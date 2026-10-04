import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GastoCajaChica } from "./entidades/gasto-caja-chica.entidad";
import { GastosServicio } from "./gastos.servicio";
import { GastosControlador } from "./gastos.controlador";

@Module({
  imports: [TypeOrmModule.forFeature([GastoCajaChica])],
  controllers: [GastosControlador],
  providers: [GastosServicio],
  exports: [GastosServicio],
})
export class GastosModulo {}
