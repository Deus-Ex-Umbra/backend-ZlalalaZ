import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export interface EstadoConexionSupabase {
  conectado: boolean;
  mensaje: string;
  detalles?: unknown;
}

@Injectable()
export class SupabaseServicio {
  private readonly logger = new Logger(SupabaseServicio.name);
  private clienteAdmin: SupabaseClient | null = null;
  private clientePublico: SupabaseClient | null = null;
  private readonly urlSupabase?: string;

  constructor(private readonly configService: ConfigService) {
    this.urlSupabase =
      this.configService.get<string>("SUPABASE_URL") ||
      this.configService.get<string>("NEXT_PUBLIC_SUPABASE_URL");

    const claveSecreta =
      this.configService.get<string>("SUPABASE_SECRET_KEY") ||
      this.configService.get<string>("SUPABASE_SERVICE_ROLE_KEY");

    const clavePublica =
      this.configService.get<string>("SUPABASE_PUBLISHABLE_KEY") ||
      this.configService.get<string>("SUPABASE_ANON_KEY") ||
      this.configService.get<string>("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

    if (this.urlSupabase && claveSecreta) {
      try {
        this.clienteAdmin = createClient(this.urlSupabase, claveSecreta, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        });
        this.logger.log(
          `Cliente Administrador de Supabase inicializado correctamente (${this.urlSupabase}).`,
        );
      } catch (error: unknown) {
        this.logger.error(
          "Error al inicializar cliente administrador de Supabase:",
          error instanceof Error ? error.message : String(error),
        );
      }
    } else {
      this.logger.warn(
        "SUPABASE_URL o SUPABASE_SECRET_KEY ausentes. Cliente administrador de Supabase desactivado.",
      );
    }

    if (this.urlSupabase && clavePublica) {
      try {
        this.clientePublico = createClient(this.urlSupabase, clavePublica);
        this.logger.log(
          "Cliente Público de Supabase inicializado correctamente.",
        );
      } catch (error: unknown) {
        this.logger.error(
          "Error al inicializar cliente público de Supabase:",
          error instanceof Error ? error.message : String(error),
        );
      }
    }
  }

  /**
   * Obtiene la instancia del cliente administrador de Supabase (service_role / secret key).
   * Proporciona acceso total y bypass de Row Level Security (RLS) para tareas de backend.
   */
  obtenerClienteAdmin(): SupabaseClient {
    if (!this.clienteAdmin) {
      throw new Error(
        "ERR-SUP-001: Cliente administrador de Supabase no inicializado. Verifique SUPABASE_URL y SUPABASE_SECRET_KEY en las variables de entorno.",
      );
    }
    return this.clienteAdmin;
  }

  /**
   * Obtiene la instancia del cliente público de Supabase (publishable / anon key).
   * Respeta las políticas de Row Level Security (RLS).
   */
  obtenerClientePublico(): SupabaseClient {
    if (!this.clientePublico) {
      throw new Error(
        "ERR-SUP-002: Cliente público de Supabase no inicializado. Verifique SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY en las variables de entorno.",
      );
    }
    return this.clientePublico;
  }

  /**
   * Indica si el cliente administrador de Supabase se encuentra activo y listo para operar.
   */
  estaConfigurado(): boolean {
    return this.clienteAdmin !== null;
  }

  /**
   * Verifica la conectividad con los servicios de Supabase mediante una solicitud de estado.
   */
  async verificarConexion(): Promise<EstadoConexionSupabase> {
    if (!this.clienteAdmin) {
      return {
        conectado: false,
        mensaje:
          "Supabase no está configurado (faltan credenciales en el entorno).",
      };
    }

    try {
      // Comprobación de estado consultando la lista de usuarios con límite de 1
      const { error } = await this.clienteAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1,
      });

      if (error) {
        this.logger.warn(
          `Comprobación de Supabase devolvió advertencia: ${error.message}`,
        );
        return {
          conectado: false,
          mensaje: `Error reportado por Supabase: ${error.message}`,
          detalles: error,
        };
      }

      return {
        conectado: true,
        mensaje: "Conexión con Supabase verificada exitosamente",
      };
    } catch (error: unknown) {
      const mensajeError =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Fallo al verificar conexión con Supabase: ${mensajeError}`,
      );
      return {
        conectado: false,
        mensaje: `No se pudo conectar con Supabase: ${mensajeError}`,
        detalles: error,
      };
    }
  }
}
