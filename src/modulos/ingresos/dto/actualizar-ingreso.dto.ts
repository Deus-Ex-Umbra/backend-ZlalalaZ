import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  IsIn,
} from "class-validator";

export class ActualizarIngresoDto {
  @IsString({ message: "La fecha de ingreso debe ser texto" })
  @IsOptional()
  fechaIngreso?: string; // YYYY-MM-DD

  @IsString({ message: "El código de producto debe ser texto" })
  @IsOptional()
  codigoProducto?: string; // Ej: P-1

  @IsNumber({}, { message: "La cantidad debe ser numérica" })
  @Min(1, { message: "La cantidad mínima es 1" })
  @IsOptional()
  cantidad?: number;

  @IsString({ message: "El nombre del proveedor debe ser texto" })
  @IsOptional()
  proveedor?: string;

  @IsNumber({}, { message: "El precio de compra unitario debe ser numérico" })
  @Min(0.01, { message: "El precio de compra unitario debe ser mayor a 0" })
  @IsOptional()
  precioCompraUnitario?: number;

  @IsNumber({}, { message: "El precio de venta unitario debe ser numérico" })
  @Min(0, { message: "El precio de venta unitario no puede ser negativo" })
  @IsOptional()
  precioVentaUnitario?: number;

  @IsString()
  @IsOptional()
  talla?: string;

  @IsString()
  @IsOptional()
  notas?: string;

  @IsOptional()
  @IsIn([
    "ACTUALIZAR_NO_VENDIDOS",
    "ACTUALIZAR_MODELO_COMPLETO",
    "CREAR_VARIANTE_NUEVO_PRECIO",
  ], {
    message: "El modo de actualización de precio no es válido",
  })
  modoActualizacionPrecio?:
    | "ACTUALIZAR_NO_VENDIDOS"
    | "ACTUALIZAR_MODELO_COMPLETO"
    | "CREAR_VARIANTE_NUEVO_PRECIO";
}
