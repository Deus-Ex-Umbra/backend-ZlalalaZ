import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { GastosServicio } from "./gastos.servicio";
import { CrearGastoDto } from "./dto/crear-gasto.dto";
import { ActualizarGastoDto } from "./dto/actualizar-gasto.dto";
import { RespuestaApi } from "../../comun/interfaces/respuesta-api.interfaz";

@Controller("gastos")
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class GastosControlador {
  constructor(private readonly gastosServicio: GastosServicio) {}

  @Get()
  async obtenerTodos(
    @Query("pagina") pagina?: string,
    @Query("limite") limite?: string,
  ): Promise<RespuestaApi> {
    const datos = await this.gastosServicio.obtenerTodos({
      pagina: pagina ? parseInt(pagina, 10) : 1,
      limite: limite ? parseInt(limite, 10) : 50,
    });
    return {
      exito: true,
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Post()
  async registrar(@Body() dto: CrearGastoDto): Promise<RespuestaApi> {
    const datos = await this.gastosServicio.registrar(dto);
    return {
      exito: true,
      mensaje: "Gasto de caja chica registrado exitosamente",
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Put(":id")
  async actualizar(
    @Param("id") id: string,
    @Body() dto: ActualizarGastoDto,
  ): Promise<RespuestaApi> {
    const datos = await this.gastosServicio.actualizar(id, dto);
    return {
      exito: true,
      mensaje: "Gasto de caja chica actualizado exitosamente",
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }
}
