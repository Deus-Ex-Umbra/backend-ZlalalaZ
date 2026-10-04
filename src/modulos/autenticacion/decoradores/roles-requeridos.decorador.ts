import { SetMetadata } from "@nestjs/common";
import { RolUsuario } from "../../usuarios/enums/rol-usuario.enum";

export const CLAVE_ROLES = "roles";
export const RolesRequeridos = (...roles: RolUsuario[]) =>
  SetMetadata(CLAVE_ROLES, roles);
