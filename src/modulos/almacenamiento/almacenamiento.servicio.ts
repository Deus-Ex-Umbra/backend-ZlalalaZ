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
  private readonly nombreBucket: string;
  private readonly dominioPublico: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(ArchivoAlmacenamiento)
    private readonly archivoRepo: Repository<ArchivoAlmacenamiento>,
  ) {
    this.proveedor = this.configService.get<string>(
      "STORAGE_PROVIDER",
      "cloudflare_r2",
    );
    this.nombreBucket = this.configService.get<string>(
      "R2_BUCKET_NAME",
      "zlalalaz-calzado",
    );
    this.dominioPublico = this.configService.get<string>(
      "R2_PUBLIC_DOMAIN",
      "https://pub-calzados.r2.dev",
    );

    this.inicializarProveedor();
  }

  private inicializarProveedor() {
    if (this.proveedor === "cloudflare_r2") {
      const accessKeyId = this.configService.get<string>("R2_ACCESS_KEY_ID");
      const secretAccessKey = this.configService.get<string>(
        "R2_SECRET_ACCESS_KEY",
      );
      const endpoint = this.configService.get<string>("R2_ENDPOINT");

      if (accessKeyId && secretAccessKey && endpoint) {
        this.clienteS3 = new S3Client({
          region: "auto",
          endpoint,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        });
        this.logger.log(
          "Cliente Cloudflare R2 (S3) inicializado exitosamente (0$ egress).",
        );
      } else {
        this.logger.warn(
          "Credenciales de Cloudflare R2 no completas en .env. Cambiando automáticamente a almacenamiento local temporal.",
        );
      }
    }
  }

  /**
   * Sube una imagen de calzado comprimida (preferentemente WebP) al almacenamiento
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

    // Si Cloudflare R2 está configurado, sube usando la API de S3
    if (this.proveedor === "cloudflare_r2" && this.clienteS3) {
      try {
        const comando = new PutObjectCommand({
          Bucket: this.nombreBucket,
          Key: nombreArchivo,
          Body: archivo.buffer,
          ContentType: archivo.mimetype || "image/webp",
        });

        await this.clienteS3.send(comando);
        const urlPublica = `${this.dominioPublico}/${nombreArchivo}`;

        this.logger.log(`Imagen subida a Cloudflare R2: ${urlPublica}`);
        const resultado: ResultadoSubida = {
          url: urlPublica,
          clave: nombreArchivo,
          tamano: archivo.size,
          proveedor: "cloudflare_r2",
        };

        await this.registrarArchivoSubido(resultado);
        return resultado;
      } catch (error) {
        this.logger.error("Error al subir a Cloudflare R2:", error);
        throw new BadRequestException({
          codigo: "ERR-ALM-001",
          mensaje: "Fallo de conexión o subida hacia Cloudflare R2",
          detalles: error instanceof Error ? error.message : error,
        });
      }
    }

    // Fallback de desarrollo: Almacenamiento local
    const resultado = await this.subirLocal(archivo, nombreArchivo);
    await this.registrarArchivoSubido(resultado);
    return resultado;
  }

  private async registrarArchivoSubido(resultado: ResultadoSubida): Promise<void> {
    try {
      await this.archivoRepo.save({
        clave: resultado.clave,
        tamanoBytes: resultado.tamano,
        url: resultado.url,
        proveedor: resultado.proveedor,
      });
    } catch (error) {
      this.logger.warn(`No se pudo registrar metadatos de archivo ${resultado.clave}:`, error);
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
