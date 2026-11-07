import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class CrearProveedorDto {
  @IsString({ message: "El nombre del proveedor es obligatorio" })
  @IsNotEmpty({ message: "El nombre del proveedor no puede estar vacío" })
  nombre: string;

  @IsString({ message: "El teléfono debe ser texto" })
  @IsOptional()
  telefono?: string;

  @IsString({ message: "El contacto debe ser texto" })
  @IsOptional()
  contacto?: string;
}
