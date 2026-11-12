/**
 * Reglas de limpieza del catálogo (pendiente 005 / DAT-003).
 * Se usan tanto en el servicio de calzados como en el importador de la hoja,
 * para que ambos produzcan siempre los mismos nombres y marcas.
 */

export enum TipoProducto {
  CALZADO = "CALZADO",
  ACCESORIO = "ACCESORIO",
}

export type SegmentoTalla = "BEBE" | "NINO" | "JUVENIL" | "ADULTO" | "UNICA";

export interface ExtraIncluidoItem {
  extraId?: string;
  codigo?: string;
  nombre: string;
  cantidad: number;
  tallaAsociada?: string;
}

export const MARCA_SIN_DEFINIR = "Sin marca";
export const TALLA_UNICA = "Única";

const MARCAS_CONOCIDAS = [
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

const PALABRAS_ACCESORIO = [
  "mochila",
  "gorra",
  "cinturon",
  "cinturón",
  "media",
  "billetera",
  "bolso",
  "cartera",
];

/** Quita espacios sobrantes (inicio, fin y duplicados internos). */
export function limpiarEspacios(texto: string | undefined | null): string {
  return (texto ?? "").replace(/\s+/g, " ").trim();
}

/** Devuelve la marca canónica si el texto coincide (sin importar mayúsculas), o `undefined`. */
function buscarMarcaCanonica(palabra: string): string | undefined {
  const minuscula = palabra.toLowerCase();
  return MARCAS_CONOCIDAS.find((marca) => marca.toLowerCase() === minuscula);
}

/**
 * Normaliza el nombre del producto: limpia espacios y corrige la capitalización
 * de la marca (ej. `NIke Air Force One ` → `Nike Air Force One`).
 * No reinterpreta modelos: un nombre dudoso se conserva y se reporta aparte.
 */
export function normalizarNombreProducto(nombre: string): string {
  const limpio = limpiarEspacios(nombre);
  if (!limpio) return limpio;
  const [primera, ...resto] = limpio.split(" ");
  const marca = buscarMarcaCanonica(primera);
  return [marca ?? primera, ...resto].join(" ");
}

/** Extrae la marca desde el inicio del nombre del producto. */
export function extraerMarca(nombre: string): string {
  const limpio = normalizarNombreProducto(nombre);
  const marcaCompuesta = MARCAS_CONOCIDAS.find((marca) =>
    limpio.toLowerCase().startsWith(marca.toLowerCase() + " "),
  );
  if (marcaCompuesta) return marcaCompuesta;
  const primera = limpio.split(" ")[0] ?? "";
  return buscarMarcaCanonica(primera) ?? MARCA_SIN_DEFINIR;
}

/** Determina si el producto es calzado o un accesorio (mochilas, etc.). */
export function detectarTipoProducto(nombre: string): TipoProducto {
  const palabras = limpiarEspacios(nombre).toLowerCase().split(" ");
  return PALABRAS_ACCESORIO.some((accesorio) =>
    palabras.some((palabra) => palabra.startsWith(accesorio)),
  )
    ? TipoProducto.ACCESORIO
    : TipoProducto.CALZADO;
}

/** Los accesorios no tienen talla: se registran como talla única. */
export function normalizarTalla(
  talla: string | undefined | null,
  tipo: TipoProducto,
): string {
  const limpia = limpiarEspacios(talla);
  if (limpia) return limpia;
  return tipo === TipoProducto.ACCESORIO ? TALLA_UNICA : "";
}

/**
 * Normaliza el código de producto al formato oficial P-1 .. P-N (al infinito, sin límite superior).
 * Tolera variantes como "P001", "p1", "P-001", "P-1", "p-150" devolviendo "P-N".
 * Si no coincide con el prefijo P, limpia espacios y lo devuelve en mayúsculas.
 */
export function normalizarCodigoProducto(
  codigo: string | undefined | null,
): string {
  if (!codigo) return "";
  const limpio = limpiarEspacios(codigo);
  const match = limpio.match(/^p-?0*(\d+)$/i);
  if (match) {
    const numero = parseInt(match[1], 10);
    return `P-${numero}`;
  }
  return limpio.toUpperCase();
}

/**
 * Clasifica una talla numérica individual en su segmento oficial:
 * BEBE (<15), NINO (15-33), JUVENIL (34-38), ADULTO (39-47), UNICA (accesorios/extras o no numérico).
 */
export function clasificarTallaIndividual(tallaTexto: string): SegmentoTalla {
  const limpio = limpiarEspacios(tallaTexto).toLowerCase();
  if (
    !limpio ||
    limpio === "única" ||
    limpio === "unica" ||
    limpio === "u" ||
    limpio === "estándar" ||
    limpio === "estandar"
  ) {
    return "UNICA";
  }

  const coincidencia = limpio.match(/(\d+)/);
  if (!coincidencia) return "UNICA";

  const numero = parseInt(coincidencia[1], 10);
  if (isNaN(numero) || numero <= 0) return "UNICA";
  if (numero < 15) return "BEBE";
  if (numero <= 33) return "NINO";
  if (numero <= 38) return "JUVENIL";
  return "ADULTO";
}

/**
 * Determina el segmento de talla principal del producto a partir de su mapa `stockPorTalla` o string `talla`.
 */
export function calcularSegmentoTalla(
  talla?: string | null,
  stockPorTalla?: Record<string, number> | null,
  tipoProducto?: TipoProducto,
  esExtra?: boolean,
): SegmentoTalla {
  if (esExtra || tipoProducto === TipoProducto.ACCESORIO) {
    return "UNICA";
  }

  const tallasCandidatas: string[] = [];
  if (stockPorTalla && typeof stockPorTalla === "object") {
    for (const [clave, cant] of Object.entries(stockPorTalla)) {
      if (clave.trim() && Number(cant) >= 0) {
        tallasCandidatas.push(clave.trim());
      }
    }
  }

  if (tallasCandidatas.length === 0 && talla) {
    for (const parte of talla.split(/[,/;-]+/)) {
      if (parte.trim()) tallasCandidatas.push(parte.trim());
    }
  }

  if (tallasCandidatas.length === 0) {
    return "UNICA";
  }

  // Usar la primera talla numérica válida como referencia principal
  for (const t of tallasCandidatas) {
    const seg = clasificarTallaIndividual(t);
    if (seg !== "UNICA") return seg;
  }

  return "UNICA";
}

