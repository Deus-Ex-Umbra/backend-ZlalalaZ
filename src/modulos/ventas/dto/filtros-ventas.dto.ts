import { IsOptional, IsString, IsNumber, Min } from "class-validator";
import { Type } from "class-transformer";

export class FiltrosVentasDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limite?: number;

  @IsOptional()
  @IsString()
  fechaInicio?: string;

  @IsOptional()
  @IsString()
  fechaFin?: string;

  @IsOptional()
  @IsString()
  formaPago?: string;

  @IsOptional()
  @IsString()
  banco?: string;

  @IsOptional()
  @IsString()
  busqueda?: string;
}
