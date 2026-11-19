import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  QueryRunner,
  RemoveEvent,
  UpdateEvent,
} from "typeorm";
import {
  ContextoAuditoria,
  DatosContextoAuditoria,
} from "./contexto-auditoria";
import { UsuarioAutenticado } from "../autenticacion/decoradores/usuario-actual.decorador";

const METODOS_MUTACION = new Set(["POST", "PUT", "PATCH", "DELETE"]);

interface PeticionHttpAuditable {
  method?: string;
  originalUrl?: string;
  url?: string;
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
  user?: UsuarioAutenticado;
}

interface CargaJwtDecodificada {
  sub?: string;
  id?: string;
  nombre?: string;
  correo?: string;
  rol?: string;
}

function extraerIpCliente(req: PeticionHttpAuditable): string | null {
  const reenviada = req.headers?.["x-forwarded-for"];
  if (typeof reenviada === "string" && reenviada.trim()) {
    return reenviada.split(",")[0].trim().slice(0, 80);
  }
  if (Array.isArray(reenviada) && reenviada[0]) {
    return String(reenviada[0]).split(",")[0].trim().slice(0, 80);
  }
  const ipDirecta = req.ip || req.socket?.remoteAddress || null;
  return ipDirecta ? String(ipDirecta).trim().slice(0, 80) : null;
}

@Injectable()
@EventSubscriber()
export class SuscriptorAuditoriaTypeOrm
  implements EntitySubscriberInterface<unknown>
{
  constructor(private readonly dataSource: DataSource) {
    const yaRegistrado = this.dataSource.subscribers.some(
      (sub) => sub instanceof SuscriptorAuditoriaTypeOrm,
    );
    if (!yaRegistrado) {
      this.dataSource.subscribers.push(this);
    }
  }

  private async aplicarContextoEnTransaccion(
    queryRunner?: QueryRunner,
    nombreTabla?: string,
  ): Promise<void> {
    if (!queryRunner || !queryRunner.isTransactionActive) return;
    if (nombreTabla === "logs_auditoria") return;
    const contexto = ContextoAuditoria.obtener();
    if (!contexto) return;

    try {
      await queryRunner.query(
        `SELECT
           set_config('lalala.usuario_id', $1, true),
           set_config('lalala.usuario_nombre', $2, true),
           set_config('lalala.usuario_rol', $3, true),
           set_config('lalala.ip', $4, true),
           set_config('lalala.metodo_http', $5, true),
           set_config('lalala.ruta_http', $6, true)`,
        [
          contexto.usuarioId ?? "",
          contexto.usuarioNombre ?? "",
          contexto.usuarioRol ?? "",
          contexto.ip ?? "",
          contexto.metodoHttp ?? "",
          contexto.rutaHttp ?? "",
        ],
      );
    } catch {
      // No bloquear la operación principal si falla set_config
    }
  }

  async beforeInsert(evento: InsertEvent<unknown>): Promise<void> {
    await this.aplicarContextoEnTransaccion(
      evento.queryRunner,
      evento.metadata?.tableName,
    );
  }

  async beforeUpdate(evento: UpdateEvent<unknown>): Promise<void> {
    await this.aplicarContextoEnTransaccion(
      evento.queryRunner,
      evento.metadata?.tableName,
    );
  }

  async beforeRemove(evento: RemoveEvent<unknown>): Promise<void> {
    await this.aplicarContextoEnTransaccion(
      evento.queryRunner,
      evento.metadata?.tableName,
    );
  }
}

@Injectable()
export class AuditoriaInterceptor implements NestInterceptor {
  constructor(
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private resolverUsuarioDePeticion(req: PeticionHttpAuditable): {
    usuarioId: string | null;
    usuarioNombre: string | null;
    usuarioRol: string | null;
  } {
    if (req.user && (req.user.id || req.user.nombre)) {
      return {
        usuarioId: req.user.id ? String(req.user.id) : null,
        usuarioNombre: req.user.nombre
          ? String(req.user.nombre)
          : req.user.correo
            ? String(req.user.correo)
            : null,
        usuarioRol: req.user.rol ? String(req.user.rol) : null,
      };
    }

    const encabezadoAuth = req.headers?.authorization;
    const valorAuth = Array.isArray(encabezadoAuth)
      ? encabezadoAuth[0]
      : encabezadoAuth;
    if (
      typeof valorAuth === "string" &&
      valorAuth.toLowerCase().startsWith("bearer ")
    ) {
      const token = valorAuth.slice(7).trim();
      if (token) {
        try {
          const secreto = this.configService.get<string>("JWT_SECRET");
          const carga = (secreto
            ? this.jwtService.verify(token, { secret: secreto })
            : this.jwtService.decode(token)) as CargaJwtDecodificada | null;
          if (carga && typeof carga === "object") {
            return {
              usuarioId: carga.sub
                ? String(carga.sub)
                : carga.id
                  ? String(carga.id)
                  : null,
              usuarioNombre: carga.nombre
                ? String(carga.nombre)
                : carga.correo
                  ? String(carga.correo)
                  : null,
              usuarioRol: carga.rol ? String(carga.rol) : null,
            };
          }
        } catch {
          // Token inválido o expirado: continuar sin usuario
        }
      }
    }

    return {
      usuarioId: null,
      usuarioNombre: null,
      usuarioRol: null,
    };
  }

  private async atribuirRegistrosVentana(
    datos: DatosContextoAuditoria,
  ): Promise<void> {
    if (!datos.usuarioNombre && !datos.rutaHttp) return;
    try {
      await this.dataSource.query(
        `UPDATE logs_auditoria
         SET usuario_id = COALESCE(usuario_id, NULLIF($1, '')::uuid),
             usuario_nombre = COALESCE(usuario_nombre, NULLIF($2, '')),
             usuario_rol = COALESCE(usuario_rol, NULLIF($3, '')),
             ip = COALESCE(ip, NULLIF($4, '')),
             metodo_http = COALESCE(metodo_http, NULLIF($5, '')),
             ruta_http = COALESCE(ruta_http, NULLIF($6, '')),
             origen = 'API_TRIGGER'
         WHERE creado_en >= ($7::timestamptz - INTERVAL '2 seconds')
           AND (usuario_nombre IS NULL OR ruta_http IS NULL)`,
        [
          datos.usuarioId ?? "",
          datos.usuarioNombre ?? "",
          datos.usuarioRol ?? "",
          datos.ip ?? "",
          datos.metodoHttp ?? "",
          datos.rutaHttp ?? "",
          datos.inicioVentana.toISOString(),
        ],
      );
    } catch {
      // No interrumpir el flujo HTTP si falla la atribución secundaria
    }
  }

  intercept(
    contexto: ExecutionContext,
    siguiente: CallHandler,
  ): Observable<unknown> {
    const req = contexto
      .switchToHttp()
      .getRequest<PeticionHttpAuditable | undefined>();

    const metodo = (req?.method || "GET").toUpperCase();
    const ruta = (req?.originalUrl || req?.url || "").slice(0, 300);

    const esMutacion =
      METODOS_MUTACION.has(metodo) &&
      !ruta.includes("/panel-central/webhook") &&
      !ruta.includes("/autenticacion/iniciar-sesion") &&
      !ruta.includes("/autenticacion/cerrar-sesion") &&
      !ruta.includes("/autenticacion/refrescar");

    if (!req || !esMutacion) {
      return siguiente.handle();
    }

    const infoUsuario = this.resolverUsuarioDePeticion(req);
    const datosContexto: DatosContextoAuditoria = {
      usuarioId: infoUsuario.usuarioId,
      usuarioNombre: infoUsuario.usuarioNombre,
      usuarioRol: infoUsuario.usuarioRol,
      ip: extraerIpCliente(req),
      metodoHttp: metodo,
      rutaHttp: ruta,
      inicioVentana: new Date(),
    };

    return ContextoAuditoria.ejecutar(datosContexto, () =>
      siguiente.handle().pipe(
        tap(() => {
          const usuarioFinal = this.resolverUsuarioDePeticion(req);
          if (usuarioFinal.usuarioNombre && !datosContexto.usuarioNombre) {
            datosContexto.usuarioId = usuarioFinal.usuarioId;
            datosContexto.usuarioNombre = usuarioFinal.usuarioNombre;
            datosContexto.usuarioRol = usuarioFinal.usuarioRol;
          }
          void this.atribuirRegistrosVentana(datosContexto);
        }),
      ),
    );
  }
}
