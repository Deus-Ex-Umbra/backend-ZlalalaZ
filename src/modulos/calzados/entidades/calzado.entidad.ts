import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import {
  MARCA_SIN_DEFINIR,
  TipoProducto,
} from "../../../comun/utilidades/normalizacion-catalogo";

@Entity("calzados")
export class Calzado {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index({ unique: true })
  @Column({ name: "codigo_producto", type: "varchar", length: 50 })
  codigoProducto: string; // Ej: P001, P002

  @Index()
  @Column({ name: "nombre_producto", type: "varchar", length: 150 })
  nombreProducto: string; // Ej: Nike Air Force One, Adidas Samba

  @Index()
  @Column({ type: "varchar", length: 60, default: MARCA_SIN_DEFINIR })
  marca: string; // Ej: Nike, Adidas, Puma, Vans, Jordan

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

  @Index()
  @Column({ type: "varchar", length: 20 })
  talla: string; // Ej: 34, 35, 36, 37, 38, 39, 40, 41, 42, 43

  @Column({ type: "varchar", length: 80, default: "Blanco" })
  color: string; // Ej: Blanco, Negro/Blanco, Crema/Bronce

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

  @Column({ name: "total_vendido", type: "int", default: 0 })
  totalVendido: number;

  @Column({ name: "stock_actual", type: "int", default: 0 })
  stockActual: number;

  @Column({ name: "foto_url", type: "varchar", length: 500, nullable: true })
  fotoUrl: string;

  @Column({ name: "alerta_stock_minimo", type: "int", default: 2 })
  alertaStockMinimo: number;

  @Column({ type: "boolean", default: true })
  activo: boolean;

  @CreateDateColumn({ name: "creado_en" })
  creadoEn: Date;

  @UpdateDateColumn({ name: "actualizado_en" })
  actualizadoEn: Date;
}
