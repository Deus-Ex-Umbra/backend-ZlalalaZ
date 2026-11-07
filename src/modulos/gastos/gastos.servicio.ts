import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  GastoCajaChica,
  FormaPagoGasto,
} from "./entidades/gasto-caja-chica.entidad";
import { CrearGastoDto } from "./dto/crear-gasto.dto";
import { ActualizarGastoDto } from "./dto/actualizar-gasto.dto";

@Injectable()
export class GastosServicio {
  constructor(
    @InjectRepository(GastoCajaChica)
    private readonly gastoRepositorio: Repository<GastoCajaChica>,
  ) {}

  async obtenerTodos(opciones: { pagina?: number; limite?: number } = {}) {
    const pagina = opciones.pagina || 1;
    const limite = Math.min(Math.max(opciones.limite || 50, 1), 500);
    const skip = (pagina - 1) * limite;

    const [elementos, total] = await this.gastoRepositorio.findAndCount({
      order: { fechaGasto: "DESC", creadoEn: "DESC" },
      skip,
      take: limite,
    });

    return {
      elementos,
      total,
      pagina,
      limite,
      totalPaginas: Math.ceil(total / limite) || 1,
    };
  }

  async registrar(dto: CrearGastoDto): Promise<GastoCajaChica> {
    const nuevoGasto = this.gastoRepositorio.create({
      ...dto,
      fechaGasto: new Date(dto.fechaGasto),
      formaPago: dto.formaPago || FormaPagoGasto.EFECTIVO,
      banco: dto.banco ? dto.banco.trim() : null,
    });

    return this.gastoRepositorio.save(nuevoGasto);
  }

  async actualizar(
    id: string,
    dto: ActualizarGastoDto,
  ): Promise<GastoCajaChica> {
    const gasto = await this.gastoRepositorio.findOne({ where: { id } });
    if (!gasto) {
      throw new NotFoundException({
        codigo: "ERR-GAST-004",
        mensaje: `No se encontró el gasto de caja chica con ID: ${id}`,
      });
    }

    if (dto.fechaGasto) {
      gasto.fechaGasto = new Date(dto.fechaGasto);
    }
    if (dto.nombreEmpleado !== undefined) {
      gasto.nombreEmpleado = dto.nombreEmpleado;
    }
    const conceptoFinal = dto.conceptoMotivo || dto.concepto;
    if (conceptoFinal !== undefined) {
      gasto.conceptoMotivo = conceptoFinal;
    }
    if (dto.monto !== undefined) {
      gasto.monto = dto.monto;
    }
    if (dto.formaPago !== undefined) {
      gasto.formaPago = dto.formaPago;
    }
    if (dto.banco !== undefined) {
      gasto.banco = dto.banco ? dto.banco.trim() : null;
    }
    if (dto.autorizadoPor !== undefined) {
      gasto.autorizadoPor = dto.autorizadoPor;
    }
    if (dto.notas !== undefined) {
      gasto.notas = dto.notas;
    }

    return this.gastoRepositorio.save(gasto);
  }

  async obtenerTotalGastos(): Promise<number> {
    const resultado = await this.gastoRepositorio
      .createQueryBuilder("gasto")
      .select("SUM(gasto.monto)", "total")
      .getRawOne();

    return Number(resultado?.total || 0);
  }
}
