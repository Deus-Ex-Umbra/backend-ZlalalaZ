import {
  Controller,
  Get,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  AlmacenamientoServicio,
  ResultadoSubida,
  UsoAlmacenamiento,
} from "./almacenamiento.servicio";
import { RespuestaApi } from "../../comun/interfaces/respuesta-api.interfaz";

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

  @Post("subir-imagen")
  @UseInterceptors(
    FileInterceptor("archivo", {
      limits: { fileSize: TAMANO_MAXIMO_BYTES },
    }),
  )
  async subirImagen(
    @UploadedFile() archivo: Express.Multer.File,
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

    const resultado =
      await this.almacenamientoServicio.subirImagenCalzado(archivo);
    return {
      exito: true,
      mensaje: "Imagen subida y comprimida en Nivel 3 exitosamente",
      datos: resultado,
      marcaTiempo: new Date().toISOString(),
    };
  }
}
