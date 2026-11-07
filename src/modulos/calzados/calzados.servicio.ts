import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  OnModuleInit,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Calzado } from "./entidades/calzado.entidad";
import { CrearCalzadoDto } from "./dto/crear-calzado.dto";
import { ActualizarCalzadoDto } from "./dto/actualizar-calzado.dto";
import { ProgramarPromocionDto } from "./dto/programar-promocion.dto";
import {
  MARCA_SIN_DEFINIR,
  detectarTipoProducto,
  extraerMarca,
  limpiarEspacios,
  normalizarCodigoProducto,
  normalizarNombreProducto,
  normalizarTalla,
} from "../../comun/utilidades/normalizacion-catalogo";

export interface FiltrosCalzados {
  busqueda?: string;
  categoria?: string;
  marca?: string;
  talla?: string;
  soloStockCritico?: boolean;
  estadoStock?: "critico" | "agotado" | "bajo" | "disponible" | string;
  pagina?: number;
  limite?: number;
}

@Injectable()
export class CalzadosServicio implements OnModuleInit {
  private readonly registro = new Logger(CalzadosServicio.name);

  constructor(
    @InjectRepository(Calzado)
    private readonly calzadoRepositorio: Repository<Calzado>,
  ) {}

  /**
   * Completa marca y tipo de producto en registros anteriores a DAT-003
   * y limpia espacios del nombre. Es idempotente.
   */
  async onModuleInit(): Promise<void> {
    const pendientes = await this.calzadoRepositorio.find({
      where: { marca: MARCA_SIN_DEFINIR },
    });
    if (pendientes.length === 0) return;

    const modificados: Calzado[] = [];
    for (const calzado of pendientes) {
      const original = JSON.stringify([
        calzado.nombreProducto,
        calzado.marca,
        calzado.tipoProducto,
        calzado.talla,
      ]);
      calzado.nombreProducto = normalizarNombreProducto(calzado.nombreProducto);
      calzado.marca = extraerMarca(calzado.nombreProducto);
      calzado.tipoProducto = detectarTipoProducto(calzado.nombreProducto);
      calzado.talla = normalizarTalla(calzado.talla, calzado.tipoProducto);
      const nuevo = JSON.stringify([
        calzado.nombreProducto,
        calzado.marca,
        calzado.tipoProducto,
        calzado.talla,
      ]);
      if (original !== nuevo) modificados.push(calzado);
    }
    if (modificados.length > 0) {
      await this.calzadoRepositorio.save(modificados);
      this.registro.log(
        `Catálogo normalizado: ${modificados.length} productos actualizados`,
      );
    }

    // Regla de dominio §1: El stock nunca puede ser negativo. Auto-reparar inconsistencias heredadas.
    const calzadosNegativos = await this.calzadoRepositorio
      .createQueryBuilder("calzado")
      .where("calzado.stockActual < 0")
      .getMany();

    if (calzadosNegativos.length > 0) {
      for (const neg of calzadosNegativos) {
        this.registro.warn(
          `Corrigiendo stock negativo para ${neg.codigoProducto} (${neg.nombreProducto}): stockActual=${neg.stockActual} -> no negativo`,
        );
        neg.stockInicial = Math.max(neg.stockInicial, neg.totalVendido);
        neg.stockActual = Math.max(
          0,
          neg.stockInicial + neg.totalIngresado - neg.totalVendido,
        );
      }
      await this.calzadoRepositorio.save(calzadosNegativos);
      this.registro.log(
        `Stocks negativos corregidos: ${calzadosNegativos.length} productos ajustados a reglas de negocio`,
      );
    }

    // INV-001: Migración automática de códigos P001..P999 a P-1..P-999
    // e INV-003: Alerta de stock mínimo crítico fijada a 1
    const todosCalzados = await this.calzadoRepositorio.find();
    const codigosExistentes = new Set(todosCalzados.map((c) => c.codigoProducto));
    const pendientesMigrar: { id: string; codigoAntiguo: string; codigoNuevo: string }[] = [];

    for (const c of todosCalzados) {
      const normalizado = normalizarCodigoProducto(c.codigoProducto);
      if (normalizado !== c.codigoProducto && !codigosExistentes.has(normalizado)) {
        pendientesMigrar.push({
          id: c.id,
          codigoAntiguo: c.codigoProducto,
          codigoNuevo: normalizado,
        });
      }
    }

    if (pendientesMigrar.length > 0) {
      for (const item of pendientesMigrar) {
        try {
          await this.calzadoRepositorio.query(
            `UPDATE calzados SET codigo_producto = $1 WHERE id = $2`,
            [item.codigoNuevo, item.id],
          );
          await this.calzadoRepositorio.query(
            `UPDATE ingresos_mercancia SET codigo_producto = $1 WHERE codigo_producto = $2`,
            [item.codigoNuevo, item.codigoAntiguo],
          );
          await this.calzadoRepositorio.query(
            `UPDATE detalles_venta SET codigo_producto = $1 WHERE codigo_producto = $2`,
            [item.codigoNuevo, item.codigoAntiguo],
          );
        } catch (error) {
          this.registro.warn(
            `Error al migrar código ${item.codigoAntiguo} a ${item.codigoNuevo}: ${(error as Error).message}`,
          );
        }
      }
      this.registro.log(
        `Códigos P-N migrados: ${pendientesMigrar.length} productos actualizados a formato P-1..P-N (sin límite superior)`,
      );
    }

    // INV-003: Asegurar alerta de stock mínimo a 1
    try {
      await this.calzadoRepositorio.query(
        `UPDATE calzados SET alerta_stock_minimo = 1 WHERE alerta_stock_minimo = 2`,
      );
    } catch {
      // Ignorar si la tabla no existe o ya está actualizada
    }

    // CAT-003: Asegurar columna extras en calzados
    try {
      await this.calzadoRepositorio.query(
        `ALTER TABLE calzados ADD COLUMN IF NOT EXISTS extras varchar(255)`,
      );
    } catch {
      // Ignorar si la tabla no existe o ya está actualizada
    }

    // REB-001: Columnas de liquidación / promoción por rango de fechas
    try {
      await this.calzadoRepositorio.query(
        `ALTER TABLE calzados ADD COLUMN IF NOT EXISTS precio_promocion decimal(10,2)`,
      );
      await this.calzadoRepositorio.query(
        `ALTER TABLE calzados ADD COLUMN IF NOT EXISTS promocion_fecha_inicio varchar(20)`,
      );
      await this.calzadoRepositorio.query(
        `ALTER TABLE calzados ADD COLUMN IF NOT EXISTS promocion_fecha_fin varchar(20)`,
      );
      await this.calzadoRepositorio.query(
        `ALTER TABLE calzados ADD COLUMN IF NOT EXISTS promocion_motivo varchar(120)`,
      );
    } catch {
      // Ignorar si la tabla no existe o ya está actualizada
    }
  }

  async obtenerTodos(filtros: FiltrosCalzados = {}) {
    const {
      busqueda,
      categoria,
      marca,
      talla,
      soloStockCritico,
      estadoStock,
      pagina = 1,
      limite = 50,
    } = filtros;
    const query = this.calzadoRepositorio.createQueryBuilder("calzado");

    query.where("calzado.activo = :activo", { activo: true });

    if (busqueda) {
      query.andWhere(
        "(LOWER(calzado.nombreProducto) LIKE :busqueda OR LOWER(calzado.codigoProducto) LIKE :busqueda OR LOWER(calzado.categoria) LIKE :busqueda OR LOWER(calzado.marca) LIKE :busqueda)",
        { busqueda: `%${busqueda.toLowerCase()}%` },
      );
    }

    if (categoria) {
      query.andWhere("calzado.categoria = :categoria", { categoria });
    }

    if (marca) {
      query.andWhere("calzado.marca = :marca", { marca });
    }

    if (talla) {
      query.andWhere("calzado.talla = :talla", { talla });
    }

    if (soloStockCritico) {
      query.andWhere("calzado.stockActual <= 1");
    }

    if (estadoStock) {
      const estado = estadoStock.trim().toLowerCase();
      if (estado === "agotado") {
        query.andWhere("calzado.stockActual <= 0");
      } else if (estado === "critico") {
        query.andWhere("calzado.stockActual = 1");
      } else if (estado === "bajo") {
        query.andWhere("calzado.stockActual = 2");
      } else if (estado === "disponible") {
        query.andWhere("calzado.stockActual >= 3");
      }
    }

    const limiteFinal = Math.min(Math.max(limite, 1), 500);

    query.orderBy("calzado.codigoProducto", "ASC");
    query.skip((pagina - 1) * limiteFinal);
    query.take(limiteFinal);

    const [elementos, total] = await query.getManyAndCount();

    return {
      elementos,
      total,
      pagina,
      limite: limiteFinal,
      totalPaginas: Math.ceil(total / limiteFinal),
    };
  }

  async obtenerPorId(id: string): Promise<Calzado> {
    const calzado = await this.calzadoRepositorio.findOne({
      where: { id, activo: true },
    });
    if (!calzado) {
      throw new NotFoundException({
        codigo: "ERR-CALZ-001",
        mensaje: `Calzado con ID ${id} no encontrado`,
      });
    }
    return calzado;
  }

  /**
   * INV-001: Escanea los códigos existentes P-N y devuelve el siguiente correlativo (P-1 al infinito, sin límite).
   */
  async obtenerSiguienteCodigo(): Promise<{ codigoSugerido: string }> {
    const filas = await this.calzadoRepositorio
      .createQueryBuilder("calzado")
      .select("calzado.codigoProducto", "codigo")
      .getRawMany<{ codigo: string }>();

    let maxNumero = 0;
    for (const fila of filas) {
      if (!fila.codigo) continue;
      const match = fila.codigo.match(/^p-?0*(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNumero) {
          maxNumero = num;
        }
      }
    }

    const siguiente = maxNumero + 1;
    return { codigoSugerido: `P-${siguiente}` };
  }

  /**
   * INV-001: Búsqueda tolerante. Si el usuario busca "P001", "P1" o "P-1", encuentra tanto "P-1" como "P001".
   */
  async obtenerPorCodigo(codigoProducto: string): Promise<Calzado> {
    const normalizado = normalizarCodigoProducto(codigoProducto);
    const variantes = new Set<string>([codigoProducto, normalizado]);
    const match = codigoProducto.match(/^p-?0*(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      variantes.add(`P-${num}`);
      variantes.add(`P${num}`);
      variantes.add(`P${String(num).padStart(3, "0")}`);
      variantes.add(`P${String(num).padStart(4, "0")}`);
    }

    const codigosMinusculas = Array.from(variantes).map((c) => c.toLowerCase());

    const calzado = await this.calzadoRepositorio
      .createQueryBuilder("calzado")
      .where("calzado.activo = :activo", { activo: true })
      .andWhere("LOWER(calzado.codigoProducto) IN (:...codigos)", {
        codigos: codigosMinusculas,
      })
      .getOne();

    if (!calzado) {
      throw new NotFoundException({
        codigo: "ERR-CALZ-001",
        mensaje: `Calzado con código ${codigoProducto} no encontrado`,
      });
    }
    return calzado;
  }

  async buscarPorCodigo(codigo: string): Promise<Calzado> {
    return this.obtenerPorCodigo(codigo);
  }

  async crear(dto: CrearCalzadoDto): Promise<Calzado> {
    const codigoProducto = normalizarCodigoProducto(dto.codigoProducto);
    const existente = await this.calzadoRepositorio.findOne({
      where: { codigoProducto },
    });

    if (existente) {
      throw new ConflictException({
        codigo: "ERR-CALZ-005",
        mensaje: `Ya existe un calzado registrado con el código ${codigoProducto}`,
      });
    }

    const stockInicial = dto.stockInicial ?? 0;
    const nombreProducto = normalizarNombreProducto(dto.nombreProducto);
    const tipoProducto =
      dto.tipoProducto ?? detectarTipoProducto(nombreProducto);
    const talla = normalizarTalla(dto.talla, tipoProducto);

    if (!talla) {
      throw new BadRequestException({
        codigo: "ERR-CALZ-006",
        mensaje:
          "El calzado requiere una talla (solo los accesorios pueden omitirla)",
      });
    }

    const nuevo = this.calzadoRepositorio.create({
      ...dto,
      codigoProducto,
      nombreProducto,
      marca: limpiarEspacios(dto.marca) || extraerMarca(nombreProducto),
      tipoProducto,
      talla,
      extras: dto.extras ? dto.extras.trim() : null,
      stockInicial,
      stockActual: stockInicial,
      totalIngresado: 0,
      totalVendido: 0,
      alertaStockMinimo: dto.alertaStockMinimo ?? 1,
    });

    return this.calzadoRepositorio.save(nuevo);
  }

  async actualizar(id: string, dto: ActualizarCalzadoDto): Promise<Calzado> {
    const calzado = await this.obtenerPorId(id);

    if (dto.stockActual !== undefined && dto.stockActual < 0) {
      throw new BadRequestException({
        codigo: "ERR-CALZ-003",
        mensaje: "El stock no puede ser negativo",
      });
    }

    Object.assign(calzado, dto);
    if (dto.extras !== undefined) {
      calzado.extras = dto.extras ? dto.extras.trim() : null;
    }
    calzado.nombreProducto = normalizarNombreProducto(calzado.nombreProducto);
    calzado.marca =
      limpiarEspacios(calzado.marca) || extraerMarca(calzado.nombreProducto);
    calzado.talla = normalizarTalla(calzado.talla, calzado.tipoProducto);
    return this.calzadoRepositorio.save(calzado);
  }

  /**
   * REB-001: Programa o quita una rebaja/liquidación por rango de fechas
   * para un SKU específico o para todas las tallas/variantes de un mismo modelo.
   */
  async programarPromocion(
    dto: ProgramarPromocionDto,
  ): Promise<{ calzadosAfectados: number; mensaje: string; modelo: string }> {
    let calzadoBase: Calzado | null = null;
    let nombreModelo = dto.nombreModelo?.trim();

    if (dto.calzadoId) {
      calzadoBase = await this.obtenerPorId(String(dto.calzadoId));
      if (!nombreModelo) {
        nombreModelo = calzadoBase.nombreProducto;
      }
    }

    if (!nombreModelo && !calzadoBase) {
      throw new BadRequestException({
        codigo: "ERR-CALZ-004",
        mensaje:
          "Debe especificar un calzado o un nombre de modelo para programar la promoción",
      });
    }

    const esLimpieza = !dto.precioPromocion || Number(dto.precioPromocion) <= 0;
    const precioPromocion = esLimpieza ? null : Number(dto.precioPromocion);
    const promocionFechaInicio = esLimpieza
      ? null
      : dto.promocionFechaInicio?.trim() || null;
    const promocionFechaFin = esLimpieza
      ? null
      : dto.promocionFechaFin?.trim() || null;
    const promocionMotivo = esLimpieza
      ? null
      : dto.promocionMotivo?.trim() || "Liquidación";

    let calzadosAfectados = 0;
    const aplicarATodoElModelo =
      dto.aplicarATodoElModelo === true ||
      (!dto.calzadoId && Boolean(nombreModelo));

    if (aplicarATodoElModelo && nombreModelo) {
      const query = this.calzadoRepositorio
        .createQueryBuilder("calzado")
        .where("calzado.activo = :activo", { activo: true })
        .andWhere(
          "LOWER(TRIM(calzado.nombreProducto)) = LOWER(TRIM(:nombreModelo))",
          {
            nombreModelo,
          },
        );

      let calzados = await query.getMany();
      if (calzados.length === 0 && calzadoBase) {
        calzados = [calzadoBase];
      }

      for (const item of calzados) {
        item.precioPromocion = precioPromocion;
        item.promocionFechaInicio = promocionFechaInicio;
        item.promocionFechaFin = promocionFechaFin;
        item.promocionMotivo = promocionMotivo;
      }

      await this.calzadoRepositorio.save(calzados);
      calzadosAfectados = calzados.length;
    } else if (calzadoBase) {
      calzadoBase.precioPromocion = precioPromocion;
      calzadoBase.promocionFechaInicio = promocionFechaInicio;
      calzadoBase.promocionFechaFin = promocionFechaFin;
      calzadoBase.promocionMotivo = promocionMotivo;
      await this.calzadoRepositorio.save(calzadoBase);
      calzadosAfectados = 1;
    }

    const mensaje = esLimpieza
      ? `Promoción removida exitosamente (${calzadosAfectados} variantes actualizadas)`
      : `Promoción de Bs ${precioPromocion} programada exitosamente (${calzadosAfectados} variantes actualizadas)`;

    return {
      calzadosAfectados,
      mensaje,
      modelo: nombreModelo || calzadoBase?.nombreProducto || "",
    };
  }

  async obtenerMarcas(): Promise<string[]> {
    const filas = await this.calzadoRepositorio
      .createQueryBuilder("calzado")
      .select("DISTINCT calzado.marca", "marca")
      .where("calzado.activo = :activo", { activo: true })
      .orderBy("calzado.marca", "ASC")
      .getRawMany<{ marca: string }>();
    return filas.map((fila) => fila.marca);
  }

  async obtenerCategorias(): Promise<string[]> {
    const filas = await this.calzadoRepositorio
      .createQueryBuilder("calzado")
      .select("DISTINCT calzado.categoria", "categoria")
      .where("calzado.activo = :activo", { activo: true })
      .andWhere("calzado.categoria IS NOT NULL")
      .andWhere("TRIM(calzado.categoria) != ''")
      .orderBy("calzado.categoria", "ASC")
      .getRawMany<{ categoria: string }>();

    return filas
      .map((fila) => fila.categoria?.trim())
      .filter((cat): cat is string => Boolean(cat && cat.length > 0));
  }

  async ajustarStock(id: string, delta: number): Promise<Calzado> {
    const calzado = await this.obtenerPorId(id);
    if (calzado.stockActual + delta < 0) {
      throw new BadRequestException({
        codigo: "ERR-CALZ-003",
        mensaje: `Stock insuficiente para ${calzado.nombreProducto} (Talla: ${calzado.talla}). Disponible: ${calzado.stockActual}`,
      });
    }
    calzado.stockActual += delta;
    return this.calzadoRepositorio.save(calzado);
  }

  async obtenerStockCritico(): Promise<Calzado[]> {
    return this.calzadoRepositorio
      .createQueryBuilder("calzado")
      .where("calzado.activo = :activo", { activo: true })
      .andWhere("calzado.stockActual <= 1")
      .orderBy("calzado.stockActual", "ASC")
      .getMany();
  }
}
