import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { IngresoMercancia } from "./entidades/ingreso-mercancia.entidad";
import { Calzado } from "../calzados/entidades/calzado.entidad";
import { Proveedor } from "./entidades/proveedor.entidad";
import { IngresosServicio } from "./ingresos.servicio";
import { IngresosControlador } from "./ingresos.controlador";

@Module({
  imports: [TypeOrmModule.forFeature([IngresoMercancia, Calzado, Proveedor])],
  controllers: [IngresosControlador],
  providers: [IngresosServicio],
  exports: [IngresosServicio],
})
export class IngresosModulo {}
