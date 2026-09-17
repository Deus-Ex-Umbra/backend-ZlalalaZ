export interface RespuestaApi<T = unknown> {
  exito: boolean;
  datos?: T;
  mensaje?: string;
  error?: {
    codigo: string;
    mensaje: string;
    detalles?: unknown;
  };
  marcaTiempo: string;
}
