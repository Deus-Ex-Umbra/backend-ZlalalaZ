import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CrearBancoDto {
  @IsString({ message: "El nombre del banco debe ser un texto" })
  @IsNotEmpty({ message: "El nombre del banco es obligatorio" })
  @MaxLength(150, { message: "El nombre del banco no puede exceder 150 caracteres" })
  nombre: string;
}
