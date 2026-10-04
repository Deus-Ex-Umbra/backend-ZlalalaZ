import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsEnum,
  MinLength,
  IsOptional,
  IsBoolean,
} from "class-validator";
import { RolUsuario } from "../enums/rol-usuario.enum";

export class CrearUsuarioDto {
  @IsString({ message: "El nombre debe ser una cadena de texto" })
  @IsNotEmpty({ message: "El nombre es obligatorio" })
  nombre: string;

  @IsEmail({}, { message: "El correo electrónico no es válido" })
  @IsNotEmpty({ message: "El correo electrónico es obligatorio" })
  correo: string;

  @IsString({ message: "La contraseña debe ser una cadena de texto" })
  @MinLength(6, { message: "La contraseña debe tener al menos 6 caracteres" })
  contrasena: string;

  @IsEnum(RolUsuario, { message: "El rol debe ser ADMINISTRACION o VENTAS" })
  @IsNotEmpty({ message: "El rol es obligatorio" })
  rol: RolUsuario;

  @IsBoolean({ message: "El estado activo debe ser un valor booleano" })
  @IsOptional()
  activo?: boolean;
}
