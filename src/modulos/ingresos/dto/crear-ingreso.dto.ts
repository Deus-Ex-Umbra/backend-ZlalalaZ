import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  IsIn,
} from "class-validator";

export class CrearIngresoDto {
  @IsString({ message: "La fecha de ingreso es requerida" })
  @IsNotEmpty()
  fechaIngreso: string; // YYYY-MM-DD

  @IsString({ message: "El código de producto es obligatorio" })
  @IsNotEmpty()
  codigoProducto: string; // Ej: P001

  @IsNumber({}, { message: "La cantidad debe ser numérica" })
  @Min(1, { message: "La cantidad mínima es 1" })
  cantidad: number;

  @IsString({ message: "El nombre del proveedor es obligatorio" })
  @IsNotEmpty()
  proveedor: string;

  @IsNumber({}, { message: "El precio de compra unitario debe ser numérico" })
  @Min(0.01, { message: "El precio de compra unitario debe ser mayor a 0" })
  precioCompraUnitario: number;

  @IsNumber({}, { message: "El precio de venta unitario debe ser numérico" })
  @Min(0, { message: "El precio de venta unitario no puede ser negativo" })
  precioVentaUnitario: number;

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
