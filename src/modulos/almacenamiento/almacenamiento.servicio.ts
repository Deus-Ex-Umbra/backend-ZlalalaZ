import { Injectable, Logger, BadRequestException } from "@nestjs/common";
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
export class AlmacenamientoServicio {
  private readonly logger = new Logger(AlmacenamientoServicio.name);
  private clienteS3: S3Client | null = null;
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

    // Resolución de nombre de bucket con precedencia:
    // 1. R2_BUCKET_NAME o S3_BUCKET_NAME explícitos
    // 2. Bucket extraído de la ruta del endpoint
    // 3. 'lalalabucket' por defecto oficial del proyecto
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

    // En Cloudflare R2 la región oficial es 'auto', mientras que en AWS S3 estándar suele ser 'us-east-1'
    this.regionS3 =
      this.configService.get<string>("R2_REGION") ||
      this.configService.get<string>("S3_REGION") ||
      this.configService.get<string>("AWS_REGION") ||
      (esR2 ? "auto" : "us-east-1");

    this.dominioPublico =
      this.configService.get<string>("R2_PUBLIC_DOMAIN") ||
      this.configService.get<string>("S3_PUBLIC_DOMAIN");

    this.inicializarProveedor();
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
        });
        this.logger.log(
          `Cliente S3/R2 en la nube inicializado exitosamente (Proveedor: '${this.proveedor}', Bucket: '${this.nombreBucket}', Región: '${this.regionS3}'${
            this.endpointLimpio ? `, Endpoint: ${this.endpointLimpio}` : ""
          }).`,
        );
      } else {
        this.logger.warn(
          `STORAGE_PROVIDER configurado como '${this.proveedor}', pero faltan credenciales activas (R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY) en .env. Se usará modo LOCAL como respaldo seguro.`,
        );
      }
    } else {
      this.logger.log(
        "Almacenamiento configurado en modo LOCAL (archivos en carpeta /uploads).",
      );
    }
  }

  /**
   * Sube una imagen de calzado comprimida (preferentemente WebP) al almacenamiento (local o nube S3/R2)
   */
  async subirImagenCalzado(
    archivo: Express.Multer.File,
    subcarpeta: string = "calzados",
  ): Promise<ResultadoSubida> {
    if (!archivo) {
      throw new BadRequestException({
        codigo: "ERR-ALM-002",
        mensaje: "No se ha proporcionado ningún archivo para subir",
      });
    }

    const extension =
      path.extname(archivo.originalname).toLowerCase() || ".webp";
    const nombreArchivo = `${subcarpeta}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}${extension}`;

    // Si el proveedor es nube y el cliente S3/R2 está listo, sube al bucket
    if (this.esNube && this.clienteS3) {
      try {
        const comando = new PutObjectCommand({
          Bucket: this.nombreBucket,
          Key: nombreArchivo,
          Body: archivo.buffer,
          ContentType: archivo.mimetype || "image/webp",
        });

        await this.clienteS3.send(comando);

        let urlPublica = "";
        if (this.dominioPublico) {
          urlPublica = `${this.dominioPublico.replace(/\/$/, "")}/${nombreArchivo}`;
        } else if (this.endpointLimpio) {
          // Cloudflare R2 u orígenes S3 compatibles con endpoint personalizado
          urlPublica = `${this.endpointLimpio}/${this.nombreBucket}/${nombreArchivo}`;
        } else {
          urlPublica = `https://${this.nombreBucket}.s3.${this.regionS3}.amazonaws.com/${nombreArchivo}`;
        }

        const proveedorNombre =
          this.proveedor === "cloudflare_r2" || this.proveedor === "r2"
            ? "cloudflare_r2"
            : "s3";

        this.logger.log(
          `Imagen subida exitosamente a la nube (${proveedorNombre}): ${urlPublica}`,
        );

        const resultado: ResultadoSubida = {
          url: urlPublica,
          clave: nombreArchivo,
          tamano: archivo.size,
          proveedor: proveedorNombre,
        };

        await this.registrarArchivoSubido(resultado);
        return resultado;
      } catch (error: unknown) {
        this.logger.error("Error al subir al bucket de almacenamiento en la nube:", error);
        throw new BadRequestException({
          codigo: "ERR-ALM-001",
          mensaje: "Fallo de conexión o subida hacia el bucket de almacenamiento en la nube",
          detalles: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Modo de respaldo o por defecto: Almacenamiento local
    const resultado = await this.subirLocal(archivo, nombreArchivo);
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

  private async subirLocal(
    archivo: Express.Multer.File,
    nombreArchivo: string,
  ): Promise<ResultadoSubida> {
    const rutaBase = path.join(process.cwd(), "uploads");
    const rutaDestino = path.join(rutaBase, nombreArchivo);
    const carpetaDestino = path.dirname(rutaDestino);

    if (!fs.existsSync(carpetaDestino)) {
      fs.mkdirSync(carpetaDestino, { recursive: true });
    }

    fs.writeFileSync(rutaDestino, archivo.buffer);
    const puerto = this.configService.get<number>("PORT", 3001);
    const urlLocal = `http://localhost:${puerto}/uploads/${nombreArchivo}`;

    this.logger.log(`Imagen guardada localmente: ${urlLocal}`);
    return {
      url: urlLocal,
      clave: nombreArchivo,
      tamano: archivo.size,
      proveedor: "local",
    };
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
