import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  Query,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { VentasServicio } from "./ventas.servicio";
import {
  CrearVentaDto,
  ActualizarVentaDto,
  ProcesarCambioDevolucionDto,
} from "./dto/crear-venta.dto";
import { SincronizarVentasDto } from "./dto/sincronizar-ventas.dto";
import { CrearBancoDto } from "./dto/crear-banco.dto";
import { FiltrosVentasDto } from "./dto/filtros-ventas.dto";
import { RespuestaApi } from "../../comun/interfaces/respuesta-api.interfaz";

@Controller("ventas")
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class VentasControlador {
  constructor(private readonly ventasServicio: VentasServicio) {}

  @Get()
  async obtenerTodas(
    @Query() filtros: FiltrosVentasDto,
  ): Promise<RespuestaApi> {
    const datos = await this.ventasServicio.obtenerTodas(filtros);
    return {
      exito: true,
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Get("bancos")
  async listarBancos(): Promise<RespuestaApi> {
    const datos = await this.ventasServicio.listarBancos();
    return {
      exito: true,
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Post("bancos")
  async crearBanco(@Body() dto: CrearBancoDto): Promise<RespuestaApi> {
    const datos = await this.ventasServicio.crearBanco(dto.nombre);
    return {
      exito: true,
      mensaje: `Banco "${datos.nombre}" registrado exitosamente`,
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

  @Patch(":id")
  async actualizarVentaParcial(
    @Param("id") id: string,
    @Body() dto: ActualizarVentaDto,
  ): Promise<RespuestaApi> {
    const datos = await this.ventasServicio.actualizarVenta(id, dto);
    return {
      exito: true,
      mensaje: "Venta actualizada exitosamente",
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Put(":id")
  async actualizarVenta(
    @Param("id") id: string,
    @Body() dto: ActualizarVentaDto,
  ): Promise<RespuestaApi> {
    const datos = await this.ventasServicio.actualizarVenta(id, dto);
    return {
      exito: true,
      mensaje: "Venta actualizada exitosamente",
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Post(":id/cambio-devolucion")
  async procesarCambioODevolucion(
    @Param("id") id: string,
    @Body() dto: ProcesarCambioDevolucionDto,
  ): Promise<RespuestaApi> {
    const resultado = await this.ventasServicio.procesarCambioODevolucion(
      id,
      dto,
    );
    return {
      exito: true,
      mensaje:
        resultado.tipoMovimiento === "DEVOLUCION_TOTAL"
          ? `Devolución total registrada para ${resultado.venta.numeroTicket}`
          : resultado.tipoMovimiento === "CAMBIO"
            ? `Cambio procesado exitosamente para ${resultado.venta.numeroTicket}`
            : `Devolución parcial registrada para ${resultado.venta.numeroTicket}`,
      datos: resultado,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Post("sincronizar")
  async sincronizarLote(
    @Body() dto: SincronizarVentasDto,
  ): Promise<RespuestaApi> {
    const resultado = await this.ventasServicio.sincronizarLote(dto);
    return {
      exito: true,
      mensaje: `Sincronización procesada: ${resultado.exitosas.length} aprobadas, ${resultado.fallidas.length} rechazadas`,
      datos: resultado,
      marcaTiempo: new Date().toISOString(),
    };
  }
}
