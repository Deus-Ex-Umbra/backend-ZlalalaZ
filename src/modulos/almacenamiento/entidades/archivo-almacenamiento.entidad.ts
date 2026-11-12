import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity("archivos_almacenamiento")
export class ArchivoAlmacenamiento {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "clave", length: 255 })
  clave: string;

  @Column({ name: "tamano_bytes", type: "bigint", default: 0 })
  tamanoBytes: number;

  @Column({ name: "url", type: "text" })
  url: string;

  @Column({ name: "proveedor", length: 50, default: "local" })
  proveedor: string;

  @CreateDateColumn({ name: "creado_en", type: "timestamp with time zone" })
  creadoEn: Date;
}
