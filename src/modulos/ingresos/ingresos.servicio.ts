import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource, Brackets } from "typeorm";
import { IngresoMercancia } from "./entidades/ingreso-mercancia.entidad";
import { Calzado } from "../calzados/entidades/calzado.entidad";
import { Proveedor } from "./entidades/proveedor.entidad";
import { CrearIngresoDto } from "./dto/crear-ingreso.dto";
import { ActualizarIngresoDto } from "./dto/actualizar-ingreso.dto";
import {
  CrearProveedorDto,
  ActualizarProveedorDto,
} from "./dto/crear-proveedor.dto";
import {
  TALLA_UNICA,
  calcularSegmentoTalla,
  limpiarEspacios,
  normalizarCodigoProducto,
} from "../../comun/utilidades/normalizacion-catalogo";

const PROVEEDORES_INICIALES = [
  "Distribuidora Calzado SRL",
  "Importadora Los Andes",
  "Calzados Manaco",
  "Comercializadora Illimani",
];

const redondear = (valor: number): number => Math.round(valor * 100) / 100;

@Injectable()
export class IngresosServicio implements OnModuleInit {
  private readonly registro = new Logger(IngresosServicio.name);
  private proveedoresSincronizados = false;

  constructor(
    @InjectRepository(IngresoMercancia)
    private readonly ingresoRepositorio: Repository<IngresoMercancia>,
    @InjectRepository(Calzado)
    private readonly calzadoRepositorio: Repository<Calzado>,
    @InjectRepository(Proveedor)
    private readonly proveedorRepositorio: Repository<Proveedor>,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.dataSource.query(`
        ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS ciudad VARCHAR(120);
        ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS metodos_pago JSONB;
        ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS notas TEXT;
        ALTER TABLE ingresos_mercancia ADD COLUMN IF NOT EXISTS proveedor_id UUID;
        ALTER TABLE ingresos_mercancia ADD COLUMN IF NOT EXISTS forma_pago VARCHAR(30) DEFAULT 'Efectivo';
        ALTER TABLE ingresos_mercancia ADD COLUMN IF NOT EXISTS desglose_pagos JSONB;
        ALTER TABLE ingresos_mercancia ALTER COLUMN talla TYPE VARCHAR(50);
      `);
    } catch {
      // Ignorar si ya existen
    }

    try {
      await this.dataSource.query(`
        INSERT INTO proveedores (id, nombre, activo)
        VALUES 
          (gen_random_uuid(), 'Distribuidora Calzado SRL', true),
          (gen_random_uuid(), 'Importadora Los Andes', true),
          (gen_random_uuid(), 'Calzados Manaco', true),
          (gen_random_uuid(), 'Comercializadora Illimani', true)
        ON CONFLICT (nombre) DO NOTHING;
      `);
    } catch {
      // Ignorar si ya existen
    }
  }

  async listarProveedores(): Promise<Proveedor[]> {
    if (!this.proveedoresSincronizados) {
      try {
        const proveedoresRegistrados = await this.proveedorRepositorio.find({
          where: { activo: true },
        });

        const nombresExistentes = new Set(
          proveedoresRegistrados.map((p) => p.nombre.trim().toLowerCase()),
        );

        const filas = await this.ingresoRepositorio
          .createQueryBuilder("ingreso")
          .select("DISTINCT ingreso.proveedor", "proveedor")
          .where("ingreso.proveedor IS NOT NULL AND ingreso.proveedor != ''")
          .getRawMany<{ proveedor: string }>();

        for (const fila of filas) {
          const nombreLimpio = fila.proveedor?.trim();
          if (
            nombreLimpio &&
            !nombresExistentes.has(nombreLimpio.toLowerCase())
          ) {
            await this.proveedorRepositorio.save(
              this.proveedorRepositorio.create({
                nombre: nombreLimpio,
                activo: true,
              }),
            );
            nombresExistentes.add(nombreLimpio.toLowerCase());
          }
        }
      } catch {
        // Ignorar
      } finally {
        this.proveedoresSincronizados = true;
      }
    }

    return this.proveedorRepositorio.find({
      where: { activo: true },
      order: { nombre: "ASC" },
    });
  }

  async crearProveedor(dto: CrearProveedorDto): Promise<Proveedor> {
    const nombreLimpio = dto.nombre.trim();
    if (!nombreLimpio) {
      throw new BadRequestException({
        codigo: "ERR-ING-001",
        mensaje: "El nombre del proveedor no puede estar vacío",
      });
    }

    const existente = await this.proveedorRepositorio
      .createQueryBuilder("p")
      .where("LOWER(p.nombre) = LOWER(:nombre)", { nombre: nombreLimpio })
      .getOne();

    if (existente) {
      existente.activo = true;
      if (dto.telefono !== undefined)
        existente.telefono = dto.telefono?.trim() || null;
      if (dto.contacto !== undefined)
        existente.contacto = dto.contacto?.trim() || null;
      if (dto.ciudad !== undefined)
        existente.ciudad = dto.ciudad?.trim() || null;
      const metodosEntrada = dto.metodosPago ?? dto.metodosPagoHabituales;
      if (metodosEntrada !== undefined)
        existente.metodosPago = metodosEntrada;
      if (dto.notas !== undefined) existente.notas = dto.notas?.trim() || null;
      return this.proveedorRepositorio.save(existente);
    }

    const nuevo = this.proveedorRepositorio.create({
      nombre: nombreLimpio,
      telefono: dto.telefono ? dto.telefono.trim() : null,
      contacto: dto.contacto ? dto.contacto.trim() : null,
      ciudad: dto.ciudad ? dto.ciudad.trim() : null,
      metodosPago:
        dto.metodosPago ??
        dto.metodosPagoHabituales ?? ["Efectivo", "Transferencia", "QR"],
      notas: dto.notas ? dto.notas.trim() : null,
      activo: true,
    });

    return this.proveedorRepositorio.save(nuevo);
  }

  async actualizarProveedor(
    id: string,
    dto: ActualizarProveedorDto,
  ): Promise<Proveedor> {
    const proveedor = await this.proveedorRepositorio.findOne({
      where: { id },
    });
    if (!proveedor) {
      throw new NotFoundException({
        codigo: "ERR-ING-006",
        mensaje: "Proveedor no encontrado",
      });
    }

    const nombreAnterior = proveedor.nombre;
    if (dto.nombre && dto.nombre.trim()) {
      proveedor.nombre = dto.nombre.trim();
    }
    if (dto.telefono !== undefined) {
      proveedor.telefono = dto.telefono ? dto.telefono.trim() : null;
    }
    if (dto.contacto !== undefined) {
      proveedor.contacto = dto.contacto ? dto.contacto.trim() : null;
    }
    if (dto.ciudad !== undefined) {
      proveedor.ciudad = dto.ciudad ? dto.ciudad.trim() : null;
    }
    const metodosAct = dto.metodosPago ?? dto.metodosPagoHabituales;
    if (metodosAct !== undefined) {
      proveedor.metodosPago = metodosAct;
    }
    if (dto.notas !== undefined) {
      proveedor.notas = dto.notas ? dto.notas.trim() : null;
    }
    if (dto.activo !== undefined) {
      proveedor.activo = dto.activo;
    }

    const guardado = await this.proveedorRepositorio.save(proveedor);

    if (dto.nombre && dto.nombre.trim() && dto.nombre.trim() !== nombreAnterior) {
      try {
        await this.ingresoRepositorio
          .createQueryBuilder()
          .update(IngresoMercancia)
          .set({ proveedor: guardado.nombre, proveedorId: guardado.id })
          .where(
            "proveedor_id = :id OR LOWER(TRIM(proveedor)) = LOWER(TRIM(:nombreAnt))",
            { id: guardado.id, nombreAnt: nombreAnterior },
          )
          .execute();
      } catch {
        // Ignorar
      }
    }

    return guardado;
  }

  async obtenerHistorialProveedor(id: string) {
    const proveedor = await this.proveedorRepositorio.findOne({
      where: { id },
    });
    if (!proveedor) {
      throw new NotFoundException({
        codigo: "ERR-ING-006",
        mensaje: "Proveedor no encontrado",
      });
    }

    const ingresos = await this.ingresoRepositorio
      .createQueryBuilder("ingreso")
      .leftJoinAndSelect("ingreso.calzado", "calzado")
      .where(
        new Brackets((qb) => {
          qb.where("ingreso.proveedorId = :id", { id }).orWhere(
            "LOWER(TRIM(ingreso.proveedor)) = LOWER(TRIM(:nombre))",
            { nombre: proveedor.nombre },
          );
        }),
      )
      .orderBy("ingreso.fechaIngreso", "DESC")
      .addOrderBy("ingreso.creadoEn", "DESC")
      .getMany();

    let totalUnidadesIngresadas = 0;
    let inversionTotalBs = 0;
    const conteoPorMetodoPago: Record<
      string,
      { cantidad: number; montoTotalBs: number }
    > = {};

    for (const ing of ingresos) {
      const cant = Number(ing.cantidad || 0);
      const costoTotal = redondear(
        cant * Number(ing.precioCompraUnitario || 0),
      );
      totalUnidadesIngresadas += cant;
      inversionTotalBs = redondear(inversionTotalBs + costoTotal);

      if (Array.isArray(ing.desglosePagos) && ing.desglosePagos.length > 0) {
        for (const tramo of ing.desglosePagos) {
          const metodo = limpiarEspacios(tramo.metodo) || "Efectivo";
          const monto = redondear(Number(tramo.monto || 0));
          if (!conteoPorMetodoPago[metodo]) {
            conteoPorMetodoPago[metodo] = { cantidad: 0, montoTotalBs: 0 };
          }
          conteoPorMetodoPago[metodo].cantidad += 1;
          conteoPorMetodoPago[metodo].montoTotalBs = redondear(
            conteoPorMetodoPago[metodo].montoTotalBs + monto,
          );
        }
      } else {
        const metodo = limpiarEspacios(ing.formaPago) || "Efectivo";
        if (!conteoPorMetodoPago[metodo]) {
          conteoPorMetodoPago[metodo] = { cantidad: 0, montoTotalBs: 0 };
        }
        conteoPorMetodoPago[metodo].cantidad += 1;
        conteoPorMetodoPago[metodo].montoTotalBs = redondear(
          conteoPorMetodoPago[metodo].montoTotalBs + costoTotal,
        );
      }
    }

    const metodoPagoMasUsado =
      Object.entries(conteoPorMetodoPago).sort(
        (a, b) => b[1].cantidad - a[1].cantidad,
      )[0]?.[0] || null;

    return {
      proveedor,
      totalTransacciones: ingresos.length,
      totalUnidadesIngresadas,
      inversionTotalBs,
      metodoPagoMasUsado,
      conteoPorMetodoPago,
      ingresos,
    };
  }

  async obtenerTodos(opciones: { pagina?: number; limite?: number } = {}) {
    const pagina = opciones.pagina || 1;
    const limite = opciones.limite || 50;
    const skip = (pagina - 1) * limite;

    const [elementos, total] = await this.ingresoRepositorio.findAndCount({
      relations: ["calzado"],
      order: { fechaIngreso: "DESC", creadoEn: "DESC" },
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

  private async asegurarProveedorRegistrado(
    nombre: string,
  ): Promise<Proveedor | null> {
    const nombreLimpio = (nombre || "").trim();
    if (!nombreLimpio) return null;
    try {
      const existente = await this.proveedorRepositorio
        .createQueryBuilder("p")
        .where("LOWER(p.nombre) = LOWER(:nombre)", { nombre: nombreLimpio })
        .getOne();
      if (existente) return existente;
      return await this.proveedorRepositorio.save(
        this.proveedorRepositorio.create({
          nombre: nombreLimpio,
          activo: true,
        }),
      );
    } catch {
      return null;
    }
  }

  async registrar(dto: CrearIngresoDto): Promise<IngresoMercancia> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const codigoNormalizado = normalizarCodigoProducto(dto.codigoProducto);
      const calzado = await queryRunner.manager.findOne(Calzado, {
        where: { codigoProducto: codigoNormalizado, activo: true },
      });

      if (!calzado) {
        throw new NotFoundException({
          codigo: "ERR-ING-003",
          mensaje: `No existe calzado registrado con código ${dto.codigoProducto}`,
        });
      }

      if (!Number.isInteger(dto.cantidad) || dto.cantidad <= 0) {
        throw new BadRequestException({
          codigo: "ERR-ING-002",
          mensaje: "La cantidad de ingreso debe ser un número entero mayor a 0",
        });
      }

      const cantidadIngreso = Number(dto.cantidad);
      const costoIngreso =
        dto.precioCompraUnitario !== undefined &&
        Number(dto.precioCompraUnitario) > 0
          ? Number(dto.precioCompraUnitario)
          : Math.max(0.01, Number(calzado.precioCompra || 0));

      const precioVentaNuevo =
        dto.precioVentaUnitario !== undefined &&
        Number(dto.precioVentaUnitario) > 0
          ? Number(dto.precioVentaUnitario)
          : Number(calzado.precioVenta || 0);

      let proveedorEntidad: Proveedor | null = null;
      if (dto.proveedorId) {
        proveedorEntidad = await queryRunner.manager.findOne(Proveedor, {
          where: { id: dto.proveedorId },
        });
      }
      const nombreProveedorFinal =
        limpiarEspacios(dto.proveedor) ||
        proveedorEntidad?.nombre ||
        "Recepción Almacén";

      const tallaElegida =
        limpiarEspacios(dto.talla) ||
        limpiarEspacios(calzado.talla) ||
        TALLA_UNICA;

      const precioCompraDifiere =
        Math.abs(Number(calzado.precioCompra) - costoIngreso) > 0.001;
      const precioVentaDifiere =
        precioVentaNuevo > 0 &&
        Math.abs(Number(calzado.precioVenta) - precioVentaNuevo) > 0.001;

      const fechaFinal = dto.fechaIngreso
        ? new Date(dto.fechaIngreso)
        : new Date();
      const formaPagoFinal = limpiarEspacios(dto.formaPago) || "Efectivo";

      if (
        dto.modoActualizacionPrecio === "CREAR_VARIANTE_NUEVO_PRECIO" &&
        (precioCompraDifiere || precioVentaDifiere)
      ) {
        const filas = await queryRunner.manager.query(
          `SELECT codigo_producto AS codigo FROM calzados`,
        );
        let maxNumero = 0;
        for (const fila of filas) {
          if (!fila.codigo) continue;
          const match = String(fila.codigo).match(/^p-?0*(\d+)$/i);
          if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxNumero) {
              maxNumero = num;
            }
          }
        }
        const nuevoCodigo = `P-${maxNumero + 1}`;
        const mapaNuevo = { [tallaElegida]: cantidadIngreso };

        const nuevoCalzado = queryRunner.manager.create(Calzado, {
          codigoProducto: nuevoCodigo,
          nombreProducto: calzado.nombreProducto,
          marca: calzado.marca,
          tipoProducto: calzado.tipoProducto,
          categoria: calzado.categoria,
          talla: tallaElegida,
          stockPorTalla: mapaNuevo,
          segmentoTalla: calcularSegmentoTalla(
            tallaElegida,
            mapaNuevo,
            calzado.tipoProducto,
            calzado.esExtra,
          ),
          color: calzado.color,
          precioCompra: costoIngreso,
          precioVenta: precioVentaNuevo,
          stockInicial: 0,
          totalIngresado: cantidadIngreso,
          totalVendido: 0,
          stockActual: cantidadIngreso,
          fotoUrl: calzado.fotoUrl,
          fotosGaleria: calzado.fotosGaleria,
          extras: calzado.extras,
          esExtra: calzado.esExtra,
          extrasIncluidos: calzado.extrasIncluidos,
          alertaStockMinimo: calzado.alertaStockMinimo,
          activo: true,
        });

        const calzadoGuardado = await queryRunner.manager.save(nuevoCalzado);

        const nuevoIngreso = queryRunner.manager.create(IngresoMercancia, {
          fechaIngreso: fechaFinal,
          calzadoId: calzadoGuardado.id,
          codigoProducto: nuevoCodigo,
          cantidad: cantidadIngreso,
          proveedorId: proveedorEntidad?.id || dto.proveedorId || null,
          proveedor: nombreProveedorFinal,
          precioCompraUnitario: costoIngreso,
          precioVentaUnitario: precioVentaNuevo,
          talla: tallaElegida,
          formaPago: formaPagoFinal,
          desglosePagos: dto.desglosePagos ?? null,
          notas: dto.notas || "",
        });

        const ingresoGuardado = await queryRunner.manager.save(nuevoIngreso);
        await queryRunner.commitTransaction();

        await this.asegurarProveedorRegistrado(nombreProveedorFinal);
        return ingresoGuardado;
      }

      const stockPrevio = Math.max(0, Number(calzado.stockActual));
      const costoPrevio = Number(calzado.precioCompra);

      let nuevoCostoCompra = costoIngreso;
      if (stockPrevio > 0) {
        const costoTotalPonderado =
          stockPrevio * costoPrevio + cantidadIngreso * costoIngreso;
        const totalUnidades = stockPrevio + cantidadIngreso;
        nuevoCostoCompra =
          Math.round((costoTotalPonderado / totalUnidades) * 100) / 100;
      }

      calzado.precioCompra = nuevoCostoCompra;
      if (precioVentaNuevo > 0) {
        calzado.precioVenta = precioVentaNuevo;
      }

      calzado.totalIngresado += cantidadIngreso;
      calzado.stockActual += cantidadIngreso;

      // Actualizar stockPorTalla para la talla ingresada
      const mapaActual: Record<string, number> =
        calzado.stockPorTalla && typeof calzado.stockPorTalla === "object"
          ? { ...calzado.stockPorTalla }
          : {};
      mapaActual[tallaElegida] =
        Math.max(0, Number(mapaActual[tallaElegida] || 0)) + cantidadIngreso;
      calzado.stockPorTalla = mapaActual;
      calzado.talla = Object.keys(mapaActual).join(", ");
      calzado.segmentoTalla = calcularSegmentoTalla(
        calzado.talla,
        calzado.stockPorTalla,
        calzado.tipoProducto,
        calzado.esExtra,
      );

      await queryRunner.manager.save(calzado);

      if (
        dto.modoActualizacionPrecio === "ACTUALIZAR_MODELO_COMPLETO" &&
        precioVentaNuevo > 0
      ) {
        await queryRunner.manager
          .createQueryBuilder()
          .update(Calzado)
          .set({ precioVenta: precioVentaNuevo })
          .where("LOWER(nombre_producto) = LOWER(:nombre)", {
            nombre: calzado.nombreProducto.trim(),
          })
          .andWhere("stock_actual > 0")
          .andWhere("id != :id", { id: calzado.id })
          .execute();
      }

      const provReg =
        proveedorEntidad ||
        (await this.asegurarProveedorRegistrado(nombreProveedorFinal));

      const nuevoIngreso = queryRunner.manager.create(IngresoMercancia, {
        fechaIngreso: fechaFinal,
        calzadoId: calzado.id,
        codigoProducto: calzado.codigoProducto,
        cantidad: cantidadIngreso,
        proveedorId: provReg?.id || dto.proveedorId || null,
        proveedor: nombreProveedorFinal,
        precioCompraUnitario: costoIngreso,
        precioVentaUnitario: precioVentaNuevo,
        talla: tallaElegida,
        formaPago: formaPagoFinal,
        desglosePagos: dto.desglosePagos ?? null,
        notas: dto.notas || "",
      });

      const ingresoGuardado = await queryRunner.manager.save(nuevoIngreso);
      await queryRunner.commitTransaction();

      return ingresoGuardado;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async actualizar(
    id: string,
    dto: ActualizarIngresoDto,
  ): Promise<IngresoMercancia> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const ingreso = await queryRunner.manager.findOne(IngresoMercancia, {
        where: { id },
        relations: ["calzado"],
      });

      if (!ingreso) {
        throw new NotFoundException({
          codigo: "ERR-ING-004",
          mensaje: `Ingreso de mercancía con ID ${id} no encontrado`,
        });
      }

      const calzadoOriginal = await queryRunner.manager.findOne(Calzado, {
        where: { id: ingreso.calzadoId },
      });

      if (!calzadoOriginal) {
        throw new NotFoundException({
          codigo: "ERR-ING-003",
          mensaje: "El calzado original asociado a este ingreso no existe",
        });
      }

      const cantidadAnterior = Number(ingreso.cantidad);
      const tallaAnterior = limpiarEspacios(ingreso.talla);
      const stockSinIngreso =
        Number(calzadoOriginal.stockActual) - cantidadAnterior;
      const totalIngresadoSinIngreso =
        Number(calzadoOriginal.totalIngresado) - cantidadAnterior;

      const nuevaCantidad =
        dto.cantidad !== undefined ? Number(dto.cantidad) : cantidadAnterior;
      if (!Number.isInteger(nuevaCantidad) || nuevaCantidad <= 0) {
        throw new BadRequestException({
          codigo: "ERR-ING-002",
          mensaje: "La cantidad de ingreso debe ser un número entero mayor a 0",
        });
      }

      const nuevoPrecioCompra =
        dto.precioCompraUnitario !== undefined
          ? Number(dto.precioCompraUnitario)
          : Number(ingreso.precioCompraUnitario);
      if (nuevoPrecioCompra < 0) {
        throw new BadRequestException({
          codigo: "ERR-CALZ-004",
          mensaje: "El precio de compra unitario no puede ser negativo",
        });
      }

      const nuevoPrecioVenta =
        dto.precioVentaUnitario !== undefined
          ? Number(dto.precioVentaUnitario)
          : Number(ingreso.precioVentaUnitario);

      const nuevaTalla =
        dto.talla !== undefined ? limpiarEspacios(dto.talla) : tallaAnterior;

      const cambiaCalzado =
        dto.codigoProducto &&
        normalizarCodigoProducto(dto.codigoProducto) !==
          normalizarCodigoProducto(ingreso.codigoProducto);

      if (cambiaCalzado) {
        if (stockSinIngreso < 0) {
          throw new BadRequestException({
            codigo: "ERR-ING-005",
            mensaje:
              "No se puede transferir el ingreso porque el stock del calzado original quedaría negativo",
          });
        }

        calzadoOriginal.stockActual = stockSinIngreso;
        calzadoOriginal.totalIngresado = Math.max(0, totalIngresadoSinIngreso);
        if (
          calzadoOriginal.stockPorTalla &&
          tallaAnterior &&
          calzadoOriginal.stockPorTalla[tallaAnterior] !== undefined
        ) {
          calzadoOriginal.stockPorTalla = {
            ...calzadoOriginal.stockPorTalla,
            [tallaAnterior]: Math.max(
              0,
              Number(calzadoOriginal.stockPorTalla[tallaAnterior]) -
                cantidadAnterior,
            ),
          };
        }
        await queryRunner.manager.save(calzadoOriginal);

        const codigoDestino = normalizarCodigoProducto(dto.codigoProducto);
        const nuevoCalzado = await queryRunner.manager.findOne(Calzado, {
          where: { codigoProducto: codigoDestino, activo: true },
        });

        if (!nuevoCalzado) {
          throw new NotFoundException({
            codigo: "ERR-ING-003",
            mensaje: `No existe calzado registrado con código ${dto.codigoProducto}`,
          });
        }

        const stockPrevioNuevo = Math.max(0, Number(nuevoCalzado.stockActual));
        const costoPrevioNuevo = Number(nuevoCalzado.precioCompra);
        let costoPonderadoNuevo = nuevoPrecioCompra;

        if (stockPrevioNuevo > 0) {
          costoPonderadoNuevo =
            Math.round(
              ((stockPrevioNuevo * costoPrevioNuevo +
                nuevaCantidad * nuevoPrecioCompra) /
                (stockPrevioNuevo + nuevaCantidad)) *
                100,
            ) / 100;
        }

        nuevoCalzado.precioCompra = costoPonderadoNuevo;
        if (nuevoPrecioVenta > 0) {
          nuevoCalzado.precioVenta = nuevoPrecioVenta;
        }
        nuevoCalzado.stockActual += nuevaCantidad;
        nuevoCalzado.totalIngresado += nuevaCantidad;
        if (nuevaTalla) {
          const mapaDestino = { ...(nuevoCalzado.stockPorTalla || {}) };
          mapaDestino[nuevaTalla] =
            Math.max(0, Number(mapaDestino[nuevaTalla] || 0)) + nuevaCantidad;
          nuevoCalzado.stockPorTalla = mapaDestino;
        }
        await queryRunner.manager.save(nuevoCalzado);

        ingreso.calzadoId = nuevoCalzado.id;
        ingreso.codigoProducto = nuevoCalzado.codigoProducto;
      } else {
        const stockResultante = stockSinIngreso + nuevaCantidad;
        if (stockResultante < 0) {
          throw new BadRequestException({
            codigo: "ERR-ING-005",
            mensaje:
              "No se puede editar el ingreso porque el stock resultante del calzado quedaría negativo",
          });
        }

        const stockBase = Math.max(0, stockSinIngreso);
        const costoBase = Number(calzadoOriginal.precioCompra);
        let costoPonderado = nuevoPrecioCompra;

        if (stockBase > 0) {
          costoPonderado =
            Math.round(
              ((stockBase * costoBase + nuevaCantidad * nuevoPrecioCompra) /
                (stockBase + nuevaCantidad)) *
                100,
            ) / 100;
        }

        calzadoOriginal.precioCompra = costoPonderado;
        if (nuevoPrecioVenta > 0) {
          calzadoOriginal.precioVenta = nuevoPrecioVenta;
        }
        calzadoOriginal.stockActual = stockResultante;
        calzadoOriginal.totalIngresado = Math.max(
          0,
          totalIngresadoSinIngreso + nuevaCantidad,
        );

        const mapa = { ...(calzadoOriginal.stockPorTalla || {}) };
        if (tallaAnterior && mapa[tallaAnterior] !== undefined) {
          mapa[tallaAnterior] = Math.max(
            0,
            Number(mapa[tallaAnterior]) - cantidadAnterior,
          );
        }
        if (nuevaTalla) {
          mapa[nuevaTalla] =
            Math.max(0, Number(mapa[nuevaTalla] || 0)) + nuevaCantidad;
        }
        calzadoOriginal.stockPorTalla = mapa;

        if (
          dto.modoActualizacionPrecio === "ACTUALIZAR_MODELO_COMPLETO" &&
          nuevoPrecioVenta > 0
        ) {
          await queryRunner.manager
            .createQueryBuilder()
            .update(Calzado)
            .set({ precioVenta: nuevoPrecioVenta })
            .where("LOWER(nombre_producto) = LOWER(:nombre)", {
              nombre: calzadoOriginal.nombreProducto.trim(),
            })
            .andWhere("stock_actual > 0")
            .andWhere("id != :id", { id: calzadoOriginal.id })
            .execute();
        }

        await queryRunner.manager.save(calzadoOriginal);
      }

      if (dto.fechaIngreso) ingreso.fechaIngreso = new Date(dto.fechaIngreso);
      ingreso.cantidad = nuevaCantidad;
      if (dto.proveedorId !== undefined) ingreso.proveedorId = dto.proveedorId;
      if (dto.proveedor) ingreso.proveedor = dto.proveedor.trim();
      ingreso.precioCompraUnitario = nuevoPrecioCompra;
      ingreso.precioVentaUnitario = nuevoPrecioVenta;
      if (dto.talla !== undefined) ingreso.talla = dto.talla;
      if (dto.formaPago !== undefined) ingreso.formaPago = dto.formaPago;
      if (dto.desglosePagos !== undefined)
        ingreso.desglosePagos = dto.desglosePagos;
      if (dto.notas !== undefined) ingreso.notas = dto.notas;

      const ingresoActualizado = await queryRunner.manager.save(ingreso);
      await queryRunner.commitTransaction();

      if (dto.proveedor) {
        await this.asegurarProveedorRegistrado(dto.proveedor);
      }

      return ingresoActualizado;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
