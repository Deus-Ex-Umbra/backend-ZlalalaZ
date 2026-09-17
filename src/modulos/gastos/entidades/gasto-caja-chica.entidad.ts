import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('gastos_caja_chica')
export class GastoCajaChica {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'fecha_gasto', type: 'date' })
  fechaGasto: Date;

  @Column({ name: 'nombre_empleado', type: 'varchar', length: 150 })
  nombreEmpleado: string; // Ej: Esther Belen, Junior Conde

  @Column({ name: 'concepto_motivo', type: 'varchar', length: 250 })
  conceptoMotivo: string; // Ej: compra de pan, almuerzo, detergente

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto: number;

  @Column({ name: 'forma_pago', type: 'varchar', length: 50, default: 'Efectivo' })
  formaPago: string; // Efectivo, Transferencia

  @Column({ name: 'autorizado_por', type: 'varchar', length: 150, default: 'Gerente Tienda' })
  autorizadoPor: string;

  @Column({ type: 'text', nullable: true })
  notas: string;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn: Date;
}
