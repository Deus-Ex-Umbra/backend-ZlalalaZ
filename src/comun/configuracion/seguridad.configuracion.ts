/**
 * Configuración de seguridad (JWT y CORS) tomada de variables de entorno.
 * Los errores de configuración están catalogados en `backend/errores.md` (ERR-CFG-XXX).
 */

/** Longitud mínima aceptada para `JWT_SECRET` (64 bytes en hexadecimal = 128 caracteres). */
export const LONGITUD_MINIMA_JWT_SECRET = 32;

/** Duración de la sesión si `JWT_EXPIRACION` no está definida: una jornada de trabajo. */
export const EXPIRACION_JWT_DEFECTO = "12h";

/** Formatos aceptados para `JWT_EXPIRACION`: segundos (`3600`) o número con unidad `s|m|h|d` (`12h`). */
const PATRON_EXPIRACION_JWT = /^\d+(s|m|h|d)?$/;

/**
 * Convierte el valor de `CORS_ORIGENES` en una lista de orígenes.
 * Los orígenes se separan con `;` y pueden ir entre comillas (simples, dobles o invertidas),
 * por ejemplo: `"http://localhost:3000";"https://tienda.com"`.
 */
export function analizarOrigenesCors(valor: string | undefined): string[] {
  if (!valor) return [];
  return valor
    .split(";")
    .map((origen) => origen.replace(/["'`]/g, "").trim().replace(/\/+$/, ""))
    .filter((origen) => origen.length > 0);
}

function esOrigenValido(origen: string): boolean {
  if (origen.includes("*")) {
    return /^https?:\/\/(\*\.)?[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*(:\d+)?$/.test(origen);
  }
  try {
    const url = new URL(origen);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.origin === origen
    );
  } catch {
    return false;
  }
}

/**
 * Evalúa si un origen de petición HTTP cumple con la lista de orígenes permitidos,
 * soportando coincidencias exactas y patrones con comodín (ej. https://*.vercel.app).
 */
export function esOrigenPermitido(
  origenPeticion: string | undefined,
  origenesPermitidos: string[],
): boolean {
  if (!origenPeticion || origenesPermitidos.length === 0) {
    return true;
  }
  return origenesPermitidos.some((patron) => {
    if (patron === "*" || patron === origenPeticion) {
      return true;
    }
    if (patron.includes("*")) {
      const regexStr = "^" + patron.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$";
      return new RegExp(regexStr).test(origenPeticion);
    }
    return false;
  });
}

/**
 * Valida las variables de entorno críticas al arrancar. Si alguna falta o es inválida,
 * la aplicación no inicia (en lugar de arrancar con valores inseguros por defecto).
 */
export function validarEntorno(
  configuracion: Record<string, unknown>,
): Record<string, unknown> {
  const secreto = configuracion.JWT_SECRET;
  if (
    typeof secreto !== "string" ||
    secreto.trim().length < LONGITUD_MINIMA_JWT_SECRET
  ) {
    throw new Error(
      `ERR-CFG-001: JWT_SECRET ausente o demasiado corto (mínimo ${LONGITUD_MINIMA_JWT_SECRET} caracteres). ` +
        `Genéralo con: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`,
    );
  }

  const expiracion = configuracion.JWT_EXPIRACION;
  if (
    expiracion !== undefined &&
    expiracion !== "" &&
    !PATRON_EXPIRACION_JWT.test(String(expiracion))
  ) {
    throw new Error(
      `ERR-CFG-002: JWT_EXPIRACION inválida ("${String(expiracion)}"). Usa segundos o un número con unidad s, m, h o d (ej. 12h).`,
    );
  }

  const origenes = analizarOrigenesCors(
    typeof configuracion.CORS_ORIGENES === "string"
      ? configuracion.CORS_ORIGENES
      : undefined,
  );
  if (origenes.length === 0) {
    throw new Error(
      'ERR-CFG-003: CORS_ORIGENES ausente. Define al menos un origen, separados por ";" (ej. "http://localhost:3000";"http://127.0.0.1:3000").',
    );
  }
  const origenInvalido = origenes.find((origen) => !esOrigenValido(origen));
  if (origenInvalido) {
    throw new Error(
      `ERR-CFG-004: Origen CORS inválido ("${origenInvalido}"). Debe ser http(s)://host[:puerto] sin ruta.`,
    );
  }

  return configuracion;
}
