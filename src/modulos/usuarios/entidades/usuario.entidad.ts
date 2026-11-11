import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import { RolUsuario } from "../enums/rol-usuario.enum";

@Entity("usuarios")
export class Usuario {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 150 })
  nombre: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 150, unique: true })
  correo: string;

  @Column({ name: "contrasena_hash", type: "varchar", length: 255 })
  contrasenaHash: string;

  @Column({
    type: "enum",
    enum: RolUsuario,
    default: RolUsuario.VENDEDOR,
  })
  rol: RolUsuario;

  @Column({ type: "boolean", default: true })
  activo: boolean;

  @Column({ name: "version_token", type: "int", default: 1 })
  versionToken: number;

  @Column({ name: "fecha_revocacion_sesiones", type: "timestamp", nullable: true })
  fechaRevocacionSesiones: Date | null;

  @CreateDateColumn({ name: "fecha_creacion" })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: "fecha_actualizacion" })
  fechaActualizacion: Date;
}
