import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
  IsArray,
  IsBoolean,
  IsObject,
} from "class-validator";
import {
  ExtraIncluidoItem,
  TipoProducto,
} from "../../../comun/utilidades/normalizacion-catalogo";

export class CrearCalzadoDto {
  @IsString({ message: "El código de producto debe ser texto" })
  @IsNotEmpty({ message: "El código de producto es obligatorio" })
  codigoProducto: string; // Ej: P-1

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
  talla?: string; // Ej: "38" o "35, 38"

  @IsObject()
  @IsOptional()
  stockPorTalla?: Record<string, number> | null;

  @IsString()
  @IsOptional()
  segmentoTalla?: string | null;

  @IsString()
  @IsOptional()
  color?: string; // Ej: Blanco, Verde+Rojo+Amarillo, Arcoíris

  @IsNumber({}, { message: "El precio de compra debe ser numérico" })
  @Min(0, { message: "El precio de compra no puede ser negativo" })
  @IsOptional()
  precioCompra?: number;

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

  @IsBoolean()
  @IsOptional()
  esExtra?: boolean;

  @IsArray()
  @IsOptional()
  extrasIncluidos?: ExtraIncluidoItem[] | null;

  @IsNumber()
  @IsOptional()
  alertaStockMinimo?: number;
}
