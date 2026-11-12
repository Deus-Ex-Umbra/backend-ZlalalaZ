import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Cliente } from "./entidades/cliente.entidad";
import { Venta } from "../ventas/entidades/venta.entidad";
import { ClientesServicio } from "./clientes.servicio";
import { ClientesControlador } from "./clientes.controlador";

@Module({
  imports: [TypeOrmModule.forFeature([Cliente, Venta])],
  controllers: [ClientesControlador],
  providers: [ClientesServicio],
  exports: [ClientesServicio],
})
export class ClientesModulo {}
