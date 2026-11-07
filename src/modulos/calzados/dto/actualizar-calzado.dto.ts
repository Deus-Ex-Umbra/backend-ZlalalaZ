import { IsString, IsNumber, IsOptional, IsEnum, Min, IsArray } from "class-validator";
import { TipoProducto } from "../../../comun/utilidades/normalizacion-catalogo";

export class ActualizarCalzadoDto {
  @IsString()
  @IsOptional()
  nombreProducto?: string;

  @IsString()
  @IsOptional()
  marca?: string;

  @IsEnum(TipoProducto)
  @IsOptional()
  tipoProducto?: TipoProducto;

  @IsString()
  @IsOptional()
  categoria?: string;

  @IsString()
  @IsOptional()
  talla?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  precioCompra?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  precioVenta?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  stockActual?: number;

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
  @Min(0)
  @IsOptional()
  precioPromocion?: number | null;

  @IsString()
  @IsOptional()
  promocionFechaInicio?: string | null;

  @IsString()
  @IsOptional()
  promocionFechaFin?: string | null;

  @IsString()
  @IsOptional()
  promocionMotivo?: string | null;

  @IsNumber()
  @Min(0)
  @IsOptional()
  alertaStockMinimo?: number;
}
