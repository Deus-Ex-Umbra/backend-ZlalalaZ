import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsBoolean,
  IsIn,
} from "class-validator";

export type TipoColorCatalogo = "NORMAL" | "ESPECIAL" | "COMBINACION";
export type PatronColorCatalogo =
  | "SOLIDO"
  | "GRADIENTE"
  | "ANIMAL"
  | "BICOLOR"
  | "TRICOLOR";

export class RegistrarColorCatalogoDto {
  @IsString({ message: "El nombre del color debe ser texto" })
  @IsOptional()
  nombre?: string;

  @IsString({ message: "El campo color debe ser texto" })
  @IsOptional()
  color?: string;

  @IsString()
  @IsIn(["NORMAL", "ESPECIAL", "COMBINACION"], {
    message: "El tipo de color debe ser NORMAL, ESPECIAL o COMBINACION",
  })
  @IsOptional()
  tipo?: TipoColorCatalogo;

  @IsString()
  @IsOptional()
  hexPrimario?: string;

  @IsArray({ message: "La lista de colores hexadecimales debe ser un arreglo" })
  @IsString({ each: true })
  @IsOptional()
  coloresHex?: string[];

  @IsArray({ message: "La lista de nombres de colores debe ser un arreglo" })
  @IsString({ each: true })
  @IsOptional()
  coloresNombres?: string[];

  @IsString()
  @IsIn(["SOLIDO", "GRADIENTE", "ANIMAL", "BICOLOR", "TRICOLOR"], {
    message:
      "El patrón debe ser SOLIDO, GRADIENTE, ANIMAL, BICOLOR o TRICOLOR",
  })
  @IsOptional()
  patron?: PatronColorCatalogo;

  @IsString()
  @IsOptional()
  descripcion?: string;
}

export class ActualizarColorCatalogoDto {
  @IsString({ message: "El nombre del color debe ser texto" })
  @IsOptional()
  nombre?: string;

  @IsString({ message: "El campo color debe ser texto" })
  @IsOptional()
  color?: string;

  @IsString()
  @IsIn(["NORMAL", "ESPECIAL", "COMBINACION"], {
    message: "El tipo de color debe ser NORMAL, ESPECIAL o COMBINACION",
  })
  @IsOptional()
  tipo?: TipoColorCatalogo;

  @IsString()
  @IsOptional()
  hexPrimario?: string;

  @IsArray({ message: "La lista de colores hexadecimales debe ser un arreglo" })
  @IsString({ each: true })
  @IsOptional()
  coloresHex?: string[];

  @IsArray({ message: "La lista de nombres de colores debe ser un arreglo" })
  @IsString({ each: true })
  @IsOptional()
  coloresNombres?: string[];

  @IsString()
  @IsIn(["SOLIDO", "GRADIENTE", "ANIMAL", "BICOLOR", "TRICOLOR"], {
    message:
      "El patrón debe ser SOLIDO, GRADIENTE, ANIMAL, BICOLOR o TRICOLOR",
  })
  @IsOptional()
  patron?: PatronColorCatalogo;

  @IsString()
  @IsOptional()
  descripcion?: string | null;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;

  @IsBoolean()
  @IsOptional()
  actualizarCalzados?: boolean;
}

export class CrearExtraCatalogoDto {
  @IsString({ message: "El nombre del extra debe ser texto" })
  @IsNotEmpty({ message: "El nombre del extra promocional es obligatorio" })
  nombre: string;

  @IsString({ message: "La descripción del extra debe ser texto" })
  @IsOptional()
  descripcion?: string;
}

export class ActualizarExtraCatalogoDto {
  @IsString({ message: "El nombre del extra debe ser texto" })
  @IsOptional()
  nombre?: string;

  @IsString({ message: "La descripción del extra debe ser texto" })
  @IsOptional()
  descripcion?: string | null;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

export class CrearCategoriaCatalogoDto {
  @IsString({ message: "El nombre de la categoría debe ser texto" })
  @IsNotEmpty({ message: "El nombre de la categoría es obligatorio" })
  nombre: string;

  @IsString({ message: "La descripción de la categoría debe ser texto" })
  @IsOptional()
  descripcion?: string;
}

export class ActualizarCategoriaCatalogoDto {
  @IsString({ message: "El nombre de la categoría debe ser texto" })
  @IsOptional()
  nombre?: string;

  @IsString({ message: "La descripción de la categoría debe ser texto" })
  @IsOptional()
  descripcion?: string | null;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;

  @IsBoolean()
  @IsOptional()
  actualizarCalzados?: boolean;
}

export class CrearMarcaCatalogoDto {
  @IsString({ message: "El nombre de la marca debe ser texto" })
  @IsNotEmpty({ message: "El nombre de la marca es obligatorio" })
  nombre: string;
}

export class ActualizarMarcaCatalogoDto {
  @IsString({ message: "El nombre de la marca debe ser texto" })
  @IsOptional()
  nombre?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;

  @IsBoolean()
  @IsOptional()
  actualizarCalzados?: boolean;
}
