/**
 * Reglas de limpieza del catálogo (pendiente 005 / DAT-003).
 * Se usan tanto en el servicio de calzados como en el importador de la hoja,
 * para que ambos produzcan siempre los mismos nombres y marcas.
 */

export enum TipoProducto {
  CALZADO = "CALZADO",
  ACCESORIO = "ACCESORIO",
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
