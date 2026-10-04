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
import { ClientesServicio } from "./clientes.servicio";
import { CrearClienteDto } from "./dto/crear-cliente.dto";
import { ActualizarClienteDto } from "./dto/actualizar-cliente.dto";
import { RespuestaApi } from "../../comun/interfaces/respuesta-api.interfaz";

@Controller("clientes")
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class ClientesControlador {
  constructor(private readonly clientesServicio: ClientesServicio) {}

  @Get()
  async obtenerTodos(
    @Query("busqueda") busqueda?: string,
    @Query("limite") limite?: string,
  ): Promise<RespuestaApi> {
    const datos = await this.clientesServicio.obtenerTodos(
      busqueda,
      limite ? parseInt(limite, 10) : 50,
    );
    return {
      exito: true,
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Get("frecuentes")
  async obtenerFrecuentes(
    @Query("limite") limite?: string,
  ): Promise<RespuestaApi> {
    const datos = await this.clientesServicio.obtenerFrecuentes(
      limite ? parseInt(limite, 10) : 10,
    );
    return {
      exito: true,
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Get(":id")
  async obtenerPorId(@Param("id") id: string): Promise<RespuestaApi> {
    const datos = await this.clientesServicio.obtenerPorId(id);
    return {
      exito: true,
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Post()
  async crear(@Body() dto: CrearClienteDto): Promise<RespuestaApi> {
    const datos = await this.clientesServicio.crear(dto);
    return {
      exito: true,
      mensaje: "Cliente registrado con éxito",
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Put(":id")
  async actualizar(
    @Param("id") id: string,
    @Body() dto: ActualizarClienteDto,
  ): Promise<RespuestaApi> {
    const datos = await this.clientesServicio.actualizar(id, dto);
    return {
      exito: true,
      mensaje: "Cliente actualizado con éxito",
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }
}
