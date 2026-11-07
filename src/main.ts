import { NestFactory } from "@nestjs/core";
import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";
import { Request, Response, NextFunction } from "express";
import { AppModulo } from "./app.modulo";
import { FiltroExcepcionGlobal } from "./comun/filtros/excepcion-global.filtro";
import {
  analizarOrigenesCors,
  esOrigenPermitido,
} from "./comun/configuracion/seguridad.configuracion";

async function iniciarAplicacion() {
  const logger = new Logger("ServidorLaLaLa");
  const app = await NestFactory.create<NestExpressApplication>(AppModulo);

  // Prefijo global para versionado de API
  app.setGlobalPrefix("api/v1");

  // Habilitar CORS solo para los orígenes de CORS_ORIGENES (separados por ";")
  const configService = app.get(ConfigService);
  const origenesPermitidos = analizarOrigenesCors(
    configService.getOrThrow<string>("CORS_ORIGENES"),
  );

  app.use(
    (
      peticion: Request,
      respuesta: Response,
      siguiente: NextFunction,
    ): void => {
      const origen = peticion.headers.origin;
      if (esOrigenPermitido(origen, origenesPermitidos)) {
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
      }
      if (peticion.method === "OPTIONS") {
        respuesta.status(204).end();
        return;
      }
      siguiente();
    },
  );

  app.enableCors({
    origin: (
      origen: string | undefined,
      devolucion: (error: Error | null, permitido?: boolean) => void,
    ) => {
      // Sin cabecera Origin (mismo origen, curl, servidor a servidor) o coincidente con lista
      if (esOrigenPermitido(origen, origenesPermitidos)) {
        devolucion(null, true);
        return;
      }
      logger.warn(`CORS: origen bloqueado ${origen}`);
      devolucion(null, false);
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true,
  });

  // Validaciones globales de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // Filtro estandarizado de excepciones en español
  app.useGlobalFilters(new FiltroExcepcionGlobal());

  // Servir archivos estáticos locales de desarrollo (uploads/)
  app.useStaticAssets(join(process.cwd(), "uploads"), {
    prefix: "/uploads/",
  });

  const puerto = process.env.PORT || 3001;
  await app.listen(puerto);

  logger.log(`=======================================================`);
  logger.log(
    `🚀 Backend LaLaLa ejecutándose en http://localhost:${puerto}/api/v1`,
  );
  logger.log(
    `📦 Almacenamiento: ${process.env.STORAGE_PROVIDER || "cloudflare_r2"}`,
  );
  logger.log(`🔒 Orígenes CORS permitidos: ${origenesPermitidos.join(", ")}`);
  logger.log(`=======================================================`);
}

iniciarAplicacion();
