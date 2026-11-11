import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { UsuariosServicio } from "./usuarios.servicio";
import { CrearUsuarioDto } from "./dto/crear-usuario.dto";
import { ActualizarUsuarioDto } from "./dto/actualizar-usuario.dto";
import { RespuestaApi } from "../../comun/interfaces/respuesta-api.interfaz";
import { GuardiaJwt } from "../autenticacion/guardias/guardia-jwt";
import { GuardiaRoles } from "../autenticacion/guardias/guardia-roles";
import { RolesRequeridos } from "../autenticacion/decoradores/roles-requeridos.decorador";
import { RolUsuario } from "./enums/rol-usuario.enum";

@Controller("usuarios")
export class UsuariosControlador {
  constructor(private readonly usuariosServicio: UsuariosServicio) {}

  @Get()
  @UseGuards(GuardiaJwt)
  async listar(): Promise<RespuestaApi> {
    const datos = await this.usuariosServicio.listar();
    return {
      exito: true,
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Post()
  @UseGuards(GuardiaJwt, GuardiaRoles)
  @RolesRequeridos(RolUsuario.ADMINISTRADOR)
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
  @UseGuards(GuardiaJwt, GuardiaRoles)
  @RolesRequeridos(RolUsuario.ADMINISTRADOR)
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
  @UseGuards(GuardiaJwt, GuardiaRoles)
  @RolesRequeridos(RolUsuario.ADMINISTRADOR)
  async eliminar(@Param("id") id: string): Promise<RespuestaApi> {
    const datos = await this.usuariosServicio.actualizar(id, { activo: false });
    return {
      exito: true,
      mensaje: "Usuario desactivado exitosamente",
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Post(":id/revocar-sesiones")
  @UseGuards(GuardiaJwt, GuardiaRoles)
  @RolesRequeridos(RolUsuario.ADMINISTRADOR)
  async revocarSesiones(@Param("id") id: string): Promise<RespuestaApi> {
    const datos = await this.usuariosServicio.revocarSesiones(id);
    return {
      exito: true,
      mensaje:
        "Se cerraron todas las sesiones activas del usuario en todos los dispositivos",
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }
}
