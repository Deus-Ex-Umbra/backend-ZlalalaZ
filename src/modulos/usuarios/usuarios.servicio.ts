import {
  Injectable,
  OnModuleInit,
  Logger,
  ConflictException,
  NotFoundException,
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
    await this.inicializarUsuariosSemilla();
  }

  async inicializarUsuariosSemilla(): Promise<void> {
    const totalUsuarios = await this.repositorioUsuario.count();
    if (totalUsuarios === 0) {
      this.logger.log(
        "Inicializando usuarios semilla por defecto para ZLaLaLaZ...",
      );

      const contrasenaAdminHash = await bcrypt.hash("Admin123*", 10);
      const usuarioAdmin = this.repositorioUsuario.create({
        nombre: "Administrador ZLaLaLaZ",
        correo: "admin@zlalalaz.com",
        contrasenaHash: contrasenaAdminHash,
        rol: RolUsuario.ADMINISTRACION,
        activo: true,
      });

      const contrasenaVentasHash = await bcrypt.hash("Ventas123*", 10);
      const usuarioVentas = this.repositorioUsuario.create({
        nombre: "Cajero / Ventas",
        correo: "ventas@zlalalaz.com",
        contrasenaHash: contrasenaVentasHash,
        rol: RolUsuario.VENTAS,
        activo: true,
      });

      await this.repositorioUsuario.save([usuarioAdmin, usuarioVentas]);
      this.logger.log(
        "Usuarios semilla creados exitosamente (admin@zlalalaz.com, ventas@zlalalaz.com)",
      );
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

    const guardado = await this.repositorioUsuario.save(usuario);
    const { contrasenaHash: _, ...usuarioSinContrasena } = guardado;
    return usuarioSinContrasena as Omit<Usuario, "contrasenaHash">;
  }
}
