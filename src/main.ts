import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModulo } from './app.modulo';
import { FiltroExcepcionGlobal } from './comun/filtros/excepcion-global.filtro';

async function iniciarAplicacion() {
  const logger = new Logger('ServidorZLaLaLaZ');
  const app = await NestFactory.create<NestExpressApplication>(AppModulo);

  // Prefijo global para versionado de API
  app.setGlobalPrefix('api/v1');

  // Habilitar CORS para peticiones desde Next.js y Tauri
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
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
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  const puerto = process.env.PORT || 3001;
  await app.listen(puerto);

  logger.log(`=======================================================`);
  logger.log(`🚀 Backend ZLaLaLaZ ejecutándose en http://localhost:${puerto}/api/v1`);
  logger.log(`📦 Almacenamiento: ${process.env.STORAGE_PROVIDER || 'cloudflare_r2'}`);
  logger.log(`=======================================================`);
}

iniciarAplicacion();
