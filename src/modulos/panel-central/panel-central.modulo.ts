import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Calzado } from "../calzados/entidades/calzado.entidad";
import { Venta } from "../ventas/entidades/venta.entidad";
import { DetalleVenta } from "../ventas/entidades/detalle-venta.entidad";
import { IngresoMercancia } from "../ingresos/entidades/ingreso-mercancia.entidad";
import { GastoCajaChica } from "../gastos/entidades/gasto-caja-chica.entidad";
import { PanelCentralServicio } from "./panel-central.servicio";
import { PanelCentralControlador } from "./panel-central.controlador";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Calzado,
      Venta,
      DetalleVenta,
      IngresoMercancia,
      GastoCajaChica,
    ]),
  ],
  controllers: [PanelCentralControlador],
  providers: [PanelCentralServicio],
  exports: [PanelCentralServicio],
})
export class PanelCentralModulo {}
