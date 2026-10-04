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
}

export enum MotivoDescuento {
  CLIENTE_FRECUENTE = "CLIENTE_FRECUENTE",
  PROMOCION = "PROMOCION",
  OTRO = "OTRO",
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

  @Column({ name: "fecha_venta", type: "date" })
  fechaVenta: Date;

  @Column({
    name: "nombre_cliente",
    type: "varchar",
    length: 150,
    default: "Cliente Casual",
  })
  nombreCliente: string;

  @Column({ type: "enum", enum: MetodoPago, default: MetodoPago.EFECTIVO })
  formaPago: MetodoPago;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  descuento: number;

  @Column({
    name: "motivo_descuento",
    type: "varchar",
    length: 30,
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

  @CreateDateColumn({ name: "creado_en" })
  creadoEn: Date;
}
