import {
  Injectable,
  BadRequestException,
  NotFoundException,
  OnModuleInit,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource, Brackets } from "typeorm";
import { Venta, MetodoPago, MotivoDescuento } from "./entidades/venta.entidad";
import { DetalleVenta } from "./entidades/detalle-venta.entidad";
import { Calzado } from "../calzados/entidades/calzado.entidad";
import { Banco } from "./entidades/banco.entidad";
import { CrearVentaDto } from "./dto/crear-venta.dto";
import { SincronizarVentasDto } from "./dto/sincronizar-ventas.dto";
import { FiltrosVentasDto } from "./dto/filtros-ventas.dto";
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
    @InjectRepository(Banco)
    private readonly bancoRepositorio: Repository<Banco>,
    private readonly dataSource: DataSource,
    private readonly clientesServicio: ClientesServicio,
  ) {}

  /**
   * NEG-006: el correlativo del ticket sale de una secuencia PostgreSQL, que es
   * atómica incluso con ventas simultáneas. Si la secuencia es nueva y ya existen
   * ventas, se inicializa para no repetir números.
   * Además ejecuta migraciones seguras para columnas de banco y catálogo de bancos.
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.dataSource.query(
        "CREATE SEQUENCE IF NOT EXISTS secuencia_ticket START 1",
      );
      await this.dataSource.query(
        "ALTER TABLE ventas ADD COLUMN IF NOT EXISTS banco varchar(100)",
      );
      await this.dataSource.query(
        "ALTER TABLE gastos_caja_chica ADD COLUMN IF NOT EXISTS banco varchar(100)",
      );
      await this.dataSource.query(
        `CREATE TABLE IF NOT EXISTS bancos (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          nombre varchar(150) UNIQUE NOT NULL,
          activo boolean DEFAULT true,
          creado_en timestamp DEFAULT CURRENT_TIMESTAMP
        )`,
      );
    } catch (errDb) {
      this.registro.warn(`Aviso en migraciones seguras: ${errDb}`);
    }

    try {
      const [estado] = await this.dataSource.query(
        'SELECT is_called AS "yaUsada" FROM secuencia_ticket',
      );
      if (!estado?.yaUsada) {
        const [{ total }] = await this.dataSource.query(
          "SELECT COUNT(*)::int AS total FROM ventas",
        );
        if (total > 0) {
          await this.dataSource.query(
            "SELECT setval('secuencia_ticket', $1, true)",
            [total],
          );
          this.registro.log(`Secuencia de tickets iniciada en ${total}`);
        }
      }
    } catch (errSeq) {
      this.registro.warn(`Aviso al inicializar secuencia_ticket: ${errSeq}`);
    }

    try {
      const bancosPorDefecto = [
        "Banco Unión",
        "Banco Nacional de Bolivia (BNB)",
        "Banco de Crédito BCP",
        "Banco Mercantil Santa Cruz",
        "Banco FIE",
        "Banco Bisa",
        "Banco Sol",
        "Banco Económico",
        "Tigo Money / Yape",
      ];

      for (const nombre of bancosPorDefecto) {
        const existe = await this.bancoRepositorio.findOne({
          where: { nombre },
        });
        if (!existe) {
          await this.bancoRepositorio.save(
            this.bancoRepositorio.create({ nombre, activo: true }),
          );
        }
      }
    } catch (errBancos) {
      this.registro.warn(`Aviso al sembrar bancos por defecto: ${errBancos}`);
    }
  }

  async listarBancos(): Promise<Banco[]> {
    return this.bancoRepositorio.find({
      where: { activo: true },
      order: { nombre: "ASC" },
    });
  }

  async crearBanco(nombre: string): Promise<Banco> {
    const nombreLimpio = (nombre || "").trim();
    if (!nombreLimpio) {
      throw new BadRequestException({
        codigo: "ERR-VENT-008",
        mensaje: "El nombre del banco no puede estar vacío",
      });
    }

    const bancoExistente = await this.bancoRepositorio
      .createQueryBuilder("banco")
      .where("LOWER(banco.nombre) = LOWER(:nombre)", { nombre: nombreLimpio })
      .getOne();

    if (bancoExistente) {
      if (!bancoExistente.activo) {
        bancoExistente.activo = true;
        return this.bancoRepositorio.save(bancoExistente);
      }
      return bancoExistente;
    }

    const nuevoBanco = this.bancoRepositorio.create({
      nombre: nombreLimpio,
      activo: true,
    });

    return this.bancoRepositorio.save(nuevoBanco);
  }

  async obtenerTodas(filtros?: FiltrosVentasDto): Promise<Venta[]> {
    const limite = filtros?.limite && filtros.limite > 0 ? filtros.limite : 100;
    const consulta = this.ventaRepositorio
      .createQueryBuilder("venta")
      .leftJoinAndSelect("venta.detalles", "detalle")
      .orderBy("venta.fechaVenta", "DESC")
      .addOrderBy("venta.creadoEn", "DESC")
      .take(limite);

    if (filtros?.fechaInicio) {
      consulta.andWhere("venta.fechaVenta >= :fechaInicio", {
        fechaInicio: filtros.fechaInicio,
      });
    }

    if (filtros?.fechaFin) {
      consulta.andWhere("venta.fechaVenta <= :fechaFin", {
        fechaFin: filtros.fechaFin,
      });
    }

    if (
      filtros?.formaPago &&
      filtros.formaPago.trim() !== "" &&
      filtros.formaPago !== "todos"
    ) {
      consulta.andWhere("venta.formaPago = :formaPago", {
        formaPago: filtros.formaPago,
      });
    }

    if (
      filtros?.banco &&
      filtros.banco.trim() !== "" &&
      filtros.banco !== "todos"
    ) {
      consulta.andWhere("LOWER(venta.banco) LIKE LOWER(:banco)", {
        banco: `%${filtros.banco.trim()}%`,
      });
    }

    if (filtros?.busqueda && filtros.busqueda.trim() !== "") {
      const termino = `%${filtros.busqueda.trim()}%`;
      consulta.andWhere(
        new Brackets((qb) => {
          qb.where("venta.numeroTicket ILIKE :termino", { termino })
            .orWhere("venta.nombreCliente ILIKE :termino", { termino })
            .orWhere("venta.nombreVendedor ILIKE :termino", { termino })
            .orWhere(
              "EXISTS (SELECT 1 FROM detalles_venta dv WHERE dv.venta_id = venta.id AND (dv.codigo_producto ILIKE :termino OR dv.nombre_producto ILIKE :termino))",
              { termino },
            );
        }),
      );
    }

    return consulta.getMany();
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

        // Descontar del inventario asegurando no negatividad (regla de dominio §1)
        if (calzado.stockActual - linea.cantidad < 0) {
          throw new BadRequestException({
            codigo: "ERR-CALZ-003",
            mensaje: `Stock insuficiente para ${calzado.nombreProducto} (Talla: ${calzado.talla}). Disponible: ${calzado.stockActual}`,
          });
        }
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
        nombreVendedor: dto.nombreVendedor?.trim() || null,
        formaPago: dto.formaPago,
        banco: dto.banco?.trim() || null,
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
    const exitosas: Array<{
      idLocal?: string;
      id: string;
      numeroTicket: string;
    }> = [];
    const fallidas: Array<{
      idLocal?: string;
      error: string;
      codigo?: string;
    }> = [];

    for (const ventaDto of dto.ventas) {
      try {
        const venta = await this.registrarVenta(ventaDto);
        exitosas.push({
          idLocal: ventaDto.idLocal,
          id: venta.id,
          numeroTicket: venta.numeroTicket,
        });
      } catch (error: unknown) {
        const errorObj =
          typeof error === "object" && error !== null
            ? (error as { response?: { mensaje?: string; codigo?: string }; message?: string })
            : undefined;
        const respuesta = errorObj?.response;
        const mensaje =
          (typeof respuesta === "object" && respuesta?.mensaje) ||
          errorObj?.message ||
          "Error al procesar la venta en el lote";
        const codigo =
          (typeof respuesta === "object" && respuesta?.codigo) ||
          "ERR-VENT-007";

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
