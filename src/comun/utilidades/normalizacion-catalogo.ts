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
 * BEBE (<15), NINO (15-33.5), JUVENIL (34-38.5), ADULTO (>=39), UNICA (accesorios/extras o no numérico).
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

  const coincidencia = limpio.match(/(\d+(?:[.,]\d+)?)/);
  if (!coincidencia) return "UNICA";

  const numero = parseFloat(coincidencia[1].replace(",", "."));
  if (isNaN(numero) || numero <= 0) return "UNICA";
  if (numero < 15) return "BEBE";
  if (numero < 34) return "NINO";
  if (numero < 39) return "JUVENIL";
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


/** Separadores que indican que un texto contiene varias tallas (ej. "38, 39"). */
const PATRON_VARIAS_TALLAS = /[,;/]/;

/**
 * Normaliza el texto de una talla para compararla sin importar espacios,
 * mayúsculas, tildes ni el separador decimal (ej. " Única " → "unica", "38,5" → "38.5", "38.0" → "38").
 */
export function normalizarClaveTalla(talla: string | undefined | null): string {
  const limpia = limpiarEspacios(talla)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const decimal = limpia.match(/^(\d+)(?:[.,](\d+))?$/);
  if (decimal) {
    const fraccion = (decimal[2] ?? "").replace(/0+$/, "");
    return fraccion
      ? `${Number(decimal[1])}.${fraccion}`
      : `${Number(decimal[1])}`;
  }
  return limpia;
}

/** Indica si la talla está vacía o representa la talla única de accesorios/extras. */
export function esTallaVaciaOUnica(talla: string | undefined | null): boolean {
  const clave = normalizarClaveTalla(talla);
  return (
    !clave ||
    clave === "unica" ||
    clave === "u" ||
    clave === "estandar" ||
    clave === "talla unica"
  );
}

/** Indica si el texto contiene varias tallas juntas (ej. el resumen "38, 39, 40"). */
export function contieneVariasTallas(talla: string | undefined | null): boolean {
  return PATRON_VARIAS_TALLAS.test(limpiarEspacios(talla));
}

/**
 * Normaliza el mapa `stockPorTalla`: limpia las claves, descarta claves vacías,
 * convierte cantidades a enteros no negativos y suma claves que solo diferían por espacios.
 */
export function normalizarMapaStockPorTalla(
  mapa?: Record<string, number | string> | null,
): Record<string, number> {
  const resultado: Record<string, number> = {};
  if (!mapa || typeof mapa !== "object" || Array.isArray(mapa)) {
    return resultado;
  }
  for (const [clave, valor] of Object.entries(mapa)) {
    const tallaLimpia = limpiarEspacios(clave);
    if (!tallaLimpia) continue;
    const cantidad = Math.max(0, Math.floor(Number(valor) || 0));
    resultado[tallaLimpia] = (resultado[tallaLimpia] ?? 0) + cantidad;
  }
  return resultado;
}

/** Ordena claves de talla numéricamente (35, 36, 38.5, 40) y luego alfabéticamente. */
export function ordenarClavesTallas(tallas: string[]): string[] {
  const aNumero = (talla: string): number =>
    parseFloat(talla.replace(",", ".").replace(/[^\d.]/g, ""));
  return [...tallas].sort((a, b) => {
    const numA = aNumero(a);
    const numB = aNumero(b);
    if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
      return numA - numB;
    }
    if (!isNaN(numA) && isNaN(numB)) return -1;
    if (isNaN(numA) && !isNaN(numB)) return 1;
    return a.localeCompare(b);
  });
}

/** Suma las existencias de todas las tallas del mapa (valores inválidos cuentan como 0). */
export function sumarStockPorTalla(
  mapa?: Record<string, number | string> | null,
): number {
  if (!mapa || typeof mapa !== "object") return 0;
  return Object.values(mapa).reduce<number>(
    (acumulado, valor) =>
      acumulado + Math.max(0, Math.floor(Number(valor) || 0)),
    0,
  );
}

/** Indica si el producto controla su inventario mediante un mapa `stockPorTalla` con claves. */
export function tieneMapaStockPorTalla(
  mapa?: Record<string, number | string> | null,
): boolean {
  return Object.keys(normalizarMapaStockPorTalla(mapa)).length > 0;
}

export interface OpcionesResolucionTalla {
  /**
   * Si es `true` (por defecto) y la talla viene vacía o como "Única" con varias claves en el mapa,
   * se resuelve la única clave que tenga existencias (> 0). Útil para ventas de productos de talla única.
   * Debe desactivarse en ingresos y restituciones, donde el saldo no indica la talla correcta.
   */
  permitirUnicaConExistencias?: boolean;
}

/**
 * Resuelve la clave canónica del mapa `stockPorTalla` que corresponde a la talla solicitada.
 * - Coincidencia exacta o normalizada (espacios, mayúsculas, tildes, separador decimal).
 * - Talla vacía o "Única": si el mapa tiene una sola clave, se usa esa; si tiene varias y solo
 *   una con existencias (y la opción lo permite), se usa esa.
 * - En cualquier otro caso (talla ausente con varias tallas, o talla inexistente) devuelve `null`
 *   para que el servicio rechace la operación en lugar de omitir el descuento en silencio.
 */
export function resolverClaveTallaEnMapa(
  mapa: Record<string, number | string> | null | undefined,
  tallaSolicitada: string | undefined | null,
  opciones: OpcionesResolucionTalla = {},
): string | null {
  if (!mapa || typeof mapa !== "object") return null;
  const claves = Object.keys(mapa).filter((clave) => limpiarEspacios(clave));
  if (claves.length === 0) return null;

  const permitirUnicaConExistencias =
    opciones.permitirUnicaConExistencias ?? true;
  const solicitada = limpiarEspacios(tallaSolicitada);

  if (solicitada) {
    const exacta = claves.find((clave) => clave === solicitada);
    if (exacta) return exacta;
    const recortada = claves.find(
      (clave) => limpiarEspacios(clave) === solicitada,
    );
    if (recortada) return recortada;
    const normalizadaSolicitada = normalizarClaveTalla(solicitada);
    const normalizada = claves.find(
      (clave) => normalizarClaveTalla(clave) === normalizadaSolicitada,
    );
    if (normalizada) return normalizada;
  }

  if (esTallaVaciaOUnica(solicitada)) {
    if (claves.length === 1) return claves[0];
    if (permitirUnicaConExistencias) {
      const conExistencias = claves.filter(
        (clave) => Math.floor(Number(mapa[clave]) || 0) > 0,
      );
      if (conExistencias.length === 1) return conExistencias[0];
    }
  }

  return null;
}

/** Texto legible con las tallas del mapa y su saldo, ej. "38 (2), 39 (0)". */
export function describirTallasDisponibles(
  mapa?: Record<string, number | string> | null,
): string {
  const normalizado = normalizarMapaStockPorTalla(mapa);
  const claves = ordenarClavesTallas(Object.keys(normalizado));
  if (claves.length === 0) return "sin tallas registradas";
  return claves.map((clave) => `${clave} (${normalizado[clave]})`).join(", ");
}
