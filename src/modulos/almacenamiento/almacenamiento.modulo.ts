import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AlmacenamientoServicio } from "./almacenamiento.servicio";
import { AlmacenamientoControlador } from "./almacenamiento.controlador";
import { ArchivoAlmacenamiento } from "./entidades/archivo-almacenamiento.entidad";

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([ArchivoAlmacenamiento])],
  controllers: [AlmacenamientoControlador],
  providers: [AlmacenamientoServicio],
  exports: [AlmacenamientoServicio],
})
export class AlmacenamientoModulo {}
