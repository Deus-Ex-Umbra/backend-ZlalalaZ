import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
  IsArray,
} from "class-validator";
import { TipoProducto } from "../../../comun/utilidades/normalizacion-catalogo";

export class CrearCalzadoDto {
  @IsString({ message: "El código de producto debe ser texto" })
  @IsNotEmpty({ message: "El código de producto es obligatorio" })
  codigoProducto: string; // Ej: P001

  @IsString({ message: "El nombre del producto debe ser texto" })
  @IsNotEmpty({ message: "El nombre del calzado es obligatorio" })
  nombreProducto: string; // Ej: Nike Air Force One

  @IsString()
  @IsOptional()
  marca?: string; // Si se omite se deduce del nombre

  @IsEnum(TipoProducto, {
    message: "El tipo de producto debe ser CALZADO o ACCESORIO",
  })
  @IsOptional()
  tipoProducto?: TipoProducto; // Si se omite se deduce del nombre

  @IsString()
  @IsOptional()
  categoria?: string; // Ej: Lifestyle

  @IsString({ message: "La talla debe ser texto" })
  @IsOptional()
  talla?: string; // Ej: 38. Obligatoria para calzado; los accesorios usan "Única"

  @IsString()
  @IsOptional()
  color?: string; // Ej: Blanco

  @IsNumber({}, { message: "El precio de compra debe ser numérico" })
  @Min(0, { message: "El precio de compra no puede ser negativo" })
  precioCompra: number;

  @IsNumber({}, { message: "El precio de venta debe ser numérico" })
  @Min(0, { message: "El precio de venta no puede ser negativo" })
  precioVenta: number;

  @IsNumber({}, { message: "El stock inicial debe ser numérico" })
  @Min(0, { message: "El stock inicial no puede ser negativo" })
  @IsOptional()
  stockInicial?: number;

  @IsString()
  @IsOptional()
  fotoUrl?: string;

  @IsString({ each: true })
  @IsArray()
  @IsOptional()
  fotosGaleria?: string[];

  @IsString()
  @IsOptional()
  extras?: string;

  @IsNumber()
  @IsOptional()
  alertaStockMinimo?: number;
}
