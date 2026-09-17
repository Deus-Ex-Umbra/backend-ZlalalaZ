import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Calzado } from '../../calzados/entidades/calzado.entidad';

@Entity('ingresos_mercancia')
export class IngresoMercancia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'fecha_ingreso', type: 'date' })
  fechaIngreso: Date;

  @Column({ name: 'calzado_id', type: 'uuid' })
  calzadoId: string;

  @ManyToOne(() => Calzado, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'calzado_id' })
  calzado: Calzado;

  @Column({ name: 'codigo_producto', type: 'varchar', length: 50 })
  codigoProducto: string; // Ej: P001

  @Column({ type: 'int' })
  cantidad: number; // Pares ingresados

  @Column({ type: 'varchar', length: 150, default: 'Distribuidora Calzado SRL' })
  proveedor: string;

  @Column({ name: 'precio_compra_unitario', type: 'decimal', precision: 10, scale: 2 })
  precioCompraUnitario: number;

  @Column({ name: 'precio_venta_unitario', type: 'decimal', precision: 10, scale: 2 })
  precioVentaUnitario: number;

  @Column({ type: 'varchar', length: 20 })
  talla: string;

  @Column({ type: 'text', nullable: true })
  notas: string;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn: Date;
}
