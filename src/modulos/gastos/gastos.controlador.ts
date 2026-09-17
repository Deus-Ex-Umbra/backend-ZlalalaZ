import { Controller, Get, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { GastosServicio } from './gastos.servicio';
import { CrearGastoDto } from './dto/crear-gasto.dto';
import { RespuestaApi } from '../../comun/interfaces/respuesta-api.interfaz';

@Controller('gastos')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class GastosControlador {
  constructor(private readonly gastosServicio: GastosServicio) {}

  @Get()
  async obtenerTodos(): Promise<RespuestaApi> {
    const datos = await this.gastosServicio.obtenerTodos();
    return {
      exito: true,
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Post()
  async registrar(@Body() dto: CrearGastoDto): Promise<RespuestaApi> {
    const datos = await this.gastosServicio.registrar(dto);
    return {
      exito: true,
      mensaje: 'Gasto de caja chica registrado exitosamente',
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }
}
