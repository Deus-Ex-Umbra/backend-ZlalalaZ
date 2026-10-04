import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import { MetodoPago, MotivoDescuento } from "../entidades/venta.entidad";

export class LineaVentaDto {
  @IsString({ message: "El código de producto es obligatorio" })
  @IsNotEmpty()
  codigoProducto: string;

  @IsString()
  @IsOptional()
  talla?: string; // Los accesorios no tienen talla

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
  idLocal?: string;

  @IsString()
  @IsOptional()
  nombreCliente?: string;

  @IsEnum(MetodoPago, {
    message: "El método de pago debe ser Efectivo, QR, Tarjeta o Transferencia",
  })
  formaPago: MetodoPago;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineaVentaDto)
  lineas: LineaVentaDto[];

  @IsNumber()
  @IsOptional()
  @Min(0)
  montoRecibido?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  descuentoGeneral?: number; // Descuento global de la venta, adicional al de cada línea

  @IsEnum(MotivoDescuento, {
    message: "El motivo del descuento debe ser CLIENTE_FRECUENTE, PROMOCION u OTRO",
  })
  @IsOptional()
  motivoDescuento?: MotivoDescuento;

  @IsString()
  @IsOptional()
  notas?: string;
}
