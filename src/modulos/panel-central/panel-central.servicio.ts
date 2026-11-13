import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Calzado } from "../calzados/entidades/calzado.entidad";
import { Venta, MetodoPago } from "../ventas/entidades/venta.entidad";
import { DetalleVenta } from "../ventas/entidades/detalle-venta.entidad";
import { IngresoMercancia } from "../ingresos/entidades/ingreso-mercancia.entidad";
import {
  GastoCajaChica,
  FormaPagoGasto,
} from "../gastos/entidades/gasto-caja-chica.entidad";
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
    ingresoBs: number;
  }[];
  topVendidosPorIngreso?: {
    nombre: string;
    codigo: string;
    unidades: number;
    ingresoBs: number;
  }[];

  totalDescuentosBs: number;
  ticketPromedioBs: number;
  gastosEfectivoBs: number;
  gastosTransferenciaBs: number;
  desagregadoMetodos: DesagregadoMetodos;
  cobrosPorBanco: CobroPorBanco[];
  arqueo: ArqueoCaja;
  stockPorTalla: StockPorTallaItem[];
  semaforoStock: SemaforoStock;
  promocionesActivasCount: number;
  tendencia: TendenciaMetricas;
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

const BANCO_SIN_ESPECIFICAR = "Sin banco";
const DIA_MS = 24 * 60 * 60 * 1000;
const OFFSET_BOLIVIA_MS = 4 * 60 * 60 * 1000;

type MetodoEfectivoBanco =
  | MetodoPago.EFECTIVO
  | MetodoPago.QR
  | MetodoPago.TARJETA
  | MetodoPago.TRANSFERENCIA;

export type DesagregadoMetodos = Record<
  MetodoEfectivoBanco,
  { cantidadTransacciones: number; montoTotalBs: number }
>;

export interface CobroPorBanco {
  banco: string;
  cantidadTransacciones: number;
  montoTotalBs: number;
}

export interface ArqueoCaja {
  efectivoCajonBs: number;
  bancosBs: number;
  gastosEfectivoBs: number;
  gastosTransferenciaBs: number;
  porBanco: CobroPorBanco[];
}

export interface StockPorTallaItem {
  talla: string;
  unidades: number;
  segmento: string;
}

export interface SemaforoStock {
  agotados: number;
  criticos: number;
  bajos: number;
  optimos: number;
}

export type GranularidadTendencia = "hora" | "dia" | "mes";

export interface PuntoTendencia {
  clave: string;
  etiqueta: string;
  ventasBs: number;
  costoVendidoBs: number;
  gananciaBrutaBs: number;
  gastosBs: number;
  gananciaNetaBs: number;
  transacciones: number;
}

export interface TendenciaMetricas {
  granularidad: GranularidadTendencia;
  puntos: PuntoTendencia[];
}

const FORMATO_CLAVE_TENDENCIA: Record<GranularidadTendencia, string> = {
  hora: "YYYY-MM-DD HH24",
  dia: "YYYY-MM-DD",
  mes: "YYYY-MM",
};

/** Fecha actual (`YYYY-MM-DD`) en Bolivia (UTC-4). */
function fechaHoyBolivia(): string {
  return new Date(Date.now() - OFFSET_BOLIVIA_MS).toISOString().slice(0, 10);
}

/**
 * Normaliza una fecha de filtro (`YYYY-MM-DD` o ISO datetime) a `YYYY-MM-DD`.
 * Los ISO con zona horaria se convierten a la fecha local de Bolivia (UTC-4).
 * Lanza `ERR-PAN-002` si la fecha no es válida.
 */
function normalizarFechaFiltro(valor?: string): string | undefined {
  const texto = (valor || "").trim();
  if (!texto) return undefined;

  let resultado: string | undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    resultado = texto;
  } else {
    const ms = Date.parse(texto);
    if (!Number.isNaN(ms)) {
      const tieneZona = /(Z|[+-]\d{2}:?\d{2})$/i.test(texto);
      resultado = tieneZona
        ? new Date(ms - OFFSET_BOLIVIA_MS).toISOString().slice(0, 10)
        : texto.slice(0, 10);
    }
  }

  const partes = resultado ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(resultado) : null;
  if (partes) {
    const anio = Number(partes[1]);
    const mes = Number(partes[2]);
    const dia = Number(partes[3]);
    const control = new Date(Date.UTC(anio, mes - 1, dia));
    if (
      control.getUTCFullYear() === anio &&
      control.getUTCMonth() === mes - 1 &&
      control.getUTCDate() === dia
    ) {
      return resultado;
    }
  }

  throw new BadRequestException({
    codigo: "ERR-PAN-002",
    mensaje: `Fecha de filtro inválida: ${texto}`,
  });
}

function resolverMetodoPago(valor?: string | null): MetodoPago | undefined {
  const limpio = limpiarEspacios(valor).toLowerCase();
  return Object.values(MetodoPago).find((m) => m.toLowerCase() === limpio);
}

/**
 * Resta el vuelto al tramo en efectivo (si no alcanza, prorratea el resto
 * entre los demás tramos) para que la suma coincida con el total neto.
 */
function descontarCambio(
  tramos: { metodo: MetodoPago; monto: number }[],
  cambio: number,
): void {
  let restante = Math.max(0, cambio);
  if (restante <= 0) return;

  for (const tramo of tramos) {
    if (restante <= 0) break;
    if (tramo.metodo !== MetodoPago.EFECTIVO) continue;
    const descuento = Math.min(restante, Math.max(0, tramo.monto));
    tramo.monto -= descuento;
    restante -= descuento;
  }

  if (restante > 0) {
    const base = tramos.reduce((suma, t) => suma + Math.max(0, t.monto), 0);
    if (base <= 0) return;
    const restanteInicial = restante;
    for (const tramo of tramos) {
      const parte = Math.min(
        Math.max(0, tramo.monto),
        (restanteInicial * Math.max(0, tramo.monto)) / base,
      );
      tramo.monto -= parte;
    }
  }
}

function determinarGranularidad(
  fechaInicio?: string,
  fechaFin?: string,
): GranularidadTendencia {
  if (!fechaInicio || !fechaFin) return "mes";
  const dias =
    (Date.parse(`${fechaFin}T00:00:00Z`) -
      Date.parse(`${fechaInicio}T00:00:00Z`)) /
    DIA_MS;
  if (dias <= 2) return "hora";
  if (dias <= 62) return "dia";
  return "mes";
}

/** Genera claves continuas (sin huecos) para la serie temporal. */
function generarClavesTendencia(
  granularidad: GranularidadTendencia,
  fechaInicio: string | undefined,
  fechaFin: string | undefined,
  clavesDatos: Set<string>,
): string[] {
  const claves = new Set<string>(clavesDatos);
  const dosDigitos = (n: number) => String(n).padStart(2, "0");

  if (granularidad === "hora" && fechaInicio && fechaFin) {
    for (
      let ms = Date.parse(`${fechaInicio}T00:00:00Z`);
      ms <= Date.parse(`${fechaFin}T00:00:00Z`);
      ms += DIA_MS
    ) {
      const dia = new Date(ms).toISOString().slice(0, 10);
      for (let h = 0; h < 24; h++) claves.add(`${dia} ${dosDigitos(h)}`);
    }
  } else if (granularidad === "dia" && fechaInicio && fechaFin) {
    for (
      let ms = Date.parse(`${fechaInicio}T00:00:00Z`);
      ms <= Date.parse(`${fechaFin}T00:00:00Z`);
      ms += DIA_MS
    ) {
      claves.add(new Date(ms).toISOString().slice(0, 10));
    }
  } else if (granularidad === "mes") {
    const ordenadas = Array.from(clavesDatos).sort();
    const inicio = fechaInicio?.slice(0, 7) || ordenadas[0];
    const fin = fechaFin?.slice(0, 7) || ordenadas[ordenadas.length - 1];
    if (inicio && fin) {
      let anio = Number(inicio.slice(0, 4));
      let mes = Number(inicio.slice(5, 7));
      const anioFin = Number(fin.slice(0, 4));
      const mesFin = Number(fin.slice(5, 7));
      let guarda = 0;
      while (
        (anio < anioFin || (anio === anioFin && mes <= mesFin)) &&
        guarda < 1200
      ) {
        claves.add(`${anio}-${dosDigitos(mes)}`);
        mes += 1;
        if (mes > 12) {
          mes = 1;
          anio += 1;
        }
        guarda += 1;
      }
    }
  }

  return Array.from(claves).sort();
}

function etiquetaTendencia(
  granularidad: GranularidadTendencia,
  clave: string,
  fechaInicio?: string,
  fechaFin?: string,
): string {
  if (granularidad === "hora") {
    const hora = `${clave.slice(11, 13)}:00`;
    return fechaInicio && fechaFin && fechaInicio !== fechaFin
      ? `${clave.slice(8, 10)}/${clave.slice(5, 7)} ${hora}`
      : hora;
  }
  if (granularidad === "dia") {
    return `${clave.slice(8, 10)}/${clave.slice(5, 7)}`;
  }
  return `${clave.slice(5, 7)}/${clave.slice(0, 4)}`;
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
    const fechaInicio = normalizarFechaFiltro(filtro.fechaInicio);
    const fechaFin = normalizarFechaFiltro(filtro.fechaFin);

    if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
      throw new BadRequestException({
        codigo: "ERR-PAN-001",
        mensaje: "La fecha inicial del filtro es posterior a la fecha final",
      });
    }

    const hoyBolivia = fechaHoyBolivia();

    const qVentas = this.ventaRepositorio.createQueryBuilder("venta");
    const qVentasLista = this.ventaRepositorio
      .createQueryBuilder("venta")
      .select([
        "venta.id",
        "venta.formaPago",
        "venta.totalVenta",
        "venta.desglosePagos",
        "venta.banco",
        "venta.cambio",
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

    const qIngresoPorProducto = this.detalleVentaRepositorio
      .createQueryBuilder("detalle")
      .innerJoin("detalle.venta", "venta");

    if (fechaInicio) {
      qIngresoPorProducto.andWhere("venta.fechaVenta >= :fechaInicio", {
        fechaInicio,
      });
    }
    if (fechaFin) {
      qIngresoPorProducto.andWhere("venta.fechaVenta <= :fechaFin", {
        fechaFin,
      });
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
      ingresoPorProducto,
      promocionesActivas,
      tendencia,
    ] = await Promise.all([
      qVentas
        .select("SUM(venta.totalVenta)", "total")
        .addSelect("COUNT(venta.id)", "conteo")
        .addSelect("SUM(venta.descuento)", "totalDescuentos")
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
        .addSelect(
          "SUM(CASE WHEN gasto.formaPago = :fpEfectivo THEN gasto.monto ELSE 0 END)",
          "gastosEfectivo",
        )
        .addSelect(
          "SUM(CASE WHEN gasto.formaPago = :fpTransferencia THEN gasto.monto ELSE 0 END)",
          "gastosTransferencia",
        )
        .setParameter("fpEfectivo", FormaPagoGasto.EFECTIVO)
        .setParameter("fpTransferencia", FormaPagoGasto.TRANSFERENCIA)
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
      qIngresoPorProducto
        .select("detalle.codigoProducto", "codigo")
        .addSelect("detalle.nombreProducto", "nombre")
        .addSelect("SUM(detalle.cantidad)", "unidades")
        .addSelect("SUM(detalle.total)", "ingreso")
        .groupBy("detalle.codigoProducto")
        .addGroupBy("detalle.nombreProducto")
        .orderBy('"ingreso"', "DESC")
        .getRawMany(),
      this.calzadoRepositorio
        .createQueryBuilder("c")
        .where("c.activo = :activo", { activo: true })
        .andWhere("c.precioPromocion IS NOT NULL")
        .andWhere("c.precioPromocion > 0")
        .andWhere(
          "(c.promocionFechaInicio IS NULL OR c.promocionFechaInicio = '' OR c.promocionFechaInicio <= :hoy)",
          { hoy: hoyBolivia },
        )
        .andWhere(
          "(c.promocionFechaFin IS NULL OR c.promocionFechaFin = '' OR c.promocionFechaFin >= :hoy)",
          { hoy: hoyBolivia },
        )
        .getCount(),
      this.construirTendencia(fechaInicio, fechaFin),
    ]);

    const ventasNetasBs = redondear(Number(resVentas?.total || 0));
    const numeroTransaccionesVenta = Number(resVentas?.conteo || 0);
    const totalDescuentosBs = redondear(Number(resVentas?.totalDescuentos || 0));
    const ticketPromedioBs =
      numeroTransaccionesVenta > 0
        ? redondear(ventasNetasBs / numeroTransaccionesVenta)
        : 0;
    const costoVendidoBs = redondear(Number(resCostoVendido?.costoTotal || 0));
    const totalGastosCajaChicaBs = redondear(Number(resGastos?.total || 0));
    const numeroRegistrosGastos = Number(resGastos?.conteo || 0);
    const gastosEfectivoBs = redondear(Number(resGastos?.gastosEfectivo || 0));
    const gastosTransferenciaBs = redondear(
      Number(resGastos?.gastosTransferencia || 0),
    );

    const gananciaBrutaBs = redondear(ventasNetasBs - costoVendidoBs);
    const gananciaNetaBs = redondear(gananciaBrutaBs - totalGastosCajaChicaBs);

    const ventasPorMetodoPago: Record<MetodoPago, number> = {
      [MetodoPago.EFECTIVO]: 0,
      [MetodoPago.QR]: 0,
      [MetodoPago.TARJETA]: 0,
      [MetodoPago.TRANSFERENCIA]: 0,
      [MetodoPago.MIXTO]: 0,
    };

    const desagregadoMetodos: DesagregadoMetodos = {
      [MetodoPago.EFECTIVO]: { cantidadTransacciones: 0, montoTotalBs: 0 },
      [MetodoPago.QR]: { cantidadTransacciones: 0, montoTotalBs: 0 },
      [MetodoPago.TARJETA]: { cantidadTransacciones: 0, montoTotalBs: 0 },
      [MetodoPago.TRANSFERENCIA]: { cantidadTransacciones: 0, montoTotalBs: 0 },
    };
    const acumuladoBancos = new Map<
      string,
      { cantidadTransacciones: number; montoTotalBs: number }
    >();

    for (const v of ventasEnRango) {
      const metodoEnum = resolverMetodoPago(v.formaPago);
      if (metodoEnum) {
        ventasPorMetodoPago[metodoEnum] += 1;
      }

      const bancoVenta = limpiarEspacios(v.banco);
      const tramosVenta: {
        metodo: MetodoEfectivoBanco;
        monto: number;
        banco: string;
      }[] = [];

      if (Array.isArray(v.desglosePagos) && v.desglosePagos.length > 0) {
        for (const tramo of v.desglosePagos) {
          const metodoTramo = resolverMetodoPago(tramo.metodo);
          tramosVenta.push({
            metodo:
              metodoTramo && metodoTramo !== MetodoPago.MIXTO
                ? metodoTramo
                : MetodoPago.EFECTIVO,
            monto: Number(tramo.monto || 0),
            banco: limpiarEspacios(tramo.banco) || bancoVenta,
          });
        }
        // El tramo en efectivo se registra entregado: se descuenta el vuelto
        // para que la suma coincida con las ventas netas.
        descontarCambio(tramosVenta, Number(v.cambio || 0));
      } else {
        tramosVenta.push({
          metodo:
            metodoEnum && metodoEnum !== MetodoPago.MIXTO
              ? metodoEnum
              : MetodoPago.EFECTIVO,
          monto: Number(v.totalVenta || 0),
          banco: bancoVenta,
        });
      }

      const metodosVenta = new Set<MetodoEfectivoBanco>();
      const bancosVenta = new Set<string>();
      for (const tramo of tramosVenta) {
        desagregadoMetodos[tramo.metodo].montoTotalBs += tramo.monto;
        metodosVenta.add(tramo.metodo);

        if (tramo.metodo !== MetodoPago.EFECTIVO) {
          const nombreBanco = tramo.banco || BANCO_SIN_ESPECIFICAR;
          const acumulado = acumuladoBancos.get(nombreBanco) || {
            cantidadTransacciones: 0,
            montoTotalBs: 0,
          };
          acumulado.montoTotalBs += tramo.monto;
          if (!bancosVenta.has(nombreBanco)) {
            acumulado.cantidadTransacciones += 1;
            bancosVenta.add(nombreBanco);
          }
          acumuladoBancos.set(nombreBanco, acumulado);
        }
      }
      for (const m of metodosVenta) {
        desagregadoMetodos[m].cantidadTransacciones += 1;
      }
    }

    for (const m of Object.keys(desagregadoMetodos)) {
      desagregadoMetodos[m].montoTotalBs = redondear(
        desagregadoMetodos[m].montoTotalBs,
      );
    }

    const cobrosPorBanco: CobroPorBanco[] = Array.from(acumuladoBancos)
      .map(([banco, datos]) => ({
        banco,
        cantidadTransacciones: datos.cantidadTransacciones,
        montoTotalBs: redondear(datos.montoTotalBs),
      }))
      .sort((a, b) => b.montoTotalBs - a.montoTotalBs);

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

    const arqueo: ArqueoCaja = {
      efectivoCajonBs: redondear(
        desagregadoMetodos[MetodoPago.EFECTIVO].montoTotalBs - gastosEfectivoBs,
      ),
      bancosBs: redondear(
        desagregadoMetodos[MetodoPago.QR].montoTotalBs +
          desagregadoMetodos[MetodoPago.TARJETA].montoTotalBs +
          desagregadoMetodos[MetodoPago.TRANSFERENCIA].montoTotalBs -
          gastosTransferenciaBs,
      ),
      gastosEfectivoBs,
      gastosTransferenciaBs,
      porBanco: cobrosPorBanco,
    };

    // Acumular stock por talla, por segmento y semáforo de stock
    const acumuladoPorTalla: Record<string, number> = {};
    const stockPorSegmento: Record<SegmentoTalla, number> = {
      BEBE: 0,
      NINO: 0,
      JUVENIL: 0,
      ADULTO: 0,
      UNICA: 0,
    };
    const semaforoStock: SemaforoStock = {
      agotados: 0,
      criticos: 0,
      bajos: 0,
      optimos: 0,
    };

    for (const calz of calzadosActivosTallas) {
      const stockProducto = Number(calz.stockActual || 0);
      if (stockProducto <= 0) semaforoStock.agotados += 1;
      else if (stockProducto === 1) semaforoStock.criticos += 1;
      else if (stockProducto === 2) semaforoStock.bajos += 1;
      else semaforoStock.optimos += 1;

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

    const stockPorTalla: StockPorTallaItem[] = Object.entries(acumuladoPorTalla)
      .map(([talla, unidades]) => ({
        talla,
        unidades,
        segmento: clasificarTallaIndividual(talla) as string,
      }))
      .sort((a, b) => {
        const esNumA = /^\d+(\.\d+)?$/.test(a.talla);
        const esNumB = /^\d+(\.\d+)?$/.test(b.talla);
        if (esNumA && esNumB) return Number(a.talla) - Number(b.talla);
        if (esNumA) return -1;
        if (esNumB) return 1;
        return a.talla.localeCompare(b.talla);
      });

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

    // Ingreso en Bs (dentro del rango de fechas) por código de producto
    const ingresoPorCodigo = new Map<string, number>();
    for (const fila of ingresoPorProducto) {
      const codigo = String(fila.codigo);
      ingresoPorCodigo.set(
        codigo,
        (ingresoPorCodigo.get(codigo) || 0) + Number(fila.ingreso || 0),
      );
    }

    const topVendidosPorIngreso = ingresoPorProducto
      .slice(0, 8)
      .map((fila: Record<string, string>) => ({
        nombre: fila.nombre,
        codigo: fila.codigo,
        unidades: Number(fila.unidades || 0),
        ingresoBs: redondear(Number(fila.ingreso || 0)),
      }));

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

      totalDescuentosBs,
      ticketPromedioBs,
      gastosEfectivoBs,
      gastosTransferenciaBs,

      ventasPorMetodoPago,
      desagregadoMetodos,
      cobrosPorBanco,
      arqueo,
      ventasEfectivoCantidad:
        desagregadoMetodos[MetodoPago.EFECTIVO].cantidadTransacciones,
      ventasQRCantidad: desagregadoMetodos[MetodoPago.QR].cantidadTransacciones,
      ventasTarjetaCantidad:
        desagregadoMetodos[MetodoPago.TARJETA].cantidadTransacciones,
      ventasTransferenciaCantidad:
        desagregadoMetodos[MetodoPago.TRANSFERENCIA].cantidadTransacciones,
      ventasMixtoCantidad: ventasPorMetodoPago[MetodoPago.MIXTO],

      metodoPagoMasUsado,
      tallaMayorStock,
      stockPorSegmento,
      stockPorTalla,
      semaforoStock,
      promocionesActivasCount: Number(promocionesActivas || 0),

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
        ingresoBs: redondear(ingresoPorCodigo.get(c.codigoProducto) || 0),
      })),
      topVendidosPorIngreso,
      tendencia,
    };
  }

  /**
   * Serie temporal de ventas, costo, gastos y ganancia.
   * `fecha_venta` y `fecha_gasto` son `date` (sin hora): para la granularidad
   * "hora" se agrupa por `creado_en` convertido a America/La_Paz (asumiendo
   * que la columna `timestamp` se guarda en UTC).
   */
  private async construirTendencia(
    fechaInicio?: string,
    fechaFin?: string,
  ): Promise<TendenciaMetricas> {
    const granularidad = determinarGranularidad(fechaInicio, fechaFin);
    const formato = FORMATO_CLAVE_TENDENCIA[granularidad];
    const horaLocal = (columna: string) =>
      `(${columna} AT TIME ZONE 'UTC') AT TIME ZONE 'America/La_Paz'`;

    const claveVenta =
      granularidad === "hora"
        ? `to_char(${horaLocal("venta.creadoEn")}, '${formato}')`
        : `to_char(venta.fechaVenta, '${formato}')`;
    const claveGasto =
      granularidad === "hora"
        ? `to_char(${horaLocal("gasto.creadoEn")}, '${formato}')`
        : `to_char(gasto.fechaGasto, '${formato}')`;

    const qVentasSerie = this.ventaRepositorio.createQueryBuilder("venta");
    const qCostoSerie = this.detalleVentaRepositorio
      .createQueryBuilder("detalle")
      .innerJoin("detalle.venta", "venta")
      .leftJoin("detalle.calzado", "calzado");
    const qGastosSerie = this.gastoRepositorio.createQueryBuilder("gasto");

    if (fechaInicio) {
      qVentasSerie.andWhere("venta.fechaVenta >= :fechaInicio", { fechaInicio });
      qCostoSerie.andWhere("venta.fechaVenta >= :fechaInicio", { fechaInicio });
      qGastosSerie.andWhere("gasto.fechaGasto >= :fechaInicio", {
        fechaInicio,
      });
    }
    if (fechaFin) {
      qVentasSerie.andWhere("venta.fechaVenta <= :fechaFin", { fechaFin });
      qCostoSerie.andWhere("venta.fechaVenta <= :fechaFin", { fechaFin });
      qGastosSerie.andWhere("gasto.fechaGasto <= :fechaFin", { fechaFin });
    }

    const [filasVentas, filasCosto, filasGastos] = await Promise.all([
      qVentasSerie
        .select(claveVenta, "clave")
        .addSelect("SUM(venta.totalVenta)", "ventas")
        .addSelect("COUNT(venta.id)", "transacciones")
        .groupBy('"clave"')
        .getRawMany(),
      qCostoSerie
        .select(claveVenta, "clave")
        .addSelect(
          "SUM(detalle.cantidad * COALESCE(NULLIF(detalle.costoUnitario, 0), calzado.precioCompra, 0))",
          "costo",
        )
        .groupBy('"clave"')
        .getRawMany(),
      qGastosSerie
        .select(claveGasto, "clave")
        .addSelect("SUM(gasto.monto)", "gastos")
        .groupBy('"clave"')
        .getRawMany(),
    ]);

    const mapaVentas = new Map<string, { ventas: number; transacciones: number }>(
      filasVentas.map((f: Record<string, string>) => [
        f.clave,
        { ventas: Number(f.ventas || 0), transacciones: Number(f.transacciones || 0) },
      ]),
    );
    const mapaCosto = new Map<string, number>(
      filasCosto.map((f: Record<string, string>) => [f.clave, Number(f.costo || 0)]),
    );
    const mapaGastos = new Map<string, number>(
      filasGastos.map((f: Record<string, string>) => [f.clave, Number(f.gastos || 0)]),
    );

    const clavesDatos = new Set<string>([
      ...mapaVentas.keys(),
      ...mapaCosto.keys(),
      ...mapaGastos.keys(),
    ]);
    const claves = generarClavesTendencia(
      granularidad,
      fechaInicio,
      fechaFin,
      clavesDatos,
    );

    const puntos: PuntoTendencia[] = claves.map((clave) => {
      const ventasBs = redondear(mapaVentas.get(clave)?.ventas || 0);
      const costoVendidoBs = redondear(mapaCosto.get(clave) || 0);
      const gastosBs = redondear(mapaGastos.get(clave) || 0);
      const gananciaBrutaBs = redondear(ventasBs - costoVendidoBs);
      return {
        clave,
        etiqueta: etiquetaTendencia(granularidad, clave, fechaInicio, fechaFin),
        ventasBs,
        costoVendidoBs,
        gananciaBrutaBs,
        gastosBs,
        gananciaNetaBs: redondear(gananciaBrutaBs - gastosBs),
        transacciones: mapaVentas.get(clave)?.transacciones || 0,
      };
    });

    return { granularidad, puntos };
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
