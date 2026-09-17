import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Calzado } from './entidades/calzado.entidad';
import { CalzadosServicio } from './calzados.servicio';
import { CalzadosControlador } from './calzados.controlador';

@Module({
  imports: [TypeOrmModule.forFeature([Calzado])],
  controllers: [CalzadosControlador],
  providers: [CalzadosServicio],
  exports: [CalzadosServicio],
})
export class CalzadosModulo {}
