import {
  IsString,
  IsEmail,
  IsEnum,
  MinLength,
  IsOptional,
  IsBoolean,
} from "class-validator";
import { RolUsuario } from "../enums/rol-usuario.enum";

export class ActualizarUsuarioDto {
  @IsString({ message: "El nombre debe ser una cadena de texto" })
  @IsOptional()
  nombre?: string;

  @IsEmail({}, { message: "El correo electrónico no es válido" })
  @IsOptional()
  correo?: string;

  @IsString({ message: "La contraseña debe ser una cadena de texto" })
  @MinLength(6, { message: "La contraseña debe tener al menos 6 caracteres" })
  @IsOptional()
  contrasena?: string;

  @IsEnum(RolUsuario, { message: "El rol debe ser ADMINISTRACION o VENTAS" })
  @IsOptional()
  rol?: RolUsuario;

  @IsBoolean({ message: "El estado activo debe ser un valor booleano" })
  @IsOptional()
  activo?: boolean;
}
