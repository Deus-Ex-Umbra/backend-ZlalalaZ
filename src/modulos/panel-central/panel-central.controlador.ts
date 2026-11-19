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
  UseGuards,
} from "@nestjs/common";
import { Observable } from "rxjs";
import {
  FichaConsultaProducto,
  MetricasGenerales,
  PanelCentralServicio,
} from "./panel-central.servicio";
import { RespuestaApi } from "../../comun/interfaces/respuesta-api.interfaz";
import { GuardiaJwt } from "../autenticacion/guardias/guardia-jwt";
import {
  UsuarioActual,
  UsuarioAutenticado,
} from "../autenticacion/decoradores/usuario-actual.decorador";
import { RolUsuario } from "../usuarios/enums/rol-usuario.enum";

export type FichaConsultaProductoRespuesta = Omit<
  FichaConsultaProducto,
  "precioCompra" | "costoTotalCompradoBs" | "utilidadEstimadaBs"
> & {
  precioCompra?: number;
  costoTotalCompradoBs?: number;
  utilidadEstimadaBs?: number;
};

@Controller("panel-central")
export class PanelCentralControlador {
  constructor(private readonly panelCentralServicio: PanelCentralServicio) {}

  private esRolVendedor(usuario?: UsuarioAutenticado | null): boolean {
    return !usuario || usuario.rol === RolUsuario.VENDEDOR;
  }

  private sanitizarMetricas(
    metricas: MetricasGenerales,
    usuario?: UsuarioAutenticado | null,
  ): MetricasGenerales {
    if (!this.esRolVendedor(usuario)) {
      return metricas;
    }
    return {
      ...metricas,
      costoVendidoBs: 0,
      gananciaBrutaBs: 0,
      gananciaNetaBs: 0,
      costoMercanciaIngresadaBs: 0,
      valoracionStockBs: 0,
      costoStockAlmacenBs: 0,
      totalCostoMercanciaBs: 0,
      gananciaBrutaEstimadaBs: 0,
      tendencia: {
        ...metricas.tendencia,
        puntos: (metricas.tendencia?.puntos ?? []).map((punto) => ({
          ...punto,
          costoVendidoBs: 0,
          gananciaBrutaBs: 0,
          gananciaNetaBs: 0,
        })),
      },
    };
  }

  private sanitizarFichaProducto(
    ficha: FichaConsultaProducto | null,
    usuario?: UsuarioAutenticado | null,
  ): FichaConsultaProductoRespuesta | null {
    if (!ficha || !this.esRolVendedor(usuario)) {
      return ficha;
    }
    const copia: FichaConsultaProductoRespuesta = { ...ficha };
    delete copia.precioCompra;
    delete copia.costoTotalCompradoBs;
    delete copia.utilidadEstimadaBs;
    return copia;
  }

  @Get("metricas")
  @UseGuards(GuardiaJwt)
  async obtenerMetricas(
    @UsuarioActual() usuario?: UsuarioAutenticado,
    @Query("fechaInicio") fechaInicio?: string,
    @Query("fechaFin") fechaFin?: string,
  ): Promise<RespuestaApi> {
    const datos = await this.panelCentralServicio.obtenerMetricas({
      fechaInicio,
      fechaFin,
    });
    return {
      exito: true,
      datos: this.sanitizarMetricas(datos, usuario),
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
  @UseGuards(GuardiaJwt)
  async consultarProducto(
    @Param("codigo") codigo: string,
    @UsuarioActual() usuario?: UsuarioAutenticado,
  ): Promise<RespuestaApi> {
    const datos =
      await this.panelCentralServicio.consultarFichaProducto(codigo);
    return {
      exito: true,
      datos: this.sanitizarFichaProducto(datos, usuario),
      marcaTiempo: new Date().toISOString(),
    };
  }
}
