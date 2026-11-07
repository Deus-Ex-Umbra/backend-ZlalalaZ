import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Calzado } from "../calzados/entidades/calzado.entidad";
import { Venta, MetodoPago } from "../ventas/entidades/venta.entidad";
import { DetalleVenta } from "../ventas/entidades/detalle-venta.entidad";
import { IngresoMercancia } from "../ingresos/entidades/ingreso-mercancia.entidad";
import { GastoCajaChica } from "../gastos/entidades/gasto-caja-chica.entidad";
import { normalizarCodigoProducto } from "../../comun/utilidades/normalizacion-catalogo";

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
  // Fórmulas oficiales (rules/03-dominio-negocio.md y pendiente 004)
  ventasNetasBs: number;
  costoVendidoBs: number;
  gananciaBrutaBs: number;
  gananciaNetaBs: number;
  costoMercanciaIngresadaBs: number;
  totalGastosCajaChicaBs: number;
  valoracionStockBs: number;
  costoStockAlmacenBs: number;

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

    // 1. Ventas netas y conteo de transacciones
    const qVentas = this.ventaRepositorio.createQueryBuilder("venta");
    if (fechaInicio) {
      qVentas.andWhere("venta.fechaVenta >= :fechaInicio", { fechaInicio });
    }
    if (fechaFin) {
      qVentas.andWhere("venta.fechaVenta <= :fechaFin", { fechaFin });
    }

    // 2. Costo de lo vendido histórico = Σ (cantidad * costoUnitario)
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

    // 3. Gastos de caja chica
    const qGastos = this.gastoRepositorio.createQueryBuilder("gasto");
    if (fechaInicio) {
      qGastos.andWhere("gasto.fechaGasto >= :fechaInicio", { fechaInicio });
    }
    if (fechaFin) {
      qGastos.andWhere("gasto.fechaGasto <= :fechaFin", { fechaFin });
    }

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

    // 7. Producto de mayor ingreso (Bs)
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

    // Ejecución paralela de las 9 consultas independientes para minimizar latencia de red/BD
    const [
      resVentas,
      resCostoVendido,
      resGastos,
      resMetodos,
      qCalzados,
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
      qMetodos.groupBy("venta.formaPago").getRawMany(),
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
        .select(["c.id", "c.nombreProducto", "c.codigoProducto", "c.stockActual"])
        .where("c.activo = :activo", { activo: true })
        .orderBy("c.stockActual", "ASC")
        .getOne(),
      this.calzadoRepositorio
        .createQueryBuilder("c")
        .select(["c.id", "c.nombreProducto", "c.codigoProducto", "c.totalVendido"])
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

    // Fórmulas oficiales de dominio (03-dominio-negocio.md §5)
    const gananciaBrutaBs = redondear(ventasNetasBs - costoVendidoBs);
    const gananciaNetaBs = redondear(gananciaBrutaBs - totalGastosCajaChicaBs);

    const ventasPorMetodoPago: Record<MetodoPago, number> = {
      [MetodoPago.EFECTIVO]: 0,
      [MetodoPago.QR]: 0,
      [MetodoPago.TARJETA]: 0,
      [MetodoPago.TRANSFERENCIA]: 0,
    };

    for (const fila of resMetodos) {
      const valorCrudo = String(
        fila.formaPago ||
          fila.formapago ||
          fila.forma_pago ||
          fila.venta_forma_pago ||
          "",
      ).trim();

      const metodoEncontrado = Object.values(MetodoPago).find(
        (m) => m.toLowerCase() === valorCrudo.toLowerCase(),
      );

      if (metodoEncontrado) {
        ventasPorMetodoPago[metodoEncontrado] = Number(
          fila.conteo || fila.count || 0,
        );
      }
    }

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

    // Fallback al catálogo si aún no hay ventas en detalles
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
      ventasEfectivoCantidad: ventasPorMetodoPago[MetodoPago.EFECTIVO],
      ventasQRCantidad: ventasPorMetodoPago[MetodoPago.QR],
      ventasTarjetaCantidad: ventasPorMetodoPago[MetodoPago.TARJETA],
      ventasTransferenciaCantidad:
        ventasPorMetodoPago[MetodoPago.TRANSFERENCIA],

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

    // Buscar última fecha de venta y variantes de otras tallas en paralelo
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

    for (const v of variantes) {
      const tallaLimpia = v.talla ? v.talla.trim() : "";
      if (!tallaLimpia) continue;

      // Excluir la misma talla del producto actualmente consultado
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
