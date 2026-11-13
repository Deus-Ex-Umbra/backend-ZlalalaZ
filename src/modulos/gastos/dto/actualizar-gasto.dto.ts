import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import { FormaPagoGasto } from "../entidades/gasto-caja-chica.entidad";
import { DesglosePagoGastoDto } from "./crear-gasto.dto";

export class ActualizarGastoDto {
  @IsString()
  @IsOptional()
  fechaGasto?: string; // YYYY-MM-DD

  @IsString()
  @IsOptional()
  nombreEmpleado?: string;

  @IsString()
  @IsOptional()
  conceptoMotivo?: string;

  @IsString()
  @IsOptional()
  concepto?: string; // Alias de compatibilidad

  @IsNumber({}, { message: "El monto debe ser numérico" })
  @Min(0.01, { message: "El monto del gasto debe ser mayor a 0" })
  @IsOptional()
  monto?: number;

  @IsEnum(FormaPagoGasto, {
    message:
      "La forma de pago debe ser Efectivo, QR, Tarjeta, Transferencia o Mixto",
  })
  @IsOptional()
  formaPago?: FormaPagoGasto;

  @IsString()
  @IsOptional()
  banco?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DesglosePagoGastoDto)
  @IsOptional()
  desglosePagos?: DesglosePagoGastoDto[];

  @IsString()
  @IsOptional()
  autorizadoPor?: string;

  @IsString()
  @IsOptional()
  notas?: string;
}
