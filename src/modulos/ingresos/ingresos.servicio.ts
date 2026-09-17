import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { IngresoMercancia } from './entidades/ingreso-mercancia.entidad';
import { Calzado } from '../calzados/entidades/calzado.entidad';
import { CrearIngresoDto } from './dto/crear-ingreso.dto';

@Injectable()
export class IngresosServicio {
  constructor(
    @InjectRepository(IngresoMercancia)
    private readonly ingresoRepositorio: Repository<IngresoMercancia>,
    @InjectRepository(Calzado)
    private readonly calzadoRepositorio: Repository<Calzado>,
    private readonly dataSource: DataSource,
  ) {}

  async obtenerTodos() {
    return this.ingresoRepositorio.find({
      relations: ['calzado'],
      order: { fechaIngreso: 'DESC', creadoEn: 'DESC' },
    });
  }

  async registrar(dto: CrearIngresoDto): Promise<IngresoMercancia> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const calzado = await queryRunner.manager.findOne(Calzado, {
        where: { codigoProducto: dto.codigoProducto, activo: true },
      });

      if (!calzado) {
        throw new NotFoundException({
          codigo: 'ERR-ING-003',
          mensaje: `No existe calzado registrado con código ${dto.codigoProducto}`,
        });
      }

      // Actualizar stock del calzado
      calzado.totalIngresado += dto.cantidad;
      calzado.stockActual += dto.cantidad;
      if (dto.precioCompraUnitario > 0) calzado.precioCompra = dto.precioCompraUnitario;
      if (dto.precioVentaUnitario > 0) calzado.precioVenta = dto.precioVentaUnitario;

      await queryRunner.manager.save(calzado);

      // Crear el registro de ingreso
      const nuevoIngreso = queryRunner.manager.create(IngresoMercancia, {
        ...dto,
        fechaIngreso: new Date(dto.fechaIngreso),
        calzadoId: calzado.id,
      });

      const ingresoGuardado = await queryRunner.manager.save(nuevoIngreso);
      await queryRunner.commitTransaction();

      return ingresoGuardado;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
