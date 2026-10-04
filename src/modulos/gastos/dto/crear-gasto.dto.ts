import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
} from "class-validator";
import { FormaPagoGasto } from "../entidades/gasto-caja-chica.entidad";

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
    message: "La forma de pago debe ser Efectivo o Transferencia",
  })
  @IsOptional()
  formaPago?: FormaPagoGasto; // Efectivo, Transferencia

  @IsString({ message: "Debe indicar quién autoriza el gasto" })
  @IsNotEmpty()
  autorizadoPor: string;

  @IsString()
  @IsOptional()
  notas?: string;
}
