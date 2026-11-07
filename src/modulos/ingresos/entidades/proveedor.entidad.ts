import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

@Entity("proveedores")
export class Proveedor {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 150, unique: true })
  nombre: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  telefono: string | null;

  @Column({ type: "varchar", length: 150, nullable: true })
  contacto: string | null;

  @Column({ type: "boolean", default: true })
  activo: boolean;

  @CreateDateColumn({ name: "creado_en" })
  creadoEn: Date;
}
