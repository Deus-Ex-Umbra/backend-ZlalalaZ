import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, Repository } from "typeorm";
import {
  AccionAuditoria,
  LogAuditoria,
} from "./entidades/log-auditoria.entidad";
import { ConsultarAuditoriaDto } from "./dto/consultar-auditoria.dto";

const CLAVES_SENSIBLES_AUDITORIA = new Set([
  "contrasena_hash",
  "contrasenahash",
  "version_token",
  "versiontoken",
  "fecha_revocacion_sesiones",
  "fecharevocacionsesiones",
]);

export interface LogAuditoriaItem {
  id: string;
  tabla: string;
  modulo: string;
  accion: AccionAuditoria;
  registroId: string | null;
  resumen: string;
  camposModificados: string[];
  valoresAnteriores: Record<string, unknown> | null;
  valoresNuevos: Record<string, unknown> | null;
  usuarioId: string | null;
  usuarioNombre: string | null;
  usuarioRol: string | null;
  ip: string | null;
  metodoHttp: string | null;
  rutaHttp: string | null;
  origen: string;
  creadoEn: string;
}

export interface RespuestaPaginadaAuditoria {
  datos: LogAuditoriaItem[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

export interface ResumenPorTablaAuditoria {
  tabla: string;
  modulo: string;
  cantidad: number;
}

export interface UsuarioActorAuditoria {
  usuarioId: string | null;
  usuarioNombre: string;
  usuarioRol: string | null;
}

export interface ResumenAuditoria {
  total: number;
  hoy: number;
  creaciones: number;
  actualizaciones: number;
  eliminaciones: number;
  porTabla: ResumenPorTablaAuditoria[];
  usuarios: UsuarioActorAuditoria[];
}

function sanitizarObjetoValores(
  valores: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!valores || typeof valores !== "object" || Array.isArray(valores)) {
    return null;
  }
  const limpio: Record<string, unknown> = {};
  for (const [clave, valor] of Object.entries(valores)) {
    if (CLAVES_SENSIBLES_AUDITORIA.has(clave.toLowerCase())) {
      continue;
    }
    limpio[clave] = valor;
  }
  return limpio;
}

@Injectable()
export class AuditoriaServicio {
  constructor(
    @InjectRepository(LogAuditoria)
    private readonly auditoriaRepositorio: Repository<LogAuditoria>,
  ) {}

  private mapearItem(entidad: LogAuditoria): LogAuditoriaItem {
    const campos = Array.isArray(entidad.camposModificados)
      ? entidad.camposModificados.filter(
          (c) => !CLAVES_SENSIBLES_AUDITORIA.has(String(c).toLowerCase()),
        )
      : [];

    return {
      id: entidad.id,
      tabla: entidad.tabla,
      modulo: entidad.modulo,
      accion: entidad.accion,
      registroId: entidad.registroId ?? null,
      resumen: entidad.resumen,
      camposModificados: campos,
      valoresAnteriores: sanitizarObjetoValores(entidad.valoresAnteriores),
      valoresNuevos: sanitizarObjetoValores(entidad.valoresNuevos),
      usuarioId: entidad.usuarioId ?? null,
      usuarioNombre: entidad.usuarioNombre ?? null,
      usuarioRol: entidad.usuarioRol ?? null,
      ip: entidad.ip ?? null,
      metodoHttp: entidad.metodoHttp ?? null,
      rutaHttp: entidad.rutaHttp ?? null,
      origen: entidad.origen || "TRIGGER_DB",
      creadoEn:
        entidad.creadoEn instanceof Date
          ? entidad.creadoEn.toISOString()
          : String(entidad.creadoEn),
    };
  }

  async listar(
    filtros: ConsultarAuditoriaDto = {},
  ): Promise<RespuestaPaginadaAuditoria> {
    const pagina = Math.max(1, Number(filtros.pagina || 1));
    const limite = Math.min(100, Math.max(1, Number(filtros.limite || 20)));

    const qb = this.auditoriaRepositorio
      .createQueryBuilder("log")
      .orderBy("log.creadoEn", "DESC");

    if (filtros.tabla && filtros.tabla.trim()) {
      qb.andWhere("LOWER(log.tabla) = LOWER(:tabla)", {
        tabla: filtros.tabla.trim(),
      });
    }

    if (filtros.modulo && filtros.modulo.trim()) {
      qb.andWhere("LOWER(log.modulo) = LOWER(:modulo)", {
        modulo: filtros.modulo.trim(),
      });
    }

    if (filtros.accion) {
      qb.andWhere("log.accion = :accion", { accion: filtros.accion });
    }

    if (filtros.usuarioId && filtros.usuarioId.trim()) {
      qb.andWhere("log.usuario_id::text = :usuarioId", {
        usuarioId: filtros.usuarioId.trim(),
      });
    }

    if (filtros.usuarioNombre && filtros.usuarioNombre.trim()) {
      qb.andWhere("log.usuarioNombre ILIKE :usuarioNombre", {
        usuarioNombre: `%${filtros.usuarioNombre.trim()}%`,
      });
    }

    if (
      filtros.fechaDesde &&
      /^\d{4}-\d{2}-\d{2}$/.test(filtros.fechaDesde.trim())
    ) {
      qb.andWhere(
        "(log.creado_en AT TIME ZONE 'America/La_Paz')::date >= :fechaDesde::date",
        { fechaDesde: filtros.fechaDesde.trim() },
      );
    }

    if (
      filtros.fechaHasta &&
      /^\d{4}-\d{2}-\d{2}$/.test(filtros.fechaHasta.trim())
    ) {
      qb.andWhere(
        "(log.creado_en AT TIME ZONE 'America/La_Paz')::date <= :fechaHasta::date",
        { fechaHasta: filtros.fechaHasta.trim() },
      );
    }

    if (filtros.busqueda && filtros.busqueda.trim()) {
      const termino = `%${filtros.busqueda.trim()}%`;
      qb.andWhere(
        new Brackets((sub) => {
          sub
            .where("log.resumen ILIKE :termino", { termino })
            .orWhere("log.tabla ILIKE :termino", { termino })
            .orWhere("log.modulo ILIKE :termino", { termino })
            .orWhere(" COALESCE(log.registro_id, '') ILIKE :termino", {
              termino,
            })
            .orWhere("COALESCE(log.usuario_nombre, '') ILIKE :termino", {
              termino,
            })
            .orWhere("COALESCE(log.ruta_http, '') ILIKE :termino", {
              termino,
            });
        }),
      );
    }

    const [filas, total] = await qb
      .skip((pagina - 1) * limite)
      .take(limite)
      .getManyAndCount();

    const totalPaginas = Math.max(1, Math.ceil(total / limite));

    return {
      datos: filas.map((fila) => this.mapearItem(fila)),
      total,
      pagina,
      limite,
      totalPaginas,
    };
  }

  async obtenerResumen(): Promise<ResumenAuditoria> {
    const conteosRaw = (await this.auditoriaRepositorio.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (
          WHERE (creado_en AT TIME ZONE 'America/La_Paz')::date = (NOW() AT TIME ZONE 'America/La_Paz')::date
        )::int AS hoy,
        COUNT(*) FILTER (WHERE accion = 'CREAR')::int AS creaciones,
        COUNT(*) FILTER (WHERE accion = 'ACTUALIZAR')::int AS actualizaciones,
        COUNT(*) FILTER (WHERE accion = 'ELIMINAR')::int AS eliminaciones
      FROM logs_auditoria
    `)) as Array<{
      total?: number;
      hoy?: number;
      creaciones?: number;
      actualizaciones?: number;
      eliminaciones?: number;
    }>;

    const porTablaRaw = (await this.auditoriaRepositorio.query(`
      SELECT
        tabla,
        modulo,
        COUNT(*)::int AS cantidad
      FROM logs_auditoria
      GROUP BY tabla, modulo
      ORDER BY cantidad DESC, tabla ASC
    `)) as Array<{
      tabla: string;
      modulo: string;
      cantidad: number;
    }>;

    const usuariosRaw = (await this.auditoriaRepositorio.query(`
      SELECT DISTINCT ON (COALESCE(usuario_nombre, ''))
        usuario_id::text AS "usuarioId",
        usuario_nombre AS "usuarioNombre",
        usuario_rol AS "usuarioRol"
      FROM logs_auditoria
      WHERE usuario_nombre IS NOT NULL
        AND BTRIM(usuario_nombre) <> ''
      ORDER BY COALESCE(usuario_nombre, '') ASC, creado_en DESC
    `)) as Array<{
      usuarioId: string | null;
      usuarioNombre: string;
      usuarioRol: string | null;
    }>;

    const filaConteo = conteosRaw[0] ?? {};

    return {
      total: Number(filaConteo.total ?? 0),
      hoy: Number(filaConteo.hoy ?? 0),
      creaciones: Number(filaConteo.creaciones ?? 0),
      actualizaciones: Number(filaConteo.actualizaciones ?? 0),
      eliminaciones: Number(filaConteo.eliminaciones ?? 0),
      porTabla: porTablaRaw.map((item) => ({
        tabla: String(item.tabla),
        modulo: String(item.modulo),
        cantidad: Number(item.cantidad ?? 0),
      })),
      usuarios: usuariosRaw.map((u) => ({
        usuarioId: u.usuarioId ? String(u.usuarioId) : null,
        usuarioNombre: String(u.usuarioNombre),
        usuarioRol: u.usuarioRol ? String(u.usuarioRol) : null,
      })),
    };
  }

  async obtenerPorId(id: string): Promise<LogAuditoriaItem> {
    const registro = await this.auditoriaRepositorio.findOne({
      where: { id },
    });
    if (!registro) {
      throw new NotFoundException({
        codigo: "ERR-AUD-001",
        mensaje: `Registro de auditoría con identificador ${id} no encontrado`,
      });
    }
    return this.mapearItem(registro);
  }
}
