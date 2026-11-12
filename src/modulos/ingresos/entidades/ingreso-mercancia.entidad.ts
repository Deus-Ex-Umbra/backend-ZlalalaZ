import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Calzado } from "../../calzados/entidades/calzado.entidad";

export interface DesglosePagoIngresoItem {
  metodo: string;
  monto: number;
  banco?: string;
}

@Entity("ingresos_mercancia")
export class IngresoMercancia {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "fecha_ingreso", type: "date" })
  fechaIngreso: Date;

  @Column({ name: "calzado_id", type: "uuid" })
  calzadoId: string;

  @ManyToOne(() => Calzado, { onDelete: "CASCADE" })
  @JoinColumn({ name: "calzado_id" })
  calzado: Calzado;

  @Column({ name: "codigo_producto", type: "varchar", length: 50 })
  codigoProducto: string; // Ej: P-1

  @Column({ type: "int" })
  cantidad: number; // Pares ingresados

  @Index()
  @Column({ name: "proveedor_id", type: "uuid", nullable: true })
  proveedorId: string | null;

  @Column({
    type: "varchar",
    length: 150,
    default: "Distribuidora Calzado SRL",
  })
  proveedor: string;

  @Column({
    name: "precio_compra_unitario",
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0,
  })
  precioCompraUnitario: number;

  @Column({
    name: "precio_venta_unitario",
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0,
  })
  precioVentaUnitario: number;

  @Column({ type: "varchar", length: 50 })
  talla: string;

  @Column({
    name: "forma_pago",
    type: "varchar",
    length: 30,
    default: "Efectivo",
  })
  formaPago: string;

  @Column({ name: "desglose_pagos", type: "jsonb", nullable: true })
  desglosePagos: DesglosePagoIngresoItem[] | null;

  @Column({ type: "text", nullable: true })
  notas: string;

  @CreateDateColumn({ name: "creado_en" })
  creadoEn: Date;
}
