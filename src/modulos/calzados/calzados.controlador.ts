import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { CalzadosServicio } from "./calzados.servicio";
import { CrearCalzadoDto } from "./dto/crear-calzado.dto";
import { ActualizarCalzadoDto } from "./dto/actualizar-calzado.dto";
import { ProgramarPromocionDto } from "./dto/programar-promocion.dto";
import {
  RegistrarColorCatalogoDto,
  ActualizarColorCatalogoDto,
  CrearExtraCatalogoDto,
  ActualizarExtraCatalogoDto,
} from "./dto/catalogo-colores-extras.dto";
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
    @Query("segmentoTalla") segmentoTalla?: string,
    @Query("segmento") segmento?: string,
    @Query("esExtra") esExtra?: string,
    @Query("soloStockCritico") soloStockCritico?: string,
    @Query("estadoStock") estadoStock?: string,
    @Query("pagina") pagina?: string,
    @Query("limite") limite?: string,
  ): Promise<RespuestaApi> {
    const resultado = await this.calzadosServicio.obtenerTodos({
      busqueda,
      categoria,
      marca,
      talla,
      segmentoTalla: segmentoTalla || segmento,
      esExtra:
        esExtra === "true" ? true : esExtra === "false" ? false : undefined,
      soloStockCritico: soloStockCritico === "true",
      estadoStock,
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

  @Get("categorias")
  async obtenerCategorias(): Promise<RespuestaApi> {
    const datos = await this.calzadosServicio.obtenerCategorias();
    return {
      exito: true,
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Get("colores")
  async obtenerColores(): Promise<RespuestaApi> {
    const datos = await this.calzadosServicio.obtenerColores();
    return {
      exito: true,
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Get("colores/detallado")
  async obtenerColoresDetallados(): Promise<RespuestaApi> {
    const datos = await this.calzadosServicio.obtenerColoresDetallados();
    return {
      exito: true,
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Post("colores")
  async registrarColor(
    @Body() dto: RegistrarColorCatalogoDto,
  ): Promise<RespuestaApi> {
    const datos = await this.calzadosServicio.registrarColor(dto);
    return {
      exito: true,
      mensaje: `Color "${datos.nombre}" agregado al catálogo`,
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Put("colores/:id")
  async actualizarColorCatalogo(
    @Param("id") id: string,
    @Body() dto: ActualizarColorCatalogoDto,
  ): Promise<RespuestaApi> {
    const datos = await this.calzadosServicio.actualizarColorCatalogo(id, dto);
    return {
      exito: true,
      mensaje: `Color "${datos.nombre}" actualizado en el catálogo`,
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Delete("colores/:id")
  async eliminarColorCatalogo(@Param("id") id: string): Promise<RespuestaApi> {
    const datos = await this.calzadosServicio.eliminarColorCatalogo(id);
    return {
      exito: true,
      mensaje: "Color desactivado del catálogo",
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Get("extras-catalogo")
  async listarExtrasCatalogo(): Promise<RespuestaApi> {
    const datos = await this.calzadosServicio.listarExtrasCatalogo();
    return {
      exito: true,
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Post("extras-catalogo")
  async crearExtraCatalogo(
    @Body() dto: CrearExtraCatalogoDto,
  ): Promise<RespuestaApi> {
    const datos = await this.calzadosServicio.crearExtraCatalogo(dto);
    return {
      exito: true,
      mensaje: `Extra promocional "${datos.nombre}" agregado al catálogo`,
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Put("extras-catalogo/:id")
  async actualizarExtraCatalogo(
    @Param("id") id: string,
    @Body() dto: ActualizarExtraCatalogoDto,
  ): Promise<RespuestaApi> {
    const datos = await this.calzadosServicio.actualizarExtraCatalogo(id, dto);
    return {
      exito: true,
      mensaje: `Extra promocional "${datos.nombre}" actualizado con éxito`,
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Delete("extras-catalogo/:id")
  async eliminarExtraCatalogo(@Param("id") id: string): Promise<RespuestaApi> {
    const datos = await this.calzadosServicio.eliminarExtraCatalogo(id);
    return {
      exito: true,
      mensaje: "Extra promocional desactivado del catálogo",
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

  @Get("siguiente-codigo")
  async obtenerSiguienteCodigo(): Promise<RespuestaApi> {
    const datos = await this.calzadosServicio.obtenerSiguienteCodigo();
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

  @Put("promocion")
  async programarPromocion(
    @Body() dto: ProgramarPromocionDto,
  ): Promise<RespuestaApi> {
    const datos = await this.calzadosServicio.programarPromocion(dto);
    return {
      exito: true,
      mensaje: datos.mensaje,
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Put("promocion-modelo")
  async programarPromocionModelo(
    @Body() dto: ProgramarPromocionDto,
  ): Promise<RespuestaApi> {
    const datos = await this.calzadosServicio.programarPromocion(dto);
    return {
      exito: true,
      mensaje: datos.mensaje,
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
