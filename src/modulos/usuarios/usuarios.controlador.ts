import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from "@nestjs/common";
import { UsuariosServicio } from "./usuarios.servicio";
import { CrearUsuarioDto } from "./dto/crear-usuario.dto";
import { ActualizarUsuarioDto } from "./dto/actualizar-usuario.dto";
import { RespuestaApi } from "../../comun/interfaces/respuesta-api.interfaz";

@Controller("usuarios")
export class UsuariosControlador {
  constructor(private readonly usuariosServicio: UsuariosServicio) {}

  @Get()
  async listar(): Promise<RespuestaApi> {
    const datos = await this.usuariosServicio.listar();
    return {
      exito: true,
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Post()
  async crear(@Body() dto: CrearUsuarioDto): Promise<RespuestaApi> {
    const datos = await this.usuariosServicio.crear(dto);
    return {
      exito: true,
      mensaje: "Usuario creado exitosamente",
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Put(":id")
  async actualizar(
    @Param("id") id: string,
    @Body() dto: ActualizarUsuarioDto,
  ): Promise<RespuestaApi> {
    const datos = await this.usuariosServicio.actualizar(id, dto);
    return {
      exito: true,
      mensaje: "Usuario actualizado exitosamente",
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Delete(":id")
  async eliminar(@Param("id") id: string): Promise<RespuestaApi> {
    const datos = await this.usuariosServicio.actualizar(id, { activo: false });
    return {
      exito: true,
      mensaje: "Usuario desactivado exitosamente",
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }
}
