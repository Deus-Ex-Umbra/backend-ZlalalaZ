import {
  Controller,
  Get,
  Post,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  AlmacenamientoServicio,
  ResultadoSubida,
  UsoAlmacenamiento,
} from "./almacenamiento.servicio";
import { RespuestaApi } from "../../comun/interfaces/respuesta-api.interfaz";

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
  @UseInterceptors(FileInterceptor("archivo"))
  async subirImagen(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB máx
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    archivo: Express.Multer.File,
  ): Promise<RespuestaApi<ResultadoSubida>> {
    const resultado =
      await this.almacenamientoServicio.subirImagenCalzado(archivo);
    return {
      exito: true,
      mensaje: "Imagen subida exitosamente al almacenamiento optimizado",
      datos: resultado,
      marcaTiempo: new Date().toISOString(),
    };
  }
}
