import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, LessThanOrEqual } from 'typeorm';
import { Calzado } from './entidades/calzado.entidad';
import { CrearCalzadoDto } from './dto/crear-calzado.dto';
import { ActualizarCalzadoDto } from './dto/actualizar-calzado.dto';

export interface FiltrosCalzados {
  busqueda?: string;
  categoria?: string;
  talla?: string;
  soloStockCritico?: boolean;
  pagina?: number;
  limite?: number;
}

@Injectable()
export class CalzadosServicio {
  constructor(
    @InjectRepository(Calzado)
    private readonly calzadoRepositorio: Repository<Calzado>,
  ) {}

  async obtenerTodos(filtros: FiltrosCalzados = {}) {
    const { busqueda, categoria, talla, soloStockCritico, pagina = 1, limite = 50 } = filtros;
    const query = this.calzadoRepositorio.createQueryBuilder('calzado');

    query.where('calzado.activo = :activo', { activo: true });

    if (busqueda) {
      query.andWhere(
        '(LOWER(calzado.nombreProducto) LIKE :busqueda OR LOWER(calzado.codigoProducto) LIKE :busqueda OR LOWER(calzado.categoria) LIKE :busqueda)',
        { busqueda: `%${busqueda.toLowerCase()}%` },
      );
    }

    if (categoria) {
      query.andWhere('calzado.categoria = :categoria', { categoria });
    }

    if (talla) {
      query.andWhere('calzado.talla = :talla', { talla });
    }

    if (soloStockCritico) {
      query.andWhere('calzado.stockActual <= calzado.alertaStockMinimo');
    }

    query.orderBy('calzado.codigoProducto', 'ASC');
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
    const calzado = await this.calzadoRepositorio.findOne({ where: { id, activo: true } });
    if (!calzado) {
      throw new NotFoundException({
        codigo: 'ERR-CALZ-001',
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
        codigo: 'ERR-CALZ-001',
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
        codigo: 'ERR-CALZ-005',
        mensaje: `Ya existe un calzado registrado con el código ${dto.codigoProducto}`,
      });
    }

    const stockInicial = dto.stockInicial ?? 0;
    const nuevo = this.calzadoRepositorio.create({
      ...dto,
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
    return this.calzadoRepositorio.save(calzado);
  }

  async ajustarStock(id: string, delta: number): Promise<Calzado> {
    const calzado = await this.obtenerPorId(id);
    calzado.stockActual += delta;
    return this.calzadoRepositorio.save(calzado);
  }

  async obtenerStockCritico(): Promise<Calzado[]> {
    return this.calzadoRepositorio
      .createQueryBuilder('calzado')
      .where('calzado.activo = :activo', { activo: true })
      .andWhere('calzado.stockActual <= calzado.alertaStockMinimo')
      .orderBy('calzado.stockActual', 'ASC')
      .getMany();
  }
}
