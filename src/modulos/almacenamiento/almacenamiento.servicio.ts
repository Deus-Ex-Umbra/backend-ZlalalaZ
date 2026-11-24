import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import * as fs from "fs";
import * as path from "path";
import { ArchivoAlmacenamiento } from "./entidades/archivo-almacenamiento.entidad";

export interface ResultadoSubida {
  url: string;
  clave: string;
  tamano: number;
  proveedor: string;
  verificado: boolean;
}

export interface ResultadoVerificacionImagen {
  accesible: boolean;
  proveedor?: string;
  tamano?: number;
  motivo?: string;
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

        // Respaldo bidireccional entre endpoint estándar R2 y jurisdicción US (.us.r2.cloudflarestorage.com)
        if (this.endpointLimpio) {
          const endpointAlternativo = this.endpointLimpio.includes(
            ".us.r2.cloudflarestorage.com",
          )
            ? this.endpointLimpio.replace(
                ".us.r2.cloudflarestorage.com",
                ".r2.cloudflarestorage.com",
              )
            : this.endpointLimpio.includes(".r2.cloudflarestorage.com")
              ? this.endpointLimpio.replace(
                  ".r2.cloudflarestorage.com",
                  ".us.r2.cloudflarestorage.com",
                )
              : null;

          if (endpointAlternativo) {
            this.clienteS3Alternativo = new S3Client({
              region: this.regionS3,
              endpoint: endpointAlternativo,
              forcePathStyle: true,
              credentials: {
                accessKeyId,
                secretAccessKey,
              },
              requestChecksumCalculation: "WHEN_REQUIRED",
              responseChecksumValidation: "WHEN_REQUIRED",
            });
          }
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
      verificado: buffer.length > 0,
    };
  }

  private contieneHostLocal(urlTexto: string): boolean {
    const limpio = (urlTexto || "").trim().toLowerCase();
    if (!limpio) return false;
    return /(?:^|\/\/)(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(?::\d+)?(?:\/|$)/i.test(
      limpio,
    );
  }

  private resolverOrigenPublico(origenCandidato?: string): string | undefined {
    const candidatos = [
      origenCandidato,
      this.configService.get<string>("BACKEND_PUBLIC_URL"),
      this.configService.get<string>("PUBLIC_URL"),
    ];

    for (const candidatoRaw of candidatos) {
      if (!candidatoRaw) continue;
      const limpio = candidatoRaw.trim();
      if (!limpio || this.contieneHostLocal(limpio)) continue;
      try {
        const urlObj = new URL(limpio);
        if (urlObj.protocol !== "https:" && urlObj.protocol !== "http:") {
          continue;
        }
        const hostBajo = urlObj.hostname.toLowerCase();
        if (
          hostBajo === "localhost" ||
          hostBajo === "127.0.0.1" ||
          hostBajo === "0.0.0.0" ||
          hostBajo === "::1" ||
          hostBajo === "[::1]" ||
          hostBajo.endsWith(".localhost")
        ) {
          continue;
        }
        return urlObj.origin.replace(/\/+$/, "");
      } catch {
        continue;
      }
    }
    return undefined;
  }

  private async verificarObjetoEnR2(
    cliente: S3Client,
    clave: string,
  ): Promise<{ verificado: boolean; tamano: number }> {
    try {
      const respuestaHead = await cliente.send(
        new HeadObjectCommand({
          Bucket: this.nombreBucket,
          Key: clave,
        }),
      );
      const tamano = Number(respuestaHead.ContentLength ?? 0);
      return {
        verificado: tamano > 0,
        tamano,
      };
    } catch (error: unknown) {
      this.logger.warn(
        `[ERR-ALM-005] Fallo HeadObjectCommand al verificar ${clave} en R2: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return { verificado: false, tamano: 0 };
    }
  }

  async verificarUrlPublica(url: string): Promise<boolean> {
    if (!url || this.contieneHostLocal(url)) {
      return false;
    }
    try {
      const controlador = new AbortController();
      const temporizador = setTimeout(() => controlador.abort(), 5000);
      try {
        const respuestaHead = await fetch(url, {
          method: "HEAD",
          signal: controlador.signal,
        });
        const tipoContenidoHead = (
          respuestaHead.headers.get("content-type") || ""
        ).toLowerCase();
        if (respuestaHead.ok && tipoContenidoHead.startsWith("image/")) {
          return true;
        }

        const respuestaGet = await fetch(url, {
          method: "GET",
          headers: { Range: "bytes=0-0" },
          signal: controlador.signal,
        });
        const tipoContenidoGet = (
          respuestaGet.headers.get("content-type") || ""
        ).toLowerCase();
        return (
          (respuestaGet.ok || respuestaGet.status === 206) &&
          tipoContenidoGet.startsWith("image/")
        );
      } finally {
        clearTimeout(temporizador);
      }
    } catch (error: unknown) {
      this.logger.warn(
        `[ERR-ALM-005] No se pudo verificar URL pública ${url}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return false;
    }
  }

  /**
   * Sube una imagen de calzado aplicando siempre Compresión Nivel 3 fija (WebP)
   * al almacenamiento en la nube S3/R2 o al respaldo seguro Serverless/Local.
   */
  async subirImagenCalzado(
    archivo: Express.Multer.File,
    subcarpeta: string = "calzados",
    origenPublico?: string,
  ): Promise<ResultadoSubida> {
    if (!archivo || !archivo.buffer) {
      throw new BadRequestException({
        codigo: "ERR-ALM-002",
        mensaje: "No se ha proporcionado ningún archivo para subir",
      });
    }

    const subcarpetaLimpia =
      subcarpeta.replace(/[^a-zA-Z0-9_-]/g, "").trim() || "calzados";
    const optimizado = await this.comprimirImagenNivel3(archivo.buffer);
    const nombreArchivo = `${subcarpetaLimpia}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}${optimizado.extension}`;

    // Si el proveedor es nube y el cliente S3/R2 está listo, intenta subir al bucket y verificar con HeadObjectCommand
    if (this.esNube && this.clienteS3) {
      const comando = new PutObjectCommand({
        Bucket: this.nombreBucket,
        Key: nombreArchivo,
        Body: optimizado.buffer,
        ContentType: optimizado.mimetype,
      });

      let verificadoEnR2 = false;
      try {
        await this.clienteS3.send(comando);
        const verificacionPrimaria = await this.verificarObjetoEnR2(
          this.clienteS3,
          nombreArchivo,
        );
        if (verificacionPrimaria.verificado) {
          verificadoEnR2 = true;
        } else {
          this.logger.warn(
            `[ERR-ALM-005] PutObjectCommand completó en cliente primario pero HeadObjectCommand devolvió tamaño 0 para ${nombreArchivo}.`,
          );
        }
      } catch (errorPrimario: unknown) {
        this.logger.warn(
          `Fallo subida primaria a S3/R2 (${this.endpointLimpio}): ${
            errorPrimario instanceof Error
              ? errorPrimario.message
              : String(errorPrimario)
          }`,
        );
      }

      if (!verificadoEnR2 && this.clienteS3Alternativo) {
        try {
          await this.clienteS3Alternativo.send(comando);
          const verificacionAlternativa = await this.verificarObjetoEnR2(
            this.clienteS3Alternativo,
            nombreArchivo,
          );
          if (verificacionAlternativa.verificado) {
            verificadoEnR2 = true;
          } else {
            this.logger.warn(
              `[ERR-ALM-005] PutObjectCommand completó en cliente secundario pero HeadObjectCommand devolvió tamaño 0 para ${nombreArchivo}.`,
            );
          }
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

      if (verificadoEnR2) {
        const proveedorNombre =
          this.proveedor === "cloudflare_r2" || this.proveedor === "r2"
            ? "cloudflare_r2"
            : "s3";

        const esEndpointPrivadoR2 = Boolean(
          this.endpointLimpio &&
            this.endpointLimpio.includes("r2.cloudflarestorage.com"),
        );

        let urlPublica = "";
        if (this.dominioPublico && !this.contieneHostLocal(this.dominioPublico)) {
          const candidatoDominio = `${this.dominioPublico.replace(/\/+$/, "")}/${nombreArchivo}`;
          const dominioVerificado = await this.verificarUrlPublica(
            candidatoDominio,
          );
          if (dominioVerificado) {
            urlPublica = candidatoDominio;
          } else {
            this.logger.warn(
              `[ERR-ALM-005] R2_PUBLIC_DOMAIN (${candidatoDominio}) no respondió como imagen pública accesible; se utilizará ruta proxy HTTP del backend.`,
            );
          }
        }

        if (!urlPublica) {
          const origenValido = this.resolverOrigenPublico(origenPublico);
          if (origenValido) {
            urlPublica = `${origenValido}/api/v1/almacenamiento/archivo/${nombreArchivo}`;
          } else if (!esEndpointPrivadoR2 && this.endpointLimpio) {
            const candidatoS3 = `${this.endpointLimpio}/${this.nombreBucket}/${nombreArchivo}`;
            if (await this.verificarUrlPublica(candidatoS3)) {
              urlPublica = candidatoS3;
            }
          }
        }

        if (!urlPublica) {
          urlPublica = `data:${optimizado.mimetype};base64,${optimizado.buffer.toString("base64")}`;
        }

        const resultado: ResultadoSubida = {
          url: urlPublica,
          clave: nombreArchivo,
          tamano: optimizado.buffer.length,
          proveedor: proveedorNombre,
          verificado: true,
        };

        await this.registrarArchivoSubido(resultado);
        return resultado;
      }
    }

    // Modo de respaldo: Serverless (Vercel) o Local
    return this.subirLocalORespaldo(
      optimizado.buffer,
      optimizado.mimetype,
      nombreArchivo,
      origenPublico,
    );
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
    origenPublico?: string,
  ): Promise<ResultadoSubida> {
    const esEntornoServerless =
      Boolean(process.env.VERCEL) ||
      Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
      process.env.NODE_ENV === "production";
    const origenValido = this.resolverOrigenPublico(origenPublico);

    if (esEntornoServerless) {
      // En Vercel Serverless nunca devolver http://localhost:3001 ni lanzar EROFS
      try {
        const rutaTmp = path.join("/tmp", "uploads", nombreArchivo);
        fs.mkdirSync(path.dirname(rutaTmp), { recursive: true });
        fs.writeFileSync(rutaTmp, buffer);
      } catch {
        // Ignorar si /tmp no está disponible
      }

      if (origenValido) {
        const dataUri = `data:${mimetype || "image/webp"};base64,${buffer.toString("base64")}`;
        try {
          await this.archivoRepo.save({
            clave: nombreArchivo,
            tamanoBytes: buffer.length,
            url: dataUri,
            proveedor: "bd_almacenamiento_webp",
          });
          return {
            url: `${origenValido}/api/v1/almacenamiento/archivo/${nombreArchivo}`,
            clave: nombreArchivo,
            tamano: buffer.length,
            proveedor: "bd_almacenamiento_webp",
            verificado: buffer.length > 0,
          };
        } catch (errorBd: unknown) {
          this.logger.warn(
            `No se pudo guardar respaldo WebP en archivos_almacenamiento (${nombreArchivo}): ${
              errorBd instanceof Error ? errorBd.message : String(errorBd)
            }`,
          );
        }
      }

      const respaldoInline = this.generarDataUriRespaldo(
        buffer,
        mimetype,
        nombreArchivo,
        "vercel_inline_webp",
      );
      await this.registrarArchivoSubido(respaldoInline);
      return respaldoInline;
    }

    try {
      const rutaBase = path.join(process.cwd(), "uploads");
      const rutaDestino = path.join(rutaBase, nombreArchivo);
      const carpetaDestino = path.dirname(rutaDestino);

      if (!fs.existsSync(carpetaDestino)) {
        fs.mkdirSync(carpetaDestino, { recursive: true });
      }

      fs.writeFileSync(rutaDestino, buffer);

      if (origenValido) {
        const dataUri = `data:${mimetype || "image/webp"};base64,${buffer.toString("base64")}`;
        try {
          await this.archivoRepo.save({
            clave: nombreArchivo,
            tamanoBytes: buffer.length,
            url: dataUri,
            proveedor: "bd_almacenamiento_webp",
          });
        } catch {
          // Si falla BD, el archivo ya existe en uploads/ local
        }
        const urlPublica = `${origenValido}/api/v1/almacenamiento/archivo/${nombreArchivo}`;
        this.logger.log(`Imagen WebP Nivel 3 guardada localmente: ${urlPublica}`);
        return {
          url: urlPublica,
          clave: nombreArchivo,
          tamano: buffer.length,
          proveedor: "local",
          verificado: buffer.length > 0,
        };
      }

      this.logger.log(
        `Imagen WebP Nivel 3 guardada en respaldo inline (${nombreArchivo}) para evitar enlaces localhost.`,
      );
      const respaldoLocal = this.generarDataUriRespaldo(
        buffer,
        mimetype,
        nombreArchivo,
        "inline_webp_n3",
      );
      await this.registrarArchivoSubido(respaldoLocal);
      return respaldoLocal;
    } catch (errorFs: unknown) {
      this.logger.warn(
        `Sistema de archivos local de solo lectura o inaccesible (${
          errorFs instanceof Error ? errorFs.message : String(errorFs)
        }), retornando Data URI WebP Nivel 3.`,
      );
      const respaldoError = this.generarDataUriRespaldo(
        buffer,
        mimetype,
        nombreArchivo,
        "inline_webp_n3",
      );
      await this.registrarArchivoSubido(respaldoError);
      return respaldoError;
    }
  }

  private deducirMimePorExtension(clave: string): string {
    const limpio = clave.toLowerCase();
    if (limpio.endsWith(".png")) return "image/png";
    if (limpio.endsWith(".jpg") || limpio.endsWith(".jpeg")) return "image/jpeg";
    if (limpio.endsWith(".avif")) return "image/avif";
    if (limpio.endsWith(".gif")) return "image/gif";
    return "image/webp";
  }

  private sanitizarClaveArchivo(claveBruta: string): string {
    const decodificada = decodeURIComponent(claveBruta || "").trim();
    const normalizada = decodificada.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
    if (!normalizada || normalizada.includes("..")) {
      throw new BadRequestException({
        codigo: "ERR-ALM-002",
        mensaje: "La clave de archivo solicitada no es válida",
      });
    }
    return normalizada;
  }

  private async cuerpoS3ABuffer(cuerpo: unknown): Promise<Buffer | null> {
    if (!cuerpo) return null;
    if (Buffer.isBuffer(cuerpo)) return cuerpo;
    if (cuerpo instanceof Uint8Array) return Buffer.from(cuerpo);

    const conTransform = cuerpo as {
      transformToByteArray?: () => Promise<Uint8Array>;
    };
    if (typeof conTransform.transformToByteArray === "function") {
      const bytes = await conTransform.transformToByteArray();
      return Buffer.from(bytes);
    }

    const iterable = cuerpo as AsyncIterable<Uint8Array>;
    if (typeof iterable[Symbol.asyncIterator] === "function") {
      const trozos: Buffer[] = [];
      for await (const trozo of iterable) {
        trozos.push(Buffer.from(trozo));
      }
      return Buffer.concat(trozos);
    }

    return null;
  }

  /**
   * Obtiene el binario de una imagen almacenada en R2, en la tabla archivos_almacenamiento
   * (si se guardó como Data URI de respaldo) o en disco (/tmp/uploads o uploads/).
   */
  async obtenerImagenArchivo(
    clave: string,
  ): Promise<{ buffer: Buffer; mimetype: string }> {
    const claveLimpia = this.sanitizarClaveArchivo(clave);
    const mimePorDefecto = this.deducirMimePorExtension(claveLimpia);

    if (this.esNube && this.clienteS3) {
      const clientes = [
        this.clienteS3,
        ...(this.clienteS3Alternativo ? [this.clienteS3Alternativo] : []),
      ];
      for (const cliente of clientes) {
        try {
          const respuestaGet = await cliente.send(
            new GetObjectCommand({
              Bucket: this.nombreBucket,
              Key: claveLimpia,
            }),
          );
          const bufferR2 = await this.cuerpoS3ABuffer(respuestaGet.Body);
          if (bufferR2 && bufferR2.length > 0) {
            return {
              buffer: bufferR2,
              mimetype: respuestaGet.ContentType || mimePorDefecto,
            };
          }
        } catch {
          // Intentar siguiente cliente o respaldo en BD/disco
        }
      }
    }

    try {
      const registro = await this.archivoRepo.findOne({
        where: { clave: claveLimpia },
      });
      if (registro?.url && registro.url.startsWith("data:image/")) {
        const coincidencia = registro.url.match(
          /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/,
        );
        if (coincidencia) {
          const bufferBd = Buffer.from(coincidencia[2], "base64");
          if (bufferBd.length > 0) {
            return {
              buffer: bufferBd,
              mimetype: coincidencia[1] || mimePorDefecto,
            };
          }
        }
      }
    } catch {
      // Continuar con búsqueda en disco local
    }

    const basesLocales = [
      path.resolve("/tmp", "uploads"),
      path.resolve(process.cwd(), "uploads"),
    ];
    for (const base of basesLocales) {
      const rutaCandidata = path.resolve(base, claveLimpia);
      if (
        rutaCandidata.startsWith(base) &&
        fs.existsSync(rutaCandidata)
      ) {
        const bufferDisco = fs.readFileSync(rutaCandidata);
        if (bufferDisco.length > 0) {
          return {
            buffer: bufferDisco,
            mimetype: mimePorDefecto,
          };
        }
      }
    }

    throw new NotFoundException({
      codigo: "ERR-ALM-002",
      mensaje: `No se encontró el archivo de imagen solicitado (${claveLimpia})`,
    });
  }

  /**
   * Verifica de manera real si una URL de imagen existe y es accesible.
   */
  async verificarExistenciaImagen(
    url: string,
  ): Promise<ResultadoVerificacionImagen> {
    const urlLimpia = (url || "").trim();
    if (!urlLimpia) {
      return {
        accesible: false,
        motivo: "La URL de la imagen está vacía",
      };
    }

    if (this.contieneHostLocal(urlLimpia)) {
      return {
        accesible: false,
        motivo:
          "Las URLs que apuntan a localhost no son accesibles desde otros dispositivos ni en producción",
      };
    }

    if (urlLimpia.startsWith("data:image/")) {
      const coincidencia = urlLimpia.match(
        /^data:image\/(jpeg|jpg|png|webp|avif|gif);base64,([A-Za-z0-9+/=\s]+)$/i,
      );
      if (!coincidencia) {
        return {
          accesible: false,
          proveedor: "inline_data_uri",
          motivo: "El formato del Data URI de imagen no es válido",
        };
      }
      const buffer = Buffer.from(coincidencia[2], "base64");
      if (buffer.length === 0) {
        return {
          accesible: false,
          proveedor: "inline_data_uri",
          tamano: 0,
          motivo: "El Data URI base64 está vacío",
        };
      }
      return {
        accesible: true,
        proveedor: "inline_data_uri",
        tamano: buffer.length,
      };
    }

    const coincidenciaProxy = urlLimpia.match(
      /\/api\/v1\/almacenamiento\/archivo\/([^/?#]+)\/([^/?#]+)$/i,
    );
    if (coincidenciaProxy) {
      const clave = `${decodeURIComponent(coincidenciaProxy[1])}/${decodeURIComponent(coincidenciaProxy[2])}`;

      if (this.esNube && this.clienteS3) {
        const verificacionPrimaria = await this.verificarObjetoEnR2(
          this.clienteS3,
          clave,
        );
        if (verificacionPrimaria.verificado) {
          return {
            accesible: true,
            proveedor: "cloudflare_r2",
            tamano: verificacionPrimaria.tamano,
          };
        }
        if (this.clienteS3Alternativo) {
          const verificacionAlt = await this.verificarObjetoEnR2(
            this.clienteS3Alternativo,
            clave,
          );
          if (verificacionAlt.verificado) {
            return {
              accesible: true,
              proveedor: "cloudflare_r2",
              tamano: verificacionAlt.tamano,
            };
          }
        }
      }

      try {
        const registro = await this.archivoRepo.findOne({
          where: { clave },
        });
        if (registro && Number(registro.tamanoBytes) > 0) {
          return {
            accesible: true,
            proveedor: registro.proveedor || "bd_almacenamiento",
            tamano: Number(registro.tamanoBytes),
          };
        }
      } catch {
        // Continuar con disco
      }

      const basesLocales = [
        path.resolve("/tmp", "uploads"),
        path.resolve(process.cwd(), "uploads"),
      ];
      for (const base of basesLocales) {
        const rutaCandidata = path.resolve(base, clave);
        if (rutaCandidata.startsWith(base) && fs.existsSync(rutaCandidata)) {
          const estadisticas = fs.statSync(rutaCandidata);
          if (estadisticas.size > 0) {
            return {
              accesible: true,
              proveedor: "local",
              tamano: estadisticas.size,
            };
          }
        }
      }

      return {
        accesible: false,
        motivo: `El archivo ${clave} no fue encontrado en R2 ni en respaldo local`,
      };
    }

    if (/^https?:\/\//i.test(urlLimpia)) {
      const esAccesible = await this.verificarUrlPublica(urlLimpia);
      return esAccesible
        ? { accesible: true, proveedor: "http_publico" }
        : {
            accesible: false,
            proveedor: "http_publico",
            motivo: "La URL pública no respondió con una imagen válida",
          };
    }

    return {
      accesible: false,
      motivo: "Formato de URL de imagen no soportado",
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
