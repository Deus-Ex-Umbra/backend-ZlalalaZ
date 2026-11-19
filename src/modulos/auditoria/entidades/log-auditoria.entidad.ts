import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

export type AccionAuditoria = "CREAR" | "ACTUALIZAR" | "ELIMINAR";

@Entity("logs_auditoria")
export class LogAuditoria {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ type: "varchar", length: 80 })
  tabla: string;

  @Index()
  @Column({ type: "varchar", length: 60 })
  modulo: string;

  @Index()
  @Column({ type: "varchar", length: 20 })
  accion: AccionAuditoria;

  @Index()
  @Column({ name: "registro_id", type: "varchar", length: 120, nullable: true })
  registroId: string | null;

  @Column({ type: "text" })
  resumen: string;

  @Column({
    name: "campos_modificados",
    type: "text",
    array: true,
    default: () => "'{}'",
  })
  camposModificados: string[];

  @Column({ name: "valores_anteriores", type: "jsonb", nullable: true })
  valoresAnteriores: Record<string, unknown> | null;

  @Column({ name: "valores_nuevos", type: "jsonb", nullable: true })
  valoresNuevos: Record<string, unknown> | null;

  @Index()
  @Column({ name: "usuario_id", type: "uuid", nullable: true })
  usuarioId: string | null;

  @Column({
    name: "usuario_nombre",
    type: "varchar",
    length: 160,
    nullable: true,
  })
  usuarioNombre: string | null;

  @Column({ name: "usuario_rol", type: "varchar", length: 40, nullable: true })
  usuarioRol: string | null;

  @Column({ type: "varchar", length: 80, nullable: true })
  ip: string | null;

  @Column({ name: "metodo_http", type: "varchar", length: 16, nullable: true })
  metodoHttp: string | null;

  @Column({ name: "ruta_http", type: "varchar", length: 300, nullable: true })
  rutaHttp: string | null;

  @Column({ type: "varchar", length: 30, default: "TRIGGER_DB" })
  origen: string;

  @Index()
  @CreateDateColumn({ name: "creado_en", type: "timestamptz" })
  creadoEn: Date;
}
