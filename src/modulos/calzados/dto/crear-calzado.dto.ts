import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class CrearCalzadoDto {
  @IsString({ message: 'El código de producto debe ser texto' })
  @IsNotEmpty({ message: 'El código de producto es obligatorio' })
  codigoProducto: string; // Ej: P001

  @IsString({ message: 'El nombre del producto debe ser texto' })
  @IsNotEmpty({ message: 'El nombre del calzado es obligatorio' })
  nombreProducto: string; // Ej: Nike Air Force One

  @IsString()
  @IsOptional()
  categoria?: string; // Ej: Lifestyle

  @IsString({ message: 'La talla es requerida' })
  @IsNotEmpty({ message: 'Debe especificar una talla' })
  talla: string; // Ej: 38

  @IsString()
  @IsOptional()
  color?: string; // Ej: Blanco

  @IsNumber({}, { message: 'El precio de compra debe ser numérico' })
  @Min(0, { message: 'El precio de compra no puede ser negativo' })
  precioCompra: number;

  @IsNumber({}, { message: 'El precio de venta debe ser numérico' })
  @Min(0, { message: 'El precio de venta no puede ser negativo' })
  precioVenta: number;

  @IsNumber({}, { message: 'El stock inicial debe ser numérico' })
  @Min(0, { message: 'El stock inicial no puede ser negativo' })
  @IsOptional()
  stockInicial?: number;

  @IsString()
  @IsOptional()
  fotoUrl?: string;

  @IsNumber()
  @IsOptional()
  alertaStockMinimo?: number;
}
