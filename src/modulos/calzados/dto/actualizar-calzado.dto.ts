import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class ActualizarCalzadoDto {
  @IsString()
  @IsOptional()
  nombreProducto?: string;

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
