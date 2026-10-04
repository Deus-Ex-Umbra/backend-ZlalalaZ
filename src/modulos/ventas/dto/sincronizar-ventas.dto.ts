import { IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { CrearVentaDto } from "./crear-venta.dto";

export class SincronizarVentasDto {
  @IsArray({ message: "La lista de ventas debe ser un arreglo" })
  @ValidateNested({ each: true })
  @Type(() => CrearVentaDto)
  ventas: CrearVentaDto[];
}
