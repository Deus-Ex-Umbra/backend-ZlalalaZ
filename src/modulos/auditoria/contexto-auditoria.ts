import { AsyncLocalStorage } from "async_hooks";

export interface DatosContextoAuditoria {
  usuarioId: string | null;
  usuarioNombre: string | null;
  usuarioRol: string | null;
  ip: string | null;
  metodoHttp: string | null;
  rutaHttp: string | null;
  inicioVentana: Date;
}

const almacenamientoContexto = new AsyncLocalStorage<DatosContextoAuditoria>();

export class ContextoAuditoria {
  static ejecutar<T>(
    datos: DatosContextoAuditoria,
    fn: () => T,
  ): T {
    return almacenamientoContexto.run(datos, fn);
  }

  static obtener(): DatosContextoAuditoria | undefined {
    return almacenamientoContexto.getStore();
  }

  static actualizarUsuario(parcial: {
    usuarioId?: string | null;
    usuarioNombre?: string | null;
    usuarioRol?: string | null;
  }): void {
    const actual = almacenamientoContexto.getStore();
    if (!actual) return;
    if (parcial.usuarioId !== undefined) {
      actual.usuarioId = parcial.usuarioId;
    }
    if (parcial.usuarioNombre !== undefined) {
      actual.usuarioNombre = parcial.usuarioNombre;
    }
    if (parcial.usuarioRol !== undefined) {
      actual.usuarioRol = parcial.usuarioRol;
    }
  }
}
