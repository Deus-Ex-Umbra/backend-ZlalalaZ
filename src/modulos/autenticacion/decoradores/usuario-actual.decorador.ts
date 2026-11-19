import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { RolUsuario } from "../../usuarios/enums/rol-usuario.enum";

export interface UsuarioAutenticado {
  id: string;
  nombre: string;
  correo: string;
  rol: RolUsuario;
  versionToken?: number;
}

export const UsuarioActual = createParamDecorator(
  (propiedad: keyof UsuarioAutenticado | undefined, contexto: ExecutionContext) => {
    const peticion = contexto.switchToHttp().getRequest();
    const usuario = peticion.user as UsuarioAutenticado | undefined;

    if (!usuario) {
      return null;
    }

    return propiedad ? usuario[propiedad] : usuario;
  },
);
