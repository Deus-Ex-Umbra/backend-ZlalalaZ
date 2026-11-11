import {
  Injectable,
  OnModuleInit,
  Logger,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcryptjs";
import { Usuario } from "./entidades/usuario.entidad";
import { RolUsuario } from "./enums/rol-usuario.enum";
import { CrearUsuarioDto } from "./dto/crear-usuario.dto";
import { ActualizarUsuarioDto } from "./dto/actualizar-usuario.dto";

@Injectable()
export class UsuariosServicio implements OnModuleInit {
  private readonly logger = new Logger(UsuariosServicio.name);

  constructor(
    @InjectRepository(Usuario)
    private readonly repositorioUsuario: Repository<Usuario>,
  ) {}

  async onModuleInit() {
    try {
      await this.repositorioUsuario.query(`
        ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS version_token INT DEFAULT 1;
        ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS fecha_revocacion_sesiones TIMESTAMP;
      `);
      this.logger.log("Esquema de usuarios sincronizado (version_token)");
    } catch (e) {
      this.logger.warn(
        `Aviso al sincronizar columnas en usuarios: ${(e as Error).message}`,
      );
    }
    await this.inicializarUsuariosSemilla();
  }

  async inicializarUsuariosSemilla(): Promise<void> {
    const totalUsuarios = await this.repositorioUsuario.count();
    const adminEmail = (process.env.ADMIN_EMAIL || "calzadoslalala@gmail.com")
      .toLowerCase()
      .trim();
    const adminPass = process.env.ADMIN_PASSWORD || "Admin123*";
    const contrasenaAdminHash = await bcrypt.hash(adminPass, 10);

    if (totalUsuarios === 0) {
      this.logger.log(
        "Inicializando usuario administrador por defecto para LaLaLa...",
      );

      const usuarioAdmin = this.repositorioUsuario.create({
        nombre: "Administrador LaLaLa",
        correo: adminEmail,
        contrasenaHash: contrasenaAdminHash,
        rol: RolUsuario.ADMINISTRADOR,
        activo: true,
      });

      await this.repositorioUsuario.save(usuarioAdmin);
      this.logger.log(
        `Usuario administrador por defecto creado exitosamente (${adminEmail})`,
      );
    } else {
      // Si existía el usuario con correo previo o temporal, sincronizar al correo oficial
      const usuarioViejo = await this.repositorioUsuario.findOne({
        where: { correo: "admin@lalala.com" },
      });
      if (usuarioViejo) {
        usuarioViejo.correo = adminEmail;
        usuarioViejo.contrasenaHash = contrasenaAdminHash;
        await this.repositorioUsuario.save(usuarioViejo);
        this.logger.log(
          `Usuario administrador actualizado de 'admin@lalala.com' a '${adminEmail}'`,
        );
      }
    }
  }

  async buscarPorCorreo(correo: string): Promise<Usuario | null> {
    return this.repositorioUsuario.findOne({
      where: { correo: correo.toLowerCase().trim() },
    });
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    return this.repositorioUsuario.findOne({
      where: { id },
    });
  }

  async crear(dto: CrearUsuarioDto): Promise<Omit<Usuario, "contrasenaHash">> {
    const correoNormalizado = dto.correo.toLowerCase().trim();
    const existe = await this.buscarPorCorreo(correoNormalizado);
    if (existe) {
      throw new ConflictException(
        "ERR-AUTH-005: Ya existe un usuario con este correo electrónico",
      );
    }

    const contrasenaHash = await bcrypt.hash(dto.contrasena, 10);
    const nuevoUsuario = this.repositorioUsuario.create({
      nombre: dto.nombre.trim(),
      correo: correoNormalizado,
      contrasenaHash,
      rol: dto.rol,
      activo: dto.activo ?? true,
    });

    const guardado = await this.repositorioUsuario.save(nuevoUsuario);
    const { contrasenaHash: _, ...usuarioSinContrasena } = guardado;
    return usuarioSinContrasena as Omit<Usuario, "contrasenaHash">;
  }

  async listar(): Promise<Omit<Usuario, "contrasenaHash">[]> {
    const usuarios = await this.repositorioUsuario.find({
      order: { fechaCreacion: "DESC" },
    });

    return usuarios.map(
      ({ contrasenaHash, ...resto }) =>
        resto as Omit<Usuario, "contrasenaHash">,
    );
  }

  async actualizar(
    id: string,
    dto: ActualizarUsuarioDto,
  ): Promise<Omit<Usuario, "contrasenaHash">> {
    const usuario = await this.buscarPorId(id);
    if (!usuario) {
      throw new NotFoundException("ERR-AUTH-004: Usuario no encontrado");
    }

    if (dto.correo && dto.correo.toLowerCase().trim() !== usuario.correo) {
      const correoExiste = await this.buscarPorCorreo(dto.correo);
      if (correoExiste) {
        throw new ConflictException(
          "ERR-AUTH-005: El correo electrónico ya se encuentra en uso",
        );
      }
      usuario.correo = dto.correo.toLowerCase().trim();
    }

    if (dto.nombre) usuario.nombre = dto.nombre.trim();
    if (dto.rol) usuario.rol = dto.rol;
    if (dto.activo !== undefined) usuario.activo = dto.activo;
    if (dto.contrasena) {
      usuario.contrasenaHash = await bcrypt.hash(dto.contrasena, 10);
    }
    if (dto.contrasena || dto.activo === false) {
      usuario.versionToken = (usuario.versionToken ?? 1) + 1;
      usuario.fechaRevocacionSesiones = new Date();
    }

    const guardado = await this.repositorioUsuario.save(usuario);
    const { contrasenaHash: _, ...usuarioSinContrasena } = guardado;
    return usuarioSinContrasena as Omit<Usuario, "contrasenaHash">;
  }

  async revocarSesiones(id: string): Promise<Omit<Usuario, "contrasenaHash">> {
    const usuario = await this.buscarPorId(id);
    if (!usuario) {
      throw new NotFoundException("ERR-AUTH-004: Usuario no encontrado");
    }

    usuario.versionToken = (usuario.versionToken ?? 1) + 1;
    usuario.fechaRevocacionSesiones = new Date();

    const guardado = await this.repositorioUsuario.save(usuario);
    const { contrasenaHash: _, ...usuarioSinContrasena } = guardado;
    return usuarioSinContrasena as Omit<Usuario, "contrasenaHash">;
  }

  async cambiarContrasenaPropia(
    id: string,
    contrasenaActual: string,
    nuevaContrasena: string,
  ): Promise<Usuario> {
    const usuario = await this.buscarPorId(id);
    if (!usuario) {
      throw new NotFoundException("ERR-AUTH-004: Usuario no encontrado");
    }

    const coincide = await bcrypt.compare(
      contrasenaActual,
      usuario.contrasenaHash,
    );
    if (!coincide) {
      throw new UnauthorizedException(
        "ERR-AUTH-001: La contraseña actual es incorrecta",
      );
    }

    usuario.contrasenaHash = await bcrypt.hash(nuevaContrasena, 10);
    usuario.versionToken = (usuario.versionToken ?? 1) + 1;
    usuario.fechaRevocacionSesiones = new Date();

    return this.repositorioUsuario.save(usuario);
  }
}
