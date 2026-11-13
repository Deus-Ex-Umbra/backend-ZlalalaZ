import { Subject, Observable } from "rxjs";

export interface EventoWebhookBus {
  tipo: string;
  tabla: string;
  origen: string;
  recibidoEn: string;
  secuencia: number;
}

let secuenciaBus = 0;
let ultimoEventoBus: EventoWebhookBus | null = null;
const flujoEventosBus = new Subject<EventoWebhookBus>();

/**
 * Emite un evento global de sincronización para propagarlo vía SSE / Webhook
 * hacia todas las pantallas conectadas de LaLaLa sin necesidad de recarga manual.
 */
export function emitirEventoWebhookGlobal(datos: {
  tipo: string;
  tabla: string;
  origen?: string;
}): EventoWebhookBus {
  secuenciaBus += 1;
  const evento: EventoWebhookBus = {
    tipo: (datos.tipo || "ACTUALIZACION").trim().toUpperCase(),
    tabla: (datos.tabla || "general").trim().toLowerCase(),
    origen: (datos.origen || "mutacion-api").trim(),
    recibidoEn: new Date().toISOString(),
    secuencia: secuenciaBus,
  };
  ultimoEventoBus = evento;
  flujoEventosBus.next(evento);
  return evento;
}

export function obtenerFlujoEventosBus(): Observable<EventoWebhookBus> {
  return flujoEventosBus.asObservable();
}

export function obtenerSecuenciaBus(): number {
  return secuenciaBus;
}

export function obtenerUltimoEventoBus(): EventoWebhookBus | null {
  return ultimoEventoBus;
}
