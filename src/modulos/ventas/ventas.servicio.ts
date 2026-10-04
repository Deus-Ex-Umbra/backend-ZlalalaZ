import {
  Injectable,
  BadRequestException,
  NotFoundException,
  OnModuleInit,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import {
  Venta,
  MetodoPago,
  MotivoDescuento,
} from "./entidades/venta.entidad";
import { DetalleVenta } from "./entidades/detalle-venta.entidad";
import { Calzado } from "../calzados/entidades/calzado.entidad";
import { CrearVentaDto } from "./dto/crear-venta.dto";
import { SincronizarVentasDto } from "./dto/sincronizar-ventas.dto";
import { ClientesServicio } from "../clientes/clientes.servicio";

const redondear = (valor: number): number => Math.round(valor * 100) / 100;

@Injectable()
export class VentasServicio implements OnModuleInit {
  private readonly registro = new Logger(VentasServicio.name);

  constructor(
    @InjectRepository(Venta)
    private readonly ventaRepositorio: Repository<Venta>,
    @InjectRepository(DetalleVenta)
    private readonly detalleRepositorio: Repository<DetalleVenta>,
    @InjectRepository(Calzado)
    private readonly calzadoRepositorio: Repository<Calzado>,
    private readonly dataSource: DataSource,
    private readonly clientesServicio: ClientesServicio,
  ) {}

  /**
   * NEG-006: el correlativo del ticket sale de una secuencia PostgreSQL, que es
   * atómica incluso con ventas simultáneas. Si la secuencia es nueva y ya existen
   * ventas, se inicializa para no repetir números.
   */
  async onModuleInit(): Promise<void> {
    await this.dataSource.query(
      "CREATE SEQUENCE IF NOT EXISTS secuencia_ticket START 1",
    );
    const [estado] = await this.dataSource.query(
      "SELECT is_called AS \"yaUsada\" FROM secuencia_ticket",
    );
    if (estado?.yaUsada) return;

    const [{ total }] = await this.dataSource.query(
      "SELECT COUNT(*)::int AS total FROM ventas",
    );
    if (total > 0) {
      await this.dataSource.query("SELECT setval('secuencia_ticket', $1, true)", [
        total,
      ]);
      this.registro.log(`Secuencia de tickets iniciada en ${total}`);
    }
  }

  async obtenerTodas(limite: number = 50) {
    return this.ventaRepositorio.find({
      relations: ["detalles"],
      order: { creadoEn: "DESC" },
      take: limite,
    });
  }

  async obtenerPorId(id: string): Promise<Venta> {
    const venta = await this.ventaRepositorio.findOne({
      where: { id },
      relations: ["detalles", "detalles.calzado"],
    });

    if (!venta) {
      throw new NotFoundException({
        codigo: "ERR-VENT-004",
        mensaje: `Venta con ID ${id} no encontrada`,
      });
    }

    return venta;
  }

  async registrarVenta(dto: CrearVentaDto): Promise<Venta> {
    if (dto.idLocal) {
      const ventaExistente = await this.ventaRepositorio.findOne({
        where: { idLocal: dto.idLocal.trim() },
        relations: ["detalles", "detalles.calzado"],
      });
      if (ventaExistente) {
        return ventaExistente;
      }
    }

    if (!dto.lineas || dto.lineas.length === 0) {
      throw new BadRequestException({
        codigo: "ERR-VENT-001",
        mensaje: "El carrito de venta no puede estar vacío",
      });
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const detallesParaGuardar: DetalleVenta[] = [];
      let subtotalCalculado = 0;
      let descuentoLineas = 0;

      for (const linea of dto.lineas) {
        const calzado = await queryRunner.manager.findOne(Calzado, {
          where: { codigoProducto: linea.codigoProducto, activo: true },
          lock: { mode: "pessimistic_write" },
        });

        if (!calzado) {
          throw new NotFoundException({
            codigo: "ERR-CALZ-001",
            mensaje: `Calzado con código ${linea.codigoProducto} no encontrado`,
          });
        }

        if (calzado.stockActual < linea.cantidad) {
          throw new BadRequestException({
            codigo: "ERR-CALZ-003",
            mensaje: `Stock insuficiente para ${calzado.nombreProducto} (Talla: ${calzado.talla}). Disponible: ${calzado.stockActual}`,
          });
        }

        const subtotalLinea = redondear(
          Number(linea.precioUnitario) * linea.cantidad,
        );
        const descuentoLinea = redondear(Number(linea.descuento || 0));

        if (descuentoLinea > subtotalLinea) {
          throw new BadRequestException({
            codigo: "ERR-VENT-005",
            mensaje: `El descuento (Bs ${descuentoLinea}) supera el valor de ${calzado.nombreProducto} (Bs ${subtotalLinea})`,
          });
        }

        // Descontar del inventario
        calzado.stockActual -= linea.cantidad;
        calzado.totalVendido += linea.cantidad;
        await queryRunner.manager.save(calzado);

        subtotalCalculado += subtotalLinea;
        descuentoLineas += descuentoLinea;

        detallesParaGuardar.push(
          queryRunner.manager.create(DetalleVenta, {
            calzadoId: calzado.id,
            codigoProducto: calzado.codigoProducto,
            nombreProducto: calzado.nombreProducto,
            talla: calzado.talla || linea.talla || "",
            cantidad: linea.cantidad,
            precioUnitario: linea.precioUnitario,
            // NEG-003: costo vigente en el momento de la venta
            costoUnitario: Number(calzado.precioCompra),
            descuento: descuentoLinea,
            total: redondear(subtotalLinea - descuentoLinea),
          }),
        );
      }

      // Descuento general: se prorratea entre las líneas para que
      // Σ total de línea == total de la venta (base de las métricas del panel).
      const descuentoGeneral = redondear(Number(dto.descuentoGeneral || 0));
      const baseDescontable = redondear(subtotalCalculado - descuentoLineas);
      if (descuentoGeneral > baseDescontable) {
        throw new BadRequestException({
          codigo: "ERR-VENT-005",
          mensaje: `El descuento general (Bs ${descuentoGeneral}) supera el total de la venta (Bs ${baseDescontable})`,
        });
      }
      if (descuentoGeneral > 0 && baseDescontable > 0) {
        let repartido = 0;
        detallesParaGuardar.forEach((detalle, indice) => {
          const esUltima = indice === detallesParaGuardar.length - 1;
          const parte = esUltima
            ? redondear(descuentoGeneral - repartido)
            : redondear((descuentoGeneral * detalle.total) / baseDescontable);
          repartido += parte;
          detalle.descuento = redondear(Number(detalle.descuento) + parte);
          detalle.total = redondear(Number(detalle.total) - parte);
        });
      }

      const descuentoTotal = redondear(descuentoLineas + descuentoGeneral);
      const totalVenta = redondear(subtotalCalculado - descuentoTotal);

      if (descuentoTotal > 0) {
        if (!dto.motivoDescuento) {
          throw new BadRequestException({
            codigo: "ERR-VENT-006",
            mensaje: "Todo descuento requiere un motivo",
          });
        }
        if (
          dto.motivoDescuento === MotivoDescuento.OTRO &&
          !dto.notas?.trim()
        ) {
          throw new BadRequestException({
            codigo: "ERR-VENT-006",
            mensaje: "El motivo OTRO requiere una nota que lo explique",
          });
        }
      }

      let cambio = 0;
      if (
        dto.formaPago === MetodoPago.EFECTIVO &&
        dto.montoRecibido !== undefined
      ) {
        if (dto.montoRecibido < totalVenta) {
          throw new BadRequestException({
            codigo: "ERR-VENT-002",
            mensaje: `El monto recibido (Bs ${dto.montoRecibido}) es menor al total de la venta (Bs ${totalVenta})`,
          });
        }
        cambio = redondear(dto.montoRecibido - totalVenta);
      }

      // NEG-006: correlativo atómico desde la secuencia de PostgreSQL
      const [{ siguiente }] = await queryRunner.query(
        "SELECT nextval('secuencia_ticket')::int AS siguiente",
      );
      const fechaHoy = new Date();
      const prefijo = `TCK-${fechaHoy.getFullYear()}${String(fechaHoy.getMonth() + 1).padStart(2, "0")}`;
      const numeroTicket = `${prefijo}-${String(siguiente).padStart(4, "0")}`;

      const nuevaVenta = queryRunner.manager.create(Venta, {
        idLocal: dto.idLocal?.trim() || null,
        numeroTicket,
        fechaVenta: fechaHoy,
        nombreCliente: dto.nombreCliente?.trim() || "Cliente Casual",
        formaPago: dto.formaPago,
        subtotal: subtotalCalculado,
        descuento: descuentoTotal,
        motivoDescuento: descuentoTotal > 0 ? dto.motivoDescuento : null,
        totalVenta,
        montoRecibido: dto.montoRecibido ?? totalVenta,
        cambio,
        notas: dto.notas || "",
        detalles: detallesParaGuardar,
      });

      const ventaGuardada = await queryRunner.manager.save(nuevaVenta);
      await queryRunner.commitTransaction();

      // NEG-005: Registrar o actualizar estadísticas del cliente
      try {
        await this.clientesServicio.registrarCompraVenta(
          ventaGuardada.nombreCliente,
          Number(ventaGuardada.totalVenta),
          new Date(ventaGuardada.fechaVenta),
        );
      } catch (errCliente) {
        this.registro.warn(
          `No se pudo actualizar historial del cliente: ${errCliente}`,
        );
      }

      return this.obtenerPorId(ventaGuardada.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * MOB-003: Sincroniza un lote de ventas registradas fuera de línea.
   * Valida stock en tiempo real y devuelve las ventas aceptadas y rechazadas.
   */
  async sincronizarLote(dto: SincronizarVentasDto): Promise<{
    procesadas: number;
    exitosas: Array<{ idLocal?: string; id: string; numeroTicket: string }>;
    fallidas: Array<{ idLocal?: string; error: string; codigo?: string }>;
  }> {
    const exitosas: Array<{ idLocal?: string; id: string; numeroTicket: string }> = [];
    const fallidas: Array<{ idLocal?: string; error: string; codigo?: string }> = [];

    for (const ventaDto of dto.ventas) {
      try {
        const venta = await this.registrarVenta(ventaDto);
        exitosas.push({
          idLocal: ventaDto.idLocal,
          id: venta.id,
          numeroTicket: venta.numeroTicket,
        });
      } catch (error: any) {
        const respuesta = error?.response;
        const mensaje =
          (typeof respuesta === "object" && respuesta?.mensaje) ||
          error?.message ||
          "Error al procesar la venta en el lote";
        const codigo =
          (typeof respuesta === "object" && respuesta?.codigo) || "ERR-VENT-007";

        fallidas.push({
          idLocal: ventaDto.idLocal,
          error: mensaje,
          codigo,
        });
      }
    }

    return {
      procesadas: dto.ventas.length,
      exitosas,
      fallidas,
    };
  }
}
