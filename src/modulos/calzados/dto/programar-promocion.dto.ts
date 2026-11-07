import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  ValidateIf,
} from "class-validator";

export class ProgramarPromocionDto {
  @IsString()
  @IsOptional()
  calzadoId?: string;

  @IsString()
  @IsOptional()
  nombreModelo?: string;

  @IsBoolean()
  @IsOptional()
  aplicarATodoElModelo?: boolean;

  @ValidateIf((_, val) => val !== null && val !== undefined)
  @IsNumber()
  @Min(0)
  @IsOptional()
  precioPromocion?: number | null;

  @ValidateIf((_, val) => val !== null && val !== undefined)
  @IsString()
  @IsOptional()
  promocionFechaInicio?: string | null;

  @ValidateIf((_, val) => val !== null && val !== undefined)
  @IsString()
  @IsOptional()
  promocionFechaFin?: string | null;

  @ValidateIf((_, val) => val !== null && val !== undefined)
  @IsString()
  @IsOptional()
  promocionMotivo?: string | null;
}
