import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { AutenticacionServicio } from "./autenticacion.servicio";
import { UsuariosServicio } from "../usuarios/usuarios.servicio";
import { IniciarSesionDto } from "./dto/iniciar-sesion.dto";
import { CrearUsuarioDto } from "../usuarios/dto/crear-usuario.dto";
import { GuardiaJwt } from "./guardias/guardia-jwt";
import { GuardiaRoles } from "./guardias/guardia-roles";
import { RolesRequeridos } from "./decoradores/roles-requeridos.decorador";
import { UsuarioActual } from "./decoradores/usuario-actual.decorador";
import { RolUsuario } from "../usuarios/enums/rol-usuario.enum";
import { Usuario } from "../usuarios/entidades/usuario.entidad";

@Controller("autenticacion")
export class AutenticacionControlador {
  constructor(
    private readonly autenticacionServicio: AutenticacionServicio,
    private readonly usuariosServicio: UsuariosServicio,
  ) {}

  @Post("iniciar-sesion")
  @HttpCode(HttpStatus.OK)
  async iniciarSesion(@Body() dto: IniciarSesionDto) {
    return this.autenticacionServicio.iniciarSesion(dto);
  }

  @Post("refrescar")
  @HttpCode(HttpStatus.OK)
  @UseGuards(GuardiaJwt)
  async refrescarSesion(@UsuarioActual() usuario: Usuario) {
    return this.autenticacionServicio.refrescarSesion(usuario);
  }

  @Get("perfil")
  @UseGuards(GuardiaJwt)
  obtenerPerfil(@UsuarioActual() usuario: Usuario) {
    return usuario;
  }

  @Get("usuarios")
  @UseGuards(GuardiaJwt, GuardiaRoles)
  @RolesRequeridos(RolUsuario.ADMINISTRADOR)
  listarUsuarios() {
    return this.usuariosServicio.listar();
  }

  @Post("usuarios")
  @UseGuards(GuardiaJwt, GuardiaRoles)
  @RolesRequeridos(RolUsuario.ADMINISTRADOR)
  crearUsuario(@Body() dto: CrearUsuarioDto) {
    return this.usuariosServicio.crear(dto);
  }
}
