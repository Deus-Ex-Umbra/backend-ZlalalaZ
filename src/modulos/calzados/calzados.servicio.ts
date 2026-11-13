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
  CrearCategoriaCatalogoDto,
  ActualizarCategoriaCatalogoDto,
  CrearMarcaCatalogoDto,
  ActualizarMarcaCatalogoDto,
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
  coloresNombres?: string[];
  patron: PatronColorCatalogo;
  descripcion?: string | null;
  activo: boolean;
  eliminadoEn?: string | null;
}

export interface ExtraCatalogoItem {
  id: string;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
  creadoEn?: string;
}

export interface CategoriaCatalogoItem {
  id: string;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
  totalCalzados?: number;
  creadoEn?: string;
}

export interface MarcaCatalogoItem {
  id: string;
  nombre: string;
  activo: boolean;
  totalCalzados?: number;
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
  {
    nombre: "Verde+Rojo+Amarillo",
    tipo: "COMBINACION",
    hexPrimario: "#16A34A",
    coloresHex: ["#16A34A", "#DC2626", "#EAB308"],
    coloresNombres: ["Verde", "Rojo", "Amarillo"],
    patron: "TRICOLOR",
    descripcion: "Combinación tricolor Verde+Rojo+Amarillo",
    activo: true,
  },
  {
    nombre: "Negro+Blanco",
    tipo: "COMBINACION",
    hexPrimario: "#111827",
    coloresHex: ["#111827", "#FFFFFF"],
    coloresNombres: ["Negro", "Blanco"],
    patron: "BICOLOR",
    descripcion: "Combinación clásica Negro+Blanco",
    activo: true,
  },
  {
    nombre: "Azul+Amarillo+Verde",
    tipo: "COMBINACION",
    hexPrimario: "#2563EB",
    coloresHex: ["#2563EB", "#EAB308", "#16A34A"],
    coloresNombres: ["Azul", "Amarillo", "Verde"],
    patron: "TRICOLOR",
    descripcion: "Combinación tricolor Azul+Amarillo+Verde",
    activo: true,
  },
  {
    nombre: "Rojo+Negro+Blanco",
    tipo: "COMBINACION",
    hexPrimario: "#DC2626",
    coloresHex: ["#DC2626", "#111827", "#FFFFFF"],
    coloresNombres: ["Rojo", "Negro", "Blanco"],
    patron: "TRICOLOR",
    descripcion: "Combinación tricolor Rojo+Negro+Blanco",
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
          colores_nombres JSONB DEFAULT '[]'::jsonb,
          patron VARCHAR(30) DEFAULT 'SOLIDO',
          descripcion VARCHAR(200),
          activo BOOLEAN DEFAULT true,
          eliminado_en TIMESTAMP NULL,
          creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        ALTER TABLE catalogo_colores ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'NORMAL';
        ALTER TABLE catalogo_colores ADD COLUMN IF NOT EXISTS hex_primario VARCHAR(20);
        ALTER TABLE catalogo_colores ADD COLUMN IF NOT EXISTS colores_hex JSONB DEFAULT '[]'::jsonb;
        ALTER TABLE catalogo_colores ADD COLUMN IF NOT EXISTS colores_nombres JSONB DEFAULT '[]'::jsonb;
        ALTER TABLE catalogo_colores ADD COLUMN IF NOT EXISTS patron VARCHAR(30) DEFAULT 'SOLIDO';
        ALTER TABLE catalogo_colores ADD COLUMN IF NOT EXISTS descripcion VARCHAR(200);
        ALTER TABLE catalogo_colores ADD COLUMN IF NOT EXISTS eliminado_en TIMESTAMP NULL;
        CREATE TABLE IF NOT EXISTS catalogo_extras (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          nombre VARCHAR(120) UNIQUE NOT NULL,
          descripcion VARCHAR(255),
          activo BOOLEAN DEFAULT true,
          creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS catalogo_categorias (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          nombre VARCHAR(100) UNIQUE NOT NULL,
          descripcion VARCHAR(200),
          activo BOOLEAN DEFAULT true,
          creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS catalogo_marcas (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          nombre VARCHAR(80) UNIQUE NOT NULL,
          activo BOOLEAN DEFAULT true,
          creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        ALTER TABLE calzados ADD COLUMN IF NOT EXISTS categoria_id UUID REFERENCES catalogo_categorias(id) ON DELETE SET NULL;
        ALTER TABLE calzados ADD COLUMN IF NOT EXISTS marca_id UUID REFERENCES catalogo_marcas(id) ON DELETE SET NULL;
        ALTER TABLE calzados ADD COLUMN IF NOT EXISTS color_id UUID REFERENCES catalogo_colores(id) ON DELETE SET NULL;
      `).catch(() => {});
    } catch {
      // Ignorar si ya existen
    }

    try {
      for (const item of SEMILLA_COLORES_CATALOGO) {
        await this.calzadoRepositorio.query(
          `INSERT INTO catalogo_colores (nombre, tipo, hex_primario, colores_hex, colores_nombres, patron, descripcion, activo)
           VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7, true)
           ON CONFLICT (nombre) DO UPDATE SET
             tipo = CASE
               WHEN catalogo_colores.eliminado_en IS NOT NULL THEN catalogo_colores.tipo
               WHEN catalogo_colores.hex_primario IS NULL OR catalogo_colores.hex_primario = '' THEN EXCLUDED.tipo
               ELSE catalogo_colores.tipo
             END,
             hex_primario = COALESCE(NULLIF(catalogo_colores.hex_primario, ''), EXCLUDED.hex_primario),
             colores_hex = CASE
               WHEN catalogo_colores.colores_hex IS NULL OR catalogo_colores.colores_hex = '[]'::jsonb THEN EXCLUDED.colores_hex
               ELSE catalogo_colores.colores_hex
             END,
             colores_nombres = CASE
               WHEN catalogo_colores.colores_nombres IS NULL OR catalogo_colores.colores_nombres = '[]'::jsonb THEN EXCLUDED.colores_nombres
               ELSE catalogo_colores.colores_nombres
             END,
             patron = CASE
               WHEN catalogo_colores.hex_primario IS NULL OR catalogo_colores.hex_primario = '' THEN EXCLUDED.patron
               ELSE COALESCE(NULLIF(catalogo_colores.patron, ''), EXCLUDED.patron)
             END,
             descripcion = COALESCE(NULLIF(catalogo_colores.descripcion, ''), EXCLUDED.descripcion)
           WHERE catalogo_colores.eliminado_en IS NULL`,
          [
            item.nombre,
            item.tipo,
            item.hexPrimario,
            JSON.stringify(item.coloresHex),
            JSON.stringify(item.coloresNombres || []),
            item.patron,
            item.descripcion || null,
          ],
        );
      }

      // Vincular calzados existentes que coincidan por nombre con catalogo_colores activo
      await this.calzadoRepositorio.query(`
        UPDATE calzados c
        SET color_id = col.id
        FROM catalogo_colores col
        WHERE c.color_id IS NULL
          AND col.activo = true
          AND col.eliminado_en IS NULL
          AND LOWER(TRIM(c.color)) = LOWER(TRIM(col.nombre));
      `);
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
      // Sembrar y vincular catalogo_categorias desde calzados existentes
      await this.calzadoRepositorio.query(`
        INSERT INTO catalogo_categorias (nombre, activo)
        SELECT DISTINCT TRIM(categoria), true
        FROM calzados
        WHERE categoria IS NOT NULL AND TRIM(categoria) != ''
        ON CONFLICT (nombre) DO NOTHING;

        UPDATE calzados c
        SET categoria_id = cc.id
        FROM catalogo_categorias cc
        WHERE c.categoria_id IS NULL
          AND LOWER(TRIM(c.categoria)) = LOWER(TRIM(cc.nombre));
      `);
    } catch {
      // Ignorar si falla semilla de categorías
    }

    try {
      // Sembrar y vincular catalogo_marcas desde marcas conocidas + calzados existentes
      const marcasBase = [
        "Nike",
        "Adidas",
        "Puma",
        "Vans",
        "Jordan",
        "Converse",
        "New Balance",
        "Reebok",
        "Fila",
        "Skechers",
      ];
      for (const m of marcasBase) {
        await this.calzadoRepositorio.query(
          `INSERT INTO catalogo_marcas (nombre, activo) VALUES ($1, true) ON CONFLICT (nombre) DO NOTHING`,
          [m],
        );
      }
      await this.calzadoRepositorio.query(
        `
        INSERT INTO catalogo_marcas (nombre, activo)
        SELECT DISTINCT TRIM(marca), true
        FROM calzados
        WHERE marca IS NOT NULL AND TRIM(marca) != '' AND TRIM(marca) != $1
        ON CONFLICT (nombre) DO NOTHING;

        UPDATE calzados c
        SET marca_id = cm.id
        FROM catalogo_marcas cm
        WHERE c.marca_id IS NULL
          AND LOWER(TRIM(c.marca)) = LOWER(TRIM(cm.nombre));
      `,
        [MARCA_SIN_DEFINIR],
      );
    } catch {
      // Ignorar si falla semilla de marcas
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
      query.andWhere("LOWER(TRIM(calzado.categoria)) = LOWER(TRIM(:categoria))", {
        categoria,
      });
    }

    if (marca) {
      query.andWhere("LOWER(TRIM(calzado.marca)) = LOWER(TRIM(:marca))", {
        marca,
      });
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

    query
      .orderBy("LENGTH(calzado.codigoProducto)", "ASC")
      .addOrderBy("calzado.codigoProducto", "ASC");
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

  private async asegurarCategoriaCatalogoId(
    nombreCategoria?: string | null,
    categoriaIdDto?: string | null,
  ): Promise<{ nombre: string; id: string | null }> {
    const limpio = limpiarEspacios(nombreCategoria) || "General";
    if (categoriaIdDto) {
      try {
        const filas = await this.calzadoRepositorio.query(
          `SELECT id, nombre FROM catalogo_categorias WHERE id = $1 LIMIT 1`,
          [categoriaIdDto],
        );
        if (filas?.[0]) {
          return { nombre: String(filas[0].nombre), id: String(filas[0].id) };
        }
      } catch {
        // Ignorar
      }
    }
    try {
      const filas = await this.calzadoRepositorio.query(
        `INSERT INTO catalogo_categorias (nombre, activo)
         VALUES ($1, true)
         ON CONFLICT (nombre) DO UPDATE SET activo = true
         RETURNING id, nombre`,
        [limpio],
      );
      if (filas?.[0]) {
        return { nombre: String(filas[0].nombre), id: String(filas[0].id) };
      }
    } catch {
      // Fallback
    }
    return { nombre: limpio, id: null };
  }

  private async asegurarMarcaCatalogoId(
    nombreMarca?: string | null,
    nombreProducto?: string,
    marcaIdDto?: string | null,
  ): Promise<{ nombre: string; id: string | null }> {
    if (marcaIdDto) {
      try {
        const filas = await this.calzadoRepositorio.query(
          `SELECT id, nombre FROM catalogo_marcas WHERE id = $1 LIMIT 1`,
          [marcaIdDto],
        );
        if (filas?.[0]) {
          return { nombre: String(filas[0].nombre), id: String(filas[0].id) };
        }
      } catch {
        // Ignorar
      }
    }

    let nombreFinal = limpiarEspacios(nombreMarca);
    if (!nombreFinal && nombreProducto) {
      nombreFinal = extraerMarca(nombreProducto);
      if (nombreFinal === MARCA_SIN_DEFINIR) {
        try {
          const marcasDb = await this.obtenerMarcas();
          const nombreLow = nombreProducto.toLowerCase();
          const coincidencia = marcasDb
            .sort((a, b) => b.length - a.length)
            .find((m) => nombreLow.startsWith(m.toLowerCase() + " ") || nombreLow === m.toLowerCase());
          if (coincidencia) nombreFinal = coincidencia;
        } catch {
          // Ignorar
        }
      }
    }

    if (!nombreFinal || nombreFinal === MARCA_SIN_DEFINIR) {
      return { nombre: MARCA_SIN_DEFINIR, id: null };
    }

    try {
      const filas = await this.calzadoRepositorio.query(
        `INSERT INTO catalogo_marcas (nombre, activo)
         VALUES ($1, true)
         ON CONFLICT (nombre) DO UPDATE SET activo = true
         RETURNING id, nombre`,
        [nombreFinal],
      );
      if (filas?.[0]) {
        return { nombre: String(filas[0].nombre), id: String(filas[0].id) };
      }
    } catch {
      // Fallback
    }
    return { nombre: nombreFinal, id: null };
  }

  private async asegurarColorCatalogoId(
    nombreColor?: string | null,
    colorIdDto?: string | null,
  ): Promise<{ nombre: string; id: string | null }> {
    if (colorIdDto) {
      try {
        const filas = await this.calzadoRepositorio.query(
          `SELECT id, nombre
           FROM catalogo_colores
           WHERE id = $1 AND activo = true AND eliminado_en IS NULL
           LIMIT 1`,
          [colorIdDto],
        );
        if (filas?.[0]) {
          return { nombre: String(filas[0].nombre), id: String(filas[0].id) };
        }
      } catch {
        // Ignorar
      }
    }

    const limpio = limpiarEspacios(nombreColor);
    if (!limpio) {
      return { nombre: "", id: null };
    }

    try {
      const filas = await this.calzadoRepositorio.query(
        `SELECT id, nombre
         FROM catalogo_colores
         WHERE LOWER(TRIM(nombre)) = LOWER(TRIM($1))
           AND activo = true
           AND eliminado_en IS NULL
         LIMIT 1`,
        [limpio],
      );
      if (filas?.[0]) {
        return { nombre: String(filas[0].nombre), id: String(filas[0].id) };
      }
    } catch {
      // Fallback
    }
    return { nombre: limpio, id: null };
  }

  async crear(dto: CrearCalzadoDto): Promise<Calzado> {
    const rawCodigo = limpiarEspacios(dto.codigoProducto);
    const codigoProducto =
      !rawCodigo || rawCodigo.toUpperCase() === "AUTO"
        ? (await this.obtenerSiguienteCodigo()).codigoSugerido
        : normalizarCodigoProducto(rawCodigo);
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

    const colorLimpio =
      dto.color !== undefined ? limpiarEspacios(dto.color) : "Blanco";
    const colorInfo = await this.asegurarColorCatalogoId(
      colorLimpio,
      dto.colorId,
    );
    if (colorInfo.nombre) {
      this.coloresEnMemoria.add(colorInfo.nombre);
    }

    const catInfo = await this.asegurarCategoriaCatalogoId(
      dto.categoria || (esExtra ? "Extra / Promoción" : "General"),
      dto.categoriaId,
    );
    const marcaInfo = await this.asegurarMarcaCatalogoId(
      dto.marca,
      nombreProducto,
      dto.marcaId,
    );

    const nuevo = this.calzadoRepositorio.create({
      ...dto,
      codigoProducto,
      nombreProducto,
      marca: marcaInfo.nombre,
      marcaId: marcaInfo.id,
      categoria: catInfo.nombre,
      categoriaId: catInfo.id,
      tipoProducto,
      talla,
      stockPorTalla: mapaTallas,
      segmentoTalla,
      color: colorInfo.nombre,
      colorId: colorInfo.id,
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
    const marcaInfo = await this.asegurarMarcaCatalogoId(
      dto.marca !== undefined ? dto.marca : calzado.marca,
      calzado.nombreProducto,
      dto.marcaId,
    );
    calzado.marca = marcaInfo.nombre;
    calzado.marcaId = marcaInfo.id;

    if (dto.categoria !== undefined || dto.categoriaId !== undefined) {
      const catInfo = await this.asegurarCategoriaCatalogoId(
        dto.categoria ?? calzado.categoria,
        dto.categoriaId,
      );
      calzado.categoria = catInfo.nombre;
      calzado.categoriaId = catInfo.id;
    }

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

    if (dto.color !== undefined || dto.colorId !== undefined) {
      const colorInput =
        dto.color !== undefined ? limpiarEspacios(dto.color) : "";
      if (!colorInput && !dto.colorId) {
        calzado.color = "";
        calzado.colorId = null;
      } else {
        const colorInfo = await this.asegurarColorCatalogoId(
          colorInput,
          dto.colorId,
        );
        calzado.color = colorInfo.nombre;
        calzado.colorId = colorInfo.id;
        if (colorInfo.nombre) {
          this.coloresEnMemoria.add(colorInfo.nombre);
        }
      }
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
      tipoRaw === "COMBINACION"
        ? "COMBINACION"
        : tipoRaw === "ESPECIAL"
          ? "ESPECIAL"
          : "NORMAL";

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

    let coloresNombres: string[] = [];
    if (Array.isArray(fila.colores_nombres)) {
      coloresNombres = fila.colores_nombres
        .map((c) => limpiarEspacios(String(c || "")))
        .filter(Boolean);
    } else if (typeof fila.colores_nombres === "string") {
      try {
        const parseado = JSON.parse(fila.colores_nombres);
        if (Array.isArray(parseado)) {
          coloresNombres = parseado
            .map((c) => limpiarEspacios(String(c || "")))
            .filter(Boolean);
        }
      } catch {
        coloresNombres = [];
      }
    }
    if (coloresNombres.length === 0 && semilla?.coloresNombres?.length) {
      coloresNombres = [...semilla.coloresNombres];
    }
    if (coloresNombres.length === 0 && tipo === "COMBINACION" && nombre) {
      coloresNombres = nombre
        .split(/[+/]/)
        .map((c) => limpiarEspacios(c))
        .filter(Boolean);
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
      coloresNombres,
      patron,
      descripcion:
        fila.descripcion !== undefined && fila.descripcion !== null
          ? String(fila.descripcion)
          : (semilla?.descripcion ?? null),
      activo: fila.activo !== undefined ? Boolean(fila.activo) : true,
      eliminadoEn: fila.eliminado_en
        ? new Date(String(fila.eliminado_en)).toISOString()
        : null,
    };
  }

  async obtenerColores(): Promise<string[]> {
    const conjunto = new Set<string>(this.coloresEnMemoria);

    try {
      const filasCatalogo = await this.calzadoRepositorio.query(
        `SELECT nombre
         FROM catalogo_colores
         WHERE activo = true AND eliminado_en IS NULL
         ORDER BY nombre ASC`,
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
        .andWhere("TRIM(calzado.color) != ''")
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
        `SELECT id, nombre, tipo, hex_primario, colores_hex, colores_nombres, patron, descripcion, activo, eliminado_en
         FROM catalogo_colores
         WHERE activo = true AND eliminado_en IS NULL
         ORDER BY
           CASE
             WHEN tipo = 'ESPECIAL' THEN 0
             WHEN tipo = 'COMBINACION' THEN 1
             ELSE 2
           END,
           nombre ASC`,
      );
      if (Array.isArray(filas)) {
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

    const ordenTipo: Record<TipoColorCatalogo, number> = {
      ESPECIAL: 0,
      COMBINACION: 1,
      NORMAL: 2,
    };
    return Array.from(this.coloresDetalladosEnMemoria.values())
      .filter((c) => c.activo && !c.eliminadoEn)
      .sort((a, b) => {
        if (a.tipo !== b.tipo) return ordenTipo[a.tipo] - ordenTipo[b.tipo];
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
    const nombresComponentes = Array.isArray(dto.coloresNombres)
      ? dto.coloresNombres.map((c) => limpiarEspacios(c)).filter(Boolean)
      : [];

    const nombreManual = limpiarEspacios(dto.nombre || dto.color || "");
    const semillaPrevia = nombreManual
      ? this.coloresDetalladosEnMemoria.get(nombreManual.toLowerCase())
      : undefined;

    const tipo: TipoColorCatalogo =
      dto.tipo === "COMBINACION"
        ? "COMBINACION"
        : dto.tipo === "ESPECIAL"
          ? "ESPECIAL"
          : !dto.tipo && semillaPrevia?.tipo
            ? semillaPrevia.tipo
            : "NORMAL";

    const limpio =
      tipo === "COMBINACION" && nombresComponentes.length > 0
        ? nombresComponentes.join("+")
        : nombreManual;

    if (!limpio) {
      throw new BadRequestException({
        codigo: "ERR-CALZ-007",
        mensaje:
          tipo === "COMBINACION"
            ? "Debes seleccionar al menos dos colores para la combinación"
            : "El nombre del color o categoría no puede estar vacío",
      });
    }

    const semillaExistente =
      this.coloresDetalladosEnMemoria.get(limpio.toLowerCase()) ||
      semillaPrevia;

    const coloresNombresFinal =
      nombresComponentes.length > 0
        ? nombresComponentes
        : tipo === "COMBINACION"
          ? limpio
              .split(/[+/]/)
              .map((c) => limpiarEspacios(c))
              .filter(Boolean)
          : semillaExistente?.coloresNombres || [];

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
      coloresNombres: coloresNombresFinal,
      patron,
      descripcion,
      activo: true,
      eliminadoEn: null,
    };

    try {
      const filas = await this.calzadoRepositorio.query(
        `INSERT INTO catalogo_colores (nombre, tipo, hex_primario, colores_hex, colores_nombres, patron, descripcion, activo, eliminado_en)
         VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7, true, NULL)
         ON CONFLICT (nombre) DO UPDATE SET
           activo = true,
           eliminado_en = NULL,
           tipo = COALESCE($2, catalogo_colores.tipo),
           hex_primario = COALESCE($3, catalogo_colores.hex_primario),
           colores_hex = CASE WHEN $4::jsonb != '[]'::jsonb THEN $4::jsonb ELSE catalogo_colores.colores_hex END,
           colores_nombres = CASE WHEN $5::jsonb != '[]'::jsonb THEN $5::jsonb ELSE catalogo_colores.colores_nombres END,
           patron = COALESCE($6, catalogo_colores.patron),
           descripcion = COALESCE($7, catalogo_colores.descripcion)
         RETURNING id, nombre, tipo, hex_primario, colores_hex, colores_nombres, patron, descripcion, activo, eliminado_en`,
        [
          limpio,
          tipo,
          hexPrimario,
          JSON.stringify(coloresHex),
          JSON.stringify(coloresNombresFinal),
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
        `SELECT id, nombre, tipo, hex_primario, colores_hex, colores_nombres, patron, descripcion, activo, eliminado_en
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
    const nuevoTipo: TipoColorCatalogo = dto.tipo || actual.tipo;
    const nuevosColoresNombres =
      Array.isArray(dto.coloresNombres) && dto.coloresNombres.length > 0
        ? dto.coloresNombres.map((c) => limpiarEspacios(c)).filter(Boolean)
        : actual.coloresNombres || [];
    const nombreDto = limpiarEspacios(dto.nombre || dto.color || "");
    const nuevoNombre =
      nuevoTipo === "COMBINACION" &&
      Array.isArray(dto.coloresNombres) &&
      dto.coloresNombres.length > 0 &&
      !nombreDto
        ? nuevosColoresNombres.join("+")
        : nombreDto ||
          (nuevoTipo === "COMBINACION" && nuevosColoresNombres.length > 0
            ? nuevosColoresNombres.join("+")
            : actual.nombre);
    const nuevosColoresHex =
      Array.isArray(dto.coloresHex) && dto.coloresHex.length > 0
        ? dto.coloresHex.map((c) => limpiarEspacios(c)).filter(Boolean)
        : actual.coloresHex;
    const nuevoHexPrimario =
      limpiarEspacios(dto.hexPrimario || "") ||
      nuevosColoresHex[0] ||
      actual.hexPrimario;
    const nuevoPatron: PatronColorCatalogo =
      dto.patron ||
      (nuevosColoresHex.length === 2
        ? "BICOLOR"
        : nuevosColoresHex.length >= 3
          ? "TRICOLOR"
          : actual.patron);
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
      coloresNombres: nuevosColoresNombres,
      patron: nuevoPatron,
      descripcion: nuevaDescripcion,
      activo: nuevoActivo,
      eliminadoEn: nuevoActivo ? null : actual.eliminadoEn || null,
    };

    try {
      const filas = await this.calzadoRepositorio.query(
        `UPDATE catalogo_colores
         SET nombre = $1,
             tipo = $2,
             hex_primario = $3,
             colores_hex = $4::jsonb,
             colores_nombres = $5::jsonb,
             patron = $6,
             descripcion = $7,
             activo = $8,
             eliminado_en = CASE WHEN $8 = true THEN NULL ELSE COALESCE(eliminado_en, CURRENT_TIMESTAMP) END
         WHERE id::text = $9 OR LOWER(nombre) = LOWER($10)
         RETURNING id, nombre, tipo, hex_primario, colores_hex, colores_nombres, patron, descripcion, activo, eliminado_en`,
        [
          nuevoNombre,
          nuevoTipo,
          nuevoHexPrimario,
          JSON.stringify(nuevosColoresHex),
          JSON.stringify(nuevosColoresNombres),
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
            `UPDATE calzados
             SET color = $1,
                 color_id = COALESCE(color_id, NULLIF($2, '')::uuid)
             WHERE (color_id IS NOT NULL AND color_id::text = $2)
                OR LOWER(TRIM(color)) = LOWER(TRIM($3))`,
            [nuevoNombre, actual.id, nombreAnterior],
          );
        } catch {
          // Ignorar si id no es uuid válido (memoria)
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
    calzadosActualizados: number;
  }> {
    let nombreEliminado = "";
    let idReal = id;
    let encontrado = false;

    try {
      const filas = await this.calzadoRepositorio.query(
        `UPDATE catalogo_colores
         SET activo = false,
             eliminado_en = COALESCE(eliminado_en, CURRENT_TIMESTAMP)
         WHERE id::text = $1 OR LOWER(nombre) = LOWER($1)
         RETURNING id, nombre`,
        [id],
      );
      if (Array.isArray(filas) && filas[0]) {
        encontrado = true;
        idReal = String(filas[0].id || id);
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
      enMemoria.eliminadoEn = new Date().toISOString();
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

    let calzadosActualizados = 0;
    if (nombreEliminado) {
      this.coloresEnMemoria.delete(nombreEliminado);

      // Remover este color o categoría/combinación de los calzados asociados
      try {
        const asociados = await this.calzadoRepositorio.query(
          `SELECT id, color, color_id
           FROM calzados
           WHERE color_id::text = $1
              OR LOWER(TRIM(color)) = LOWER(TRIM($2))
              OR LOWER(color) LIKE $3`,
          [idReal, nombreEliminado, `%${nombreEliminado.toLowerCase()}%`],
        );

        const objetivoLower = nombreEliminado.trim().toLowerCase();
        if (Array.isArray(asociados)) {
          for (const zapato of asociados) {
            const colorActual = String(zapato.color || "").trim();
            const vinculadoPorId = String(zapato.color_id || "") === idReal;

            if (
              vinculadoPorId ||
              colorActual.toLowerCase() === objetivoLower
            ) {
              await this.calzadoRepositorio.query(
                `UPDATE calzados SET color = '', color_id = NULL WHERE id = $1`,
                [zapato.id],
              );
              calzadosActualizados += 1;
              continue;
            }

            // Si el calzado tenía múltiples colores separados por '+' o '/', quitar solo el token eliminado
            const partes = colorActual
              .split(/\s*([+/])\s*/)
              .map((p) => p.trim())
              .filter(Boolean);
            const restantes: string[] = [];
            for (const parte of partes) {
              if (parte === "+" || parte === "/") continue;
              if (parte.toLowerCase() === objetivoLower) continue;
              restantes.push(parte);
            }

            if (restantes.length !== partes.filter((p) => p !== "+" && p !== "/").length) {
              const separador = colorActual.includes("+") ? "+" : "/";
              const nuevoColor = restantes.join(separador);
              await this.calzadoRepositorio.query(
                `UPDATE calzados
                 SET color = $1,
                     color_id = CASE WHEN $1 = '' THEN NULL ELSE color_id END
                 WHERE id = $2`,
                [nuevoColor, zapato.id],
              );
              calzadosActualizados += 1;
            }
          }
        }
      } catch {
        // Ignorar si no hay calzados vinculados
      }
    }

    return {
      id: idReal,
      nombre: nombreEliminado,
      eliminado: true,
      activo: false,
      calzadosActualizados,
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
    const conjunto = new Set<string>();
    try {
      const filasCat = await this.calzadoRepositorio.query(
        `SELECT nombre FROM catalogo_marcas WHERE activo = true ORDER BY nombre ASC`,
      );
      for (const f of filasCat) {
        const nombre = limpiarEspacios(String(f?.nombre || ""));
        if (nombre && nombre !== MARCA_SIN_DEFINIR) conjunto.add(nombre);
      }
    } catch {
      // Fallback
    }

    const filas = await this.calzadoRepositorio
      .createQueryBuilder("calzado")
      .select("DISTINCT calzado.marca", "marca")
      .where("calzado.activo = :activo", { activo: true })
      .orderBy("calzado.marca", "ASC")
      .getRawMany<{ marca: string }>();
    for (const fila of filas) {
      const nombre = limpiarEspacios(fila.marca);
      if (nombre && nombre !== MARCA_SIN_DEFINIR) conjunto.add(nombre);
    }

    return Array.from(conjunto).sort((a, b) => a.localeCompare(b, "es"));
  }

  async obtenerMarcasDetalladas(): Promise<MarcaCatalogoItem[]> {
    try {
      const filas = await this.calzadoRepositorio.query(`
        SELECT cm.id, cm.nombre, cm.activo, cm.creado_en,
          COUNT(c.id)::int AS total_calzados
        FROM catalogo_marcas cm
        LEFT JOIN calzados c ON (c.marca_id = cm.id OR LOWER(TRIM(c.marca)) = LOWER(TRIM(cm.nombre))) AND c.activo = true
        WHERE cm.activo = true
        GROUP BY cm.id, cm.nombre, cm.activo, cm.creado_en
        ORDER BY cm.nombre ASC
      `);
      return filas.map((f: Record<string, unknown>) => ({
        id: String(f.id),
        nombre: String(f.nombre),
        activo: f.activo !== false,
        totalCalzados: Number(f.total_calzados ?? 0),
        creadoEn: f.creado_en ? String(f.creado_en) : undefined,
      }));
    } catch {
      const nombres = await this.obtenerMarcas();
      return nombres.map((nombre, idx) => ({
        id: `mem-marca-${idx}`,
        nombre,
        activo: true,
        totalCalzados: 0,
      }));
    }
  }

  async crearMarcaCatalogo(
    dto: CrearMarcaCatalogoDto,
  ): Promise<MarcaCatalogoItem> {
    const limpio = limpiarEspacios(dto.nombre);
    if (!limpio) {
      throw new BadRequestException({
        codigo: "ERR-CALZ-009",
        mensaje: "El nombre de la marca no puede estar vacío",
      });
    }

    const filas = await this.calzadoRepositorio.query(
      `INSERT INTO catalogo_marcas (nombre, activo)
       VALUES ($1, true)
       ON CONFLICT (nombre) DO UPDATE SET activo = true
       RETURNING id, nombre, activo, creado_en`,
      [limpio],
    );
    const f = filas[0];
    return {
      id: String(f.id),
      nombre: String(f.nombre),
      activo: f.activo !== false,
      totalCalzados: 0,
      creadoEn: f.creado_en ? String(f.creado_en) : undefined,
    };
  }

  async actualizarMarcaCatalogo(
    id: string,
    dto: ActualizarMarcaCatalogoDto,
  ): Promise<MarcaCatalogoItem> {
    const existentes = await this.calzadoRepositorio.query(
      `SELECT id, nombre, activo, creado_en FROM catalogo_marcas WHERE id = $1 LIMIT 1`,
      [id],
    );
    if (!existentes?.[0]) {
      throw new NotFoundException({
        codigo: "ERR-CALZ-010",
        mensaje: "No existe la marca solicitada en el catálogo",
      });
    }

    const anterior = String(existentes[0].nombre);
    const nuevoNombre = dto.nombre ? limpiarEspacios(dto.nombre) : anterior;
    if (!nuevoNombre) {
      throw new BadRequestException({
        codigo: "ERR-CALZ-009",
        mensaje: "El nombre de la marca no puede estar vacío",
      });
    }

    const activo =
      dto.activo !== undefined ? dto.activo : existentes[0].activo !== false;

    const filas = await this.calzadoRepositorio.query(
      `UPDATE catalogo_marcas SET nombre = $1, activo = $2 WHERE id = $3 RETURNING id, nombre, activo, creado_en`,
      [nuevoNombre, activo, id],
    );

    if (nuevoNombre !== anterior && dto.actualizarCalzados !== false) {
      await this.calzadoRepositorio.query(
        `UPDATE calzados SET marca = $1, marca_id = $2 WHERE marca_id = $2 OR LOWER(TRIM(marca)) = LOWER(TRIM($3))`,
        [nuevoNombre, id, anterior],
      );
    }

    const f = filas[0];
    return {
      id: String(f.id),
      nombre: String(f.nombre),
      activo: f.activo !== false,
      creadoEn: f.creado_en ? String(f.creado_en) : undefined,
    };
  }

  async eliminarMarcaCatalogo(id: string): Promise<{ id: string; eliminado: boolean }> {
    const filas = await this.calzadoRepositorio.query(
      `UPDATE catalogo_marcas SET activo = false WHERE id = $1 RETURNING id`,
      [id],
    );
    if (!filas?.[0]) {
      throw new NotFoundException({
        codigo: "ERR-CALZ-010",
        mensaje: "No existe la marca solicitada en el catálogo",
      });
    }
    return { id: String(filas[0].id), eliminado: true };
  }

  async obtenerCategorias(): Promise<string[]> {
    const conjunto = new Set<string>();
    try {
      const filasCat = await this.calzadoRepositorio.query(
        `SELECT nombre FROM catalogo_categorias WHERE activo = true ORDER BY nombre ASC`,
      );
      for (const f of filasCat) {
        const nombre = limpiarEspacios(String(f?.nombre || ""));
        if (nombre) conjunto.add(nombre);
      }
    } catch {
      // Fallback
    }

    const filas = await this.calzadoRepositorio
      .createQueryBuilder("calzado")
      .select("DISTINCT calzado.categoria", "categoria")
      .where("calzado.activo = :activo", { activo: true })
      .andWhere("calzado.categoria IS NOT NULL")
      .andWhere("TRIM(calzado.categoria) != ''")
      .orderBy("calzado.categoria", "ASC")
      .getRawMany<{ categoria: string }>();

    for (const fila of filas) {
      const cat = fila.categoria?.trim();
      if (cat) conjunto.add(cat);
    }

    return Array.from(conjunto).sort((a, b) => a.localeCompare(b, "es"));
  }

  async obtenerCategoriasDetalladas(): Promise<CategoriaCatalogoItem[]> {
    try {
      const filas = await this.calzadoRepositorio.query(`
        SELECT cc.id, cc.nombre, cc.descripcion, cc.activo, cc.creado_en,
          COUNT(c.id)::int AS total_calzados
        FROM catalogo_categorias cc
        LEFT JOIN calzados c ON (c.categoria_id = cc.id OR LOWER(TRIM(c.categoria)) = LOWER(TRIM(cc.nombre))) AND c.activo = true
        WHERE cc.activo = true
        GROUP BY cc.id, cc.nombre, cc.descripcion, cc.activo, cc.creado_en
        ORDER BY cc.nombre ASC
      `);
      return filas.map((f: Record<string, unknown>) => ({
        id: String(f.id),
        nombre: String(f.nombre),
        descripcion: f.descripcion ? String(f.descripcion) : null,
        activo: f.activo !== false,
        totalCalzados: Number(f.total_calzados ?? 0),
        creadoEn: f.creado_en ? String(f.creado_en) : undefined,
      }));
    } catch {
      const nombres = await this.obtenerCategorias();
      return nombres.map((nombre, idx) => ({
        id: `mem-cat-${idx}`,
        nombre,
        descripcion: null,
        activo: true,
        totalCalzados: 0,
      }));
    }
  }

  async crearCategoriaCatalogo(
    dto: CrearCategoriaCatalogoDto,
  ): Promise<CategoriaCatalogoItem> {
    const limpio = limpiarEspacios(dto.nombre);
    if (!limpio) {
      throw new BadRequestException({
        codigo: "ERR-CALZ-009",
        mensaje: "El nombre de la categoría no puede estar vacío",
      });
    }

    const filas = await this.calzadoRepositorio.query(
      `INSERT INTO catalogo_categorias (nombre, descripcion, activo)
       VALUES ($1, $2, true)
       ON CONFLICT (nombre) DO UPDATE SET
         descripcion = COALESCE(EXCLUDED.descripcion, catalogo_categorias.descripcion),
         activo = true
       RETURNING id, nombre, descripcion, activo, creado_en`,
      [limpio, dto.descripcion ? limpiarEspacios(dto.descripcion) : null],
    );
    const f = filas[0];
    return {
      id: String(f.id),
      nombre: String(f.nombre),
      descripcion: f.descripcion ? String(f.descripcion) : null,
      activo: f.activo !== false,
      totalCalzados: 0,
      creadoEn: f.creado_en ? String(f.creado_en) : undefined,
    };
  }

  async actualizarCategoriaCatalogo(
    id: string,
    dto: ActualizarCategoriaCatalogoDto,
  ): Promise<CategoriaCatalogoItem> {
    const existentes = await this.calzadoRepositorio.query(
      `SELECT id, nombre, descripcion, activo, creado_en FROM catalogo_categorias WHERE id = $1 LIMIT 1`,
      [id],
    );
    if (!existentes?.[0]) {
      throw new NotFoundException({
        codigo: "ERR-CALZ-010",
        mensaje: "No existe la categoría solicitada en el catálogo",
      });
    }

    const anterior = String(existentes[0].nombre);
    const nuevoNombre = dto.nombre ? limpiarEspacios(dto.nombre) : anterior;
    if (!nuevoNombre) {
      throw new BadRequestException({
        codigo: "ERR-CALZ-009",
        mensaje: "El nombre de la categoría no puede estar vacío",
      });
    }

    const descripcionFinal =
      dto.descripcion !== undefined
        ? dto.descripcion
          ? limpiarEspacios(dto.descripcion)
          : null
        : existentes[0].descripcion;
    const activo =
      dto.activo !== undefined ? dto.activo : existentes[0].activo !== false;

    const filas = await this.calzadoRepositorio.query(
      `UPDATE catalogo_categorias SET nombre = $1, descripcion = $2, activo = $3 WHERE id = $4 RETURNING id, nombre, descripcion, activo, creado_en`,
      [nuevoNombre, descripcionFinal, activo, id],
    );

    if (nuevoNombre !== anterior && dto.actualizarCalzados !== false) {
      await this.calzadoRepositorio.query(
        `UPDATE calzados SET categoria = $1, categoria_id = $2 WHERE categoria_id = $2 OR LOWER(TRIM(categoria)) = LOWER(TRIM($3))`,
        [nuevoNombre, id, anterior],
      );
    }

    const f = filas[0];
    return {
      id: String(f.id),
      nombre: String(f.nombre),
      descripcion: f.descripcion ? String(f.descripcion) : null,
      activo: f.activo !== false,
      creadoEn: f.creado_en ? String(f.creado_en) : undefined,
    };
  }

  async eliminarCategoriaCatalogo(
    id: string,
  ): Promise<{ id: string; eliminado: boolean }> {
    const filas = await this.calzadoRepositorio.query(
      `UPDATE catalogo_categorias SET activo = false WHERE id = $1 RETURNING id`,
      [id],
    );
    if (!filas?.[0]) {
      throw new NotFoundException({
        codigo: "ERR-CALZ-010",
        mensaje: "No existe la categoría solicitada en el catálogo",
      });
    }
    return { id: String(filas[0].id), eliminado: true };
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
