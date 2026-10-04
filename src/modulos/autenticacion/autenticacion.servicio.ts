import { Injectable, UnauthorizedException, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { UsuariosServicio } from "../usuarios/usuarios.servicio";
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

  async iniciarSesion(dto: IniciarSesionDto) {
    const usuario = await this.validarUsuario(dto.correo, dto.contrasena);

    const cargaUtil: CargaUtilJwt = {
      sub: usuario.id,
      correo: usuario.correo,
      rol: usuario.rol,
      nombre: usuario.nombre,
    };

    const tokenAcceso = this.jwtService.sign(cargaUtil);

    this.logger.log(
      `Inicio de sesión exitoso: ${usuario.correo} (${usuario.rol})`,
    );

    return {
      tokenAcceso,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
      },
    };
  }
}
