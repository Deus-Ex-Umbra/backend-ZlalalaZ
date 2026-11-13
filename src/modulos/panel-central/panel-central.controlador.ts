import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  MessageEvent,
  Param,
  Post,
  Query,
  Sse,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { PanelCentralServicio } from "./panel-central.servicio";
import { RespuestaApi } from "../../comun/interfaces/respuesta-api.interfaz";

@Controller("panel-central")
export class PanelCentralControlador {
  constructor(private readonly panelCentralServicio: PanelCentralServicio) {}

  @Get("metricas")
  async obtenerMetricas(
    @Query("fechaInicio") fechaInicio?: string,
    @Query("fechaFin") fechaFin?: string,
  ): Promise<RespuestaApi> {
    const datos = await this.panelCentralServicio.obtenerMetricas({
      fechaInicio,
      fechaFin,
    });
    return {
      exito: true,
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Get("revision")
  async obtenerRevision(): Promise<RespuestaApi> {
    const datos = await this.panelCentralServicio.obtenerEstadoRevision();
    return {
      exito: true,
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Post("webhook")
  @HttpCode(HttpStatus.OK)
  async recibirWebhook(
    @Body() cuerpo?: Record<string, unknown>,
    @Headers("x-webhook-secret") secreto?: string,
  ): Promise<RespuestaApi> {
    const datos = await this.panelCentralServicio.procesarWebhook(
      cuerpo ?? {},
      secreto,
    );
    return {
      exito: true,
      mensaje: "Webhook procesado correctamente",
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Sse("eventos")
  suscribirEventos(): Observable<MessageEvent> {
    return this.panelCentralServicio.obtenerFlujoEventos();
  }

  @Get("consulta/:codigo")
  async consultarProducto(
    @Param("codigo") codigo: string,
  ): Promise<RespuestaApi> {
    const datos =
      await this.panelCentralServicio.consultarFichaProducto(codigo);
    return {
      exito: true,
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }
}
