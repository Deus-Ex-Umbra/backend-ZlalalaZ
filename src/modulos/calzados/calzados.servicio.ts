import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  OnModuleInit,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Brackets } from "typeorm";
import { Calzado } from "./entidades/calzado.entidad";
import { CrearCalzadoDto } from "./dto/crear-calzado.dto";
import { ActualizarCalzadoDto } from "./dto/actualizar-calzado.dto";
import { ProgramarPromocionDto } from "./dto/programar-promocion.dto";
import {
  MARCA_SIN_DEFINIR,
  TALLA_UNICA,
  TipoProducto,
  calcularSegmentoTalla,
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
  segmentoTalla?: string;
  esExtra?: boolean;
  soloStockCritico?: boolean;
  estadoStock?: "critico" | "agotado" | "bajo" | "disponible" | string;
  pagina?: number;
  limite?: number;
}

const COLORES_BASE_OFICIALES: string[] = [
  "Blanco",
  "Negro",
  "Gris",
  "Crema",
  "Beige",
  "Marrón",
  "Café",
  "Azul",
  "Azul Marino",
  "Celeste",
  "Rojo",
  "Vino",
  "Verde",
  "Verde Militar",
  "Amarillo",
  "Naranja",
  "Rosado",
  "Lila",
  "Morado",
  "Dorado",
  "Plateado",
  "Negro+Blanco",
  "Blanco+Negro",
  "Verde+Rojo+Amarillo",
  "Arcoíris",
  "Payaso",
  "Payaso Oscuro",
  "Leopardo",
  "Camuflaje",
  "Multicolor",
];

@Injectable()
export class CalzadosServicio implements OnModuleInit {
  private readonly registro = new Logger(CalzadosServicio.name);
  private readonly coloresEnMemoria = new Set<string>(COLORES_BASE_OFICIALES);

  constructor(
    @InjectRepository(Calzado)
    private readonly calzadoRepositorio: Repository<Calzado>,
  ) {}

  private normalizarMapaStockPorTalla(
    mapa?: Record<string, number> | null,
  ): Record<string, number> {
    const resultado: Record<string, number> = {};
    if (!mapa || typeof mapa !== "object") return resultado;
    for (const [clave, valor] of Object.entries(mapa)) {
      const tallaLimpia = limpiarEspacios(clave);
      if (!tallaLimpia) continue;
      const cantidad = Math.max(0, Math.floor(Number(valor) || 0));
      resultado[tallaLimpia] = cantidad;
    }
    return resultado;
  }

  private ordenarTallasClaves(tallas: string[]): string[] {
    return [...tallas].sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ""), 10);
      const numB = parseInt(b.replace(/\D/g, ""), 10);
      if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
        return numA - numB;
      }
      return a.localeCompare(b);
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.calzadoRepositorio.query(`
        ALTER TABLE calzados ADD COLUMN IF NOT EXISTS extras VARCHAR(255);
        ALTER TABLE calzados ADD COLUMN IF NOT EXISTS precio_promocion NUMERIC(10,2);
        ALTER TABLE calzados ADD COLUMN IF NOT EXISTS promocion_fecha_inicio VARCHAR(50);
        ALTER TABLE calzados ADD COLUMN IF NOT EXISTS promocion_fecha_fin VARCHAR(50);
        ALTER TABLE calzados ADD COLUMN IF NOT EXISTS promocion_motivo VARCHAR(150);
        ALTER TABLE calzados ADD COLUMN IF NOT EXISTS stock_por_talla JSONB DEFAULT '{}'::jsonb;
        ALTER TABLE calzados ADD COLUMN IF NOT EXISTS segmento_talla VARCHAR(30);
        ALTER TABLE calzados ADD COLUMN IF NOT EXISTS es_extra BOOLEAN DEFAULT false;
        ALTER TABLE calzados ADD COLUMN IF NOT EXISTS extras_incluidos JSONB DEFAULT '[]'::jsonb;
        ALTER TABLE calzados ALTER COLUMN foto_url TYPE TEXT;
        ALTER TABLE calzados ALTER COLUMN talla TYPE VARCHAR(120);
        ALTER TABLE calzados ALTER COLUMN color TYPE VARCHAR(160);
        CREATE TABLE IF NOT EXISTS catalogo_colores (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          nombre VARCHAR(120) UNIQUE NOT NULL,
          activo BOOLEAN DEFAULT true,
          creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `).catch(() => {});
    } catch {
      // Ignorar si ya existen
    }

    try {
      // Normalización ligera de marcas pendientes (máximo 50 por arranque)
      const pendientes = await this.calzadoRepositorio.find({
        where: { marca: MARCA_SIN_DEFINIR },
        take: 50,
      });
      if (pendientes.length > 0) {
        const modificados: Calzado[] = [];
        for (const calzado of pendientes) {
          calzado.nombreProducto = normalizarNombreProducto(
            calzado.nombreProducto,
          );
          calzado.marca = extraerMarca(calzado.nombreProducto);
          calzado.tipoProducto = detectarTipoProducto(calzado.nombreProducto);
          calzado.talla = normalizarTalla(calzado.talla, calzado.tipoProducto);
          modificados.push(calzado);
        }
        if (modificados.length > 0) {
          await this.calzadoRepositorio.save(modificados);
          this.registro.log(
            `Catálogo normalizado: ${modificados.length} productos actualizados`,
          );
        }
      }
    } catch (err) {
      this.registro.warn(`Aviso en normalización de marcas: ${err}`);
    }

    try {
      // Regla de dominio §1: El stock nunca puede ser negativo. Reparación rápida atómica.
      await this.calzadoRepositorio.query(`
        UPDATE calzados
        SET stock_actual = GREATEST(0, stock_inicial + total_ingresado - total_vendido)
        WHERE stock_actual < 0;
      `);
    } catch {
      // Ignorar
    }

    try {
      // Sincronizar segmento_talla si es nulo con una sola consulta SQL rápida
      await this.calzadoRepositorio.query(`
        UPDATE calzados
        SET segmento_talla = CASE
          WHEN UPPER(categoria) LIKE '%BEBE%' OR UPPER(categoria) LIKE '%BEBÉ%' THEN 'BEBE'
          WHEN UPPER(categoria) LIKE '%NINO%' OR UPPER(categoria) LIKE '%NIÑO%' OR UPPER(categoria) LIKE '%NINA%' OR UPPER(categoria) LIKE '%NIÑA%' THEN 'NINO'
          WHEN UPPER(categoria) LIKE '%JUVENIL%' THEN 'JUVENIL'
          ELSE 'ADULTO'
        END
        WHERE segmento_talla IS NULL OR segmento_talla = '';
      `);
    } catch {
      // Ignorar
    }

    try {
      await this.calzadoRepositorio.query(
        `UPDATE calzados SET alerta_stock_minimo = 1 WHERE alerta_stock_minimo = 2`,
      );
    } catch {
      // Ignorar
    }

    try {
      // INV-001: Migración de códigos antiguos P001..P999 a P-1..P-999 (máximo 50 por arranque)
      const antiguos = await this.calzadoRepositorio
        .createQueryBuilder("c")
        .where("c.codigoProducto ~ '^P[0-9]{3,}$'")
        .take(50)
        .getMany();

      for (const item of antiguos) {
        const normalizado = normalizarCodigoProducto(item.codigoProducto);
        if (normalizado !== item.codigoProducto) {
          try {
            await this.calzadoRepositorio.query(
              `UPDATE calzados SET codigo_producto = $1 WHERE id = $2`,
              [normalizado, item.id],
            );
            await this.calzadoRepositorio.query(
              `UPDATE ingresos_mercancia SET codigo_producto = $1 WHERE codigo_producto = $2`,
              [normalizado, item.codigoProducto],
            );
            await this.calzadoRepositorio.query(
              `UPDATE detalles_venta SET codigo_producto = $1 WHERE codigo_producto = $2`,
              [normalizado, item.codigoProducto],
            );
          } catch {
            // Ignorar conflicto de código
          }
        }
      }
    } catch (err) {
      this.registro.warn(`Aviso en migración de códigos: ${err}`);
    }
  }

  async obtenerTodos(filtros: FiltrosCalzados = {}) {
    const {
      busqueda,
      categoria,
      marca,
      talla,
      segmentoTalla,
      esExtra,
      soloStockCritico,
      estadoStock,
      pagina = 1,
      limite = 50,
    } = filtros;
    const query = this.calzadoRepositorio.createQueryBuilder("calzado");

    query.where("calzado.activo = :activo", { activo: true });

    if (busqueda) {
      query.andWhere(
        "(LOWER(calzado.nombreProducto) LIKE :busqueda OR LOWER(calzado.codigoProducto) LIKE :busqueda OR LOWER(calzado.categoria) LIKE :busqueda OR LOWER(calzado.marca) LIKE :busqueda OR LOWER(calzado.color) LIKE :busqueda)",
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
      const tallaLimpia = talla.trim();
      query.andWhere(
        new Brackets((qb) => {
          qb.where("calzado.talla = :talla", { talla: tallaLimpia })
            .orWhere("calzado.talla ILIKE :tallaParcial", {
              tallaParcial: `%${tallaLimpia}%`,
            })
            .orWhere("calzado.stock_por_talla ? :talla", {
              talla: tallaLimpia,
            });
        }),
      );
    }

    if (segmentoTalla && segmentoTalla !== "todos") {
      query.andWhere("UPPER(calzado.segmentoTalla) = UPPER(:segmentoTalla)", {
        segmentoTalla: segmentoTalla.trim(),
      });
    }

    if (esExtra !== undefined) {
      query.andWhere("calzado.esExtra = :esExtra", { esExtra });
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

    const nombreProducto = normalizarNombreProducto(dto.nombreProducto);
    const esExtra = Boolean(dto.esExtra);
    const tipoProducto = esExtra
      ? TipoProducto.ACCESORIO
      : (dto.tipoProducto ?? detectarTipoProducto(nombreProducto));

    const mapaTallas = this.normalizarMapaStockPorTalla(dto.stockPorTalla);
    const clavesTallas = this.ordenarTallasClaves(Object.keys(mapaTallas));

    let stockInicial = Math.max(0, Math.floor(Number(dto.stockInicial ?? 0)));
    let talla = normalizarTalla(dto.talla, tipoProducto);

    if (clavesTallas.length > 0) {
      stockInicial = Object.values(mapaTallas).reduce(
        (acc, val) => acc + Math.max(0, Number(val) || 0),
        0,
      );
      talla = clavesTallas.join(", ");
    } else {
      if (!talla) {
        if (esExtra || tipoProducto === TipoProducto.ACCESORIO) {
          talla = TALLA_UNICA;
        } else {
          throw new BadRequestException({
            codigo: "ERR-CALZ-006",
            mensaje:
              "El calzado requiere al menos una talla (solo los accesorios o extras pueden omitirla)",
          });
        }
      }
      mapaTallas[talla] = stockInicial;
    }

    const segmentoTalla =
      dto.segmentoTalla ||
      calcularSegmentoTalla(talla, mapaTallas, tipoProducto, esExtra);

    const colorLimpio = limpiarEspacios(dto.color) || "Blanco";
    if (colorLimpio) {
      this.coloresEnMemoria.add(colorLimpio);
    }

    const nuevo = this.calzadoRepositorio.create({
      ...dto,
      codigoProducto,
      nombreProducto,
      marca: limpiarEspacios(dto.marca) || extraerMarca(nombreProducto),
      tipoProducto,
      talla,
      stockPorTalla: mapaTallas,
      segmentoTalla,
      color: colorLimpio,
      precioCompra: Number(dto.precioCompra ?? 0),
      precioVenta: Number(dto.precioVenta ?? 0),
      extras: dto.extras ? dto.extras.trim() : null,
      esExtra,
      extrasIncluidos: Array.isArray(dto.extrasIncluidos)
        ? dto.extrasIncluidos
        : [],
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

    const { stockPorTalla: mapaDto, ...restoDto } = dto;
    Object.assign(calzado, restoDto);

    if (dto.extras !== undefined) {
      calzado.extras = dto.extras ? dto.extras.trim() : null;
    }

    calzado.nombreProducto = normalizarNombreProducto(calzado.nombreProducto);
    calzado.marca =
      limpiarEspacios(calzado.marca) || extraerMarca(calzado.nombreProducto);

    if (mapaDto && typeof mapaDto === "object") {
      const mapaNormalizado = this.normalizarMapaStockPorTalla(mapaDto);
      const claves = this.ordenarTallasClaves(Object.keys(mapaNormalizado));
      if (claves.length > 0) {
        calzado.stockPorTalla = mapaNormalizado;
        calzado.stockActual = Object.values(mapaNormalizado).reduce(
          (acc, val) => acc + Math.max(0, Number(val) || 0),
          0,
        );
        calzado.talla = claves.join(", ");
      }
    } else if (dto.talla !== undefined || dto.stockActual !== undefined) {
      calzado.talla = normalizarTalla(calzado.talla, calzado.tipoProducto);
      const clavesActuales = calzado.stockPorTalla
        ? Object.keys(calzado.stockPorTalla)
        : [];
      if (clavesActuales.length <= 1) {
        const claveUnica = calzado.talla || TALLA_UNICA;
        calzado.stockPorTalla = {
          [claveUnica]: Math.max(0, Number(calzado.stockActual || 0)),
        };
      }
    }

    calzado.segmentoTalla =
      dto.segmentoTalla ||
      calcularSegmentoTalla(
        calzado.talla,
        calzado.stockPorTalla,
        calzado.tipoProducto,
        calzado.esExtra,
      );

    if (dto.color) {
      calzado.color = limpiarEspacios(dto.color) || "Blanco";
      this.coloresEnMemoria.add(calzado.color);
    }

    return this.calzadoRepositorio.save(calzado);
  }

  async obtenerColores(): Promise<string[]> {
    const conjunto = new Set<string>(this.coloresEnMemoria);

    try {
      const filasCatalogo = await this.calzadoRepositorio.query(
        `SELECT nombre FROM catalogo_colores WHERE activo = true ORDER BY nombre ASC`,
      );
      for (const fila of filasCatalogo) {
        if (fila?.nombre && String(fila.nombre).trim()) {
          conjunto.add(String(fila.nombre).trim());
        }
      }
    } catch {
      // Ignorar si la tabla aún no existe
    }

    try {
      const filasCalzados = await this.calzadoRepositorio
        .createQueryBuilder("calzado")
        .select("DISTINCT calzado.color", "color")
        .where("calzado.activo = :activo", { activo: true })
        .andWhere("calzado.color IS NOT NULL")
        .getRawMany<{ color: string }>();

      for (const fila of filasCalzados) {
        const limpio = limpiarEspacios(fila.color);
        if (limpio) {
          conjunto.add(limpio);
        }
      }
    } catch {
      // Ignorar
    }

    return Array.from(conjunto).sort((a, b) => a.localeCompare(b, "es"));
  }

  async registrarColor(nombre: string): Promise<{
    nombre: string;
    colores: string[];
  }> {
    const limpio = limpiarEspacios(nombre);
    if (!limpio) {
      throw new BadRequestException({
        codigo: "ERR-CALZ-007",
        mensaje: "El nombre del color o combinación no puede estar vacío",
      });
    }

    this.coloresEnMemoria.add(limpio);
    try {
      await this.calzadoRepositorio.query(
        `INSERT INTO catalogo_colores (nombre, activo) VALUES ($1, true) ON CONFLICT (nombre) DO UPDATE SET activo = true`,
        [limpio],
      );
    } catch {
      // Ya está en memoria
    }

    const colores = await this.obtenerColores();
    return { nombre: limpio, colores };
  }

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

  async ajustarStock(
    id: string,
    delta: number,
    tallaEspecifica?: string,
  ): Promise<Calzado> {
    const calzado = await this.obtenerPorId(id);
    if (calzado.stockActual + delta < 0) {
      throw new BadRequestException({
        codigo: "ERR-CALZ-003",
        mensaje: `Stock insuficiente para ${calzado.nombreProducto} (Talla: ${tallaEspecifica || calzado.talla}). Disponible: ${calzado.stockActual}`,
      });
    }
    calzado.stockActual += delta;
    if (calzado.stockPorTalla && typeof calzado.stockPorTalla === "object") {
      const clave =
        tallaEspecifica && calzado.stockPorTalla[tallaEspecifica] !== undefined
          ? tallaEspecifica
          : Object.keys(calzado.stockPorTalla)[0];
      if (clave) {
        calzado.stockPorTalla = {
          ...calzado.stockPorTalla,
          [clave]: Math.max(
            0,
            (Number(calzado.stockPorTalla[clave]) || 0) + delta,
          ),
        };
      }
    }
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
