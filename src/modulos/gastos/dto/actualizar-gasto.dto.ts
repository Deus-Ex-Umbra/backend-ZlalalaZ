import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
} from "class-validator";
import { FormaPagoGasto } from "../entidades/gasto-caja-chica.entidad";

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
    message: "La forma de pago debe ser Efectivo o Transferencia",
  })
  @IsOptional()
  formaPago?: FormaPagoGasto;

  @IsString()
  @IsOptional()
  banco?: string;

  @IsString()
  @IsOptional()
  autorizadoPor?: string;

  @IsString()
  @IsOptional()
  notas?: string;
}
