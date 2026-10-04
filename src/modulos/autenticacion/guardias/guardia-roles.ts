import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { CLAVE_ROLES } from "../decoradores/roles-requeridos.decorador";
import { RolUsuario } from "../../usuarios/enums/rol-usuario.enum";

@Injectable()
export class GuardiaRoles implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(contexto: ExecutionContext): boolean {
    const rolesRequeridos = this.reflector.getAllAndOverride<RolUsuario[]>(
      CLAVE_ROLES,
      [contexto.getHandler(), contexto.getClass()],
    );

    // Si no se requiere ningún rol específico, se permite el acceso
    if (!rolesRequeridos || rolesRequeridos.length === 0) {
      return true;
    }

    const { user } = contexto.switchToHttp().getRequest();
    if (!user || !user.rol) {
      throw new ForbiddenException(
        "ERR-AUTH-003: Acceso denegado por rol insuficiente",
      );
    }

    const tienePermiso = rolesRequeridos.some((rol) => rol === user.rol);
    if (!tienePermiso) {
      throw new ForbiddenException(
        `ERR-AUTH-003: Acceso denegado. Se requiere uno de los siguientes roles: ${rolesRequeridos.join(", ")}`,
      );
    }

    return true;
  }
}
