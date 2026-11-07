import { Injectable, UnauthorizedException, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { UsuariosServicio } from "../usuarios/usuarios.servicio";
import { Usuario } from "../usuarios/entidades/usuario.entidad";
import { IniciarSesionDto } from "./dto/iniciar-sesion.dto";
import { CargaUtilJwt } from "./estrategias/estrategia-jwt";

@Injectable()
export class AutenticacionServicio {
  private readonly logger = new Logger(AutenticacionServicio.name);

  constructor(
    private readonly usuariosServicio: UsuariosServicio,
    private readonly jwtService: JwtService,
  ) {}

  async validarUsuario(correo: string, contrasenaPlana: string) {
    const usuario = await this.usuariosServicio.buscarPorCorreo(correo);
    if (!usuario) {
      throw new UnauthorizedException("ERR-AUTH-001: Credenciales inválidas");
    }

    if (!usuario.activo) {
      throw new UnauthorizedException(
        "ERR-AUTH-004: La cuenta de usuario se encuentra inactiva",
      );
    }

    const contrasenaValida = await bcrypt.compare(
      contrasenaPlana,
      usuario.contrasenaHash,
    );
    if (!contrasenaValida) {
      throw new UnauthorizedException("ERR-AUTH-001: Credenciales inválidas");
    }

    return usuario;
  }

  private generarSesion(usuario: Usuario) {
    const cargaUtil: CargaUtilJwt = {
      sub: usuario.id,
      correo: usuario.correo,
      rol: usuario.rol,
      nombre: usuario.nombre,
    };

    return {
      tokenAcceso: this.jwtService.sign(cargaUtil),
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
      },
    };
  }

  async iniciarSesion(dto: IniciarSesionDto) {
    const usuario = await this.validarUsuario(dto.correo, dto.contrasena);

    this.logger.log(
      `Inicio de sesión exitoso: ${usuario.correo} (${usuario.rol})`,
    );

    return this.generarSesion(usuario);
  }

  /**
   * Emite un token nuevo para un usuario con sesión vigente (autorefresco).
   * Si recibe el usuario ya validado por GuardiaJwt, evita una segunda consulta a BD.
   */
  async refrescarSesion(
    usuarioOId:
      | string
      | Pick<Usuario, "id" | "nombre" | "correo" | "rol">,
  ) {
    if (typeof usuarioOId !== "string") {
      return this.generarSesion(usuarioOId as Usuario);
    }

    const usuario = await this.usuariosServicio.buscarPorId(usuarioOId);
    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException(
        "ERR-AUTH-004: La cuenta de usuario se encuentra inactiva",
      );
    }

    return this.generarSesion(usuario);
  }
}
