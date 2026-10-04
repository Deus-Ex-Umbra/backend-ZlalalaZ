import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  OnModuleInit,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Calzado } from "./entidades/calzado.entidad";
import { CrearCalzadoDto } from "./dto/crear-calzado.dto";
import { ActualizarCalzadoDto } from "./dto/actualizar-calzado.dto";
import {
  MARCA_SIN_DEFINIR,
  detectarTipoProducto,
  extraerMarca,
  limpiarEspacios,
  normalizarNombreProducto,
  normalizarTalla,
} from "../../comun/utilidades/normalizacion-catalogo";

export interface FiltrosCalzados {
  busqueda?: string;
  categoria?: string;
  marca?: string;
  talla?: string;
  soloStockCritico?: boolean;
  pagina?: number;
  limite?: number;
}

@Injectable()
export class CalzadosServicio implements OnModuleInit {
  private readonly registro = new Logger(CalzadosServicio.name);

  constructor(
    @InjectRepository(Calzado)
    private readonly calzadoRepositorio: Repository<Calzado>,
  ) {}

  /**
   * Completa marca y tipo de producto en registros anteriores a DAT-003
   * y limpia espacios del nombre. Es idempotente.
   */
  async onModuleInit(): Promise<void> {
    const pendientes = await this.calzadoRepositorio.find({
      where: { marca: MARCA_SIN_DEFINIR },
    });
    if (pendientes.length === 0) return;

    const modificados: Calzado[] = [];
    for (const calzado of pendientes) {
      const original = JSON.stringify([
        calzado.nombreProducto,
        calzado.marca,
        calzado.tipoProducto,
        calzado.talla,
      ]);
      calzado.nombreProducto = normalizarNombreProducto(calzado.nombreProducto);
      calzado.marca = extraerMarca(calzado.nombreProducto);
      calzado.tipoProducto = detectarTipoProducto(calzado.nombreProducto);
      calzado.talla = normalizarTalla(calzado.talla, calzado.tipoProducto);
      const nuevo = JSON.stringify([
        calzado.nombreProducto,
        calzado.marca,
        calzado.tipoProducto,
        calzado.talla,
      ]);
      if (original !== nuevo) modificados.push(calzado);
    }
    if (modificados.length === 0) return;
    await this.calzadoRepositorio.save(modificados);
    this.registro.log(
      `Catálogo normalizado: ${modificados.length} productos actualizados`,
    );
  }

  async obtenerTodos(filtros: FiltrosCalzados = {}) {
    const {
      busqueda,
      categoria,
      marca,
      talla,
      soloStockCritico,
      pagina = 1,
      limite = 50,
    } = filtros;
    const query = this.calzadoRepositorio.createQueryBuilder("calzado");

    query.where("calzado.activo = :activo", { activo: true });

    if (busqueda) {
      query.andWhere(
        "(LOWER(calzado.nombreProducto) LIKE :busqueda OR LOWER(calzado.codigoProducto) LIKE :busqueda OR LOWER(calzado.categoria) LIKE :busqueda OR LOWER(calzado.marca) LIKE :busqueda)",
        { busqueda: `%${busqueda.toLowerCase()}%` },
      );
    }

    if (categoria) {
      query.andWhere("calzado.categoria = :categoria", { categoria });
    }

    if (marca) {
      query.andWhere("calzado.marca = :marca", { marca });
    }

    if (talla) {
      query.andWhere("calzado.talla = :talla", { talla });
    }

    if (soloStockCritico) {
      query.andWhere("calzado.stockActual <= calzado.alertaStockMinimo");
    }

    query.orderBy("calzado.codigoProducto", "ASC");
    query.skip((pagina - 1) * limite);
    query.take(limite);

    const [elementos, total] = await query.getManyAndCount();

    return {
      elementos,
      total,
      pagina,
      limite,
      totalPaginas: Math.ceil(total / limite),
    };
  }

  async obtenerPorId(id: string): Promise<Calzado> {
    const calzado = await this.calzadoRepositorio.findOne({
      where: { id, activo: true },
    });
    if (!calzado) {
      throw new NotFoundException({
        codigo: "ERR-CALZ-001",
        mensaje: `Calzado con ID ${id} no encontrado`,
      });
    }
    return calzado;
  }

  async obtenerPorCodigo(codigoProducto: string): Promise<Calzado> {
    const calzado = await this.calzadoRepositorio.findOne({
      where: { codigoProducto, activo: true },
    });
    if (!calzado) {
      throw new NotFoundException({
        codigo: "ERR-CALZ-001",
        mensaje: `Calzado con código ${codigoProducto} no encontrado`,
      });
    }
    return calzado;
  }

  async crear(dto: CrearCalzadoDto): Promise<Calzado> {
    const existente = await this.calzadoRepositorio.findOne({
      where: { codigoProducto: dto.codigoProducto },
    });

    if (existente) {
      throw new ConflictException({
        codigo: "ERR-CALZ-005",
        mensaje: `Ya existe un calzado registrado con el código ${dto.codigoProducto}`,
      });
    }

    const stockInicial = dto.stockInicial ?? 0;
    const nombreProducto = normalizarNombreProducto(dto.nombreProducto);
    const tipoProducto = dto.tipoProducto ?? detectarTipoProducto(nombreProducto);
    const talla = normalizarTalla(dto.talla, tipoProducto);

    if (!talla) {
      throw new BadRequestException({
        codigo: "ERR-CALZ-006",
        mensaje: "El calzado requiere una talla (solo los accesorios pueden omitirla)",
      });
    }

    const nuevo = this.calzadoRepositorio.create({
      ...dto,
      nombreProducto,
      marca: limpiarEspacios(dto.marca) || extraerMarca(nombreProducto),
      tipoProducto,
      talla,
      stockInicial,
      stockActual: stockInicial,
      totalIngresado: 0,
      totalVendido: 0,
    });

    return this.calzadoRepositorio.save(nuevo);
  }

  async actualizar(id: string, dto: ActualizarCalzadoDto): Promise<Calzado> {
    const calzado = await this.obtenerPorId(id);
    Object.assign(calzado, dto);
    calzado.nombreProducto = normalizarNombreProducto(calzado.nombreProducto);
    calzado.marca = limpiarEspacios(calzado.marca) || extraerMarca(calzado.nombreProducto);
    calzado.talla = normalizarTalla(calzado.talla, calzado.tipoProducto);
    return this.calzadoRepositorio.save(calzado);
  }

  async obtenerMarcas(): Promise<string[]> {
    const filas = await this.calzadoRepositorio
      .createQueryBuilder("calzado")
      .select("DISTINCT calzado.marca", "marca")
      .where("calzado.activo = :activo", { activo: true })
      .orderBy("calzado.marca", "ASC")
      .getRawMany<{ marca: string }>();
    return filas.map((fila) => fila.marca);
  }

  async ajustarStock(id: string, delta: number): Promise<Calzado> {
    const calzado = await this.obtenerPorId(id);
    calzado.stockActual += delta;
    return this.calzadoRepositorio.save(calzado);
  }

  async obtenerStockCritico(): Promise<Calzado[]> {
    return this.calzadoRepositorio
      .createQueryBuilder("calzado")
      .where("calzado.activo = :activo", { activo: true })
      .andWhere("calzado.stockActual <= calzado.alertaStockMinimo")
      .orderBy("calzado.stockActual", "ASC")
      .getMany();
  }
}
