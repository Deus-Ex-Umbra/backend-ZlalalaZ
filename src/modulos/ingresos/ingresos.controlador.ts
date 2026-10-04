import {
  Controller,
  Get,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { IngresosServicio } from "./ingresos.servicio";
import { CrearIngresoDto } from "./dto/crear-ingreso.dto";
import { RespuestaApi } from "../../comun/interfaces/respuesta-api.interfaz";

@Controller("ingresos")
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class IngresosControlador {
  constructor(private readonly ingresosServicio: IngresosServicio) {}

  @Get()
  async obtenerTodos(): Promise<RespuestaApi> {
    const datos = await this.ingresosServicio.obtenerTodos();
    return {
      exito: true,
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Post()
  async registrar(@Body() dto: CrearIngresoDto): Promise<RespuestaApi> {
    const datos = await this.ingresosServicio.registrar(dto);
    return {
      exito: true,
      mensaje: "Ingreso de mercancía registrado y stock actualizado con éxito",
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }
}
