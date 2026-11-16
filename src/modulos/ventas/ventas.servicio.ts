import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  OnModuleInit,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource, Brackets, EntityManager } from "typeorm";
import {
  Venta,
  MetodoPago,
  MotivoDescuento,
  DesglosePagoItem,
  EstadoVenta,
  HistorialCambioVentaItem,
} from "./entidades/venta.entidad";
import { DetalleVenta } from "./entidades/detalle-venta.entidad";
import { Calzado } from "../calzados/entidades/calzado.entidad";
import { Banco } from "./entidades/banco.entidad";
import { Cliente } from "../clientes/entidades/cliente.entidad";
import {
  CrearVentaDto,
  ActualizarVentaDto,
  ProcesarCambioDevolucionDto,
} from "./dto/crear-venta.dto";
import { SincronizarVentasDto } from "./dto/sincronizar-ventas.dto";
import { FiltrosVentasDto } from "./dto/filtros-ventas.dto";
import { ClientesServicio } from "../clientes/clientes.servicio";
import {
  ExtraIncluidoItem,
  TALLA_UNICA,
  calcularSegmentoTalla,
  contieneVariasTallas,
  describirTallasDisponibles,
  esTallaVaciaOUnica,
  limpiarEspacios,
  normalizarClaveTalla,
  normalizarCodigoProducto,
  normalizarMapaStockPorTalla,
  ordenarClavesTallas,
  resolverClaveTallaEnMapa,
  sumarStockPorTalla,
  tieneMapaStockPorTalla,
} from "../../comun/utilidades/normalizacion-catalogo";

const redondear = (valor: number): number => Math.round(valor * 100) / 100;

const PATRON_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Referencia para ubicar y bloquear un calzado dentro de una transacción. */
interface ReferenciaCalzado {
  id?: string | null;
  codigo?: string | null;
}

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

  async onModuleInit(): Promise<void> {
    try {
      await this.dataSource.query(
        "CREATE SEQUENCE IF NOT EXISTS secuencia_ticket START 1",
      );
      await this.dataSource.query(
        "ALTER TABLE ventas ADD COLUMN IF NOT EXISTS banco varchar(100)",
      );
      await this.dataSource.query(
        "ALTER TABLE ventas ADD COLUMN IF NOT EXISTS desglose_pagos jsonb",
      );
      await this.dataSource.query(
        "ALTER TABLE ventas ADD COLUMN IF NOT EXISTS cliente_id uuid",
      );
      await this.dataSource.query(
        "ALTER TABLE ventas ALTER COLUMN forma_pago TYPE varchar(30) USING forma_pago::text",
      );
      await this.dataSource.query(
        "ALTER TABLE gastos_caja_chica ADD COLUMN IF NOT EXISTS banco varchar(100)",
      );
      await this.dataSource.query(
        "ALTER TABLE ventas ADD COLUMN IF NOT EXISTS estado varchar(30) DEFAULT 'COMPLETADA'",
      );
      await this.dataSource.query(
        "ALTER TABLE ventas ADD COLUMN IF NOT EXISTS historial_cambios jsonb DEFAULT '[]'::jsonb",
      );
      await this.dataSource.query(
        "UPDATE ventas SET estado = 'COMPLETADA' WHERE estado IS NULL",
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
      await this.dataSource.query(`
        INSERT INTO bancos (id, nombre, activo)
        VALUES 
          (gen_random_uuid(), 'Banco Unión', true),
          (gen_random_uuid(), 'Banco Nacional de Bolivia (BNB)', true),
          (gen_random_uuid(), 'Banco de Crédito BCP', true),
          (gen_random_uuid(), 'Banco Mercantil Santa Cruz', true),
          (gen_random_uuid(), 'Banco FIE', true),
          (gen_random_uuid(), 'Banco Bisa', true),
          (gen_random_uuid(), 'Banco Sol', true),
          (gen_random_uuid(), 'Banco Económico', true),
          (gen_random_uuid(), 'Tigo Money / Yape', true)
        ON CONFLICT (nombre) DO NOTHING;
      `);
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
      const metodoFiltro = filtros.formaPago.trim();
      consulta.andWhere(
        new Brackets((qb) => {
          qb.where("venta.formaPago = :formaPago", {
            formaPago: metodoFiltro,
          }).orWhere("venta.desglose_pagos::text ILIKE :metodoJson", {
            metodoJson: `%"metodo":"${metodoFiltro}"%`,
          });
        }),
      );
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

  private resolverMetodoEnum(texto?: string): MetodoPago {
    const limpio = limpiarEspacios(texto).toLowerCase();
    if (limpio === "qr") return MetodoPago.QR;
    if (limpio === "tarjeta") return MetodoPago.TARJETA;
    if (limpio === "transferencia") return MetodoPago.TRANSFERENCIA;
    if (limpio === "mixto") return MetodoPago.MIXTO;
    return MetodoPago.EFECTIVO;
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
      const manager = queryRunner.manager;

      // Calzados bloqueados (pessimistic_write) durante toda la transacción: varias líneas del
      // mismo calzado (ej. P-4 talla 38 + P-4 talla 39) acumulan sobre la misma instancia.
      const bloqueados = new Map<string, Calzado>();
      await this.prebloquearCalzados(
        manager,
        bloqueados,
        dto.lineas.map((linea) => ({ codigo: linea.codigoProducto })),
      );
      await this.prebloquearCalzados(
        manager,
        bloqueados,
        this.referenciasExtrasIncluidos(Array.from(bloqueados.values())),
      );

      for (const linea of dto.lineas) {
        const calzado = await this.obtenerCalzadoBloqueado(
          manager,
          bloqueados,
          { codigo: linea.codigoProducto },
        );

        if (!calzado || !calzado.activo) {
          throw new NotFoundException({
            codigo: "ERR-CALZ-001",
            mensaje: `Calzado con código ${linea.codigoProducto} no encontrado`,
          });
        }

        const tallaSolicitada = limpiarEspacios(
          linea.tallaSeleccionada || linea.talla,
        );

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

        const tallaRegistrada = this.descontarStockVendido(
          calzado,
          tallaSolicitada,
          linea.cantidad,
        );
        await manager.save(calzado);

        // Extras incluidos inventariados: se descuentan de su propio stock
        await this.descontarExtrasIncluidos(
          manager,
          bloqueados,
          calzado,
          tallaRegistrada,
          linea.cantidad,
        );

        subtotalCalculado += subtotalLinea;
        descuentoLineas += descuentoLinea;

        detallesParaGuardar.push(
          manager.create(DetalleVenta, {
            calzadoId: calzado.id,
            codigoProducto: calzado.codigoProducto,
            nombreProducto: calzado.nombreProducto,
            talla: tallaRegistrada,
            cantidad: linea.cantidad,
            precioUnitario: linea.precioUnitario,
            costoUnitario: Number(calzado.precioCompra),
            descuento: descuentoLinea,
            total: redondear(subtotalLinea - descuentoLinea),
          }),
        );
      }

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

      // Procesamiento de Pagos Simples vs Pagos Mixtos Condicionales
      const desgloseEntrante = Array.isArray(dto.desglosePagos)
        ? dto.desglosePagos.filter((p) => Number(p.monto) > 0)
        : [];

      let formaPagoFinal: MetodoPago = dto.formaPago || MetodoPago.EFECTIVO;
      let desgloseFinal: DesglosePagoItem[] = [];
      let montoRecibidoFinal = dto.montoRecibido ?? totalVenta;
      let cambio = 0;
      let bancoFinal: string | null = dto.banco?.trim() || null;

      if (desgloseEntrante.length >= 2) {
        let sumaPagos = 0;
        const bancosUsados: string[] = [];

        for (const item of desgloseEntrante) {
          const montoTramo = redondear(Number(item.monto));
          if (montoTramo <= 0) {
            throw new BadRequestException({
              codigo: "ERR-VENT-009",
              mensaje: "Cada método de pago en un pago mixto debe tener un monto mayor a Bs 0",
            });
          }
          sumaPagos = redondear(sumaPagos + montoTramo);
          if (item.banco?.trim()) {
            bancosUsados.push(item.banco.trim());
          }
          desgloseFinal.push({
            metodo: limpiarEspacios(item.metodo) || MetodoPago.EFECTIVO,
            monto: montoTramo,
            ...(item.banco?.trim() ? { banco: item.banco.trim() } : {}),
          });
        }

        if (sumaPagos + 0.01 < totalVenta) {
          throw new BadRequestException({
            codigo: "ERR-VENT-002",
            mensaje: `La suma del pago mixto (Bs ${sumaPagos}) no cubre el total de la venta (Bs ${totalVenta})`,
          });
        }

        formaPagoFinal = MetodoPago.MIXTO;
        montoRecibidoFinal = sumaPagos;
        cambio = redondear(Math.max(0, sumaPagos - totalVenta));
        if (!bancoFinal && bancosUsados.length > 0) {
          bancoFinal = Array.from(new Set(bancosUsados)).join(" / ");
        }
      } else {
        if (desgloseEntrante.length === 1) {
          formaPagoFinal = this.resolverMetodoEnum(desgloseEntrante[0].metodo);
          if (desgloseEntrante[0].banco?.trim() && !bancoFinal) {
            bancoFinal = desgloseEntrante[0].banco.trim();
          }
          if (dto.montoRecibido === undefined) {
            montoRecibidoFinal = redondear(Number(desgloseEntrante[0].monto));
          }
        }

        if (
          formaPagoFinal === MetodoPago.EFECTIVO &&
          dto.montoRecibido !== undefined
        ) {
          if (dto.montoRecibido + 0.01 < totalVenta) {
            throw new BadRequestException({
              codigo: "ERR-VENT-002",
              mensaje: `El monto recibido (Bs ${dto.montoRecibido}) es menor al total de la venta (Bs ${totalVenta})`,
            });
          }
          cambio = redondear(Math.max(0, dto.montoRecibido - totalVenta));
        }

        desgloseFinal = [
          {
            metodo: formaPagoFinal,
            monto: totalVenta,
            ...(bancoFinal ? { banco: bancoFinal } : {}),
          },
        ];
      }

      const [{ siguiente }] = await queryRunner.query(
        "SELECT nextval('secuencia_ticket')::int AS siguiente",
      );
      const fechaHoy = new Date();
      const prefijo = `TCK-${fechaHoy.getFullYear()}${String(fechaHoy.getMonth() + 1).padStart(2, "0")}`;
      const numeroTicket = `${prefijo}-${String(siguiente).padStart(4, "0")}`;

      const nombreClienteFinal =
        limpiarEspacios(dto.nombreCliente || dto.clienteNombre) ||
        "Cliente Casual";

      const nuevaVenta = queryRunner.manager.create(Venta, {
        idLocal: dto.idLocal?.trim() || null,
        numeroTicket,
        fechaVenta: fechaHoy,
        clienteId: dto.clienteId?.trim() || null,
        nombreCliente: nombreClienteFinal,
        nombreVendedor: dto.nombreVendedor?.trim() || null,
        formaPago: formaPagoFinal,
        banco: bancoFinal,
        desglosePagos: desgloseFinal,
        subtotal: subtotalCalculado,
        descuento: descuentoTotal,
        motivoDescuento: descuentoTotal > 0 ? dto.motivoDescuento : null,
        totalVenta,
        montoRecibido: montoRecibidoFinal,
        cambio,
        notas: dto.notas || "",
        detalles: detallesParaGuardar,
      });

      const ventaGuardada = await queryRunner.manager.save(nuevaVenta);
      await queryRunner.commitTransaction();

      // NEG-005: Registrar o actualizar estadísticas del cliente y vincular clienteId
      try {
        const clienteVinculado =
          await this.clientesServicio.registrarCompraVenta(
            ventaGuardada.nombreCliente,
            Number(ventaGuardada.totalVenta),
            new Date(ventaGuardada.fechaVenta),
            dto.clienteId,
            formaPagoFinal,
          );
        if (clienteVinculado && !ventaGuardada.clienteId) {
          await this.ventaRepositorio.update(ventaGuardada.id, {
            clienteId: clienteVinculado.id,
          });
        }
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

  async actualizarVenta(id: string, dto: ActualizarVentaDto): Promise<Venta> {
    const venta = await this.obtenerPorId(id);

    if (dto.nombreCliente !== undefined || dto.clienteNombre !== undefined) {
      venta.nombreCliente =
        limpiarEspacios(dto.nombreCliente || dto.clienteNombre) ||
        "Cliente Casual";
    }
    if (dto.clienteId !== undefined) {
      venta.clienteId = dto.clienteId ? dto.clienteId.trim() : null;
    }
    if (dto.notas !== undefined) {
      venta.notas = dto.notas;
    }
    if (dto.motivoDescuento !== undefined) {
      venta.motivoDescuento = dto.motivoDescuento;
    }
    if (dto.banco !== undefined) {
      venta.banco = dto.banco ? dto.banco.trim() : null;
    }
    if (dto.formaPago !== undefined) {
      venta.formaPago = dto.formaPago;
    }
    if (dto.desglosePagos !== undefined) {
      if (Array.isArray(dto.desglosePagos) && dto.desglosePagos.length > 0) {
        venta.desglosePagos = dto.desglosePagos.map((d) => ({
          metodo: limpiarEspacios(d.metodo) || MetodoPago.EFECTIVO,
          monto: redondear(Number(d.monto)),
          ...(d.banco?.trim() ? { banco: d.banco.trim() } : {}),
        }));
        venta.formaPago =
          venta.desglosePagos.length >= 2
            ? MetodoPago.MIXTO
            : this.resolverMetodoEnum(venta.desglosePagos[0].metodo);
      } else {
        venta.desglosePagos = null;
      }
    }

    await this.ventaRepositorio.save(venta);
    return this.obtenerPorId(id);
  }

  /** Busca entre los calzados ya bloqueados uno con el código indicado (original o normalizado). */
  private buscarBloqueadoPorCodigo(
    bloqueados: Map<string, Calzado>,
    codigo: string,
  ): Calzado | undefined {
    const normalizado = normalizarCodigoProducto(codigo);
    for (const calzado of bloqueados.values()) {
      if (
        calzado.codigoProducto === codigo ||
        normalizarCodigoProducto(calzado.codigoProducto) === normalizado
      ) {
        return calzado;
      }
    }
    return undefined;
  }

  /**
   * Obtiene un calzado con bloqueo `pessimistic_write`, reutilizando la instancia ya bloqueada
   * en la transacción para que todas las operaciones acumulen sobre el mismo estado en memoria.
   */
  private async obtenerCalzadoBloqueado(
    manager: EntityManager,
    bloqueados: Map<string, Calzado>,
    referencia: ReferenciaCalzado,
  ): Promise<Calzado | null> {
    const id = limpiarEspacios(referencia.id);
    const codigo = limpiarEspacios(referencia.codigo);
    const idValido = id && PATRON_UUID.test(id) ? id : "";

    const enMemoria =
      (idValido ? bloqueados.get(idValido) : undefined) ??
      (codigo ? this.buscarBloqueadoPorCodigo(bloqueados, codigo) : undefined);
    if (enMemoria) return enMemoria;

    let calzado: Calzado | null = null;
    if (idValido) {
      calzado = await manager.findOne(Calzado, {
        where: { id: idValido },
        lock: { mode: "pessimistic_write" },
      });
    }
    if (!calzado && codigo) {
      calzado = await manager.findOne(Calzado, {
        where: { codigoProducto: codigo },
        lock: { mode: "pessimistic_write" },
      });
      const codigoNormalizado = normalizarCodigoProducto(codigo);
      if (!calzado && codigoNormalizado !== codigo) {
        calzado = await manager.findOne(Calzado, {
          where: { codigoProducto: codigoNormalizado },
          lock: { mode: "pessimistic_write" },
        });
      }
    }
    if (!calzado) return null;

    const yaBloqueado = bloqueados.get(calzado.id);
    if (yaBloqueado) return yaBloqueado;
    bloqueados.set(calzado.id, calzado);
    return calzado;
  }

  /** Bloquea por adelantado varios calzados en orden determinista (por código) para evitar deadlocks. */
  private async prebloquearCalzados(
    manager: EntityManager,
    bloqueados: Map<string, Calzado>,
    referencias: ReferenciaCalzado[],
  ): Promise<void> {
    const ordenadas = referencias
      .map((referencia) => ({
        referencia,
        orden:
          normalizarCodigoProducto(referencia.codigo) ||
          limpiarEspacios(referencia.id),
      }))
      .filter((item) => item.orden)
      .sort((a, b) => a.orden.localeCompare(b.orden));
    for (const { referencia } of ordenadas) {
      await this.obtenerCalzadoBloqueado(manager, bloqueados, referencia);
    }
  }

  /** Referencias (id/código) de los extras incluidos inventariados de los calzados indicados. */
  private referenciasExtrasIncluidos(calzados: Calzado[]): ReferenciaCalzado[] {
    const referencias: ReferenciaCalzado[] = [];
    for (const calzado of calzados) {
      for (const extra of calzado.extrasIncluidos ?? []) {
        if (extra?.extraId || extra?.codigo) {
          referencias.push({ id: extra.extraId, codigo: extra.codigo });
        }
      }
    }
    return referencias;
  }

  /** Un extra con `tallaAsociada` solo acompaña a esa talla del calzado principal. */
  private extraAplicaATalla(extra: ExtraIncluidoItem, talla: string): boolean {
    const tallaAsociada = limpiarEspacios(extra.tallaAsociada);
    if (!tallaAsociada || !limpiarEspacios(talla)) return true;
    return normalizarClaveTalla(tallaAsociada) === normalizarClaveTalla(talla);
  }

  /**
   * Garantiza la fórmula maestra de inventario antes de guardar:
   * stockActual = stockInicial + totalIngresado - totalVendido = Σ stockPorTalla.
   */
  private validarFormulaMaestra(calzado: Calzado, contexto: string): void {
    const stockActual = Number(calzado.stockActual || 0);
    const totalVendido = Number(calzado.totalVendido || 0);
    const esperado =
      Number(calzado.stockInicial || 0) +
      Number(calzado.totalIngresado || 0) -
      totalVendido;
    const usaMapa = tieneMapaStockPorTalla(calzado.stockPorTalla);
    const sumaTallas = sumarStockPorTalla(calzado.stockPorTalla);

    if (
      stockActual < 0 ||
      totalVendido < 0 ||
      stockActual !== esperado ||
      (usaMapa && sumaTallas !== stockActual)
    ) {
      throw new ConflictException({
        codigo: "ERR-CALZ-011",
        mensaje: `Inconsistencia de inventario en ${calzado.nombreProducto} (${calzado.codigoProducto}) al ${contexto}: stock actual ${stockActual}, stock inicial + ingresado - vendido = ${esperado}${usaMapa ? `, suma por talla = ${sumaTallas}` : ""}. La operación fue revertida.`,
      });
    }
  }

  /**
   * Descuenta unidades vendidas de un calzado bloqueado. Si el calzado controla stock por talla,
   * la talla es obligatoria y debe existir con saldo suficiente (sin atajos silenciosos).
   * La talla agotada se conserva en el mapa con 0. Devuelve la talla canónica para el detalle.
   */
  private descontarStockVendido(
    calzado: Calzado,
    tallaSolicitada: string,
    cantidad: number,
  ): string {
    const mapa = normalizarMapaStockPorTalla(calzado.stockPorTalla);
    let tallaRegistrada: string;

    if (Object.keys(mapa).length > 0) {
      const clave = resolverClaveTallaEnMapa(mapa, tallaSolicitada);
      if (!clave) {
        throw new BadRequestException({
          codigo: "ERR-CALZ-002",
          mensaje: `La talla "${tallaSolicitada || "sin especificar"}" no está disponible para ${calzado.nombreProducto} (${calzado.codigoProducto}). Tallas registradas: ${describirTallasDisponibles(mapa)}`,
        });
      }
      const disponibleEnTalla = mapa[clave] ?? 0;
      if (disponibleEnTalla < cantidad) {
        throw new BadRequestException({
          codigo: "ERR-CALZ-003",
          mensaje: `Stock insuficiente para ${calzado.nombreProducto} (${calzado.codigoProducto}) en talla ${clave}. Disponible: ${disponibleEnTalla}, solicitado: ${cantidad}`,
        });
      }
      mapa[clave] = disponibleEnTalla - cantidad;
      calzado.stockPorTalla = mapa;
      calzado.totalVendido = Number(calzado.totalVendido || 0) + cantidad;
      calzado.stockActual = sumarStockPorTalla(mapa);
      tallaRegistrada = clave;
    } else {
      const disponible = Number(calzado.stockActual || 0);
      if (disponible < cantidad) {
        throw new BadRequestException({
          codigo: "ERR-CALZ-003",
          mensaje: `Stock insuficiente para ${calzado.nombreProducto} (${calzado.codigoProducto}). Disponible: ${disponible}, solicitado: ${cantidad}`,
        });
      }
      calzado.stockActual = disponible - cantidad;
      calzado.totalVendido = Number(calzado.totalVendido || 0) + cantidad;
      tallaRegistrada =
        tallaSolicitada || limpiarEspacios(calzado.talla) || TALLA_UNICA;
    }

    this.validarFormulaMaestra(calzado, "descontar la venta");
    return tallaRegistrada;
  }

  /**
   * Descuenta el stock de los extras incluidos inventariados (bloqueados con pessimistic_write),
   * distribuyendo el descuento entre las tallas con saldo para que Σ stockPorTalla = stockActual.
   * Un extra agotado no bloquea la venta del calzado principal (se descuenta solo lo disponible).
   */
  private async descontarExtrasIncluidos(
    manager: EntityManager,
    bloqueados: Map<string, Calzado>,
    calzadoPrincipal: Calzado,
    tallaVendida: string,
    cantidadVendida: number,
  ): Promise<void> {
    const extras = Array.isArray(calzadoPrincipal.extrasIncluidos)
      ? calzadoPrincipal.extrasIncluidos
      : [];

    for (const extraItem of extras) {
      if (!extraItem || !this.extraAplicaATalla(extraItem, tallaVendida)) {
        continue;
      }
      if (!extraItem.extraId && !extraItem.codigo) continue;

      const calzadoExtra = await this.obtenerCalzadoBloqueado(
        manager,
        bloqueados,
        { id: extraItem.extraId, codigo: extraItem.codigo },
      );
      if (
        !calzadoExtra ||
        !calzadoExtra.activo ||
        calzadoExtra.id === calzadoPrincipal.id
      ) {
        continue;
      }

      const cantidadExtra =
        Math.max(1, Math.floor(Number(extraItem.cantidad) || 1)) *
        cantidadVendida;
      const mapaExtra = normalizarMapaStockPorTalla(calzadoExtra.stockPorTalla);
      let descontado = 0;

      if (Object.keys(mapaExtra).length > 0) {
        let pendiente = cantidadExtra;
        for (const clave of ordenarClavesTallas(Object.keys(mapaExtra))) {
          if (pendiente <= 0) break;
          const saldo = mapaExtra[clave] ?? 0;
          const tomar = Math.min(saldo, pendiente);
          if (tomar > 0) {
            mapaExtra[clave] = saldo - tomar;
            pendiente -= tomar;
            descontado += tomar;
          }
        }
        if (descontado > 0) {
          calzadoExtra.stockPorTalla = mapaExtra;
          calzadoExtra.stockActual = sumarStockPorTalla(mapaExtra);
        }
      } else {
        const disponible = Math.max(0, Number(calzadoExtra.stockActual || 0));
        descontado = Math.min(disponible, cantidadExtra);
        if (descontado > 0) {
          calzadoExtra.stockActual = disponible - descontado;
        }
      }

      if (descontado < cantidadExtra) {
        this.registro.warn(
          `Extra ${calzadoExtra.codigoProducto} sin stock suficiente para ${calzadoPrincipal.codigoProducto}: se descontaron ${descontado} de ${cantidadExtra}`,
        );
      }
      if (descontado <= 0) continue;

      calzadoExtra.totalVendido =
        Number(calzadoExtra.totalVendido || 0) + descontado;
      this.validarFormulaMaestra(calzadoExtra, "descontar el extra incluido");
      await manager.save(calzadoExtra);
    }
  }

  /**
   * Devuelve unidades al inventario de un calzado bloqueado (devolución o cambio):
   * valida que no se restituya más de lo vendido, suma a la talla en stockPorTalla
   * (incluida "Única") y mantiene stockActual = stockInicial + totalIngresado - totalVendido = Σ stockPorTalla.
   */
  private restituirStockCalzado(
    calzado: Calzado,
    talla: string | undefined,
    cantidad: number,
  ): void {
    const totalVendido = Number(calzado.totalVendido || 0);
    if (totalVendido < cantidad) {
      throw new BadRequestException({
        codigo: "ERR-VENT-014",
        mensaje: `No se pueden restituir ${cantidad} unidades de ${calzado.nombreProducto} (${calzado.codigoProducto}): el inventario solo registra ${totalVendido} vendidas`,
      });
    }

    const mapa = normalizarMapaStockPorTalla(calzado.stockPorTalla);
    const tallaLimpia = limpiarEspacios(talla);

    if (Object.keys(mapa).length > 0) {
      let clave = resolverClaveTallaEnMapa(mapa, tallaLimpia, {
        permitirUnicaConExistencias: false,
      });
      // La talla vendida pudo eliminarse del mapa: se vuelve a crear si es una talla concreta.
      if (
        !clave &&
        tallaLimpia &&
        !esTallaVaciaOUnica(tallaLimpia) &&
        !contieneVariasTallas(tallaLimpia)
      ) {
        clave = tallaLimpia;
      }
      if (!clave) {
        throw new BadRequestException({
          codigo: "ERR-CALZ-002",
          mensaje: `No se puede determinar la talla a restituir de ${calzado.nombreProducto} (${calzado.codigoProducto}). Talla registrada en la venta: "${tallaLimpia || "sin especificar"}". Tallas del producto: ${describirTallasDisponibles(mapa)}`,
        });
      }
      mapa[clave] = (mapa[clave] ?? 0) + cantidad;
      calzado.stockPorTalla = mapa;
      calzado.totalVendido = totalVendido - cantidad;
      calzado.stockActual = sumarStockPorTalla(mapa);
      calzado.talla = ordenarClavesTallas(Object.keys(mapa)).join(", ");
    } else {
      calzado.totalVendido = totalVendido - cantidad;
      calzado.stockActual = Number(calzado.stockActual || 0) + cantidad;
    }

    calzado.segmentoTalla = calcularSegmentoTalla(
      calzado.talla,
      calzado.stockPorTalla,
      calzado.tipoProducto,
      calzado.esExtra,
    );
    this.validarFormulaMaestra(calzado, "restituir inventario");
  }

  /**
   * Restituye los extras incluidos al devolver unidades del calzado principal.
   * Nunca restituye más de lo que el extra tiene registrado como vendido (fórmula maestra intacta).
   */
  private async restituirExtrasIncluidos(
    manager: EntityManager,
    bloqueados: Map<string, Calzado>,
    calzadoPrincipal: Calzado,
    tallaDevuelta: string,
    cantidadDevuelta: number,
  ): Promise<void> {
    const extras = Array.isArray(calzadoPrincipal.extrasIncluidos)
      ? calzadoPrincipal.extrasIncluidos
      : [];

    for (const extraItem of extras) {
      if (!extraItem || !this.extraAplicaATalla(extraItem, tallaDevuelta)) {
        continue;
      }
      if (!extraItem.extraId && !extraItem.codigo) continue;

      const calzadoExtra = await this.obtenerCalzadoBloqueado(
        manager,
        bloqueados,
        { id: extraItem.extraId, codigo: extraItem.codigo },
      );
      if (!calzadoExtra || calzadoExtra.id === calzadoPrincipal.id) continue;

      const cantidadExtra =
        Math.max(1, Math.floor(Number(extraItem.cantidad) || 1)) *
        cantidadDevuelta;
      const restituible = Math.min(
        cantidadExtra,
        Math.max(0, Number(calzadoExtra.totalVendido || 0)),
      );
      if (restituible <= 0) continue;

      const mapaExtra = normalizarMapaStockPorTalla(calzadoExtra.stockPorTalla);
      calzadoExtra.totalVendido =
        Number(calzadoExtra.totalVendido || 0) - restituible;
      const clavesExtra = ordenarClavesTallas(Object.keys(mapaExtra));
      if (clavesExtra.length > 0) {
        const clave =
          resolverClaveTallaEnMapa(mapaExtra, "", {
            permitirUnicaConExistencias: false,
          }) ?? clavesExtra[0];
        mapaExtra[clave] = (mapaExtra[clave] ?? 0) + restituible;
        calzadoExtra.stockPorTalla = mapaExtra;
        calzadoExtra.stockActual = sumarStockPorTalla(mapaExtra);
      } else {
        calzadoExtra.stockActual =
          Number(calzadoExtra.stockActual || 0) + restituible;
      }

      this.validarFormulaMaestra(calzadoExtra, "restituir el extra incluido");
      await manager.save(calzadoExtra);
    }
  }

  /**
   * Procesa de forma atómica un cambio de talla/calzado, devolución parcial o devolución total.
   * Restituye inventario original, descuenta inventario de reemplazo y recalcula totales.
   */
  async procesarCambioODevolucion(
    id: string,
    dto: ProcesarCambioDevolucionDto,
  ): Promise<{
    venta: Venta;
    diferenciaNeto: number;
    tipoMovimiento: "CAMBIO" | "DEVOLUCION_PARCIAL" | "DEVOLUCION_TOTAL";
  }> {
    const motivoLimpio = limpiarEspacios(dto.motivo);
    if (!motivoLimpio) {
      throw new BadRequestException({
        codigo: "ERR-VENT-010",
        mensaje: "Debes ingresar el motivo del cambio o devolución",
      });
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Bloquea la venta para impedir dos devoluciones concurrentes sobre el mismo ticket
      await queryRunner.manager.findOne(Venta, {
        where: { id },
        lock: { mode: "pessimistic_write" },
      });
      const venta = await queryRunner.manager.findOne(Venta, {
        where: { id },
        relations: ["detalles"],
      });
      if (!venta) {
        throw new NotFoundException({
          codigo: "ERR-VENT-002",
          mensaje: `La venta con ID ${id} no fue encontrada`,
        });
      }

      if (venta.estado === EstadoVenta.ANULADA_DEVUELTA) {
        throw new BadRequestException({
          codigo: "ERR-VENT-011",
          mensaje: "Esta venta ya fue anulada por devolución total",
        });
      }

      const detallesOriginales = venta.detalles || [];
      if (detallesOriginales.length === 0) {
        throw new BadRequestException({
          codigo: "ERR-VENT-012",
          mensaje: "La venta no tiene ítems activos para cambiar o devolver",
        });
      }

      const mapaDetalles = new Map<string, DetalleVenta>(
        detallesOriginales.map((d) => [d.id, d]),
      );

      // Mapear cantidades solicitadas a devolver por línea
      const mapaDevoluciones = new Map<string, number>();
      if (dto.devolucionTotal) {
        for (const det of detallesOriginales) {
          mapaDevoluciones.set(det.id, det.cantidad);
        }
      } else {
        for (const item of dto.itemsDevueltos || []) {
          if (item.cantidadADevolver <= 0) continue;
          const det = mapaDetalles.get(item.detalleId);
          if (!det) {
            throw new BadRequestException({
              codigo: "ERR-VENT-013",
              mensaje: `La línea de detalle ${item.detalleId} no pertenece a esta venta`,
            });
          }
          const acumulado =
            (mapaDevoluciones.get(item.detalleId) || 0) +
            item.cantidadADevolver;
          if (acumulado > det.cantidad) {
            throw new BadRequestException({
              codigo: "ERR-VENT-014",
              mensaje: `No puedes devolver ${acumulado} unidades de ${det.nombreProducto} (vendidas: ${det.cantidad})`,
            });
          }
          mapaDevoluciones.set(item.detalleId, acumulado);
        }
      }

      const itemsReemplazo = dto.devolucionTotal
        ? []
        : dto.itemsReemplazo || [];

      if (mapaDevoluciones.size === 0 && itemsReemplazo.length === 0) {
        throw new BadRequestException({
          codigo: "ERR-VENT-015",
          mensaje:
            "Selecciona al menos una unidad para devolver o un calzado de reemplazo",
        });
      }

      // Detectar automáticamente devolución total cuando se devuelven todas las unidades sin reemplazos
      let quedanUnidadesOriginales = false;
      for (const det of detallesOriginales) {
        const cantDevuelta = mapaDevoluciones.get(det.id) || 0;
        if (det.cantidad - cantDevuelta > 0) {
          quedanUnidadesOriginales = true;
          break;
        }
      }
      const esDevolucionTotal =
        Boolean(dto.devolucionTotal) ||
        (!quedanUnidadesOriginales && itemsReemplazo.length === 0);

      const totalAnterior = redondear(Number(venta.totalVenta));
      const descuentoPorLineasPrevio = detallesOriginales.reduce(
        (acc, d) => acc + Number(d.descuento || 0),
        0,
      );
      const descuentoGeneralPrevio = Math.max(
        0,
        redondear(Number(venta.descuento || 0) - descuentoPorLineasPrevio),
      );

      const itemsDevueltosLog: HistorialCambioVentaItem["itemsDevueltos"] = [];
      const itemsAgregadosLog: HistorialCambioVentaItem["itemsAgregados"] = [];

      // Calzados bloqueados (pessimistic_write) compartidos entre devoluciones y reemplazos
      const manager = queryRunner.manager;
      const bloqueados = new Map<string, Calzado>();
      await this.prebloquearCalzados(manager, bloqueados, [
        ...Array.from(mapaDevoluciones.keys()).map((detalleId) => {
          const det = mapaDetalles.get(detalleId);
          return { id: det?.calzadoId, codigo: det?.codigoProducto };
        }),
        ...itemsReemplazo.map((reemp) => ({ codigo: reemp.codigoProducto })),
      ]);
      await this.prebloquearCalzados(
        manager,
        bloqueados,
        this.referenciasExtrasIncluidos(Array.from(bloqueados.values())),
      );

      // 1) Restituir stock de cada unidad devuelta
      for (const [detalleId, cantDevuelta] of mapaDevoluciones.entries()) {
        const det = mapaDetalles.get(detalleId);
        if (!det) continue;
        const calzado = await this.obtenerCalzadoBloqueado(manager, bloqueados, {
          id: det.calzadoId,
          codigo: det.codigoProducto,
        });
        if (calzado) {
          this.restituirStockCalzado(calzado, det.talla, cantDevuelta);
          await manager.save(calzado);
          await this.restituirExtrasIncluidos(
            manager,
            bloqueados,
            calzado,
            det.talla,
            cantDevuelta,
          );
        } else {
          this.registro.warn(
            `Devolución de ${det.codigoProducto} sin calzado en inventario: no se restituyó stock`,
          );
        }

        const descuentoUnit =
          det.cantidad > 0 ? Number(det.descuento || 0) / det.cantidad : 0;
        const montoDevueltoLinea = redondear(
          (Number(det.precioUnitario) - descuentoUnit) * cantDevuelta,
        );
        itemsDevueltosLog.push({
          codigoProducto: det.codigoProducto,
          nombreProducto: det.nombreProducto,
          talla: det.talla,
          cantidad: cantDevuelta,
          montoBs: montoDevueltoLinea,
        });

        if (!esDevolucionTotal) {
          const nuevaCant = det.cantidad - cantDevuelta;
          if (nuevaCant <= 0) {
            await queryRunner.manager.remove(DetalleVenta, det);
            det.cantidad = 0;
          } else {
            det.cantidad = nuevaCant;
            det.descuento = redondear(
              Math.max(0, Number(det.descuento || 0) - descuentoUnit * cantDevuelta),
            );
            det.total = redondear(
              Number(det.precioUnitario) * det.cantidad - det.descuento,
            );
            await queryRunner.manager.save(det);
          }
        }
      }

      // 2) Descontar stock y registrar detalles de reemplazo
      const nuevosDetallesAgregados: DetalleVenta[] = [];
      for (const reemp of itemsReemplazo) {
        const codigoNormalizado = normalizarCodigoProducto(reemp.codigoProducto);
        const calzadoReemp = await this.obtenerCalzadoBloqueado(
          manager,
          bloqueados,
          { codigo: reemp.codigoProducto },
        );
        if (!calzadoReemp || !calzadoReemp.activo) {
          throw new NotFoundException({
            codigo: "ERR-CALZ-002",
            mensaje: `Calzado de reemplazo ${codigoNormalizado} no encontrado o inactivo`,
          });
        }

        const tallaElegida = this.descontarStockVendido(
          calzadoReemp,
          limpiarEspacios(reemp.tallaSeleccionada || reemp.talla),
          reemp.cantidad,
        );
        await manager.save(calzadoReemp);
        await this.descontarExtrasIncluidos(
          manager,
          bloqueados,
          calzadoReemp,
          tallaElegida,
          reemp.cantidad,
        );

        const precioUnitarioReemp =
          reemp.precioUnitario !== undefined
            ? redondear(Number(reemp.precioUnitario))
            : redondear(Number(calzadoReemp.precioVenta));
        const descuentoReemp = redondear(Number(reemp.descuento || 0));
        const subtotalReemp = redondear(precioUnitarioReemp * reemp.cantidad);
        const totalReemp = redondear(Math.max(0, subtotalReemp - descuentoReemp));

        const nuevoDet = queryRunner.manager.create(DetalleVenta, {
          ventaId: venta.id,
          calzadoId: calzadoReemp.id,
          codigoProducto: calzadoReemp.codigoProducto,
          nombreProducto: calzadoReemp.nombreProducto,
          talla: tallaElegida,
          cantidad: reemp.cantidad,
          precioUnitario: precioUnitarioReemp,
          costoUnitario: redondear(Number(calzadoReemp.precioCompra || 0)),
          descuento: descuentoReemp,
          total: totalReemp,
        });
        const guardadoDet = await queryRunner.manager.save(
          DetalleVenta,
          nuevoDet,
        );
        nuevosDetallesAgregados.push(guardadoDet);
        itemsAgregadosLog.push({
          codigoProducto: calzadoReemp.codigoProducto,
          nombreProducto: calzadoReemp.nombreProducto,
          talla: tallaElegida,
          cantidad: reemp.cantidad,
          montoBs: totalReemp,
        });
      }

      // 3) Recalcular importes, estado e historial de auditoría
      let nuevoTotal = 0;
      let tipoMovimiento: HistorialCambioVentaItem["tipo"] =
        "DEVOLUCION_PARCIAL";

      if (esDevolucionTotal) {
        venta.subtotal = 0;
        venta.descuento = 0;
        venta.totalVenta = 0;
        venta.estado = EstadoVenta.ANULADA_DEVUELTA;
        tipoMovimiento = "DEVOLUCION_TOTAL";
      } else {
        const detallesVigentes = [
          ...detallesOriginales.filter((d) => d.cantidad > 0),
          ...nuevosDetallesAgregados,
        ];
        const nuevoSubtotal = redondear(
          detallesVigentes.reduce(
            (acc, d) => acc + Number(d.precioUnitario) * d.cantidad,
            0,
          ),
        );
        const nuevoDescuentoLineas = redondear(
          detallesVigentes.reduce((acc, d) => acc + Number(d.descuento || 0), 0),
        );
        const descuentoTotalAplicado = redondear(
          Math.min(
            nuevoSubtotal,
            nuevoDescuentoLineas + descuentoGeneralPrevio,
          ),
        );
        nuevoTotal = redondear(
          Math.max(0, nuevoSubtotal - descuentoTotalAplicado),
        );

        venta.subtotal = nuevoSubtotal;
        venta.descuento = descuentoTotalAplicado;
        venta.totalVenta = nuevoTotal;
        venta.estado =
          itemsAgregadosLog.length > 0
            ? EstadoVenta.EDITADA_CON_CAMBIO
            : EstadoVenta.DEVUELTA_PARCIAL;
        tipoMovimiento =
          itemsAgregadosLog.length > 0 ? "CAMBIO" : "DEVOLUCION_PARCIAL";
      }

      const diferenciaNeto = redondear(nuevoTotal - totalAnterior);
      const registroAuditoria: HistorialCambioVentaItem = {
        id: `${Date.now()}`,
        fechaHora: new Date().toISOString(),
        tipo: tipoMovimiento,
        operador: limpiarEspacios(dto.operadorNombre) || "Personal en turno",
        motivo: motivoLimpio,
        itemsDevueltos: itemsDevueltosLog,
        itemsAgregados: itemsAgregadosLog,
        totalAnterior,
        totalNuevo: nuevoTotal,
        diferenciaNeto,
        formaPagoDiferencia: dto.formaPagoDiferencia || null,
        bancoDiferencia: limpiarEspacios(dto.bancoDiferencia) || null,
      };

      const historialActual = Array.isArray(venta.historialCambios)
        ? venta.historialCambios
        : [];
      venta.historialCambios = [...historialActual, registroAuditoria];

      const etiquetaNota =
        tipoMovimiento === "DEVOLUCION_TOTAL"
          ? `[DEVOLUCIÓN TOTAL] ${motivoLimpio}`
          : tipoMovimiento === "CAMBIO"
            ? `[CAMBIO] ${motivoLimpio}`
            : `[DEVOLUCIÓN PARCIAL] ${motivoLimpio}`;
      venta.notas = venta.notas
        ? `${venta.notas} | ${etiquetaNota}`
        : etiquetaNota;

      await queryRunner.manager.save(Venta, venta);

      // Actualizar métricas acumuladas del cliente si está asociado
      if (venta.clienteId) {
        const cliente = await queryRunner.manager.findOne(Cliente, {
          where: { id: venta.clienteId },
        });
        if (cliente) {
          cliente.montoTotalComprado = redondear(
            Math.max(0, Number(cliente.montoTotalComprado || 0) + diferenciaNeto),
          );
          if (esDevolucionTotal) {
            cliente.totalCompras = Math.max(0, (cliente.totalCompras || 1) - 1);
          }
          await queryRunner.manager.save(Cliente, cliente);
        }
      }

      await queryRunner.commitTransaction();

      const ventaActualizada = await this.obtenerPorId(id);
      return {
        venta: ventaActualizada,
        diferenciaNeto,
        tipoMovimiento,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

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
            ? (error as {
                response?: { mensaje?: string; codigo?: string };
                message?: string;
              })
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
