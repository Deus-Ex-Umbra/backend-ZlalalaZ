import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Venta } from './venta.entidad';
import { Calzado } from '../../calzados/entidades/calzado.entidad';

@Entity('detalles_venta')
export class DetalleVenta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'venta_id', type: 'uuid' })
  ventaId: string;

  @ManyToOne(() => Venta, (venta) => venta.detalles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'venta_id' })
  venta: Venta;

  @Column({ name: 'calzado_id', type: 'uuid' })
  calzadoId: string;

  @ManyToOne(() => Calzado)
  @JoinColumn({ name: 'calzado_id' })
  calzado: Calzado;

  @Column({ name: 'codigo_producto', type: 'varchar', length: 50 })
  codigoProducto: string; // Ej: P001

  @Column({ name: 'nombre_producto', type: 'varchar', length: 150 })
  nombreProducto: string;

  @Column({ type: 'varchar', length: 20 })
  talla: string;

  @Column({ type: 'int', default: 1 })
  cantidad: number;

  @Column({ name: 'precio_unitario', type: 'decimal', precision: 10, scale: 2 })
  precioUnitario: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  descuento: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;
}
