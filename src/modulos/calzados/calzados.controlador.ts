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
import { CalzadosServicio } from "./calzados.servicio";
import { CrearCalzadoDto } from "./dto/crear-calzado.dto";
import { ActualizarCalzadoDto } from "./dto/actualizar-calzado.dto";
import { RespuestaApi } from "../../comun/interfaces/respuesta-api.interfaz";

@Controller("calzados")
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class CalzadosControlador {
  constructor(private readonly calzadosServicio: CalzadosServicio) {}

  @Get()
  async obtenerTodos(
    @Query("busqueda") busqueda?: string,
    @Query("categoria") categoria?: string,
    @Query("marca") marca?: string,
    @Query("talla") talla?: string,
    @Query("soloStockCritico") soloStockCritico?: string,
    @Query("pagina") pagina?: string,
    @Query("limite") limite?: string,
  ): Promise<RespuestaApi> {
    const resultado = await this.calzadosServicio.obtenerTodos({
      busqueda,
      categoria,
      marca,
      talla,
      soloStockCritico: soloStockCritico === "true",
      pagina: pagina ? parseInt(pagina, 10) : 1,
      limite: limite ? parseInt(limite, 10) : 50,
    });

    return {
      exito: true,
      datos: resultado,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Get("marcas")
  async obtenerMarcas(): Promise<RespuestaApi> {
    const datos = await this.calzadosServicio.obtenerMarcas();
    return {
      exito: true,
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Get("stock-critico")
  async obtenerStockCritico(): Promise<RespuestaApi> {
    const datos = await this.calzadosServicio.obtenerStockCritico();
    return {
      exito: true,
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Get("codigo/:codigo")
  async obtenerPorCodigo(
    @Param("codigo") codigo: string,
  ): Promise<RespuestaApi> {
    const datos = await this.calzadosServicio.obtenerPorCodigo(codigo);
    return {
      exito: true,
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Get(":id")
  async obtenerPorId(@Param("id") id: string): Promise<RespuestaApi> {
    const datos = await this.calzadosServicio.obtenerPorId(id);
    return {
      exito: true,
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Post()
  async crear(@Body() dto: CrearCalzadoDto): Promise<RespuestaApi> {
    const datos = await this.calzadosServicio.crear(dto);
    return {
      exito: true,
      mensaje: "Calzado registrado exitosamente",
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Put(":id")
  async actualizar(
    @Param("id") id: string,
    @Body() dto: ActualizarCalzadoDto,
  ): Promise<RespuestaApi> {
    const datos = await this.calzadosServicio.actualizar(id, dto);
    return {
      exito: true,
      mensaje: "Calzado actualizado exitosamente",
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }
}
