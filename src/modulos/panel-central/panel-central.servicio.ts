import {
  Injectable,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Calzado } from "../calzados/entidades/calzado.entidad";
import { Venta, MetodoPago } from "../ventas/entidades/venta.entidad";
import { DetalleVenta } from "../ventas/entidades/detalle-venta.entidad";
import { IngresoMercancia } from "../ingresos/entidades/ingreso-mercancia.entidad";
import { GastoCajaChica } from "../gastos/entidades/gasto-caja-chica.entidad";

const redondear = (valor: number): number => Math.round(valor * 100) / 100;

export interface FiltroRangoFechas {
  fechaInicio?: string;
  fechaFin?: string;
}

export interface MetricasGenerales {
  // Fórmulas oficiales (rules/03-dominio-negocio.md y pendiente 004)
  ventasNetasBs: number;
  costoVendidoBs: number;
  gananciaBrutaBs: number;
  gananciaNetaBs: number;
  costoMercanciaIngresadaBs: number;
  totalGastosCajaChicaBs: number;

  // Nombres anteriores para retrocompatibilidad
  totalVentasBs: number;
  totalCostoMercanciaBs: number;
  gananciaBrutaEstimadaBs: number;

  // Métricas de inventario y actividad
  numeroProductosDistintos: number;
  totalUnidadesEnStock: number;
  totalUnidadesVendidas: number;
  totalUnidadesIngresadas: number;
  numeroTransaccionesVenta: number;
  numeroRegistrosGastos: number;

  // Ventas por método de pago (aparecen los 4 garantizados)
  ventasPorMetodoPago: Record<MetodoPago, number>;
  ventasEfectivoCantidad: number;
  ventasQRCantidad: number;
  ventasTarjetaCantidad: number;
  ventasTransferenciaCantidad: number;

  // Destacados
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
}

export interface FichaConsultaProducto {
  codigoProducto: string;
  nombreProducto: string;
  categoria: string;
  talla: string;
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

  async obtenerMetricas(filtro: FiltroRangoFechas = {}): Promise<MetricasGenerales> {
    const { fechaInicio, fechaFin } = filtro;

    if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
      throw new BadRequestException({
        codigo: "ERR-PAN-001",
        mensaje: "La fecha inicial del filtro es posterior a la fecha final",
      });
    }

    // 1. Ventas netas y conteo de transacciones
    const qVentas = this.ventaRepositorio.createQueryBuilder("venta");
    if (fechaInicio) {
      qVentas.andWhere("venta.fechaVenta >= :fechaInicio", { fechaInicio });
    }
    if (fechaFin) {
      qVentas.andWhere("venta.fechaVenta <= :fechaFin", { fechaFin });
    }
    const resVentas = await qVentas
      .select("SUM(venta.totalVenta)", "total")
      .addSelect("COUNT(venta.id)", "conteo")
      .getRawOne();

    const ventasNetasBs = redondear(Number(resVentas?.total || 0));
    const numeroTransaccionesVenta = Number(resVentas?.conteo || 0);

    // 2. Costo de lo vendido histórico = Σ (cantidad * costoUnitario)
    const qCostoVendido = this.detalleVentaRepositorio
      .createQueryBuilder("detalle")
      .innerJoin("detalle.venta", "venta")
      .leftJoin("detalle.calzado", "calzado");

    if (fechaInicio) {
      qCostoVendido.andWhere("venta.fechaVenta >= :fechaInicio", { fechaInicio });
    }
    if (fechaFin) {
      qCostoVendido.andWhere("venta.fechaVenta <= :fechaFin", { fechaFin });
    }

    const resCostoVendido = await qCostoVendido
      .select(
        "SUM(detalle.cantidad * COALESCE(NULLIF(detalle.costoUnitario, 0), calzado.precioCompra, 0))",
        "costoTotal",
      )
      .getRawOne();

    const costoVendidoBs = redondear(Number(resCostoVendido?.costoTotal || 0));

    // 3. Gastos de caja chica
    const qGastos = this.gastoRepositorio.createQueryBuilder("gasto");
    if (fechaInicio) {
      qGastos.andWhere("gasto.fechaGasto >= :fechaInicio", { fechaInicio });
    }
    if (fechaFin) {
      qGastos.andWhere("gasto.fechaGasto <= :fechaFin", { fechaFin });
    }
    const resGastos = await qGastos
      .select("SUM(gasto.monto)", "total")
      .addSelect("COUNT(gasto.id)", "conteo")
      .getRawOne();

    const totalGastosCajaChicaBs = redondear(Number(resGastos?.total || 0));
    const numeroRegistrosGastos = Number(resGastos?.conteo || 0);

    // Fórmulas oficiales de dominio (03-dominio-negocio.md §5)
    const gananciaBrutaBs = redondear(ventasNetasBs - costoVendidoBs);
    const gananciaNetaBs = redondear(gananciaBrutaBs - totalGastosCajaChicaBs);

    // 4. Conteo de ventas por cada método de pago (aparecen los 4 garantizados)
    const qMetodos = this.ventaRepositorio
      .createQueryBuilder("venta")
      .select("venta.formaPago", "formaPago")
      .addSelect("COUNT(venta.id)", "conteo");

    if (fechaInicio) {
      qMetodos.andWhere("venta.fechaVenta >= :fechaInicio", { fechaInicio });
    }
    if (fechaFin) {
      qMetodos.andWhere("venta.fechaVenta <= :fechaFin", { fechaFin });
    }

    const resMetodos = await qMetodos.groupBy("venta.formaPago").getRawMany();

    const ventasPorMetodoPago: Record<MetodoPago, number> = {
      [MetodoPago.EFECTIVO]: 0,
      [MetodoPago.QR]: 0,
      [MetodoPago.TARJETA]: 0,
      [MetodoPago.TRANSFERENCIA]: 0,
    };

    for (const fila of resMetodos) {
      if (fila.formaPago in ventasPorMetodoPago) {
        ventasPorMetodoPago[fila.formaPago as MetodoPago] = Number(fila.conteo || 0);
      }
    }

    // 5. Métricas globales de catálogo
    const qCalzados = await this.calzadoRepositorio
      .createQueryBuilder("c")
      .where("c.activo = :activo", { activo: true })
      .select("COUNT(c.id)", "distintos")
      .addSelect("SUM(c.stockActual)", "stockTotal")
      .addSelect("SUM(c.totalVendido)", "vendidasTotal")
      .addSelect("SUM(c.totalIngresado)", "ingresadasTotal")
      .addSelect("SUM(c.totalIngresado * c.precioCompra)", "costoIngresado")
      .getRawOne();

    const numeroProductosDistintos = Number(qCalzados?.distintos || 0);
    const totalUnidadesEnStock = Number(qCalzados?.stockTotal || 0);
    const totalUnidadesVendidas = Number(qCalzados?.vendidasTotal || 0);
    const totalUnidadesIngresadas = Number(qCalzados?.ingresadasTotal || 0);
    const costoMercanciaIngresadaBs = redondear(Number(qCalzados?.costoIngresado || 0));

    // 6. Producto más vendido (por unidades)
    const qMasVendido = this.detalleVentaRepositorio
      .createQueryBuilder("detalle")
      .innerJoin("detalle.venta", "venta");

    if (fechaInicio) {
      qMasVendido.andWhere("venta.fechaVenta >= :fechaInicio", { fechaInicio });
    }
    if (fechaFin) {
      qMasVendido.andWhere("venta.fechaVenta <= :fechaFin", { fechaFin });
    }

    const resMasVendido = await qMasVendido
      .select("detalle.codigoProducto", "codigo")
      .addSelect("detalle.nombreProducto", "nombre")
      .addSelect("SUM(detalle.cantidad)", "unidades")
      .groupBy("detalle.codigoProducto")
      .addGroupBy("detalle.nombreProducto")
      .orderBy('"unidades"', "DESC")
      .limit(1)
      .getRawOne();

    // Fallback al catálogo si aún no hay ventas en detalles
    const productoMasVendido = resMasVendido
      ? {
          nombre: resMasVendido.nombre,
          codigo: resMasVendido.codigo,
          unidades: Number(resMasVendido.unidades),
        }
      : undefined;

    // 7. Producto de mayor ingreso (Bs)
    const qMayorIngreso = this.detalleVentaRepositorio
      .createQueryBuilder("detalle")
      .innerJoin("detalle.venta", "venta");

    if (fechaInicio) {
      qMayorIngreso.andWhere("venta.fechaVenta >= :fechaInicio", { fechaInicio });
    }
    if (fechaFin) {
      qMayorIngreso.andWhere("venta.fechaVenta <= :fechaFin", { fechaFin });
    }

    const resMayorIngreso = await qMayorIngreso
      .select("detalle.codigoProducto", "codigo")
      .addSelect("detalle.nombreProducto", "nombre")
      .addSelect("SUM(detalle.total)", "ingreso")
      .groupBy("detalle.codigoProducto")
      .addGroupBy("detalle.nombreProducto")
      .orderBy('"ingreso"', "DESC")
      .limit(1)
      .getRawOne();

    const productoMayorIngreso = resMayorIngreso
      ? {
          nombre: resMayorIngreso.nombre,
          codigo: resMayorIngreso.codigo,
          ingresoBs: redondear(Number(resMayorIngreso.ingreso)),
        }
      : undefined;

    // 8. Producto menor stock
    const menorStock = await this.calzadoRepositorio
      .createQueryBuilder("c")
      .where("c.activo = :activo", { activo: true })
      .orderBy("c.stockActual", "ASC")
      .getOne();

    return {
      ventasNetasBs,
      costoVendidoBs,
      gananciaBrutaBs,
      gananciaNetaBs,
      costoMercanciaIngresadaBs,
      totalGastosCajaChicaBs,

      totalVentasBs: ventasNetasBs,
      totalCostoMercanciaBs: costoMercanciaIngresadaBs,
      gananciaBrutaEstimadaBs: gananciaBrutaBs,

      numeroProductosDistintos,
      totalUnidadesEnStock,
      totalUnidadesVendidas,
      totalUnidadesIngresadas,
      numeroTransaccionesVenta,
      numeroRegistrosGastos,

      ventasPorMetodoPago,
      ventasEfectivoCantidad: ventasPorMetodoPago[MetodoPago.EFECTIVO],
      ventasQRCantidad: ventasPorMetodoPago[MetodoPago.QR],
      ventasTarjetaCantidad: ventasPorMetodoPago[MetodoPago.TARJETA],
      ventasTransferenciaCantidad: ventasPorMetodoPago[MetodoPago.TRANSFERENCIA],

      productoMasVendido,
      productoMayorIngreso,
      productoMenorStock: menorStock
        ? {
            nombre: menorStock.nombreProducto,
            codigo: menorStock.codigoProducto,
            stock: Number(menorStock.stockActual),
          }
        : undefined,
    };
  }

  async consultarFichaProducto(
    codigoProducto: string,
  ): Promise<FichaConsultaProducto | null> {
    const calzado = await this.calzadoRepositorio.findOne({
      where: { codigoProducto, activo: true },
    });

    if (!calzado) return null;

    const ingresosGeneradosBs =
      Number(calzado.totalVendido) * Number(calzado.precioVenta);
    const costoTotalCompradoBs =
      (Number(calzado.stockInicial) + Number(calzado.totalIngresado)) *
      Number(calzado.precioCompra);
    const utilidadEstimadaBs =
      ingresosGeneradosBs -
      Number(calzado.totalVendido) * Number(calzado.precioCompra);

    // Buscar última fecha de venta
    const ultimoDetalle = await this.detalleVentaRepositorio.findOne({
      where: { codigoProducto },
      relations: ["venta"],
      order: { venta: { fechaVenta: "DESC" } },
    });

    return {
      codigoProducto: calzado.codigoProducto,
      nombreProducto: calzado.nombreProducto,
      categoria: calzado.categoria,
      talla: calzado.talla,
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
    };
  }
}
