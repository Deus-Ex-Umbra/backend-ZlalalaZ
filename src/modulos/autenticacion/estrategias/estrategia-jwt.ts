import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { UsuariosServicio } from "../../usuarios/usuarios.servicio";
import { RolUsuario } from "../../usuarios/enums/rol-usuario.enum";

export interface CargaUtilJwt {
  sub: string;
  correo: string;
  rol: RolUsuario;
  nombre: string;
  versionToken?: number;
}

@Injectable()
export class EstrategiaJwt extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usuariosServicio: UsuariosServicio,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>("JWT_SECRET"),
    });
  }

  async validate(payload: CargaUtilJwt) {
    const usuario = await this.usuariosServicio.buscarPorId(payload.sub);
    if (!usuario) {
      throw new UnauthorizedException(
        "ERR-AUTH-004: Usuario no encontrado en el sistema",
      );
    }

    if (!usuario.activo) {
      throw new UnauthorizedException(
        "ERR-AUTH-004: La cuenta de usuario se encuentra inactiva",
      );
    }

    if (
      payload.versionToken !== undefined &&
      usuario.versionToken !== undefined &&
      usuario.versionToken !== null &&
      payload.versionToken !== usuario.versionToken
    ) {
      throw new UnauthorizedException(
        "ERR-AUTH-006: Tu sesión ha sido cerrada remotamente por seguridad. Inicia sesión nuevamente.",
      );
    }

    return {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
      versionToken: usuario.versionToken ?? 1,
    };
  }
}
