import { Controller, Get, Param } from '@nestjs/common';
import { PanelCentralServicio } from './panel-central.servicio';
import { RespuestaApi } from '../../comun/interfaces/respuesta-api.interfaz';

@Controller('panel-central')
export class PanelCentralControlador {
  constructor(private readonly panelCentralServicio: PanelCentralServicio) {}

  @Get('metricas')
  async obtenerMetricas(): Promise<RespuestaApi> {
    const datos = await this.panelCentralServicio.obtenerMetricas();
    return {
      exito: true,
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Get('consulta/:codigo')
  async consultarProducto(@Param('codigo') codigo: string): Promise<RespuestaApi> {
    const datos = await this.panelCentralServicio.consultarFichaProducto(codigo);
    return {
      exito: true,
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }
}
