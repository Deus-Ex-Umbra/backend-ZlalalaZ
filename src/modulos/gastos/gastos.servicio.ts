import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Repository,
  FindOptionsWhere,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
} from "typeorm";
import {
  GastoCajaChica,
  FormaPagoGasto,
  DesglosePagoGasto,
} from "./entidades/gasto-caja-chica.entidad";
import { CrearGastoDto, DesglosePagoGastoDto } from "./dto/crear-gasto.dto";
import { ActualizarGastoDto } from "./dto/actualizar-gasto.dto";

@Injectable()
export class GastosServicio implements OnModuleInit {
  constructor(
    @InjectRepository(GastoCajaChica)
    private readonly gastoRepositorio: Repository<GastoCajaChica>,
  ) {}

  async onModuleInit() {
    await this.gastoRepositorio
      .query(
        "ALTER TABLE gastos_caja_chica ADD COLUMN IF NOT EXISTS desglose_pagos JSONB DEFAULT '[]'::jsonb",
      )
      .catch(() => {});
  }

  private resolverPagosGasto(
    formaPagoEntrada?: FormaPagoGasto,
    bancoEntrada?: string,
    desgloseEntrada?: DesglosePagoGastoDto[],
  ): {
    formaPago: FormaPagoGasto;
    banco: string | null;
    desglosePagos: DesglosePagoGasto[];
  } {
    if (desgloseEntrada && desgloseEntrada.length > 0) {
      const lineas: DesglosePagoGasto[] = desgloseEntrada
        .filter((l) => Number(l.monto) > 0)
        .map((l) => ({
          metodo: l.metodo.trim(),
          monto: Number(Number(l.monto).toFixed(2)),
          banco: l.banco?.trim() || null,
        }));

      if (lineas.length > 0) {
        const bancosUnicos = Array.from(
          new Set(
            lineas
              .map((l) => l.banco)
              .filter((b): b is string => Boolean(b)),
          ),
        );
        const formaPago =
          lineas.length > 1
            ? FormaPagoGasto.MIXTO
            : ((Object.values(FormaPagoGasto).includes(
                lineas[0].metodo as FormaPagoGasto,
              )
                ? lineas[0].metodo
                : formaPagoEntrada || FormaPagoGasto.EFECTIVO) as FormaPagoGasto);
        return {
          formaPago,
          banco: bancosUnicos.length > 0 ? bancosUnicos.join(" / ") : null,
          desglosePagos: lineas,
        };
      }
    }

    const formaFinal = formaPagoEntrada || FormaPagoGasto.EFECTIVO;
    const bancoFinal = bancoEntrada ? bancoEntrada.trim() : null;
    return {
      formaPago: formaFinal,
      banco: bancoFinal,
      desglosePagos: [],
    };
  }

  /**
   * Normaliza una fecha de filtro (`YYYY-MM-DD` o ISO datetime) a `YYYY-MM-DD`.
   * Los ISO con zona horaria se convierten a fecha local de Bolivia (UTC-4).
   */
  private normalizarFechaFiltro(valor?: string): string | undefined {
    const texto = (valor || "").trim();
    if (!texto) return undefined;

    const soloFecha = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
    let resultado: string | undefined;

    if (soloFecha) {
      resultado = texto;
    } else {
      const ms = Date.parse(texto);
      if (!Number.isNaN(ms)) {
        const tieneZona = /(Z|[+-]\d{2}:?\d{2})$/i.test(texto);
        resultado = tieneZona
          ? new Date(ms - 4 * 60 * 60 * 1000).toISOString().slice(0, 10)
          : texto.slice(0, 10);
      }
    }

    const partes = resultado ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(resultado) : null;
    if (partes) {
      const [, a, m, d] = partes.map(Number);
      const control = new Date(Date.UTC(a, m - 1, d));
      if (
        control.getUTCFullYear() === a &&
        control.getUTCMonth() === m - 1 &&
        control.getUTCDate() === d
      ) {
        return resultado;
      }
    }

    throw new BadRequestException({
      codigo: "ERR-GAST-005",
      mensaje: `Fecha de filtro inválida: ${texto}`,
    });
  }

  async obtenerTodos(
    opciones: {
      pagina?: number;
      limite?: number;
      fechaInicio?: string;
      fechaFin?: string;
    } = {},
  ) {
    const pagina = opciones.pagina || 1;
    const limite = Math.min(Math.max(opciones.limite || 50, 1), 500);
    const skip = (pagina - 1) * limite;

    const fechaInicio = this.normalizarFechaFiltro(opciones.fechaInicio);
    const fechaFin = this.normalizarFechaFiltro(opciones.fechaFin);

    if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
      throw new BadRequestException({
        codigo: "ERR-GAST-006",
        mensaje: "La fecha inicial del filtro es posterior a la fecha final",
      });
    }

    const where: FindOptionsWhere<GastoCajaChica> = {};
    if (fechaInicio && fechaFin) {
      where.fechaGasto = Between(
        fechaInicio as unknown as Date,
        fechaFin as unknown as Date,
      );
    } else if (fechaInicio) {
      where.fechaGasto = MoreThanOrEqual(fechaInicio as unknown as Date);
    } else if (fechaFin) {
      where.fechaGasto = LessThanOrEqual(fechaFin as unknown as Date);
    }

    const [elementos, total] = await this.gastoRepositorio.findAndCount({
      where,
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
    const pago = this.resolverPagosGasto(
      dto.formaPago,
      dto.banco,
      dto.desglosePagos,
    );
    const nuevoGasto = this.gastoRepositorio.create({
      ...dto,
      fechaGasto: new Date(dto.fechaGasto),
      formaPago: pago.formaPago,
      banco: pago.banco,
      desglosePagos: pago.desglosePagos,
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
    if (dto.desglosePagos && dto.desglosePagos.length > 0) {
      const pago = this.resolverPagosGasto(
        dto.formaPago,
        dto.banco,
        dto.desglosePagos,
      );
      gasto.formaPago = pago.formaPago;
      gasto.banco = pago.banco;
      gasto.desglosePagos = pago.desglosePagos;
    } else {
      if (dto.formaPago !== undefined) {
        gasto.formaPago = dto.formaPago;
      }
      if (dto.banco !== undefined) {
        gasto.banco = dto.banco ? dto.banco.trim() : null;
      }
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
