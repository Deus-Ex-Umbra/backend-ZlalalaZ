import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Usuario } from "./entidades/usuario.entidad";
import { UsuariosServicio } from "./usuarios.servicio";
import { UsuariosControlador } from "./usuarios.controlador";

@Module({
  imports: [TypeOrmModule.forFeature([Usuario])],
  controllers: [UsuariosControlador],
  providers: [UsuariosServicio],
  exports: [UsuariosServicio, TypeOrmModule],
})
export class UsuariosModulo {}
