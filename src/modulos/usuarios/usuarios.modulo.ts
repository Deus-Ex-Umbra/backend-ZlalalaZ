import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Usuario } from "./entidades/usuario.entidad";
import { UsuariosServicio } from "./usuarios.servicio";

@Module({
  imports: [TypeOrmModule.forFeature([Usuario])],
  providers: [UsuariosServicio],
  exports: [UsuariosServicio, TypeOrmModule],
})
export class UsuariosModulo {}
