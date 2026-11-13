import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
  IsArray,
  IsBoolean,
  IsObject,
} from "class-validator";
import {
  ExtraIncluidoItem,
  TipoProducto,
} from "../../../comun/utilidades/normalizacion-catalogo";

export class ActualizarCalzadoDto {
  @IsString()
  @IsOptional()
  nombreProducto?: string;

  @IsString()
  @IsOptional()
  marca?: string;

  @IsString()
  @IsOptional()
  marcaId?: string;

  @IsEnum(TipoProducto)
  @IsOptional()
  tipoProducto?: TipoProducto;

  @IsString()
  @IsOptional()
  categoria?: string;

  @IsString()
  @IsOptional()
  categoriaId?: string;

  @IsString()
  @IsOptional()
  talla?: string;

  @IsObject()
  @IsOptional()
  stockPorTalla?: Record<string, number> | null;

  @IsString()
  @IsOptional()
  segmentoTalla?: string | null;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  colorId?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  precioCompra?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  precioVenta?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  stockActual?: number;

  @IsString()
  @IsOptional()
  fotoUrl?: string;

  @IsString({ each: true })
  @IsArray()
  @IsOptional()
  fotosGaleria?: string[];

  @IsString()
  @IsOptional()
  extras?: string;

  @IsBoolean()
  @IsOptional()
  esExtra?: boolean;

  @IsArray()
  @IsOptional()
  extrasIncluidos?: ExtraIncluidoItem[] | null;

  @IsNumber()
  @Min(0)
  @IsOptional()
  precioPromocion?: number | null;

  @IsString()
  @IsOptional()
  promocionFechaInicio?: string | null;

  @IsString()
  @IsOptional()
  promocionFechaFin?: string | null;

  @IsString()
  @IsOptional()
  promocionMotivo?: string | null;

  @IsNumber()
  @Min(0)
  @IsOptional()
  alertaStockMinimo?: number;
}
