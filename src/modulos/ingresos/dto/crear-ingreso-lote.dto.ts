import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  IsIn,
  IsArray,
  IsObject,
  ArrayMinSize,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { DesglosePagoIngresoItem } from "../entidades/ingreso-mercancia.entidad";

export class ItemIngresoLoteDto {
  @IsString({ message: "El código de producto es obligatorio" })
  @IsNotEmpty({ message: "El código de producto no puede estar vacío" })
  codigoProducto: string;

  @IsString()
  @IsOptional()
  talla?: string;

  @IsObject({ message: "La curva de tallas debe ser un objeto válido" })
  @IsOptional()
  curvaTallas?: Record<string, number>;

  @IsNumber({}, { message: "La cantidad debe ser numérica" })
  @Min(1, { message: "La cantidad mínima es 1" })
  @IsOptional()
  cantidad?: number;

  @IsNumber({}, { message: "El precio de compra unitario debe ser numérico" })
  @Min(0, { message: "El precio de compra unitario no puede ser negativo" })
  @IsOptional()
  precioCompraUnitario?: number;

  @IsNumber({}, { message: "El precio de venta unitario debe ser numérico" })
  @Min(0, { message: "El precio de venta unitario no puede ser negativo" })
  @IsOptional()
  precioVentaUnitario?: number;

  @IsOptional()
  @IsIn(
    [
      "ACTUALIZAR_NO_VENDIDOS",
      "ACTUALIZAR_MODELO_COMPLETO",
      "CREAR_VARIANTE_NUEVO_PRECIO",
    ],
    {
      message: "El modo de actualización de precio no es válido",
    },
  )
  modoActualizacionPrecio?:
    | "ACTUALIZAR_NO_VENDIDOS"
    | "ACTUALIZAR_MODELO_COMPLETO"
    | "CREAR_VARIANTE_NUEVO_PRECIO";
}

export class CrearIngresoLoteDto {
  @IsString({ message: "La fecha de ingreso debe ser texto" })
  @IsOptional()
  fechaIngreso?: string;

  @IsString()
  @IsOptional()
  proveedorId?: string;

  @IsString()
  @IsOptional()
  proveedor?: string;

  @IsString()
  @IsOptional()
  formaPago?: string;

  @IsArray()
  @IsOptional()
  desglosePagos?: DesglosePagoIngresoItem[] | null;

  @IsString()
  @IsOptional()
  notas?: string;

  @IsArray({ message: "Debe proporcionar la lista de calzados del lote" })
  @ArrayMinSize(1, {
    message: "El lote de ingreso debe incluir al menos un calzado",
  })
  @ValidateNested({ each: true })
  @Type(() => ItemIngresoLoteDto)
  items: ItemIngresoLoteDto[];
}
