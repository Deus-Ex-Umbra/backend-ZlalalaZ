import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MetodoPago } from '../entidades/venta.entidad';

export class LineaVentaDto {
  @IsString({ message: 'El código de producto es obligatorio' })
  @IsNotEmpty()
  codigoProducto: string;

  @IsString()
  @IsNotEmpty()
  talla: string;

  @IsNumber()
  @Min(1)
  cantidad: number;

  @IsNumber()
  @Min(0)
  precioUnitario: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  descuento?: number;
}

export class CrearVentaDto {
  @IsString()
  @IsOptional()
  nombreCliente?: string;

  @IsEnum(MetodoPago, { message: 'El método de pago debe ser Efectivo, QR, Tarjeta o Transferencia' })
  formaPago: MetodoPago;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineaVentaDto)
  lineas: LineaVentaDto[];

  @IsNumber()
  @IsOptional()
  @Min(0)
  montoRecibido?: number;

  @IsString()
  @IsOptional()
  notas?: string;
}
