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
      secretOrKey: configService.get<string>(
        "JWT_SECRET",
        "zlalalaz_super_secret_jwt_key_2026_calzado_store_bolivia",
      ),
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

    return {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
    };
  }
}
