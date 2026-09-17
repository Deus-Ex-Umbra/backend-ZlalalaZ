import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AlmacenamientoServicio } from './almacenamiento.servicio';
import { AlmacenamientoControlador } from './almacenamiento.controlador';

@Module({
  imports: [ConfigModule],
  controllers: [AlmacenamientoControlador],
  providers: [AlmacenamientoServicio],
  exports: [AlmacenamientoServicio],
})
export class AlmacenamientoModulo {}
