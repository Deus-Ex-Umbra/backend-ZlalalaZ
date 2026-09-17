import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Venta } from './entidades/venta.entidad';
import { DetalleVenta } from './entidades/detalle-venta.entidad';
import { Calzado } from '../calzados/entidades/calzado.entidad';
import { VentasServicio } from './ventas.servicio';
import { VentasControlador } from './ventas.controlador';

@Module({
  imports: [TypeOrmModule.forFeature([Venta, DetalleVenta, Calzado])],
  controllers: [VentasControlador],
  providers: [VentasServicio],
  exports: [VentasServicio],
})
export class VentasModulo {}
