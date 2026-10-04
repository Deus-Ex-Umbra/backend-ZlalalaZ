import { IsString, IsOptional, IsEmail, IsBoolean } from "class-validator";

export class ActualizarClienteDto {
  @IsString()
  @IsOptional()
  nombreCompleto?: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsEmail({}, { message: "El correo electrónico no es válido" })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  notas?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
