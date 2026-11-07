import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

@Entity("bancos")
export class Banco {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 150 })
  nombre: string;

  @Column({ type: "boolean", default: true })
  activo: boolean;

  @CreateDateColumn({ name: "creado_en" })
  creadoEn: Date;
}
