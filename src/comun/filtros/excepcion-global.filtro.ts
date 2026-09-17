import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { RespuestaApi } from '../interfaces/respuesta-api.interfaz';

@Catch()
export class FiltroExcepcionGlobal implements ExceptionFilter {
  private readonly logger = new Logger(FiltroExcepcionGlobal.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let estado = HttpStatus.INTERNAL_SERVER_ERROR;
    let mensaje = 'Error interno en el servidor';
    let codigo = 'ERR-SERV-500';
    let detalles: unknown = null;

    if (exception instanceof HttpException) {
      estado = exception.getStatus();
      const respuestaHttp = exception.getResponse();

      if (typeof respuestaHttp === 'string') {
        mensaje = respuestaHttp;
      } else if (typeof respuestaHttp === 'object' && respuestaHttp !== null) {
        const respuestaObj = respuestaHttp as Record<string, unknown>;
        mensaje = (respuestaObj.message as string) || exception.message;
        detalles = respuestaObj.detalles || respuestaObj.message;
        codigo = (respuestaObj.codigo as string) || `ERR-HTTP-${estado}`;
      }
    } else if (exception instanceof Error) {
      mensaje = exception.message;
      detalles = exception.stack;
    }

    this.logger.error(
      `[${request.method}] ${request.url} - Estado: ${estado} - Código: ${codigo} - Mensaje: ${mensaje}`,
    );

    const cuerpoRespuesta: RespuestaApi = {
      exito: false,
      error: {
        codigo,
        mensaje,
        detalles: process.env.NODE_ENV === 'development' ? detalles : undefined,
      },
      marcaTiempo: new Date().toISOString(),
    };

    response.status(estado).json(cuerpoRespuesta);
  }
}
