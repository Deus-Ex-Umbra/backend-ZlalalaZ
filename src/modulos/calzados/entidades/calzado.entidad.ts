import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import {
  ExtraIncluidoItem,
  MARCA_SIN_DEFINIR,
  TipoProducto,
} from "../../../comun/utilidades/normalizacion-catalogo";

@Entity("calzados")
export class Calzado {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index({ unique: true })
  @Column({ name: "codigo_producto", type: "varchar", length: 50 })
  codigoProducto: string; // Ej: P-1, P-2

  @Index()
  @Column({ name: "nombre_producto", type: "varchar", length: 150 })
  nombreProducto: string; // Ej: Nike Air Force One, Adidas Samba

  @Index()
  @Column({ type: "varchar", length: 60, default: MARCA_SIN_DEFINIR })
  marca: string; // Ej: Nike, Adidas, Puma, Vans, Jordan

  @Column({ name: "marca_id", type: "uuid", nullable: true })
  marcaId: string | null;

  @Column({
    name: "tipo_producto",
    type: "varchar",
    length: 20,
    default: TipoProducto.CALZADO,
  })
  tipoProducto: TipoProducto; // CALZADO | ACCESORIO (los accesorios usan talla "Única")

  @Index()
  @Column({ type: "varchar", length: 100, default: "General" })
  categoria: string; // Ej: Lifestyle, Drake, Low 84, Messi

  @Column({ name: "categoria_id", type: "uuid", nullable: true })
  categoriaId: string | null;

  @Index()
  @Column({ type: "varchar", length: 120 })
  talla: string; // Ej: "38" o "35, 38"

  @Column({
    name: "stock_por_talla",
    type: "jsonb",
    nullable: true,
    default: () => "'{}'::jsonb",
  })
  stockPorTalla: Record<string, number> | null;

  @Index()
  @Column({
    name: "segmento_talla",
    type: "varchar",
    length: 30,
    nullable: true,
  })
  segmentoTalla: string | null; // BEBE | NINO | JUVENIL | ADULTO | UNICA

  @Column({ type: "varchar", length: 160, default: "Blanco" })
  color: string; // Ej: Blanco, Negro+Blanco, Verde+Rojo+Amarillo, Arcoíris, Payaso

  @Column({ name: "color_id", type: "uuid", nullable: true })
  colorId: string | null;

  @Column({
    name: "precio_compra",
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0,
  })
  precioCompra: number;

  @Column({
    name: "precio_venta",
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0,
  })
  precioVenta: number;

  @Column({ name: "stock_inicial", type: "int", default: 0 })
  stockInicial: number;

  @Column({ name: "total_ingresado", type: "int", default: 0 })
  totalIngresado: number;

  @Index()
  @Column({ name: "total_vendido", type: "int", default: 0 })
  totalVendido: number;

  @Index()
  @Column({ name: "stock_actual", type: "int", default: 0 })
  stockActual: number;

  @Column({ name: "foto_url", type: "text", nullable: true })
  fotoUrl: string;

  @Column({ name: "fotos_galeria", type: "simple-array", nullable: true })
  fotosGaleria: string[];

  @Column({ name: "extras", type: "varchar", length: 255, nullable: true })
  extras: string | null;

  @Column({ name: "es_extra", type: "boolean", default: false })
  esExtra: boolean;

  @Column({
    name: "extras_incluidos",
    type: "jsonb",
    nullable: true,
    default: () => "'[]'::jsonb",
  })
  extrasIncluidos: ExtraIncluidoItem[] | null;

  @Column({
    name: "precio_promocion",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  precioPromocion: number | null;

  @Column({
    name: "promocion_fecha_inicio",
    type: "varchar",
    length: 20,
    nullable: true,
  })
  promocionFechaInicio: string | null;

  @Column({
    name: "promocion_fecha_fin",
    type: "varchar",
    length: 20,
    nullable: true,
  })
  promocionFechaFin: string | null;

  @Column({
    name: "promocion_motivo",
    type: "varchar",
    length: 120,
    nullable: true,
  })
  promocionMotivo: string | null;

  @Column({ name: "alerta_stock_minimo", type: "int", default: 1 })
  alertaStockMinimo: number;

  @Index()
  @Column({ type: "boolean", default: true })
  activo: boolean;

  @CreateDateColumn({ name: "creado_en" })
  creadoEn: Date;

  @UpdateDateColumn({ name: "actualizado_en" })
  actualizadoEn: Date;

  /** Vínculos relacionales (`calzados_colores` JOIN `catalogo_colores`) poblados en consultas. */
  coloresRelacionados?: {
    id: string;
    nombre: string;
    tipo: "NORMAL" | "ESPECIAL" | "COMBINACION";
    hexPrimario?: string;
    coloresHex?: string[];
    patron?: string;
    tallasAsociadas?: string[];
    orden?: number;
  }[];
}
