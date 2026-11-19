import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import { AccionAuditoria } from "../entidades/log-auditoria.entidad";

export class ConsultarAuditoriaDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite?: number = 20;

  @IsOptional()
  @IsString()
  tabla?: string;

  @IsOptional()
  @IsString()
  modulo?: string;

  @IsOptional()
  @IsIn(["CREAR", "ACTUALIZAR", "ELIMINAR"])
  accion?: AccionAuditoria;

  @IsOptional()
  @IsString()
  usuarioId?: string;

  @IsOptional()
  @IsString()
  usuarioNombre?: string;

  @IsOptional()
  @IsString()
  busqueda?: string;

  @IsOptional()
  @IsString()
  fechaDesde?: string;

  @IsOptional()
  @IsString()
  fechaHasta?: string;
}
