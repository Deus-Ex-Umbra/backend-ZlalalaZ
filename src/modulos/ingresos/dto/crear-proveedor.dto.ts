import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsBoolean,
} from "class-validator";

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

  @IsString()
  @IsOptional()
  ciudad?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  metodosPago?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  metodosPagoHabituales?: string[];

  @IsString()
  @IsOptional()
  notas?: string;
}

export class ActualizarProveedorDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  telefono?: string | null;

  @IsString()
  @IsOptional()
  contacto?: string | null;

  @IsString()
  @IsOptional()
  ciudad?: string | null;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  metodosPago?: string[] | null;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  metodosPagoHabituales?: string[] | null;

  @IsString()
  @IsOptional()
  notas?: string | null;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
