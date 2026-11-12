import {
  Injectable,
  BadRequestException,
  NotFoundException,
  OnModuleInit,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource, Brackets } from "typeorm";
import {
  Venta,
  MetodoPago,
  MotivoDescuento,
  DesglosePagoItem,
} from "./entidades/venta.entidad";
import { DetalleVenta } from "./entidades/detalle-venta.entidad";
import { Calzado } from "../calzados/entidades/calzado.entidad";
import { Banco } from "./entidades/banco.entidad";
import { CrearVentaDto, ActualizarVentaDto } from "./dto/crear-venta.dto";
import { SincronizarVentasDto } from "./dto/sincronizar-ventas.dto";
import { FiltrosVentasDto } from "./dto/filtros-ventas.dto";
import { ClientesServicio } from "../clientes/clientes.servicio";
import {
  limpiarEspacios,
  normalizarCodigoProducto,
} from "../../comun/utilidades/normalizacion-catalogo";

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

      for (const linea of dto.lineas) {
        const codigoNormalizado = normalizarCodigoProducto(
          linea.codigoProducto,
        );
        let calzado = await queryRunner.manager.findOne(Calzado, {
          where: { codigoProducto: linea.codigoProducto, activo: true },
          lock: { mode: "pessimistic_write" },
        });

        if (!calzado && codigoNormalizado !== linea.codigoProducto) {
          calzado = await queryRunner.manager.findOne(Calzado, {
            where: { codigoProducto: codigoNormalizado, activo: true },
            lock: { mode: "pessimistic_write" },
          });
        }

        if (!calzado) {
          throw new NotFoundException({
            codigo: "ERR-CALZ-001",
            mensaje: `Calzado con código ${linea.codigoProducto} no encontrado`,
          });
        }

        const tallaElegida = limpiarEspacios(
          linea.tallaSeleccionada || linea.talla,
        );

        if (calzado.stockActual < linea.cantidad) {
          throw new BadRequestException({
            codigo: "ERR-CALZ-003",
            mensaje: `Stock insuficiente para ${calzado.nombreProducto} (Talla: ${tallaElegida || calzado.talla}). Disponible: ${calzado.stockActual}`,
          });
        }

        // Descontar stock por talla específica si existe en stockPorTalla
        if (
          calzado.stockPorTalla &&
          typeof calzado.stockPorTalla === "object" &&
          Object.keys(calzado.stockPorTalla).length > 0
        ) {
          const mapaActual = { ...calzado.stockPorTalla };
          const claveEncontrada =
            tallaElegida && mapaActual[tallaElegida] !== undefined
              ? tallaElegida
              : Object.keys(mapaActual).length === 1
                ? Object.keys(mapaActual)[0]
                : undefined;

          if (claveEncontrada) {
            const disponibleEnTalla = Number(mapaActual[claveEncontrada] || 0);
            if (
              Object.keys(mapaActual).length > 1 &&
              disponibleEnTalla < linea.cantidad
            ) {
              throw new BadRequestException({
                codigo: "ERR-CALZ-003",
                mensaje: `Stock insuficiente para ${calzado.nombreProducto} en talla ${claveEncontrada}. Disponible: ${disponibleEnTalla}`,
              });
            }
            mapaActual[claveEncontrada] = Math.max(
              0,
              disponibleEnTalla - linea.cantidad,
            );
            calzado.stockPorTalla = mapaActual;
          }
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

        calzado.stockActual = Math.max(0, calzado.stockActual - linea.cantidad);
        calzado.totalVendido += linea.cantidad;
        await queryRunner.manager.save(calzado);

        // Si el calzado vendido tiene extrasIncluidos inventariados, descontar su stock disponible
        if (
          Array.isArray(calzado.extrasIncluidos) &&
          calzado.extrasIncluidos.length > 0
        ) {
          for (const extraItem of calzado.extrasIncluidos) {
            if (
              extraItem.tallaAsociada &&
              tallaElegida &&
              extraItem.tallaAsociada.trim() !== tallaElegida
            ) {
              continue;
            }
            const cantidadExtraTotal =
              Math.max(1, Number(extraItem.cantidad || 1)) * linea.cantidad;
            let calzadoExtra: Calzado | null = null;

            if (extraItem.extraId) {
              calzadoExtra = await queryRunner.manager.findOne(Calzado, {
                where: { id: extraItem.extraId, activo: true },
              });
            } else if (extraItem.codigo) {
              calzadoExtra = await queryRunner.manager.findOne(Calzado, {
                where: {
                  codigoProducto: normalizarCodigoProducto(extraItem.codigo),
                  activo: true,
                },
              });
            }

            if (calzadoExtra && calzadoExtra.stockActual > 0) {
              const descuentoRealExtra = Math.min(
                calzadoExtra.stockActual,
                cantidadExtraTotal,
              );
              calzadoExtra.stockActual -= descuentoRealExtra;
              calzadoExtra.totalVendido += descuentoRealExtra;
              if (
                calzadoExtra.stockPorTalla &&
                typeof calzadoExtra.stockPorTalla === "object"
              ) {
                const primeraClave = Object.keys(calzadoExtra.stockPorTalla)[0];
                if (primeraClave) {
                  calzadoExtra.stockPorTalla = {
                    ...calzadoExtra.stockPorTalla,
                    [primeraClave]: Math.max(
                      0,
                      Number(calzadoExtra.stockPorTalla[primeraClave] || 0) -
                        descuentoRealExtra,
                    ),
                  };
                }
              }
              await queryRunner.manager.save(calzadoExtra);
            }
          }
        }

        subtotalCalculado += subtotalLinea;
        descuentoLineas += descuentoLinea;

        detallesParaGuardar.push(
          queryRunner.manager.create(DetalleVenta, {
            calzadoId: calzado.id,
            codigoProducto: calzado.codigoProducto,
            nombreProducto: calzado.nombreProducto,
            talla: tallaElegida || calzado.talla || "",
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
