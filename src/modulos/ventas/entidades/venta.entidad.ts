import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Index,
} from "typeorm";
import { DetalleVenta } from "./detalle-venta.entidad";

export enum MetodoPago {
  EFECTIVO = "Efectivo",
  QR = "QR",
  TARJETA = "Tarjeta",
  TRANSFERENCIA = "Transferencia",
  MIXTO = "Mixto",
}

export enum MotivoDescuento {
  CLIENTE_FRECUENTE = "CLIENTE_FRECUENTE",
  PROMOCION = "PROMOCION",
  LIQUIDACION = "LIQUIDACION",
  CAMBIO_MERCADERIA = "CAMBIO_MERCADERIA",
  ACTUALIZACION = "ACTUALIZACION",
  OTRO = "OTRO",
}

export interface DesglosePagoItem {
  metodo: string;
  monto: number;
  banco?: string;
}

@Entity("ventas")
export class Venta {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index({ unique: true })
  @Column({ name: "numero_ticket", type: "varchar", length: 50 })
  numeroTicket: string; // Ej: TCK-202609-0001

  @Index({ unique: false })
  @Column({ name: "id_local", type: "varchar", length: 100, nullable: true })
  idLocal?: string | null;

  @Index()
  @Column({ name: "fecha_venta", type: "date" })
  fechaVenta: Date;

  @Index()
  @Column({ name: "cliente_id", type: "uuid", nullable: true })
  clienteId: string | null;

  @Column({
    name: "nombre_cliente",
    type: "varchar",
    length: 150,
    default: "Cliente Casual",
  })
  nombreCliente: string;

  @Column({
    name: "nombre_vendedor",
    type: "varchar",
    length: 150,
    nullable: true,
  })
  nombreVendedor: string | null;

  @Index()
  @Column({
    name: "forma_pago",
    type: "varchar",
    length: 30,
    default: MetodoPago.EFECTIVO,
  })
  formaPago: MetodoPago;

  @Column({ name: "banco", type: "varchar", length: 100, nullable: true })
  banco: string | null;

  @Column({
    name: "desglose_pagos",
    type: "jsonb",
    nullable: true,
  })
  desglosePagos: DesglosePagoItem[] | null;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  descuento: number;

  @Column({
    name: "motivo_descuento",
    type: "varchar",
    length: 50,
    nullable: true,
  })
  motivoDescuento: MotivoDescuento | null;

  @Column({ name: "total_venta", type: "decimal", precision: 10, scale: 2 })
  totalVenta: number;

  @Column({
    name: "monto_recibido",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  montoRecibido: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  cambio: number;

  @Column({ type: "text", nullable: true })
  notas: string;

  @OneToMany(() => DetalleVenta, (detalle) => detalle.venta, { cascade: true })
  detalles: DetalleVenta[];

  @Index()
  @CreateDateColumn({ name: "creado_en" })
  creadoEn: Date;
}
