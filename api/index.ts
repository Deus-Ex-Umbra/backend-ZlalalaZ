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
  const origen = peticion.headers.origin;

  // Inyección de cabeceras CORS universales a nivel Serverless para asegurar preflights y respuestas
  if (esOrigenPermitido(origen)) {
    respuesta.setHeader("Access-Control-Allow-Origin", origen || "*");
    respuesta.setHeader("Access-Control-Allow-Credentials", "true");
    respuesta.setHeader(
      "Access-Control-Allow-Methods",
      "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    );
    respuesta.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, Accept, X-Requested-With, Origin, Access-Control-Request-Method, Access-Control-Request-Headers",
    );
    respuesta.setHeader(
      "Access-Control-Expose-Headers",
      "Content-Range, X-Content-Range",
    );
  }

  // Responder de inmediato a preflights OPTIONS con 204 No Content
  if (peticion.method === "OPTIONS") {
    respuesta.status(204).end();
    return;
  }

  const servidor = await inicializarServidorNest();
  servidor(peticion, respuesta);
}
