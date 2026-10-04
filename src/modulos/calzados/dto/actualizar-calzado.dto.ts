import { IsString, IsNumber, IsOptional, IsEnum, Min } from "class-validator";
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
  @IsOptional()
  stockActual?: number;

  @IsString()
  @IsOptional()
  fotoUrl?: string;

  @IsNumber()
  @IsOptional()
  alertaStockMinimo?: number;
}
