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
  RegistrarColorCatalogoDto,
  ActualizarColorCatalogoDto,
  CrearExtraCatalogoDto,
  ActualizarExtraCatalogoDto,
  TipoColorCatalogo,
  PatronColorCatalogo,
} from "./dto/catalogo-colores-extras.dto";
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

export interface ColorCatalogoDetallado {
  id: string;
  nombre: string;
  tipo: TipoColorCatalogo;
  hexPrimario: string;
  coloresHex: string[];
  patron: PatronColorCatalogo;
  descripcion?: string | null;
  activo: boolean;
}

export interface ExtraCatalogoItem {
  id: string;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
  creadoEn?: string;
}

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

const SEMILLA_COLORES_CATALOGO: Omit<ColorCatalogoDetallado, "id">[] = [
  {
    nombre: "Blanco",
    tipo: "NORMAL",
    hexPrimario: "#FFFFFF",
    coloresHex: ["#FFFFFF"],
    patron: "SOLIDO",
    descripcion: "Blanco puro clásico",
    activo: true,
  },
  {
    nombre: "Negro",
    tipo: "NORMAL",
    hexPrimario: "#111827",
    coloresHex: ["#111827"],
    patron: "SOLIDO",
    descripcion: "Negro intenso",
    activo: true,
  },
  {
    nombre: "Gris",
    tipo: "NORMAL",
    hexPrimario: "#6B7280",
    coloresHex: ["#6B7280"],
    patron: "SOLIDO",
    descripcion: "Gris neutro",
    activo: true,
  },
  {
    nombre: "Crema",
    tipo: "NORMAL",
    hexPrimario: "#F5F0E1",
    coloresHex: ["#F5F0E1"],
    patron: "SOLIDO",
    descripcion: "Tono crema suave",
    activo: true,
  },
  {
    nombre: "Beige",
    tipo: "NORMAL",
    hexPrimario: "#D8C8B8",
    coloresHex: ["#D8C8B8"],
    patron: "SOLIDO",
    descripcion: "Beige arena",
    activo: true,
  },
  {
    nombre: "Marrón",
    tipo: "NORMAL",
    hexPrimario: "#6D4C41",
    coloresHex: ["#6D4C41"],
    patron: "SOLIDO",
    descripcion: "Marrón cuero tradicional",
    activo: true,
  },
  {
    nombre: "Café",
    tipo: "NORMAL",
    hexPrimario: "#4E342E",
    coloresHex: ["#4E342E"],
    patron: "SOLIDO",
    descripcion: "Café oscuro tostado",
    activo: true,
  },
  {
    nombre: "Azul",
    tipo: "NORMAL",
    hexPrimario: "#2563EB",
    coloresHex: ["#2563EB"],
    patron: "SOLIDO",
    descripcion: "Azul clásico",
    activo: true,
  },
  {
    nombre: "Azul Marino",
    tipo: "NORMAL",
    hexPrimario: "#1E3A8A",
    coloresHex: ["#1E3A8A"],
    patron: "SOLIDO",
    descripcion: "Azul marino profundo",
    activo: true,
  },
  {
    nombre: "Celeste",
    tipo: "NORMAL",
    hexPrimario: "#38BDF8",
    coloresHex: ["#38BDF8"],
    patron: "SOLIDO",
    descripcion: "Celeste claro",
    activo: true,
  },
  {
    nombre: "Rojo",
    tipo: "NORMAL",
    hexPrimario: "#DC2626",
    coloresHex: ["#DC2626"],
    patron: "SOLIDO",
    descripcion: "Rojo vivo",
    activo: true,
  },
  {
    nombre: "Vino",
    tipo: "NORMAL",
    hexPrimario: "#7F1D1D",
    coloresHex: ["#7F1D1D"],
    patron: "SOLIDO",
    descripcion: "Vino tinto / guindo",
    activo: true,
  },
  {
    nombre: "Verde",
    tipo: "NORMAL",
    hexPrimario: "#16A34A",
    coloresHex: ["#16A34A"],
    patron: "SOLIDO",
    descripcion: "Verde clásico",
    activo: true,
  },
  {
    nombre: "Verde Militar",
    tipo: "NORMAL",
    hexPrimario: "#4D5D3B",
    coloresHex: ["#4D5D3B"],
    patron: "SOLIDO",
    descripcion: "Verde olivo militar",
    activo: true,
  },
  {
    nombre: "Amarillo",
    tipo: "NORMAL",
    hexPrimario: "#EAB308",
    coloresHex: ["#EAB308"],
    patron: "SOLIDO",
    descripcion: "Amarillo vibrante",
    activo: true,
  },
  {
    nombre: "Naranja",
    tipo: "NORMAL",
    hexPrimario: "#EA580C",
    coloresHex: ["#EA580C"],
    patron: "SOLIDO",
    descripcion: "Naranja cálido",
    activo: true,
  },
  {
    nombre: "Rosado",
    tipo: "NORMAL",
    hexPrimario: "#F472B6",
    coloresHex: ["#F472B6"],
    patron: "SOLIDO",
    descripcion: "Rosado suave",
    activo: true,
  },
  {
    nombre: "Lila",
    tipo: "NORMAL",
    hexPrimario: "#C084FC",
    coloresHex: ["#C084FC"],
    patron: "SOLIDO",
    descripcion: "Lila pastel",
    activo: true,
  },
  {
    nombre: "Morado",
    tipo: "NORMAL",
    hexPrimario: "#7C3AED",
    coloresHex: ["#7C3AED"],
    patron: "SOLIDO",
    descripcion: "Morado intenso",
    activo: true,
  },
  {
    nombre: "Dorado",
    tipo: "NORMAL",
    hexPrimario: "#D4AF37",
    coloresHex: ["#D4AF37"],
    patron: "SOLIDO",
    descripcion: "Acabado metálico dorado",
    activo: true,
  },
  {
    nombre: "Plateado",
    tipo: "NORMAL",
    hexPrimario: "#C0C0C0",
    coloresHex: ["#C0C0C0"],
    patron: "SOLIDO",
    descripcion: "Acabado metálico plateado",
    activo: true,
  },
  {
    nombre: "Arcoíris",
    tipo: "ESPECIAL",
    hexPrimario: "#EF4444",
    coloresHex: [
      "#EF4444",
      "#F59E0B",
      "#EAB308",
      "#22C55E",
      "#3B82F6",
      "#8B5CF6",
    ],
    patron: "GRADIENTE",
    descripcion: "Espectro multicolor completo tipo arcoíris",
    activo: true,
  },
  {
    nombre: "Payaso",
    tipo: "ESPECIAL",
    hexPrimario: "#EF4444",
    coloresHex: ["#EF4444", "#3B82F6", "#EAB308", "#22C55E"],
    patron: "TRICOLOR",
    descripcion: "Combinación festiva de colores primarios vivos",
    activo: true,
  },
  {
    nombre: "Payaso Oscuro",
    tipo: "ESPECIAL",
    hexPrimario: "#7F1D1D",
    coloresHex: ["#111827", "#7F1D1D", "#4C1D95", "#1E3A8A"],
    patron: "TRICOLOR",
    descripcion: "Combinación multicolor en tonos oscuros y profundos",
    activo: true,
  },
  {
    nombre: "Leopardo",
    tipo: "ESPECIAL",
    hexPrimario: "#D97706",
    coloresHex: ["#F59E0B", "#92400E", "#1F2937"],
    patron: "ANIMAL",
    descripcion: "Estampado animal print de manchas de leopardo",
    activo: true,
  },
  {
    nombre: "Tigre",
    tipo: "ESPECIAL",
    hexPrimario: "#EA580C",
    coloresHex: ["#F97316", "#111827", "#FEF3C7"],
    patron: "ANIMAL",
    descripcion: "Estampado animal print de rayas de tigre naranja y negro",
    activo: true,
  },
  {
    nombre: "León",
    tipo: "ESPECIAL",
    hexPrimario: "#D97706",
    coloresHex: ["#D97706", "#92400E", "#FEF08A"],
    patron: "GRADIENTE",
    descripcion: "Tonos dorados, ámbar y melena tierra estilo león",
    activo: true,
  },
  {
    nombre: "Tornasol",
    tipo: "ESPECIAL",
    hexPrimario: "#06B6D4",
    coloresHex: ["#06B6D4", "#EC4899", "#A855F7", "#38BDF8"],
    patron: "GRADIENTE",
    descripcion: "Acabado iridiscente con reflejos cambiantes",
    activo: true,
  },
  {
    nombre: "Camuflaje",
    tipo: "ESPECIAL",
    hexPrimario: "#4D5D3B",
    coloresHex: ["#365314", "#4D5D3B", "#78350F", "#1F2937"],
    patron: "ANIMAL",
    descripcion: "Patrón militar camuflado en tonos tierra y verde olivo",
    activo: true,
  },
  {
    nombre: "Neón",
    tipo: "ESPECIAL",
    hexPrimario: "#84CC16",
    coloresHex: ["#A3E635", "#EC4899", "#06B6D4"],
    patron: "GRADIENTE",
    descripcion: "Tonos fluorescentes de alta visibilidad",
    activo: true,
  },
  {
    nombre: "Trabajador",
    tipo: "ESPECIAL",
    hexPrimario: "#B45309",
    coloresHex: ["#D97706", "#78350F", "#111827"],
    patron: "BICOLOR",
    descripcion:
      "Combinación industrial cuero miel, café y suela negra de seguridad",
    activo: true,
  },
  {
    nombre: "Multicolor",
    tipo: "ESPECIAL",
    hexPrimario: "#8B5CF6",
    coloresHex: ["#EC4899", "#8B5CF6", "#3B82F6", "#10B981"],
    patron: "GRADIENTE",
    descripcion: "Múltiples colores combinados en el diseño",
    activo: true,
  },
];

const SEMILLA_EXTRAS_CATALOGO: Array<{ nombre: string; descripcion: string }> =
  [
    {
      nombre: "Soda",
      descripcion: "Bebida de cortesía incluida con la compra",
    },
    {
      nombre: "Medias",
      descripcion: "Par de medias de regalo incluido",
    },
    {
      nombre: "Cordones extra",
      descripcion: "Juego adicional de cordones de repuesto",
    },
    {
      nombre: "Plantillas",
      descripcion: "Par de plantillas anatómicas de obsequio",
    },
    {
      nombre: "Bolsa ecológica",
      descripcion: "Bolsa reutilizable de tela de la tienda",
    },
    {
      nombre: "Caja especial",
      descripcion: "Empaque o caja de edición especial de regalo",
    },
    {
      nombre: "Llavero",
      descripcion: "Llavero promocional coleccionable",
    },
    {
      nombre: "Protector gamuza",
      descripcion: "Spray o espuma limpiadora para cuidado del calzado",
    },
  ];

const COLORES_BASE_OFICIALES: string[] = [
  ...SEMILLA_COLORES_CATALOGO.map((c) => c.nombre),
  "Negro+Blanco",
  "Blanco+Negro",
  "Verde+Rojo+Amarillo",
];

@Injectable()
export class CalzadosServicio implements OnModuleInit {
  private readonly registro = new Logger(CalzadosServicio.name);
  private readonly coloresEnMemoria = new Set<string>(COLORES_BASE_OFICIALES);
  private readonly coloresDetalladosEnMemoria = new Map<
    string,
    ColorCatalogoDetallado
  >(
    SEMILLA_COLORES_CATALOGO.map((item, idx) => [
      item.nombre.toLowerCase(),
      {
        ...item,
        id: `mem-color-${idx + 1}`,
      },
    ]),
  );
  private readonly extrasCatalogoEnMemoria = new Map<string, ExtraCatalogoItem>(
    SEMILLA_EXTRAS_CATALOGO.map((item, idx) => [
      item.nombre.toLowerCase(),
      {
        id: `mem-extra-${idx + 1}`,
        nombre: item.nombre,
        descripcion: item.descripcion,
        activo: true,
        creadoEn: new Date().toISOString(),
      },
    ]),
  );

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
          tipo VARCHAR(20) DEFAULT 'NORMAL',
          hex_primario VARCHAR(20),
          colores_hex JSONB DEFAULT '[]'::jsonb,
          patron VARCHAR(30) DEFAULT 'SOLIDO',
          descripcion VARCHAR(200),
          activo BOOLEAN DEFAULT true,
          creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        ALTER TABLE catalogo_colores ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'NORMAL';
        ALTER TABLE catalogo_colores ADD COLUMN IF NOT EXISTS hex_primario VARCHAR(20);
        ALTER TABLE catalogo_colores ADD COLUMN IF NOT EXISTS colores_hex JSONB DEFAULT '[]'::jsonb;
        ALTER TABLE catalogo_colores ADD COLUMN IF NOT EXISTS patron VARCHAR(30) DEFAULT 'SOLIDO';
        ALTER TABLE catalogo_colores ADD COLUMN IF NOT EXISTS descripcion VARCHAR(200);
        CREATE TABLE IF NOT EXISTS catalogo_extras (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          nombre VARCHAR(120) UNIQUE NOT NULL,
          descripcion VARCHAR(255),
          activo BOOLEAN DEFAULT true,
          creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `).catch(() => {});
    } catch {
      // Ignorar si ya existen
    }

    try {
      for (const item of SEMILLA_COLORES_CATALOGO) {
        await this.calzadoRepositorio.query(
          `INSERT INTO catalogo_colores (nombre, tipo, hex_primario, colores_hex, patron, descripcion, activo)
           VALUES ($1, $2, $3, $4::jsonb, $5, $6, true)
           ON CONFLICT (nombre) DO UPDATE SET
             tipo = CASE
               WHEN catalogo_colores.hex_primario IS NULL OR catalogo_colores.hex_primario = '' THEN EXCLUDED.tipo
               ELSE catalogo_colores.tipo
             END,
             hex_primario = COALESCE(NULLIF(catalogo_colores.hex_primario, ''), EXCLUDED.hex_primario),
             colores_hex = CASE
               WHEN catalogo_colores.colores_hex IS NULL OR catalogo_colores.colores_hex = '[]'::jsonb THEN EXCLUDED.colores_hex
               ELSE catalogo_colores.colores_hex
             END,
             patron = CASE
               WHEN catalogo_colores.hex_primario IS NULL OR catalogo_colores.hex_primario = '' THEN EXCLUDED.patron
               ELSE COALESCE(NULLIF(catalogo_colores.patron, ''), EXCLUDED.patron)
             END,
             descripcion = COALESCE(NULLIF(catalogo_colores.descripcion, ''), EXCLUDED.descripcion)`,
          [
            item.nombre,
            item.tipo,
            item.hexPrimario,
            JSON.stringify(item.coloresHex),
            item.patron,
            item.descripcion || null,
          ],
        );
      }
    } catch {
      // Ignorar si falla semilla de colores
    }

    try {
      for (const extra of SEMILLA_EXTRAS_CATALOGO) {
        await this.calzadoRepositorio.query(
          `INSERT INTO catalogo_extras (nombre, descripcion, activo)
           VALUES ($1, $2, true)
           ON CONFLICT (nombre) DO NOTHING`,
          [extra.nombre, extra.descripcion],
        );
      }
    } catch {
      // Ignorar si falla semilla de extras
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

  private mapearFilaColorDetallado(
    fila: Record<string, unknown>,
  ): ColorCatalogoDetallado {
    const nombre = limpiarEspacios(String(fila.nombre || ""));
    const semilla = this.coloresDetalladosEnMemoria.get(nombre.toLowerCase());
    const tipoRaw = String(fila.tipo || semilla?.tipo || "NORMAL")
      .trim()
      .toUpperCase();
    const tipo: TipoColorCatalogo =
      tipoRaw === "ESPECIAL" ? "ESPECIAL" : "NORMAL";

    let coloresHex: string[] = [];
    if (Array.isArray(fila.colores_hex)) {
      coloresHex = fila.colores_hex
        .map((c) => String(c || "").trim())
        .filter(Boolean);
    } else if (typeof fila.colores_hex === "string") {
      try {
        const parseado = JSON.parse(fila.colores_hex);
        if (Array.isArray(parseado)) {
          coloresHex = parseado
            .map((c) => String(c || "").trim())
            .filter(Boolean);
        }
      } catch {
        coloresHex = [];
      }
    }

    const hexPrimario =
      limpiarEspacios(String(fila.hex_primario || "")) ||
      coloresHex[0] ||
      semilla?.hexPrimario ||
      "#6B7280";

    if (coloresHex.length === 0) {
      coloresHex =
        semilla?.coloresHex && semilla.coloresHex.length > 0
          ? [...semilla.coloresHex]
          : [hexPrimario];
    }

    const patronRaw = String(fila.patron || semilla?.patron || "SOLIDO")
      .trim()
      .toUpperCase();
    const patronesValidos: PatronColorCatalogo[] = [
      "SOLIDO",
      "GRADIENTE",
      "ANIMAL",
      "BICOLOR",
      "TRICOLOR",
    ];
    const patron: PatronColorCatalogo = patronesValidos.includes(
      patronRaw as PatronColorCatalogo,
    )
      ? (patronRaw as PatronColorCatalogo)
      : "SOLIDO";

    return {
      id: String(fila.id || semilla?.id || `mem-color-${nombre.toLowerCase()}`),
      nombre,
      tipo,
      hexPrimario,
      coloresHex,
      patron,
      descripcion:
        fila.descripcion !== undefined && fila.descripcion !== null
          ? String(fila.descripcion)
          : (semilla?.descripcion ?? null),
      activo: fila.activo !== undefined ? Boolean(fila.activo) : true,
    };
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

  async obtenerColoresDetallados(): Promise<ColorCatalogoDetallado[]> {
    try {
      const filas = await this.calzadoRepositorio.query(
        `SELECT id, nombre, tipo, hex_primario, colores_hex, patron, descripcion, activo
         FROM catalogo_colores
         WHERE activo = true
         ORDER BY CASE WHEN tipo = 'ESPECIAL' THEN 0 ELSE 1 END, nombre ASC`,
      );
      if (Array.isArray(filas) && filas.length > 0) {
        const mapeados = filas.map((fila: Record<string, unknown>) =>
          this.mapearFilaColorDetallado(fila),
        );
        for (const item of mapeados) {
          this.coloresDetalladosEnMemoria.set(item.nombre.toLowerCase(), item);
        }
        return mapeados;
      }
    } catch {
      // Fallback seguro en memoria si falla SQL
    }

    return Array.from(this.coloresDetalladosEnMemoria.values())
      .filter((c) => c.activo)
      .sort((a, b) => {
        if (a.tipo !== b.tipo) return a.tipo === "ESPECIAL" ? -1 : 1;
        return a.nombre.localeCompare(b.nombre, "es");
      });
  }

  async registrarColor(
    entrada: string | RegistrarColorCatalogoDto,
  ): Promise<{
    nombre: string;
    colores: string[];
    detalle: ColorCatalogoDetallado;
  }> {
    const dto: RegistrarColorCatalogoDto =
      typeof entrada === "string" ? { nombre: entrada } : entrada || {};
    const limpio = limpiarEspacios(dto.nombre || dto.color || "");
    if (!limpio) {
      throw new BadRequestException({
        codigo: "ERR-CALZ-007",
        mensaje: "El nombre del color o combinación no puede estar vacío",
      });
    }

    const semillaExistente = this.coloresDetalladosEnMemoria.get(
      limpio.toLowerCase(),
    );
    const tipo: TipoColorCatalogo =
      dto.tipo === "ESPECIAL" ||
      (!dto.tipo && semillaExistente?.tipo === "ESPECIAL")
        ? "ESPECIAL"
        : "NORMAL";
    const coloresHex =
      Array.isArray(dto.coloresHex) && dto.coloresHex.length > 0
        ? dto.coloresHex.map((c) => limpiarEspacios(c)).filter(Boolean)
        : semillaExistente?.coloresHex ||
          (dto.hexPrimario ? [limpiarEspacios(dto.hexPrimario)] : ["#6B7280"]);
    const hexPrimario =
      limpiarEspacios(dto.hexPrimario || "") ||
      coloresHex[0] ||
      semillaExistente?.hexPrimario ||
      "#6B7280";
    const patron: PatronColorCatalogo =
      dto.patron ||
      semillaExistente?.patron ||
      (coloresHex.length === 2
        ? "BICOLOR"
        : coloresHex.length >= 3
          ? "TRICOLOR"
          : "SOLIDO");
    const descripcion =
      dto.descripcion !== undefined
        ? limpiarEspacios(dto.descripcion) || null
        : (semillaExistente?.descripcion ?? null);

    this.coloresEnMemoria.add(limpio);

    let detalle: ColorCatalogoDetallado = {
      id: semillaExistente?.id || `mem-color-${Date.now()}`,
      nombre: limpio,
      tipo,
      hexPrimario,
      coloresHex,
      patron,
      descripcion,
      activo: true,
    };

    try {
      const filas = await this.calzadoRepositorio.query(
        `INSERT INTO catalogo_colores (nombre, tipo, hex_primario, colores_hex, patron, descripcion, activo)
         VALUES ($1, $2, $3, $4::jsonb, $5, $6, true)
         ON CONFLICT (nombre) DO UPDATE SET
           activo = true,
           tipo = COALESCE($2, catalogo_colores.tipo),
           hex_primario = COALESCE($3, catalogo_colores.hex_primario),
           colores_hex = CASE WHEN $4::jsonb != '[]'::jsonb THEN $4::jsonb ELSE catalogo_colores.colores_hex END,
           patron = COALESCE($5, catalogo_colores.patron),
           descripcion = COALESCE($6, catalogo_colores.descripcion)
         RETURNING id, nombre, tipo, hex_primario, colores_hex, patron, descripcion, activo`,
        [
          limpio,
          tipo,
          hexPrimario,
          JSON.stringify(coloresHex),
          patron,
          descripcion,
        ],
      );
      if (Array.isArray(filas) && filas[0]) {
        detalle = this.mapearFilaColorDetallado(filas[0]);
      }
    } catch {
      // Ya está en memoria
    }

    this.coloresDetalladosEnMemoria.set(limpio.toLowerCase(), detalle);
    const colores = await this.obtenerColores();
    return { nombre: limpio, colores, detalle };
  }

  async actualizarColorCatalogo(
    id: string,
    dto: ActualizarColorCatalogoDto,
  ): Promise<ColorCatalogoDetallado> {
    let filaExistente: Record<string, unknown> | null = null;
    try {
      const filas = await this.calzadoRepositorio.query(
        `SELECT id, nombre, tipo, hex_primario, colores_hex, patron, descripcion, activo
         FROM catalogo_colores
         WHERE id::text = $1 OR LOWER(nombre) = LOWER($1)
         LIMIT 1`,
        [id],
      );
      if (Array.isArray(filas) && filas[0]) {
        filaExistente = filas[0];
      }
    } catch {
      // Buscar en memoria si falla SQL
    }

    const enMemoria = Array.from(this.coloresDetalladosEnMemoria.values()).find(
      (c) => c.id === id || c.nombre.toLowerCase() === id.toLowerCase(),
    );

    if (!filaExistente && !enMemoria) {
      throw new NotFoundException({
        codigo: "ERR-CALZ-008",
        mensaje: `Color o categoría especial con identificador ${id} no encontrado en el catálogo`,
      });
    }

    const actual = filaExistente
      ? this.mapearFilaColorDetallado(filaExistente)
      : (enMemoria as ColorCatalogoDetallado);

    const nombreAnterior = actual.nombre;
    const nuevoNombre =
      limpiarEspacios(dto.nombre || dto.color || "") || actual.nombre;
    const nuevoTipo: TipoColorCatalogo = dto.tipo || actual.tipo;
    const nuevosColoresHex =
      Array.isArray(dto.coloresHex) && dto.coloresHex.length > 0
        ? dto.coloresHex.map((c) => limpiarEspacios(c)).filter(Boolean)
        : actual.coloresHex;
    const nuevoHexPrimario =
      limpiarEspacios(dto.hexPrimario || "") ||
      nuevosColoresHex[0] ||
      actual.hexPrimario;
    const nuevoPatron: PatronColorCatalogo = dto.patron || actual.patron;
    const nuevaDescripcion =
      dto.descripcion !== undefined
        ? dto.descripcion
          ? limpiarEspacios(dto.descripcion)
          : null
        : (actual.descripcion ?? null);
    const nuevoActivo = dto.activo !== undefined ? dto.activo : actual.activo;

    let actualizado: ColorCatalogoDetallado = {
      id: actual.id,
      nombre: nuevoNombre,
      tipo: nuevoTipo,
      hexPrimario: nuevoHexPrimario,
      coloresHex: nuevosColoresHex,
      patron: nuevoPatron,
      descripcion: nuevaDescripcion,
      activo: nuevoActivo,
    };

    try {
      const filas = await this.calzadoRepositorio.query(
        `UPDATE catalogo_colores
         SET nombre = $1,
             tipo = $2,
             hex_primario = $3,
             colores_hex = $4::jsonb,
             patron = $5,
             descripcion = $6,
             activo = $7
         WHERE id::text = $8 OR LOWER(nombre) = LOWER($9)
         RETURNING id, nombre, tipo, hex_primario, colores_hex, patron, descripcion, activo`,
        [
          nuevoNombre,
          nuevoTipo,
          nuevoHexPrimario,
          JSON.stringify(nuevosColoresHex),
          nuevoPatron,
          nuevaDescripcion,
          nuevoActivo,
          actual.id,
          nombreAnterior,
        ],
      );
      if (Array.isArray(filas) && filas[0]) {
        actualizado = this.mapearFilaColorDetallado(filas[0]);
      }
    } catch {
      // Conservar actualización en memoria
    }

    if (
      nuevoNombre.toLowerCase() !== nombreAnterior.toLowerCase() ||
      nuevoNombre !== nombreAnterior
    ) {
      this.coloresEnMemoria.delete(nombreAnterior);
      this.coloresDetalladosEnMemoria.delete(nombreAnterior.toLowerCase());
      if (dto.actualizarCalzados !== false) {
        try {
          await this.calzadoRepositorio.query(
            `UPDATE calzados SET color = $1 WHERE LOWER(TRIM(color)) = LOWER(TRIM($2))`,
            [nuevoNombre, nombreAnterior],
          );
        } catch {
          // Ignorar
        }
      }
    }

    if (nuevoActivo) {
      this.coloresEnMemoria.add(nuevoNombre);
    } else {
      this.coloresEnMemoria.delete(nuevoNombre);
    }
    this.coloresDetalladosEnMemoria.set(nuevoNombre.toLowerCase(), actualizado);

    return actualizado;
  }

  async eliminarColorCatalogo(id: string): Promise<{
    id: string;
    nombre: string;
    eliminado: boolean;
    activo: boolean;
  }> {
    let nombreEliminado = "";
    let encontrado = false;

    try {
      const filas = await this.calzadoRepositorio.query(
        `UPDATE catalogo_colores
         SET activo = false
         WHERE id::text = $1 OR LOWER(nombre) = LOWER($1)
         RETURNING id, nombre`,
        [id],
      );
      if (Array.isArray(filas) && filas[0]) {
        encontrado = true;
        nombreEliminado = String(filas[0].nombre || "");
      }
    } catch {
      // Fallback memoria
    }

    const enMemoria = Array.from(this.coloresDetalladosEnMemoria.values()).find(
      (c) => c.id === id || c.nombre.toLowerCase() === id.toLowerCase(),
    );
    if (enMemoria) {
      encontrado = true;
      nombreEliminado = nombreEliminado || enMemoria.nombre;
      enMemoria.activo = false;
      this.coloresDetalladosEnMemoria.set(
        enMemoria.nombre.toLowerCase(),
        enMemoria,
      );
      this.coloresEnMemoria.delete(enMemoria.nombre);
    }

    if (!encontrado) {
      throw new NotFoundException({
        codigo: "ERR-CALZ-008",
        mensaje: `Color o categoría especial con identificador ${id} no encontrado en el catálogo`,
      });
    }

    if (nombreEliminado) {
      this.coloresEnMemoria.delete(nombreEliminado);
    }

    return {
      id,
      nombre: nombreEliminado,
      eliminado: true,
      activo: false,
    };
  }

  async listarExtrasCatalogo(): Promise<ExtraCatalogoItem[]> {
    try {
      const filas = await this.calzadoRepositorio.query(
        `SELECT id, nombre, descripcion, activo, creado_en
         FROM catalogo_extras
         WHERE activo = true
         ORDER BY nombre ASC`,
      );
      if (Array.isArray(filas) && filas.length > 0) {
        const items: ExtraCatalogoItem[] = filas.map(
          (f: Record<string, unknown>) => ({
            id: String(f.id),
            nombre: limpiarEspacios(String(f.nombre || "")),
            descripcion:
              f.descripcion !== undefined && f.descripcion !== null
                ? String(f.descripcion)
                : null,
            activo: f.activo !== undefined ? Boolean(f.activo) : true,
            creadoEn: f.creado_en
              ? new Date(String(f.creado_en)).toISOString()
              : undefined,
          }),
        );
        for (const item of items) {
          this.extrasCatalogoEnMemoria.set(item.nombre.toLowerCase(), item);
        }
        return items;
      }
    } catch {
      // Fallback memoria
    }

    return Array.from(this.extrasCatalogoEnMemoria.values())
      .filter((e) => e.activo)
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }

  async crearExtraCatalogo(
    dto: CrearExtraCatalogoDto,
  ): Promise<ExtraCatalogoItem> {
    const nombreLimpio = limpiarEspacios(dto.nombre || "");
    if (!nombreLimpio) {
      throw new BadRequestException({
        codigo: "ERR-CALZ-008",
        mensaje: "El nombre del extra promocional no puede estar vacío",
      });
    }

    const descripcion = dto.descripcion
      ? limpiarEspacios(dto.descripcion)
      : null;

    let item: ExtraCatalogoItem = {
      id: `mem-extra-${Date.now()}`,
      nombre: nombreLimpio,
      descripcion,
      activo: true,
      creadoEn: new Date().toISOString(),
    };

    try {
      const filas = await this.calzadoRepositorio.query(
        `INSERT INTO catalogo_extras (nombre, descripcion, activo)
         VALUES ($1, $2, true)
         ON CONFLICT (nombre) DO UPDATE SET
           activo = true,
           descripcion = COALESCE($2, catalogo_extras.descripcion)
         RETURNING id, nombre, descripcion, activo, creado_en`,
        [nombreLimpio, descripcion],
      );
      if (Array.isArray(filas) && filas[0]) {
        item = {
          id: String(filas[0].id),
          nombre: limpiarEspacios(String(filas[0].nombre || "")),
          descripcion:
            filas[0].descripcion !== undefined && filas[0].descripcion !== null
              ? String(filas[0].descripcion)
              : null,
          activo: Boolean(filas[0].activo),
          creadoEn: filas[0].creado_en
            ? new Date(String(filas[0].creado_en)).toISOString()
            : new Date().toISOString(),
        };
      }
    } catch {
      // Conservar en memoria
    }

    this.extrasCatalogoEnMemoria.set(nombreLimpio.toLowerCase(), item);
    return item;
  }

  async actualizarExtraCatalogo(
    id: string,
    dto: ActualizarExtraCatalogoDto,
  ): Promise<ExtraCatalogoItem> {
    let filaExistente: Record<string, unknown> | null = null;
    try {
      const filas = await this.calzadoRepositorio.query(
        `SELECT id, nombre, descripcion, activo, creado_en
         FROM catalogo_extras
         WHERE id::text = $1 OR LOWER(nombre) = LOWER($1)
         LIMIT 1`,
        [id],
      );
      if (Array.isArray(filas) && filas[0]) {
        filaExistente = filas[0];
      }
    } catch {
      // Fallback memoria
    }

    const enMemoria = Array.from(this.extrasCatalogoEnMemoria.values()).find(
      (e) => e.id === id || e.nombre.toLowerCase() === id.toLowerCase(),
    );

    if (!filaExistente && !enMemoria) {
      throw new NotFoundException({
        codigo: "ERR-CALZ-008",
        mensaje: `Extra promocional con identificador ${id} no encontrado en el catálogo`,
      });
    }

    const nombreAnterior = filaExistente
      ? limpiarEspacios(String(filaExistente.nombre || ""))
      : (enMemoria?.nombre ?? "");
    const nuevoNombre = limpiarEspacios(dto.nombre || "") || nombreAnterior;
    const nuevaDescripcion =
      dto.descripcion !== undefined
        ? dto.descripcion
          ? limpiarEspacios(dto.descripcion)
          : null
        : filaExistente && filaExistente.descripcion !== null
          ? String(filaExistente.descripcion)
          : (enMemoria?.descripcion ?? null);
    const nuevoActivo =
      dto.activo !== undefined
        ? dto.activo
        : filaExistente !== null
          ? Boolean(filaExistente.activo)
          : (enMemoria?.activo ?? true);

    let actualizado: ExtraCatalogoItem = {
      id: filaExistente ? String(filaExistente.id) : (enMemoria?.id ?? id),
      nombre: nuevoNombre,
      descripcion: nuevaDescripcion,
      activo: nuevoActivo,
      creadoEn: enMemoria?.creadoEn || new Date().toISOString(),
    };

    try {
      const filas = await this.calzadoRepositorio.query(
        `UPDATE catalogo_extras
         SET nombre = $1,
             descripcion = $2,
             activo = $3
         WHERE id::text = $4 OR LOWER(nombre) = LOWER($5)
         RETURNING id, nombre, descripcion, activo, creado_en`,
        [
          nuevoNombre,
          nuevaDescripcion,
          nuevoActivo,
          actualizado.id,
          nombreAnterior,
        ],
      );
      if (Array.isArray(filas) && filas[0]) {
        actualizado = {
          id: String(filas[0].id),
          nombre: limpiarEspacios(String(filas[0].nombre || "")),
          descripcion:
            filas[0].descripcion !== undefined && filas[0].descripcion !== null
              ? String(filas[0].descripcion)
              : null,
          activo: Boolean(filas[0].activo),
          creadoEn: filas[0].creado_en
            ? new Date(String(filas[0].creado_en)).toISOString()
            : actualizado.creadoEn,
        };
      }
    } catch {
      // Conservar en memoria
    }

    if (nombreAnterior.toLowerCase() !== nuevoNombre.toLowerCase()) {
      this.extrasCatalogoEnMemoria.delete(nombreAnterior.toLowerCase());
    }
    this.extrasCatalogoEnMemoria.set(nuevoNombre.toLowerCase(), actualizado);

    return actualizado;
  }

  async eliminarExtraCatalogo(id: string): Promise<{
    id: string;
    nombre: string;
    eliminado: boolean;
    activo: boolean;
  }> {
    let nombreEliminado = "";
    let encontrado = false;

    try {
      const filas = await this.calzadoRepositorio.query(
        `UPDATE catalogo_extras
         SET activo = false
         WHERE id::text = $1 OR LOWER(nombre) = LOWER($1)
         RETURNING id, nombre`,
        [id],
      );
      if (Array.isArray(filas) && filas[0]) {
        encontrado = true;
        nombreEliminado = String(filas[0].nombre || "");
      }
    } catch {
      // Fallback memoria
    }

    const enMemoria = Array.from(this.extrasCatalogoEnMemoria.values()).find(
      (e) => e.id === id || e.nombre.toLowerCase() === id.toLowerCase(),
    );
    if (enMemoria) {
      encontrado = true;
      nombreEliminado = nombreEliminado || enMemoria.nombre;
      enMemoria.activo = false;
      this.extrasCatalogoEnMemoria.set(
        enMemoria.nombre.toLowerCase(),
        enMemoria,
      );
    }

    if (!encontrado) {
      throw new NotFoundException({
        codigo: "ERR-CALZ-008",
        mensaje: `Extra promocional con identificador ${id} no encontrado en el catálogo`,
      });
    }

    return {
      id,
      nombre: nombreEliminado,
      eliminado: true,
      activo: false,
    };
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
