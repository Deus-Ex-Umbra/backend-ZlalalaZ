import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { IsString, IsNotEmpty } from "class-validator";
import { Request, Response } from "express";
import {
  AlmacenamientoServicio,
  ResultadoSubida,
  ResultadoVerificacionImagen,
  UsoAlmacenamiento,
} from "./almacenamiento.servicio";
import { RespuestaApi } from "../../comun/interfaces/respuesta-api.interfaz";

export class VerificarImagenAlmacenamientoDto {
  @IsString({ message: "La URL de la imagen debe ser texto" })
  @IsNotEmpty({ message: "La URL de la imagen es obligatoria" })
  url: string;
}

const MIMETYPES_PERMITIDOS = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

const TAMANO_MAXIMO_BYTES = 10 * 1024 * 1024; // 10MB pre-compresión

@Controller("almacenamiento")
export class AlmacenamientoControlador {
  constructor(
    private readonly almacenamientoServicio: AlmacenamientoServicio,
  ) {}

  private extraerOrigenPublicoDePeticion(peticion: Request): string | undefined {
    const protoCabecera = peticion.headers["x-forwarded-proto"];
    const protoBruto = Array.isArray(protoCabecera)
      ? protoCabecera[0]
      : protoCabecera;
    const protocolo = (
      protoBruto
        ? protoBruto.split(",")[0].trim()
        : peticion.protocol || "https"
    )
      .replace(/:$/, "")
      .toLowerCase();

    const hostCabecera =
      peticion.headers["x-forwarded-host"] ||
      (typeof peticion.get === "function"
        ? peticion.get("host")
        : peticion.headers["host"]);
    const hostBruto = Array.isArray(hostCabecera)
      ? hostCabecera[0]
      : hostCabecera;
    const host = hostBruto ? hostBruto.split(",")[0].trim() : "";

    if (
      host &&
      !/^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(?::\d+)?$/i.test(host)
    ) {
      return `${protocolo === "http" ? "http" : "https"}://${host}`;
    }

    const origenEntorno =
      process.env.BACKEND_PUBLIC_URL || process.env.PUBLIC_URL;
    if (
      origenEntorno &&
      !/localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(origenEntorno)
    ) {
      return origenEntorno.trim().replace(/\/+$/, "");
    }

    return undefined;
  }

  @Get("uso")
  async obtenerUso(): Promise<RespuestaApi<UsoAlmacenamiento>> {
    const datos = await this.almacenamientoServicio.obtenerUsoEspacio();
    return {
      exito: true,
      mensaje: "Métricas de uso de almacenamiento obtenidas con éxito",
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Get("archivo/:subcarpeta/:nombre")
  async obtenerArchivoPublico(
    @Param("subcarpeta") subcarpeta: string,
    @Param("nombre") nombre: string,
    @Res() respuesta: Response,
  ): Promise<void> {
    const clave = `${subcarpeta}/${nombre}`;
    const archivo =
      await this.almacenamientoServicio.obtenerImagenArchivo(clave);

    respuesta.setHeader("Content-Type", archivo.mimetype || "image/webp");
    respuesta.setHeader("Content-Length", String(archivo.buffer.length));
    respuesta.setHeader(
      "Cache-Control",
      "public, max-age=31536000, immutable",
    );
    respuesta.setHeader("Access-Control-Allow-Origin", "*");
    respuesta.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    respuesta.status(200).send(archivo.buffer);
  }

  @Post("verificar")
  async verificarImagen(
    @Body() dto: VerificarImagenAlmacenamientoDto,
  ): Promise<RespuestaApi<ResultadoVerificacionImagen>> {
    const datos = await this.almacenamientoServicio.verificarExistenciaImagen(
      dto.url,
    );
    return {
      exito: true,
      mensaje: datos.accesible
        ? "Imagen verificada y accesible"
        : "La imagen no pudo ser verificada",
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Post("subir-imagen")
  @UseInterceptors(
    FileInterceptor("archivo", {
      limits: { fileSize: TAMANO_MAXIMO_BYTES },
    }),
  )
  async subirImagen(
    @UploadedFile() archivo: Express.Multer.File,
    @Req() peticion: Request,
  ): Promise<RespuestaApi<ResultadoSubida>> {
    if (!archivo || !archivo.buffer) {
      throw new BadRequestException({
        codigo: "ERR-ALM-002",
        mensaje: "No se ha proporcionado ningún archivo de imagen válido",
      });
    }

    const mime = (archivo.mimetype || "").toLowerCase().trim();
    if (!MIMETYPES_PERMITIDOS.has(mime)) {
      throw new BadRequestException({
        codigo: "ERR-ALM-003",
        mensaje: `Formato de imagen no soportado (${mime || "desconocido"}). Use JPEG, PNG, WebP, AVIF o GIF.`,
      });
    }

    if (archivo.size > TAMANO_MAXIMO_BYTES) {
      throw new BadRequestException({
        codigo: "ERR-ALM-004",
        mensaje: "La imagen supera el tamaño máximo permitido de 10 MB",
      });
    }

    const origenPublico = this.extraerOrigenPublicoDePeticion(peticion);
    const resultado = await this.almacenamientoServicio.subirImagenCalzado(
      archivo,
      "calzados",
      origenPublico,
    );
    return {
      exito: true,
      mensaje: "Imagen subida y comprimida en Nivel 3 exitosamente",
      datos: resultado,
      marcaTiempo: new Date().toISOString(),
    };
  }
}
