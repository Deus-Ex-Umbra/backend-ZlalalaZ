import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { VentasServicio } from "./ventas.servicio";
import { CrearVentaDto } from "./dto/crear-venta.dto";
import { SincronizarVentasDto } from "./dto/sincronizar-ventas.dto";
import { RespuestaApi } from "../../comun/interfaces/respuesta-api.interfaz";

@Controller("ventas")
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class VentasControlador {
  constructor(private readonly ventasServicio: VentasServicio) {}

  @Get()
  async obtenerTodas(): Promise<RespuestaApi> {
    const datos = await this.ventasServicio.obtenerTodas();
    return {
      exito: true,
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Get(":id")
  async obtenerPorId(@Param("id") id: string): Promise<RespuestaApi> {
    const datos = await this.ventasServicio.obtenerPorId(id);
    return {
      exito: true,
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Post()
  async registrarVenta(@Body() dto: CrearVentaDto): Promise<RespuestaApi> {
    const datos = await this.ventasServicio.registrarVenta(dto);
    return {
      exito: true,
      mensaje: `Venta registrada exitosamente con ticket ${datos.numeroTicket}`,
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Post("sincronizar")
  async sincronizarLote(@Body() dto: SincronizarVentasDto): Promise<RespuestaApi> {
    const resultado = await this.ventasServicio.sincronizarLote(dto);
    return {
      exito: true,
      mensaje: `Sincronización procesada: ${resultado.exitosas.length} aprobadas, ${resultado.fallidas.length} rechazadas`,
      datos: resultado,
      marcaTiempo: new Date().toISOString(),
    };
  }
}
