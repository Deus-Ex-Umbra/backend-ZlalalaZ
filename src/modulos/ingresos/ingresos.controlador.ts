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
import { IngresosServicio } from "./ingresos.servicio";
import { CrearIngresoDto } from "./dto/crear-ingreso.dto";
import { ActualizarIngresoDto } from "./dto/actualizar-ingreso.dto";
import {
  CrearProveedorDto,
  ActualizarProveedorDto,
} from "./dto/crear-proveedor.dto";
import { RespuestaApi } from "../../comun/interfaces/respuesta-api.interfaz";

@Controller("ingresos")
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class IngresosControlador {
  constructor(private readonly ingresosServicio: IngresosServicio) {}

  @Get("proveedores")
  async listarProveedores(): Promise<RespuestaApi> {
    const datos = await this.ingresosServicio.listarProveedores();
    return {
      exito: true,
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Post("proveedores")
  async crearProveedor(
    @Body() dto: CrearProveedorDto,
  ): Promise<RespuestaApi> {
    const datos = await this.ingresosServicio.crearProveedor(dto);
    return {
      exito: true,
      mensaje: "Proveedor registrado con éxito",
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Put("proveedores/:id")
  async actualizarProveedor(
    @Param("id") id: string,
    @Body() dto: ActualizarProveedorDto,
  ): Promise<RespuestaApi> {
    const datos = await this.ingresosServicio.actualizarProveedor(id, dto);
    return {
      exito: true,
      mensaje: "Proveedor actualizado con éxito",
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Get("proveedores/:id/historial")
  async obtenerHistorialProveedor(
    @Param("id") id: string,
  ): Promise<RespuestaApi> {
    const datos = await this.ingresosServicio.obtenerHistorialProveedor(id);
    return {
      exito: true,
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Get()
  async obtenerTodos(
    @Query("pagina") pagina?: string,
    @Query("limite") limite?: string,
  ): Promise<RespuestaApi> {
    const datos = await this.ingresosServicio.obtenerTodos({
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
  async registrar(@Body() dto: CrearIngresoDto): Promise<RespuestaApi> {
    const datos = await this.ingresosServicio.registrar(dto);
    return {
      exito: true,
      mensaje: "Ingreso de mercancía registrado y stock actualizado con éxito",
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Put(":id")
  async actualizar(
    @Param("id") id: string,
    @Body() dto: ActualizarIngresoDto,
  ): Promise<RespuestaApi> {
    const datos = await this.ingresosServicio.actualizar(id, dto);
    return {
      exito: true,
      mensaje: "Ingreso de mercancía y stock actualizados con éxito",
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }
}
