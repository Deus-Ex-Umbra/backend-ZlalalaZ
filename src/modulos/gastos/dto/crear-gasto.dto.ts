import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import { FormaPagoGasto } from "../entidades/gasto-caja-chica.entidad";

export class DesglosePagoGastoDto {
  @IsString()
  @IsNotEmpty({ message: "El método de pago es obligatorio en el desglose" })
  metodo: string;

  @IsNumber({}, { message: "El monto del desglose debe ser numérico" })
  @Min(0.01, { message: "El monto de cada método de pago debe ser mayor a 0" })
  monto: number;

  @IsString()
  @IsOptional()
  banco?: string;
}

export class CrearGastoDto {
  @IsString()
  @IsNotEmpty({ message: "La fecha del gasto es obligatoria" })
  fechaGasto: string; // YYYY-MM-DD

  @IsString({ message: "El nombre del empleado es obligatorio" })
  @IsNotEmpty()
  nombreEmpleado: string;

  @IsString({ message: "El concepto del gasto es obligatorio" })
  @IsNotEmpty()
  conceptoMotivo: string;

  @IsNumber({}, { message: "El monto debe ser numérico" })
  @Min(0.01, { message: "El monto del gasto debe ser mayor a 0" })
  monto: number;

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

  @IsString({ message: "Debe indicar quién autoriza el gasto" })
  @IsNotEmpty()
  autorizadoPor: string;

  @IsString()
  @IsOptional()
  notas?: string;
}
