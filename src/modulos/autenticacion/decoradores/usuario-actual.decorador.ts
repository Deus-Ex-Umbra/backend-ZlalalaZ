import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const UsuarioActual = createParamDecorator(
  (propiedad: string | undefined, contexto: ExecutionContext) => {
    const peticion = contexto.switchToHttp().getRequest();
    const usuario = peticion.user;

    if (!usuario) {
      return null;
    }

    return propiedad ? usuario[propiedad] : usuario;
  },
);
