import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Calzado } from '../calzados/entidades/calzado.entidad';
import { Venta, MetodoPago } from '../ventas/entidades/venta.entidad';
import { DetalleVenta } from '../ventas/entidades/detalle-venta.entidad';
import { IngresoMercancia } from '../ingresos/entidades/ingreso-mercancia.entidad';
import { GastoCajaChica } from '../gastos/entidades/gasto-caja-chica.entidad';

export interface MetricasGenerales {
  totalVentasBs: number;
  totalCostoMercanciaBs: number;
  totalGastosCajaChicaBs: number;
  gananciaBrutaEstimadaBs: number;
  numeroProductosDistintos: number;
  totalUnidadesEnStock: number;
  totalUnidadesVendidas: number;
  totalUnidadesIngresadas: number;
  numeroTransaccionesVenta: number;
  numeroRegistrosGastos: number;
  ventasEfectivoCantidad: number;
  ventasQRCantidad: number;
  ventasTarjetaCantidad: number;
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

  async obtenerMetricas(): Promise<MetricasGenerales> {
    // Total ventas
    const qVentas = await this.ventaRepositorio
      .createQueryBuilder('venta')
      .select('SUM(venta.totalVenta)', 'total')
      .addSelect('COUNT(venta.id)', 'conteo')
      .getRawOne();

    const totalVentasBs = Number(qVentas?.total || 0);
    const numeroTransaccionesVenta = Number(qVentas?.conteo || 0);

    // Conteo por forma de pago
    const ventasEfectivoCantidad = await this.ventaRepositorio.count({
      where: { formaPago: MetodoPago.EFECTIVO },
    });
    const ventasQRCantidad = await this.ventaRepositorio.count({
      where: { formaPago: MetodoPago.QR },
    });
    const ventasTarjetaCantidad = await this.ventaRepositorio.count({
      where: { formaPago: MetodoPago.TARJETA },
    });

    // Total gastos caja chica
    const qGastos = await this.gastoRepositorio
      .createQueryBuilder('gasto')
      .select('SUM(gasto.monto)', 'total')
      .addSelect('COUNT(gasto.id)', 'conteo')
      .getRawOne();

    const totalGastosCajaChicaBs = Number(qGastos?.total || 0);
    const numeroRegistrosGastos = Number(qGastos?.conteo || 0);

    // Métricas de calzado
    const qCalzados = await this.calzadoRepositorio
      .createQueryBuilder('c')
      .where('c.activo = :activo', { activo: true })
      .select('COUNT(c.id)', 'distintos')
      .addSelect('SUM(c.stockActual)', 'stockTotal')
      .addSelect('SUM(c.totalVendido)', 'vendidasTotal')
      .addSelect('SUM(c.totalIngresado)', 'ingresadasTotal')
      .addSelect('SUM(c.totalIngresado * c.precioCompra)', 'costoTotal')
      .getRawOne();

    const numeroProductosDistintos = Number(qCalzados?.distintos || 0);
    const totalUnidadesEnStock = Number(qCalzados?.stockTotal || 0);
    const totalUnidadesVendidas = Number(qCalzados?.vendidasTotal || 0);
    const totalUnidadesIngresadas = Number(qCalzados?.ingresadasTotal || 0);
    const totalCostoMercanciaBs = Number(qCalzados?.costoTotal || 0);

    const gananciaBrutaEstimadaBs = totalVentasBs - totalCostoMercanciaBs - totalGastosCajaChicaBs;

    // Producto más vendido
    const masVendido = await this.calzadoRepositorio
      .createQueryBuilder('c')
      .where('c.activo = :activo', { activo: true })
      .orderBy('c.totalVendido', 'DESC')
      .getOne();

    // Producto menor stock
    const menorStock = await this.calzadoRepositorio
      .createQueryBuilder('c')
      .where('c.activo = :activo', { activo: true })
      .orderBy('c.stockActual', 'ASC')
      .getOne();

    return {
      totalVentasBs,
      totalCostoMercanciaBs,
      totalGastosCajaChicaBs,
      gananciaBrutaEstimadaBs,
      numeroProductosDistintos,
      totalUnidadesEnStock,
      totalUnidadesVendidas,
      totalUnidadesIngresadas,
      numeroTransaccionesVenta,
      numeroRegistrosGastos,
      ventasEfectivoCantidad,
      ventasQRCantidad,
      ventasTarjetaCantidad,
      productoMasVendido: masVendido
        ? {
            nombre: masVendido.nombreProducto,
            codigo: masVendido.codigoProducto,
            unidades: masVendido.totalVendido,
          }
        : undefined,
      productoMenorStock: menorStock
        ? {
            nombre: menorStock.nombreProducto,
            codigo: menorStock.codigoProducto,
            stock: menorStock.stockActual,
          }
        : undefined,
    };
  }

  async consultarFichaProducto(codigoProducto: string): Promise<FichaConsultaProducto | null> {
    const calzado = await this.calzadoRepositorio.findOne({
      where: { codigoProducto, activo: true },
    });

    if (!calzado) return null;

    const ingresosGeneradosBs = Number(calzado.totalVendido) * Number(calzado.precioVenta);
    const costoTotalCompradoBs =
      (Number(calzado.stockInicial) + Number(calzado.totalIngresado)) * Number(calzado.precioCompra);
    const utilidadEstimadaBs = ingresosGeneradosBs - (Number(calzado.totalVendido) * Number(calzado.precioCompra));

    // Buscar última fecha de venta
    const ultimoDetalle = await this.detalleVentaRepositorio.findOne({
      where: { codigoProducto },
      relations: ['venta'],
      order: { venta: { fechaVenta: 'DESC' } },
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
        ? new Date(ultimoDetalle.venta.fechaVenta).toISOString().split('T')[0]
        : undefined,
      fotoUrl: calzado.fotoUrl,
    };
  }
}
