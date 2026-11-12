import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Calzado } from "../calzados/entidades/calzado.entidad";
import { Venta, MetodoPago } from "../ventas/entidades/venta.entidad";
import { DetalleVenta } from "../ventas/entidades/detalle-venta.entidad";
import { IngresoMercancia } from "../ingresos/entidades/ingreso-mercancia.entidad";
import { GastoCajaChica } from "../gastos/entidades/gasto-caja-chica.entidad";
import {
  SegmentoTalla,
  clasificarTallaIndividual,
  limpiarEspacios,
  normalizarCodigoProducto,
} from "../../comun/utilidades/normalizacion-catalogo";

const redondear = (valor: number): number => Math.round(valor * 100) / 100;

export interface FiltroRangoFechas {
  fechaInicio?: string;
  fechaFin?: string;
}

export interface VarianteTallaFicha {
  id?: string;
  codigoProducto: string;
  talla: string;
  stockActual: number;
}

export interface MetricasGenerales {
  ventasNetasBs: number;
  costoVendidoBs: number;
  gananciaBrutaBs: number;
  gananciaNetaBs: number;
  costoMercanciaIngresadaBs: number;
  totalGastosCajaChicaBs: number;
  valoracionStockBs: number;
  costoStockAlmacenBs: number;

  totalVentasBs: number;
  totalCostoMercanciaBs: number;
  gananciaBrutaEstimadaBs: number;

  numeroProductosDistintos: number;
  totalUnidadesEnStock: number;
  totalUnidadesVendidas: number;
  totalUnidadesIngresadas: number;
  numeroTransaccionesVenta: number;
  numeroRegistrosGastos: number;

  ventasPorMetodoPago: Record<MetodoPago, number>;
  ventasEfectivoCantidad: number;
  ventasQRCantidad: number;
  ventasTarjetaCantidad: number;
  ventasTransferenciaCantidad: number;
  ventasMixtoCantidad?: number;

  metodoPagoMasUsado: {
    metodo: string;
    cantidadTransacciones: number;
    montoTotalBs: number;
  };
  tallaMayorStock: {
    talla: string;
    unidades: number;
    segmento: string;
  };
  stockPorSegmento: Record<SegmentoTalla, number>;

  productoMasVendido?: {
    nombre: string;
    codigo: string;
    unidades: number;
  };
  productoMayorIngreso?: {
    nombre: string;
    codigo: string;
    ingresoBs: number;
  };
  productoMenorStock?: {
    nombre: string;
    codigo: string;
    stock: number;
  };
  topVendidos?: {
    nombre: string;
    codigo: string;
    unidades: number;
  }[];
}

export interface FichaConsultaProducto {
  codigoProducto: string;
  nombreProducto: string;
  categoria: string;
  talla: string;
  stockPorTalla?: Record<string, number> | null;
  segmentoTalla?: string | null;
  color: string;
  precioCompra: number;
  precioVenta: number;
  stockActual: number;
  totalIngresado: number;
  totalVendido: number;
  ingresosGeneradosBs: number;
  costoTotalCompradoBs: number;
  utilidadEstimadaBs: number;
  ultimaFechaVenta?: string;
  fotoUrl?: string;
  otrasTallas?: VarianteTallaFicha[];
}

@Injectable()
export class PanelCentralServicio {
  constructor(
    @InjectRepository(Calzado)
    private readonly calzadoRepositorio: Repository<Calzado>,
    @InjectRepository(Venta)
    private readonly ventaRepositorio: Repository<Venta>,
    @InjectRepository(DetalleVenta)
    private readonly detalleVentaRepositorio: Repository<DetalleVenta>,
    @InjectRepository(IngresoMercancia)
    private readonly ingresoRepositorio: Repository<IngresoMercancia>,
    @InjectRepository(GastoCajaChica)
    private readonly gastoRepositorio: Repository<GastoCajaChica>,
  ) {}

  async obtenerMetricas(
    filtro: FiltroRangoFechas = {},
  ): Promise<MetricasGenerales> {
    const { fechaInicio, fechaFin } = filtro;

    if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
      throw new BadRequestException({
        codigo: "ERR-PAN-001",
        mensaje: "La fecha inicial del filtro es posterior a la fecha final",
      });
    }

    const qVentas = this.ventaRepositorio.createQueryBuilder("venta");
    const qVentasLista = this.ventaRepositorio
      .createQueryBuilder("venta")
      .select([
        "venta.id",
        "venta.formaPago",
        "venta.totalVenta",
        "venta.desglosePagos",
      ]);

    if (fechaInicio) {
      qVentas.andWhere("venta.fechaVenta >= :fechaInicio", { fechaInicio });
      qVentasLista.andWhere("venta.fechaVenta >= :fechaInicio", {
        fechaInicio,
      });
    }
    if (fechaFin) {
      qVentas.andWhere("venta.fechaVenta <= :fechaFin", { fechaFin });
      qVentasLista.andWhere("venta.fechaVenta <= :fechaFin", { fechaFin });
    }

    const qCostoVendido = this.detalleVentaRepositorio
      .createQueryBuilder("detalle")
      .innerJoin("detalle.venta", "venta")
      .leftJoin("detalle.calzado", "calzado");

    if (fechaInicio) {
      qCostoVendido.andWhere("venta.fechaVenta >= :fechaInicio", {
        fechaInicio,
      });
    }
    if (fechaFin) {
      qCostoVendido.andWhere("venta.fechaVenta <= :fechaFin", { fechaFin });
    }

    const qGastos = this.gastoRepositorio.createQueryBuilder("gasto");
    if (fechaInicio) {
      qGastos.andWhere("gasto.fechaGasto >= :fechaInicio", { fechaInicio });
    }
    if (fechaFin) {
      qGastos.andWhere("gasto.fechaGasto <= :fechaFin", { fechaFin });
    }

    const qMasVendido = this.detalleVentaRepositorio
      .createQueryBuilder("detalle")
      .innerJoin("detalle.venta", "venta");

    if (fechaInicio) {
      qMasVendido.andWhere("venta.fechaVenta >= :fechaInicio", { fechaInicio });
    }
    if (fechaFin) {
      qMasVendido.andWhere("venta.fechaVenta <= :fechaFin", { fechaFin });
    }

    const qMayorIngreso = this.detalleVentaRepositorio
      .createQueryBuilder("detalle")
      .innerJoin("detalle.venta", "venta");

    if (fechaInicio) {
      qMayorIngreso.andWhere("venta.fechaVenta >= :fechaInicio", {
        fechaInicio,
      });
    }
    if (fechaFin) {
      qMayorIngreso.andWhere("venta.fechaVenta <= :fechaFin", { fechaFin });
    }

    const [
      resVentas,
      resCostoVendido,
      resGastos,
      ventasEnRango,
      qCalzados,
      calzadosActivosTallas,
      resMasVendido,
      resMayorIngreso,
      menorStock,
      topVendidos,
    ] = await Promise.all([
      qVentas
        .select("SUM(venta.totalVenta)", "total")
        .addSelect("COUNT(venta.id)", "conteo")
        .getRawOne(),
      qCostoVendido
        .select(
          "SUM(detalle.cantidad * COALESCE(NULLIF(detalle.costoUnitario, 0), calzado.precioCompra, 0))",
          "costoTotal",
        )
        .getRawOne(),
      qGastos
        .select("SUM(gasto.monto)", "total")
        .addSelect("COUNT(gasto.id)", "conteo")
        .getRawOne(),
      qVentasLista.getMany(),
      this.calzadoRepositorio
        .createQueryBuilder("c")
        .where("c.activo = :activo", { activo: true })
        .select("COUNT(c.id)", "distintos")
        .addSelect("SUM(c.stockActual)", "stockTotal")
        .addSelect("SUM(c.totalVendido)", "vendidasTotal")
        .addSelect("SUM(c.totalIngresado)", "ingresadasTotal")
        .addSelect("SUM(c.totalIngresado * c.precioCompra)", "costoIngresado")
        .addSelect("SUM(c.stockActual * c.precioCompra)", "valoracionStock")
        .getRawOne(),
      this.calzadoRepositorio
        .createQueryBuilder("c")
        .select([
          "c.id",
          "c.talla",
          "c.stockPorTalla",
          "c.segmentoTalla",
          "c.stockActual",
          "c.tipoProducto",
          "c.esExtra",
        ])
        .where("c.activo = :activo", { activo: true })
        .getMany(),
      qMasVendido
        .select("detalle.codigoProducto", "codigo")
        .addSelect("detalle.nombreProducto", "nombre")
        .addSelect("SUM(detalle.cantidad)", "unidades")
        .groupBy("detalle.codigoProducto")
        .addGroupBy("detalle.nombreProducto")
        .orderBy('"unidades"', "DESC")
        .limit(1)
        .getRawOne(),
      qMayorIngreso
        .select("detalle.codigoProducto", "codigo")
        .addSelect("detalle.nombreProducto", "nombre")
        .addSelect("SUM(detalle.total)", "ingreso")
        .groupBy("detalle.codigoProducto")
        .addGroupBy("detalle.nombreProducto")
        .orderBy('"ingreso"', "DESC")
        .limit(1)
        .getRawOne(),
      this.calzadoRepositorio
        .createQueryBuilder("c")
        .select([
          "c.id",
          "c.nombreProducto",
          "c.codigoProducto",
          "c.stockActual",
        ])
        .where("c.activo = :activo", { activo: true })
        .orderBy("c.stockActual", "ASC")
        .getOne(),
      this.calzadoRepositorio
        .createQueryBuilder("c")
        .select([
          "c.id",
          "c.nombreProducto",
          "c.codigoProducto",
          "c.totalVendido",
        ])
        .where("c.activo = :activo", { activo: true })
        .andWhere("c.totalVendido > 0")
        .orderBy("c.totalVendido", "DESC")
        .limit(5)
        .getMany(),
    ]);

    const ventasNetasBs = redondear(Number(resVentas?.total || 0));
    const numeroTransaccionesVenta = Number(resVentas?.conteo || 0);
    const costoVendidoBs = redondear(Number(resCostoVendido?.costoTotal || 0));
    const totalGastosCajaChicaBs = redondear(Number(resGastos?.total || 0));
    const numeroRegistrosGastos = Number(resGastos?.conteo || 0);

    const gananciaBrutaBs = redondear(ventasNetasBs - costoVendidoBs);
    const gananciaNetaBs = redondear(gananciaBrutaBs - totalGastosCajaChicaBs);

    const ventasPorMetodoPago: Record<MetodoPago, number> = {
      [MetodoPago.EFECTIVO]: 0,
      [MetodoPago.QR]: 0,
      [MetodoPago.TARJETA]: 0,
      [MetodoPago.TRANSFERENCIA]: 0,
      [MetodoPago.MIXTO]: 0,
    };

    const desagregadoMetodos: Record<
      string,
      { cantidadTransacciones: number; montoTotalBs: number }
    > = {
      [MetodoPago.EFECTIVO]: { cantidadTransacciones: 0, montoTotalBs: 0 },
      [MetodoPago.QR]: { cantidadTransacciones: 0, montoTotalBs: 0 },
      [MetodoPago.TARJETA]: { cantidadTransacciones: 0, montoTotalBs: 0 },
      [MetodoPago.TRANSFERENCIA]: { cantidadTransacciones: 0, montoTotalBs: 0 },
    };

    for (const v of ventasEnRango) {
      const formaCruda = limpiarEspacios(v.formaPago);
      const metodoEnum = Object.values(MetodoPago).find(
        (m) => m.toLowerCase() === formaCruda.toLowerCase(),
      );
      if (metodoEnum) {
        ventasPorMetodoPago[metodoEnum] += 1;
      }

      if (Array.isArray(v.desglosePagos) && v.desglosePagos.length > 0) {
        for (const tramo of v.desglosePagos) {
          const mLimpio =
            Object.values(MetodoPago).find(
              (m) =>
                m.toLowerCase() === limpiarEspacios(tramo.metodo).toLowerCase(),
            ) ||
            limpiarEspacios(tramo.metodo) ||
            MetodoPago.EFECTIVO;
          if (!desagregadoMetodos[mLimpio]) {
            desagregadoMetodos[mLimpio] = {
              cantidadTransacciones: 0,
              montoTotalBs: 0,
            };
          }
          desagregadoMetodos[mLimpio].cantidadTransacciones += 1;
          desagregadoMetodos[mLimpio].montoTotalBs = redondear(
            desagregadoMetodos[mLimpio].montoTotalBs +
              Number(tramo.monto || 0),
          );
        }
      } else {
        const mUnico = metodoEnum || MetodoPago.EFECTIVO;
        if (!desagregadoMetodos[mUnico]) {
          desagregadoMetodos[mUnico] = {
            cantidadTransacciones: 0,
            montoTotalBs: 0,
          };
        }
        desagregadoMetodos[mUnico].cantidadTransacciones += 1;
        desagregadoMetodos[mUnico].montoTotalBs = redondear(
          desagregadoMetodos[mUnico].montoTotalBs + Number(v.totalVenta || 0),
        );
      }
    }

    const metodoOrdenado = Object.entries(desagregadoMetodos).sort((a, b) => {
      if (b[1].cantidadTransacciones !== a[1].cantidadTransacciones) {
        return b[1].cantidadTransacciones - a[1].cantidadTransacciones;
      }
      return b[1].montoTotalBs - a[1].montoTotalBs;
    })[0];

    const metodoPagoMasUsado = metodoOrdenado
      ? {
          metodo: metodoOrdenado[0],
          cantidadTransacciones: metodoOrdenado[1].cantidadTransacciones,
          montoTotalBs: metodoOrdenado[1].montoTotalBs,
        }
      : {
          metodo: MetodoPago.EFECTIVO,
          cantidadTransacciones: 0,
          montoTotalBs: 0,
        };

    // Acumular stock por talla y por segmento
    const acumuladoPorTalla: Record<string, number> = {};
    const stockPorSegmento: Record<SegmentoTalla, number> = {
      BEBE: 0,
      NINO: 0,
      JUVENIL: 0,
      ADULTO: 0,
      UNICA: 0,
    };

    for (const calz of calzadosActivosTallas) {
      const tieneMapa =
        calz.stockPorTalla &&
        typeof calz.stockPorTalla === "object" &&
        Object.keys(calz.stockPorTalla).length > 0;

      if (tieneMapa && calz.stockPorTalla) {
        for (const [tallaClave, cant] of Object.entries(calz.stockPorTalla)) {
          const unidades = Math.max(0, Number(cant || 0));
          if (unidades <= 0) continue;
          const tLimpia = limpiarEspacios(tallaClave) || "Única";
          acumuladoPorTalla[tLimpia] =
            (acumuladoPorTalla[tLimpia] || 0) + unidades;
          const seg = calz.esExtra
            ? "UNICA"
            : clasificarTallaIndividual(tLimpia);
          stockPorSegmento[seg] = (stockPorSegmento[seg] || 0) + unidades;
        }
      } else {
        const unidades = Math.max(0, Number(calz.stockActual || 0));
        if (unidades <= 0) continue;
        const tLimpia = limpiarEspacios(calz.talla) || "Única";
        acumuladoPorTalla[tLimpia] =
          (acumuladoPorTalla[tLimpia] || 0) + unidades;
        const seg = calz.esExtra
          ? "UNICA"
          : clasificarTallaIndividual(tLimpia);
        stockPorSegmento[seg] = (stockPorSegmento[seg] || 0) + unidades;
      }
    }

    const tallaTopEntry = Object.entries(acumuladoPorTalla).sort(
      (a, b) => b[1] - a[1],
    )[0];

    const tallaMayorStock = tallaTopEntry
      ? {
          talla: tallaTopEntry[0],
          unidades: tallaTopEntry[1],
          segmento: clasificarTallaIndividual(tallaTopEntry[0]),
        }
      : {
          talla: "38",
          unidades: 0,
          segmento: "JUVENIL",
        };

    const numeroProductosDistintos = Number(qCalzados?.distintos || 0);
    const totalUnidadesEnStock = Number(qCalzados?.stockTotal || 0);
    const totalUnidadesVendidas = Number(qCalzados?.vendidasTotal || 0);
    const totalUnidadesIngresadas = Number(qCalzados?.ingresadasTotal || 0);
    const costoMercanciaIngresadaBs = redondear(
      Number(qCalzados?.costoIngresado || 0),
    );
    const valoracionStockBs = redondear(
      Number(qCalzados?.valoracionStock || 0),
    );
    const costoStockAlmacenBs = valoracionStockBs;

    const productoMasVendido = resMasVendido
      ? {
          nombre: resMasVendido.nombre,
          codigo: resMasVendido.codigo,
          unidades: Number(resMasVendido.unidades),
        }
      : undefined;

    const productoMayorIngreso = resMayorIngreso
      ? {
          nombre: resMayorIngreso.nombre,
          codigo: resMayorIngreso.codigo,
          ingresoBs: redondear(Number(resMayorIngreso.ingreso)),
        }
      : undefined;

    return {
      ventasNetasBs,
      costoVendidoBs,
      gananciaBrutaBs,
      gananciaNetaBs,
      costoMercanciaIngresadaBs,
      totalGastosCajaChicaBs,
      valoracionStockBs,
      costoStockAlmacenBs,

      totalVentasBs: ventasNetasBs,
      totalCostoMercanciaBs: valoracionStockBs,
      gananciaBrutaEstimadaBs: gananciaBrutaBs,

      numeroProductosDistintos,
      totalUnidadesEnStock,
      totalUnidadesVendidas,
      totalUnidadesIngresadas,
      numeroTransaccionesVenta,
      numeroRegistrosGastos,

      ventasPorMetodoPago,
      ventasEfectivoCantidad: desagregadoMetodos[MetodoPago.EFECTIVO].cantidadTransacciones,
      ventasQRCantidad: desagregadoMetodos[MetodoPago.QR].cantidadTransacciones,
      ventasTarjetaCantidad: desagregadoMetodos[MetodoPago.TARJETA].cantidadTransacciones,
      ventasTransferenciaCantidad:
        desagregadoMetodos[MetodoPago.TRANSFERENCIA].cantidadTransacciones,
      ventasMixtoCantidad: ventasPorMetodoPago[MetodoPago.MIXTO],

      metodoPagoMasUsado,
      tallaMayorStock,
      stockPorSegmento,

      productoMasVendido,
      productoMayorIngreso,
      productoMenorStock: menorStock
        ? {
            nombre: menorStock.nombreProducto,
            codigo: menorStock.codigoProducto,
            stock: Number(menorStock.stockActual),
          }
        : undefined,
      topVendidos: topVendidos.map((c: Calzado) => ({
        nombre: c.nombreProducto,
        codigo: c.codigoProducto,
        unidades: Number(c.totalVendido),
      })),
    };
  }

  async consultarFichaProducto(
    codigoProducto: string,
  ): Promise<FichaConsultaProducto | null> {
    const normalizado = normalizarCodigoProducto(codigoProducto);
    const variantesCod = new Set<string>([codigoProducto, normalizado]);
    const match = codigoProducto.match(/^p-?0*(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      variantesCod.add(`P-${num}`);
      variantesCod.add(`P${num}`);
      variantesCod.add(`P${String(num).padStart(3, "0")}`);
      variantesCod.add(`P${String(num).padStart(4, "0")}`);
    }

    const codigosMinusculas = Array.from(variantesCod).map((c) =>
      c.toLowerCase(),
    );

    const calzado = await this.calzadoRepositorio
      .createQueryBuilder("calzado")
      .where("calzado.activo = :activo", { activo: true })
      .andWhere("LOWER(calzado.codigoProducto) IN (:...codigos)", {
        codigos: codigosMinusculas,
      })
      .getOne();

    if (!calzado) return null;

    const ingresosGeneradosBs =
      Number(calzado.totalVendido) * Number(calzado.precioVenta);
    const costoTotalCompradoBs =
      (Number(calzado.stockInicial) + Number(calzado.totalIngresado)) *
      Number(calzado.precioCompra);
    const utilidadEstimadaBs =
      ingresosGeneradosBs -
      Number(calzado.totalVendido) * Number(calzado.precioCompra);

    const [ultimoDetalle, variantes] = await Promise.all([
      this.detalleVentaRepositorio
        .createQueryBuilder("detalle")
        .leftJoinAndSelect("detalle.venta", "venta")
        .where(
          "detalle.calzadoId = :calzadoId OR LOWER(detalle.codigoProducto) IN (:...codigos)",
          {
            calzadoId: calzado.id,
            codigos: codigosMinusculas,
          },
        )
        .orderBy("venta.fechaVenta", "DESC")
        .getOne(),
      this.calzadoRepositorio
        .createQueryBuilder("c")
        .where("c.activo = :activo", { activo: true })
        .andWhere("LOWER(TRIM(c.nombreProducto)) = :nombre", {
          nombre: calzado.nombreProducto.toLowerCase().trim(),
        })
        .andWhere("c.id != :id", { id: calzado.id })
        .getMany(),
    ]);

    const mapaTallas = new Map<
      string,
      {
        id: string;
        codigoProducto: string;
        talla: string;
        stockActual: number;
        esMismaEdicion: boolean;
      }
    >();

    // También incluir las tallas propias en stockPorTalla si tiene múltiples tallas
    if (
      calzado.stockPorTalla &&
      typeof calzado.stockPorTalla === "object" &&
      Object.keys(calzado.stockPorTalla).length > 1
    ) {
      for (const [tClave, cant] of Object.entries(calzado.stockPorTalla)) {
        mapaTallas.set(tClave.trim(), {
          id: calzado.id,
          codigoProducto: calzado.codigoProducto,
          talla: tClave.trim(),
          stockActual: Number(cant || 0),
          esMismaEdicion: true,
        });
      }
    }

    for (const v of variantes) {
      const tallaLimpia = v.talla ? v.talla.trim() : "";
      if (!tallaLimpia) continue;

      if (tallaLimpia.toLowerCase() === calzado.talla.trim().toLowerCase()) {
        continue;
      }

      const esMismaEdicion =
        v.categoria.toLowerCase().trim() ===
        calzado.categoria.toLowerCase().trim();
      const previa = mapaTallas.get(tallaLimpia);

      if (!previa) {
        mapaTallas.set(tallaLimpia, {
          id: v.id,
          codigoProducto: v.codigoProducto,
          talla: tallaLimpia,
          stockActual: Number(v.stockActual),
          esMismaEdicion,
        });
      } else {
        previa.stockActual += Number(v.stockActual);
        if (!previa.esMismaEdicion && esMismaEdicion) {
          previa.id = v.id;
          previa.codigoProducto = v.codigoProducto;
          previa.esMismaEdicion = true;
        } else if (previa.stockActual <= 0 && Number(v.stockActual) > 0) {
          previa.id = v.id;
          previa.codigoProducto = v.codigoProducto;
        }
      }
    }

    const extraerNumeroTalla = (t: string): number => {
      const limpio = t.replace(/\D/g, "");
      const n = parseInt(limpio, 10);
      return isNaN(n) ? 999 : n;
    };

    const otrasTallas: VarianteTallaFicha[] = Array.from(mapaTallas.values())
      .map(({ id, codigoProducto, talla, stockActual }) => ({
        id,
        codigoProducto,
        talla,
        stockActual,
      }))
      .sort((a, b) => {
        const numA = extraerNumeroTalla(a.talla);
        const numB = extraerNumeroTalla(b.talla);
        if (numA !== numB) return numA - numB;
        return a.talla.localeCompare(b.talla);
      });

    return {
      codigoProducto: calzado.codigoProducto,
      nombreProducto: calzado.nombreProducto,
      categoria: calzado.categoria,
      talla: calzado.talla,
      stockPorTalla: calzado.stockPorTalla,
      segmentoTalla: calzado.segmentoTalla,
      color: calzado.color,
      precioCompra: Number(calzado.precioCompra),
      precioVenta: Number(calzado.precioVenta),
      stockActual: calzado.stockActual,
      totalIngresado: calzado.totalIngresado,
      totalVendido: calzado.totalVendido,
      ingresosGeneradosBs,
      costoTotalCompradoBs,
      utilidadEstimadaBs,
      ultimaFechaVenta: ultimoDetalle?.venta?.fechaVenta
        ? new Date(ultimoDetalle.venta.fechaVenta).toISOString().split("T")[0]
        : undefined,
      fotoUrl: calzado.fotoUrl,
      otrasTallas,
    };
  }

  async obtenerFichaCalzado(
    codigoProducto: string,
  ): Promise<FichaConsultaProducto | null> {
    return this.consultarFichaProducto(codigoProducto);
  }
}
