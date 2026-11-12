import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
import { ValidationPipe } from "@nestjs/common";
import express, { Express, Request, Response } from "express";
import { AppModulo } from "../src/app.modulo";
import { FiltroExcepcionGlobal } from "../src/comun/filtros/excepcion-global.filtro";
import {
  analizarOrigenesCors,
  esOrigenPermitido,
} from "../src/comun/configuracion/seguridad.configuracion";
import { ConfigService } from "@nestjs/config";

/**
 * Instancia en memoria de la aplicación Express para reutilización en entornos serverless (Vercel).
 * Esto evita reconectar a la base de datos y recrear el árbol de inyección de dependencias en cada invocación.
 */
let servidorExpressEnCache: Express | null = null;

async function inicializarServidorNest(): Promise<Express> {
  if (servidorExpressEnCache) {
    return servidorExpressEnCache;
  }

  const servidorExpress = express();
  servidorExpress.use(express.json({ limit: "10mb" }));
  servidorExpress.use(express.urlencoded({ extended: true, limit: "10mb" }));
  const adaptador = new ExpressAdapter(servidorExpress);

  const aplicacionNest = await NestFactory.create(AppModulo, adaptador, {
    logger: ["error", "warn", "log"],
  });

  // Prefijo global para versionado de API
  aplicacionNest.setGlobalPrefix("api/v1");

  // Configuración de CORS basada en variables de entorno
  const configService = aplicacionNest.get(ConfigService);
  const origenesConfig = configService.get<string>("CORS_ORIGENES");
  const origenesPermitidos = origenesConfig
    ? analizarOrigenesCors(origenesConfig)
    : [];

  aplicacionNest.enableCors({
    origin: (
      origen: string | undefined,
      devolucion: (error: Error | null, permitido?: boolean) => void,
    ) => {
      // Peticiones sin origen (mismo origen, curl, serverless a serverless) o permitidos
      if (esOrigenPermitido(origen, origenesPermitidos)) {
        devolucion(null, true);
        return;
      }
      devolucion(null, false);
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true,
  });

  // Validaciones globales de DTOs con class-validator
  aplicacionNest.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // Filtro global estandarizado de excepciones
  aplicacionNest.useGlobalFilters(new FiltroExcepcionGlobal());

  // Inicializar la aplicación Nest sin levantar puerto de red local
  await aplicacionNest.init();

  servidorExpressEnCache = servidorExpress;
  return servidorExpressEnCache;
}

/**
 * Manejador principal para Vercel Serverless Function
 */
export default async function manejadorServerless(
  peticion: Request,
  respuesta: Response,
): Promise<void> {
  const origen = (peticion.headers.origin as string) || "*";

  // Inyección obligatoria de cabeceras CORS universales a nivel Serverless
  respuesta.setHeader("Access-Control-Allow-Origin", origen);
  respuesta.setHeader("Access-Control-Allow-Credentials", "true");
  respuesta.setHeader(
    "Access-Control-Allow-Methods",
    "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  );
  respuesta.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Accept, Authorization, X-Requested-With, Origin, Access-Control-Request-Method, Access-Control-Request-Headers",
  );
  respuesta.setHeader(
    "Access-Control-Expose-Headers",
    "Content-Range, X-Content-Range",
  );

  // Responder de inmediato a preflights OPTIONS con 204 No Content
  if (peticion.method === "OPTIONS") {
    respuesta.status(204).end();
    return;
  }

  // Ejecutar el servidor Express esperando que la respuesta termine de emitirse
  return new Promise<void>((resolve) => {
    const temporizador = setTimeout(() => {
      if (!respuesta.headersSent) {
        respuesta.status(504).json({
          statusCode: 504,
          mensaje: "Tiempo de espera agotado al procesar la solicitud en el servidor",
        });
      }
      resolve();
    }, 15000);

    inicializarServidorNest()
      .then((servidor) => {
        respuesta.on("finish", () => {
          clearTimeout(temporizador);
          resolve();
        });
        respuesta.on("close", () => {
          clearTimeout(temporizador);
          resolve();
        });
        servidor(peticion, respuesta);
      })
      .catch((error: unknown) => {
        clearTimeout(temporizador);
        console.error("[Vercel Serverless Error]", error);
        if (!respuesta.headersSent) {
          respuesta.status(500).json({
            statusCode: 500,
            mensaje: "Error interno al inicializar o ejecutar el servidor",
            error: error instanceof Error ? error.message : String(error),
          });
        }
        resolve();
      });
  });
}
