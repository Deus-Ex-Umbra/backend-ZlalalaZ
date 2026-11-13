import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

export enum FormaPagoGasto {
  EFECTIVO = "Efectivo",
  QR = "QR",
  TARJETA = "Tarjeta",
  TRANSFERENCIA = "Transferencia",
  MIXTO = "Mixto",
}

export interface DesglosePagoGasto {
  metodo: string;
  monto: number;
  banco?: string | null;
}

@Entity("gastos_caja_chica")
export class GastoCajaChica {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ name: "fecha_gasto", type: "date" })
  fechaGasto: Date;

  @Column({ name: "nombre_empleado", type: "varchar", length: 150 })
  nombreEmpleado: string; // Ej: Esther Belen, Junior Conde

  @Column({ name: "concepto_motivo", type: "varchar", length: 250 })
  conceptoMotivo: string; // Ej: compra de pan, almuerzo, detergente

  @Column({ type: "decimal", precision: 10, scale: 2 })
  monto: number;

  @Column({
    name: "forma_pago",
    type: "varchar",
    length: 50,
    default: FormaPagoGasto.EFECTIVO,
  })
  formaPago: FormaPagoGasto; // Efectivo, Transferencia

  @Column({ name: "banco", type: "varchar", length: 100, nullable: true })
  banco: string | null;

  @Column({
    name: "desglose_pagos",
    type: "jsonb",
    nullable: true,
    default: () => "'[]'::jsonb",
  })
  desglosePagos: DesglosePagoGasto[] | null;

  @Column({
    name: "autorizado_por",
    type: "varchar",
    length: 150,
    default: "Gerente Tienda",
  })
  autorizadoPor: string;

  @Column({ type: "text", nullable: true })
  notas: string;

  @CreateDateColumn({ name: "creado_en" })
  creadoEn: Date;
}
