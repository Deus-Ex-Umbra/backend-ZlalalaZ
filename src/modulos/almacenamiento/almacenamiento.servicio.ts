import {
  Injectable,
  Logger,
  BadRequestException,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import * as fs from "fs";
import * as path from "path";
import { ArchivoAlmacenamiento } from "./entidades/archivo-almacenamiento.entidad";

export interface ResultadoSubida {
  url: string;
  clave: string;
  tamano: number;
  proveedor: string;
}

export interface UsoAlmacenamiento {
  mbUsados: number;
  bytesUsados: number;
  mbLimite: number;
  cantidadFotos: number;
  porcentajeUsado: number;
}

@Injectable()
export class AlmacenamientoServicio implements OnModuleInit {
  private readonly logger = new Logger(AlmacenamientoServicio.name);
  private clienteS3: S3Client | null = null;
  private clienteS3Alternativo: S3Client | null = null;
  private readonly proveedor: string;
  private nombreBucket: string;
  private readonly dominioPublico?: string;
  private regionS3: string;
  private readonly esNube: boolean;
  private endpointLimpio?: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(ArchivoAlmacenamiento)
    private readonly archivoRepo: Repository<ArchivoAlmacenamiento>,
  ) {
    this.proveedor = (
      this.configService.get<string>("STORAGE_PROVIDER", "local")
    ).toLowerCase();

    this.esNube = [
      "nube",
      "s3",
      "aws_s3",
      "cloudflare_r2",
      "r2",
    ].includes(this.proveedor);

    // Endpoint bruto configurado en R2_ENDPOINT o S3_ENDPOINT
    const endpointBruto =
      this.configService.get<string>("R2_ENDPOINT") ||
      this.configService.get<string>("S3_ENDPOINT");

    let bucketDetectadoEnRuta: string | undefined = undefined;

    if (endpointBruto) {
      try {
        const urlObjeto = new URL(endpointBruto);
        const segmentosRuta = urlObjeto.pathname
          .split("/")
          .filter((segmento) => segmento.trim().length > 0);

        if (segmentosRuta.length > 0) {
          bucketDetectadoEnRuta = segmentosRuta[0];
          this.logger.log(
            `Bucket '${bucketDetectadoEnRuta}' detectado en la ruta del endpoint de almacenamiento.`,
          );
        }

        // Endpoint limpio: únicamente el origen (protocolo + dominio[:puerto]), sin ruta
        this.endpointLimpio = urlObjeto.origin;
      } catch (error: unknown) {
        this.logger.warn(
          `El endpoint de almacenamiento provisto no es una URL con protocolo válido (${endpointBruto}): ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        this.endpointLimpio = endpointBruto.replace(/\/+$/, "");
      }
    }

    this.nombreBucket =
      this.configService.get<string>("R2_BUCKET_NAME") ||
      this.configService.get<string>("S3_BUCKET_NAME") ||
      this.configService.get<string>("AWS_S3_BUCKET") ||
      bucketDetectadoEnRuta ||
      "lalalabucket";

    const esR2 =
      this.proveedor === "cloudflare_r2" ||
      this.proveedor === "r2" ||
      Boolean(
        endpointBruto && endpointBruto.includes("r2.cloudflarestorage.com"),
      );

    this.regionS3 =
      this.configService.get<string>("R2_REGION") ||
      this.configService.get<string>("S3_REGION") ||
      this.configService.get<string>("AWS_REGION") ||
      (esR2 ? "auto" : "us-east-1");

    const dominioConfig =
      this.configService.get<string>("R2_PUBLIC_DOMAIN") ||
      this.configService.get<string>("S3_PUBLIC_DOMAIN");

    this.dominioPublico =
      dominioConfig && !dominioConfig.toLowerCase().includes("tu_")
        ? dominioConfig.trim()
        : undefined;

    this.inicializarProveedor();
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.archivoRepo.query(`
        ALTER TABLE archivos_almacenamiento ALTER COLUMN url TYPE TEXT;
      `);
    } catch {
      // Ignorar si la tabla aún no existe o ya es TEXT
    }
  }

  private inicializarProveedor(): void {
    if (this.esNube) {
      const accessKeyId =
        this.configService.get<string>("R2_ACCESS_KEY_ID") ||
        this.configService.get<string>("S3_ACCESS_KEY_ID") ||
        this.configService.get<string>("AWS_ACCESS_KEY_ID");

      const secretAccessKey =
        this.configService.get<string>("R2_SECRET_ACCESS_KEY") ||
        this.configService.get<string>("S3_SECRET_ACCESS_KEY") ||
        this.configService.get<string>("AWS_SECRET_ACCESS_KEY");

      const tieneCredencialesValidas =
        Boolean(accessKeyId) &&
        Boolean(secretAccessKey) &&
        !accessKeyId?.toLowerCase().includes("tu_") &&
        !secretAccessKey?.toLowerCase().includes("tu_");

      if (tieneCredencialesValidas && accessKeyId && secretAccessKey) {
        this.clienteS3 = new S3Client({
          region: this.regionS3,
          ...(this.endpointLimpio
            ? { endpoint: this.endpointLimpio, forcePathStyle: true }
            : {}),
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
          requestChecksumCalculation: "WHEN_REQUIRED",
          responseChecksumValidation: "WHEN_REQUIRED",
        });

        // Si el endpoint contiene .us.r2.cloudflarestorage.com, preparamos cliente alternativo estándar R2
        if (
          this.endpointLimpio &&
          this.endpointLimpio.includes(".us.r2.cloudflarestorage.com")
        ) {
          const endpointSinUs = this.endpointLimpio.replace(
            ".us.r2.cloudflarestorage.com",
            ".r2.cloudflarestorage.com",
          );
          this.clienteS3Alternativo = new S3Client({
            region: this.regionS3,
            endpoint: endpointSinUs,
            forcePathStyle: true,
            credentials: {
              accessKeyId,
              secretAccessKey,
            },
            requestChecksumCalculation: "WHEN_REQUIRED",
            responseChecksumValidation: "WHEN_REQUIRED",
          });
        }

        this.logger.log(
          `Cliente S3/R2 en la nube inicializado exitosamente (Proveedor: '${this.proveedor}', Bucket: '${this.nombreBucket}', Región: '${this.regionS3}'${
            this.endpointLimpio ? `, Endpoint: ${this.endpointLimpio}` : ""
          }).`,
        );
      } else {
        this.logger.warn(
          `STORAGE_PROVIDER configurado como '${this.proveedor}', pero faltan credenciales activas en .env. Se usará respaldo seguro.`,
        );
      }
    } else {
      this.logger.log(
        "Almacenamiento configurado en modo LOCAL (archivos en carpeta /uploads o Data URI en Serverless).",
      );
    }
  }

  /**
   * Aplica Compresión Nivel 3 fija por defecto (WebP máx 1200x1200px, calidad 75, esfuerzo 4).
   * Sharp se carga dinámicamente para prevenir fallos nativos en entornos serverless.
   */
  private async comprimirImagenNivel3(bufferOriginal: Buffer): Promise<{
    buffer: Buffer;
    mimetype: string;
    extension: string;
  }> {
    try {
      // Carga dinámica de sharp para compatibilidad con Vercel Serverless
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const moduloSharp = require("sharp");
      const sharpFn = moduloSharp.default || moduloSharp;
      const bufferWebp = await sharpFn(bufferOriginal)
        .rotate()
        .resize({
          width: 1200,
          height: 1200,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 75, effort: 4 })
        .toBuffer();

      return {
        buffer: bufferWebp,
        mimetype: "image/webp",
        extension: ".webp",
      };
    } catch (error: unknown) {
      this.logger.warn(
        `Fallo al comprimir con sharp Nivel 3 (o sharp no disponible en entorno serverless), se usará el buffer original: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return {
        buffer: bufferOriginal,
        mimetype: "image/webp",
        extension: ".webp",
      };
    }
  }

  private generarDataUriRespaldo(
    buffer: Buffer,
    mimetype: string,
    nombreArchivo: string,
    proveedor: string = "inline_webp_n3",
  ): ResultadoSubida {
    const base64 = buffer.toString("base64");
    const dataUri = `data:${mimetype || "image/webp"};base64,${base64}`;
    return {
      url: dataUri,
      clave: nombreArchivo,
      tamano: buffer.length,
      proveedor,
    };
  }

  /**
   * Sube una imagen de calzado aplicando siempre Compresión Nivel 3 fija (WebP)
   * al almacenamiento en la nube S3/R2 o al respaldo seguro Serverless/Local.
   */
  async subirImagenCalzado(
    archivo: Express.Multer.File,
    subcarpeta: string = "calzados",
  ): Promise<ResultadoSubida> {
    if (!archivo || !archivo.buffer) {
      throw new BadRequestException({
        codigo: "ERR-ALM-002",
        mensaje: "No se ha proporcionado ningún archivo para subir",
      });
    }

    const optimizado = await this.comprimirImagenNivel3(archivo.buffer);
    const nombreArchivo = `${subcarpeta}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}${optimizado.extension}`;

    // Si el proveedor es nube y el cliente S3/R2 está listo, intenta subir al bucket
    if (this.esNube && this.clienteS3) {
      const comando = new PutObjectCommand({
        Bucket: this.nombreBucket,
        Key: nombreArchivo,
        Body: optimizado.buffer,
        ContentType: optimizado.mimetype,
      });

      let subidaExitosa = false;
      try {
        await this.clienteS3.send(comando);
        subidaExitosa = true;
      } catch (errorPrimario: unknown) {
        this.logger.warn(
          `Fallo subida primaria a S3/R2 (${this.endpointLimpio}): ${
            errorPrimario instanceof Error
              ? errorPrimario.message
              : String(errorPrimario)
          }`,
        );
        if (this.clienteS3Alternativo) {
          try {
            await this.clienteS3Alternativo.send(comando);
            subidaExitosa = true;
          } catch (errorSecundario: unknown) {
            this.logger.warn(
              `Fallo subida secundaria a R2 estándar: ${
                errorSecundario instanceof Error
                  ? errorSecundario.message
                  : String(errorSecundario)
              }`,
            );
          }
        }
      }

      if (subidaExitosa) {
        const proveedorNombre =
          this.proveedor === "cloudflare_r2" || this.proveedor === "r2"
            ? "cloudflare_r2"
            : "s3";

        // Si existe R2_PUBLIC_DOMAIN válido, construir URL pública del CDN;
        // si no hay R2_PUBLIC_DOMAIN y el endpoint es privado (*.r2.cloudflarestorage.com),
        // devolvemos el Data URI WebP Nivel 3 para que la imagen se renderice siempre en producción sin 400/403.
        const esEndpointPrivadoR2 = Boolean(
          this.endpointLimpio &&
            this.endpointLimpio.includes("r2.cloudflarestorage.com"),
        );

        let urlPublica = "";
        if (this.dominioPublico) {
          urlPublica = `${this.dominioPublico.replace(/\/$/, "")}/${nombreArchivo}`;
        } else if (esEndpointPrivadoR2) {
          urlPublica = `data:${optimizado.mimetype};base64,${optimizado.buffer.toString("base64")}`;
        } else if (this.endpointLimpio) {
          urlPublica = `${this.endpointLimpio}/${this.nombreBucket}/${nombreArchivo}`;
        } else {
          urlPublica = `https://${this.nombreBucket}.s3.${this.regionS3}.amazonaws.com/${nombreArchivo}`;
        }

        const resultado: ResultadoSubida = {
          url: urlPublica,
          clave: nombreArchivo,
          tamano: optimizado.buffer.length,
          proveedor: proveedorNombre,
        };

        await this.registrarArchivoSubido(resultado);
        return resultado;
      }
    }

    // Modo de respaldo: Serverless (Vercel) o Local
    const resultado = await this.subirLocalORespaldo(
      optimizado.buffer,
      optimizado.mimetype,
      nombreArchivo,
    );
    await this.registrarArchivoSubido(resultado);
    return resultado;
  }

  private async registrarArchivoSubido(
    resultado: ResultadoSubida,
  ): Promise<void> {
    try {
      await this.archivoRepo.save({
        clave: resultado.clave,
        tamanoBytes: resultado.tamano,
        url: resultado.url,
        proveedor: resultado.proveedor,
      });
    } catch (error: unknown) {
      this.logger.warn(
        `No se pudo registrar metadatos de archivo ${resultado.clave}:`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  private async subirLocalORespaldo(
    buffer: Buffer,
    mimetype: string,
    nombreArchivo: string,
  ): Promise<ResultadoSubida> {
    const esEntornoServerless =
      Boolean(process.env.VERCEL) ||
      Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
      process.env.NODE_ENV === "production";

    if (esEntornoServerless) {
      // En Vercel Serverless nunca devolver http://localhost:3001 ni lanzar EROFS
      try {
        const rutaTmp = path.join("/tmp", "uploads", nombreArchivo);
        fs.mkdirSync(path.dirname(rutaTmp), { recursive: true });
        fs.writeFileSync(rutaTmp, buffer);
      } catch {
        // Ignorar si /tmp no está disponible
      }
      return this.generarDataUriRespaldo(
        buffer,
        mimetype,
        nombreArchivo,
        "vercel_inline_webp",
      );
    }

    try {
      const rutaBase = path.join(process.cwd(), "uploads");
      const rutaDestino = path.join(rutaBase, nombreArchivo);
      const carpetaDestino = path.dirname(rutaDestino);

      if (!fs.existsSync(carpetaDestino)) {
        fs.mkdirSync(carpetaDestino, { recursive: true });
      }

      fs.writeFileSync(rutaDestino, buffer);
      const puerto = this.configService.get<number>("PORT", 3001);
      const urlLocal = `http://localhost:${puerto}/uploads/${nombreArchivo}`;

      this.logger.log(`Imagen WebP Nivel 3 guardada localmente: ${urlLocal}`);
      return {
        url: urlLocal,
        clave: nombreArchivo,
        tamano: buffer.length,
        proveedor: "local",
      };
    } catch (errorFs: unknown) {
      this.logger.warn(
        `Sistema de archivos local de solo lectura o inaccesible (${
          errorFs instanceof Error ? errorFs.message : String(errorFs)
        }), retornando Data URI WebP Nivel 3.`,
      );
      return this.generarDataUriRespaldo(
        buffer,
        mimetype,
        nombreArchivo,
        "inline_webp_n3",
      );
    }
  }

  /**
   * Retorna métricas de espacio utilizado en MB y porcentaje sobre los 10 GB (10 240 MB)
   * gratuitos ofrecidos por Cloudflare R2 sin costo de salida.
   */
  async obtenerUsoEspacio(): Promise<UsoAlmacenamiento> {
    const cantidadFotos = await this.archivoRepo.count();
    const sumaRaw = await this.archivoRepo
      .createQueryBuilder("archivo")
      .select("SUM(archivo.tamanoBytes)", "total")
      .getRawOne();

    const bytesUsados = Number(sumaRaw?.total || 0);
    const mbUsados = Number((bytesUsados / (1024 * 1024)).toFixed(2));
    const mbLimite = 10240; // 10 GB en MB
    const porcentajeUsado = Number(((mbUsados / mbLimite) * 100).toFixed(2));

    return {
      mbUsados,
      bytesUsados,
      mbLimite,
      cantidadFotos,
      porcentajeUsado,
    };
  }
}
