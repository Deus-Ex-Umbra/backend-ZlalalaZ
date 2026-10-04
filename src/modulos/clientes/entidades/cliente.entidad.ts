import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

@Entity("clientes")
export class Cliente {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ name: "nombre_completo", type: "varchar", length: 150 })
  nombreCompleto: string;

  @Column({ type: "varchar", length: 30, nullable: true })
  telefono: string;

  @Column({ type: "varchar", length: 150, nullable: true })
  email: string;

  @Column({ name: "total_compras", type: "int", default: 0 })
  totalCompras: number;

  @Column({
    name: "monto_total_comprado",
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0,
  })
  montoTotalComprado: number;

  @Column({ name: "fecha_primera_compra", type: "date", nullable: true })
  fechaPrimeraCompra: Date;

  @Column({ name: "fecha_ultima_compra", type: "date", nullable: true })
  fechaUltimaCompra: Date;

  @Column({ type: "text", nullable: true })
  notas: string;

  @Column({ type: "boolean", default: true })
  activo: boolean;

  @CreateDateColumn({ name: "creado_en" })
  creadoEn: Date;

  @UpdateDateColumn({ name: "actualizado_en" })
  actualizadoEn: Date;
}
