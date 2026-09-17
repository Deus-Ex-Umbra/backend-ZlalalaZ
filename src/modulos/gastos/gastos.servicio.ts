import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GastoCajaChica } from './entidades/gasto-caja-chica.entidad';
import { CrearGastoDto } from './dto/crear-gasto.dto';

@Injectable()
export class GastosServicio {
  constructor(
    @InjectRepository(GastoCajaChica)
    private readonly gastoRepositorio: Repository<GastoCajaChica>,
  ) {}

  async obtenerTodos() {
    return this.gastoRepositorio.find({
      order: { fechaGasto: 'DESC', creadoEn: 'DESC' },
    });
  }

  async registrar(dto: CrearGastoDto): Promise<GastoCajaChica> {
    const nuevoGasto = this.gastoRepositorio.create({
      ...dto,
      fechaGasto: new Date(dto.fechaGasto),
      formaPago: dto.formaPago || 'Efectivo',
    });

    return this.gastoRepositorio.save(nuevoGasto);
  }

  async obtenerTotalGastos(): Promise<number> {
    const resultado = await this.gastoRepositorio
      .createQueryBuilder('gasto')
      .select('SUM(gasto.monto)', 'total')
      .getRawOne();

    return Number(resultado?.total || 0);
  }
}
