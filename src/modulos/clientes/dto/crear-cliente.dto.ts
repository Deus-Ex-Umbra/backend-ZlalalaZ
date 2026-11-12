import { IsString, IsNotEmpty, IsOptional, IsEmail } from "class-validator";

export class CrearClienteDto {
  @IsString({ message: "El nombre del cliente es obligatorio" })
  @IsNotEmpty()
  nombreCompleto: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsEmail({}, { message: "El correo electrónico no es válido" })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  metodoPagoPreferido?: string;

  @IsString()
  @IsOptional()
  notas?: string;
}
