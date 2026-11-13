import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { emitirEventoWebhookGlobal } from "../servicios/bus-eventos-webhook";

const METODOS_MUTACION = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function resolverModuloDesdeRuta(ruta: string): string {
  const limpia = (ruta || "").split("?")[0];
  const segmentos = limpia
    .split("/")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s && s !== "api" && s !== "v1");
  return segmentos[0] || "sistema";
}

/**
 * Interceptor global que dispara automáticamente un evento tipo webhook/SSE
 * tras cualquier mutación exitosa en todos los módulos del sistema.
 */
@Injectable()
export class WebhookSyncInterceptor implements NestInterceptor {
  intercept(contexto: ExecutionContext, siguiente: CallHandler): Observable<unknown> {
    const req = contexto.switchToHttp().getRequest<{
      method?: string;
      originalUrl?: string;
      url?: string;
    }>();

    const metodo = (req?.method || "GET").toUpperCase();
    const ruta = req?.originalUrl || req?.url || "";

    const debeEmitir =
      METODOS_MUTACION.has(metodo) &&
      !ruta.includes("/panel-central/webhook") &&
      !ruta.includes("/autenticacion/iniciar-sesion") &&
      !ruta.includes("/autenticacion/cerrar-sesion");

    if (!debeEmitir) {
      return siguiente.handle();
    }

    return siguiente.handle().pipe(
      tap(() => {
        emitirEventoWebhookGlobal({
          tipo: metodo,
          tabla: resolverModuloDesdeRuta(ruta),
          origen: "mutacion-api",
        });
      }),
    );
  }
}
