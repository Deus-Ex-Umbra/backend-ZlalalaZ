import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
  IsArray,
  IsBoolean,
  ValidateNested,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import { MetodoPago, MotivoDescuento } from "../entidades/venta.entidad";

export class DesglosePagoDto {
  @IsString()
  @IsNotEmpty()
  metodo: string;

  @IsNumber()
  @Min(0.01, { message: "Cada monto del desglose debe ser mayor a 0" })
  monto: number;

  @IsString()
  @IsOptional()
  banco?: string;
}

export class LineaVentaDto {
  @IsString({ message: "El código de producto es obligatorio" })
  @IsNotEmpty()
  codigoProducto: string;

  @IsString()
  @IsOptional()
  talla?: string;

  @IsString()
  @IsOptional()
  tallaSeleccionada?: string;

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
  clienteId?: string;

  @IsString()
  @IsOptional()
  nombreCliente?: string;

  @IsString()
  @IsOptional()
  clienteNombre?: string;

  @IsString()
  @IsOptional()
  nombreVendedor?: string;

  @IsEnum(MetodoPago, {
    message:
      "El método de pago debe ser Efectivo, QR, Tarjeta, Transferencia o Mixto",
  })
  @IsOptional()
  formaPago?: MetodoPago;

  @IsString()
  @IsOptional()
  banco?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DesglosePagoDto)
  @IsOptional()
  desglosePagos?: DesglosePagoDto[];

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
  descuentoGeneral?: number;

  @IsEnum(MotivoDescuento, {
    message:
      "El motivo del descuento debe ser CLIENTE_FRECUENTE, PROMOCION, LIQUIDACION, CAMBIO_MERCADERIA, ACTUALIZACION u OTRO",
  })
  @IsOptional()
  motivoDescuento?: MotivoDescuento;

  @IsString()
  @IsOptional()
  notas?: string;
}

export class ActualizarVentaDto {
  @IsString()
  @IsOptional()
  clienteId?: string | null;

  @IsString()
  @IsOptional()
  nombreCliente?: string;

  @IsString()
  @IsOptional()
  clienteNombre?: string;

  @IsEnum(MetodoPago)
  @IsOptional()
  formaPago?: MetodoPago;

  @IsString()
  @IsOptional()
  banco?: string | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DesglosePagoDto)
  @IsOptional()
  desglosePagos?: DesglosePagoDto[] | null;

  @IsEnum(MotivoDescuento)
  @IsOptional()
  motivoDescuento?: MotivoDescuento | null;

  @IsString()
  @IsOptional()
  notas?: string;
}

export class ItemDevueltoCambioDto {
  @IsString({ message: "El identificador de línea es obligatorio" })
  @IsNotEmpty()
  detalleId: string;

  @IsNumber()
  @Min(1, { message: "La cantidad a devolver debe ser al menos 1" })
  cantidadADevolver: number;
}

export class ItemReemplazoCambioDto {
  @IsString({ message: "El código del calzado de reemplazo es obligatorio" })
  @IsNotEmpty()
  codigoProducto: string;

  @IsString()
  @IsOptional()
  talla?: string;

  @IsString()
  @IsOptional()
  tallaSeleccionada?: string;

  @IsNumber()
  @Min(1, { message: "La cantidad de reemplazo debe ser al menos 1" })
  cantidad: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  precioUnitario?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  descuento?: number;
}

export class ProcesarCambioDevolucionDto {
  @IsString({ message: "El motivo del cambio o devolución es obligatorio" })
  @IsNotEmpty({ message: "Debes indicar el motivo del cambio o devolución" })
  motivo: string;

  @IsBoolean()
  @IsOptional()
  devolucionTotal?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDevueltoCambioDto)
  @IsOptional()
  itemsDevueltos?: ItemDevueltoCambioDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemReemplazoCambioDto)
  @IsOptional()
  itemsReemplazo?: ItemReemplazoCambioDto[];

  @IsEnum(MetodoPago, {
    message:
      "El método de pago debe ser Efectivo, QR, Tarjeta, Transferencia o Mixto",
  })
  @IsOptional()
  formaPagoDiferencia?: MetodoPago;

  @IsString()
  @IsOptional()
  bancoDiferencia?: string;

  @IsString()
  @IsOptional()
  operadorNombre?: string;
}
