import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { IngresoMercancia } from "./entidades/ingreso-mercancia.entidad";
import { Calzado } from "../calzados/entidades/calzado.entidad";
import { Proveedor } from "./entidades/proveedor.entidad";
import { CrearIngresoDto } from "./dto/crear-ingreso.dto";
import { ActualizarIngresoDto } from "./dto/actualizar-ingreso.dto";
import { CrearProveedorDto } from "./dto/crear-proveedor.dto";
import { normalizarCodigoProducto } from "../../comun/utilidades/normalizacion-catalogo";

const PROVEEDORES_INICIALES = [
  "Distribuidora Calzado SRL",
  "Importadora Los Andes",
  "Calzados Manaco",
  "Comercializadora Illimani",
];

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
      const cantidad = await this.proveedorRepositorio.count();
      if (cantidad === 0) {
        // Sembrar proveedores iniciales y los que ya existan en ingresos_mercancia
        const proveedoresAInsertar = new Set<string>(PROVEEDORES_INICIALES);

        try {
          const filas = await this.ingresoRepositorio
            .createQueryBuilder("ingreso")
            .select("DISTINCT ingreso.proveedor", "proveedor")
            .where("ingreso.proveedor IS NOT NULL AND ingreso.proveedor != ''")
            .getRawMany<{ proveedor: string }>();

          filas.forEach((f) => {
            if (f.proveedor && f.proveedor.trim()) {
              proveedoresAInsertar.add(f.proveedor.trim());
            }
          });
        } catch {
          // Ignorar si la tabla de ingresos aún no existe o está vacía
        }

        for (const nombre of proveedoresAInsertar) {
          await this.proveedorRepositorio.save(
            this.proveedorRepositorio.create({
              nombre,
              activo: true,
            }),
          );
        }
        this.registro.log(
          `Catálogo de proveedores inicializado con ${proveedoresAInsertar.size} registros.`,
        );
      }
    } catch (error) {
      this.registro.warn(
        `No fue posible inicializar proveedores: ${(error as Error).message}`,
      );
    }
  }

  async listarProveedores(): Promise<Proveedor[]> {
    // Sincronizar nombres históricos de ingresos solo la primera vez para no degradar latencia
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
          if (nombreLimpio && !nombresExistentes.has(nombreLimpio.toLowerCase())) {
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
        // Ignorar si la sincronización raw falla
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
      if (!existente.activo) {
        existente.activo = true;
        if (dto.telefono) existente.telefono = dto.telefono.trim();
        if (dto.contacto) existente.contacto = dto.contacto.trim();
        return this.proveedorRepositorio.save(existente);
      }
      return existente;
    }

    const nuevo = this.proveedorRepositorio.create({
      nombre: nombreLimpio,
      telefono: dto.telefono ? dto.telefono.trim() : null,
      contacto: dto.contacto ? dto.contacto.trim() : null,
      activo: true,
    });

    return this.proveedorRepositorio.save(nuevo);
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

  private async asegurarProveedorRegistrado(nombre: string): Promise<void> {
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) return;
    try {
      const existente = await this.proveedorRepositorio
        .createQueryBuilder("p")
        .where("LOWER(p.nombre) = LOWER(:nombre)", { nombre: nombreLimpio })
        .getOne();
      if (!existente) {
        await this.proveedorRepositorio.save(
          this.proveedorRepositorio.create({
            nombre: nombreLimpio,
            activo: true,
          }),
        );
      }
    } catch {
      // Ignorar error secundario
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

      if (dto.precioCompraUnitario <= 0) {
        throw new BadRequestException({
          codigo: "ERR-CALZ-004",
          mensaje: "El precio de compra unitario debe ser mayor a 0",
        });
      }

      if (!Number.isInteger(dto.cantidad) || dto.cantidad <= 0) {
        throw new BadRequestException({
          codigo: "ERR-ING-002",
          mensaje: "La cantidad de ingreso debe ser un número entero mayor a 0",
        });
      }

      const cantidadIngreso = Number(dto.cantidad);
      const costoIngreso = Number(dto.precioCompraUnitario);
      const precioVentaNuevo = Number(dto.precioVentaUnitario);

      const precioCompraDifiere =
        Math.abs(Number(calzado.precioCompra) - costoIngreso) > 0.001;
      const precioVentaDifiere =
        precioVentaNuevo > 0 &&
        Math.abs(Number(calzado.precioVenta) - precioVentaNuevo) > 0.001;

      // COM-003: Opción CREAR_VARIANTE_NUEVO_PRECIO
      if (
        dto.modoActualizacionPrecio === "CREAR_VARIANTE_NUEVO_PRECIO" &&
        (precioCompraDifiere || precioVentaDifiere)
      ) {
        // Obtener siguiente correlativo P-N
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

        const nuevoCalzado = queryRunner.manager.create(Calzado, {
          codigoProducto: nuevoCodigo,
          nombreProducto: calzado.nombreProducto,
          marca: calzado.marca,
          tipoProducto: calzado.tipoProducto,
          categoria: calzado.categoria,
          talla: dto.talla || calzado.talla,
          color: calzado.color,
          precioCompra: costoIngreso,
          precioVenta:
            precioVentaNuevo > 0 ? precioVentaNuevo : Number(calzado.precioVenta),
          stockInicial: 0,
          totalIngresado: cantidadIngreso,
          totalVendido: 0,
          stockActual: cantidadIngreso,
          fotoUrl: calzado.fotoUrl,
          fotosGaleria: calzado.fotosGaleria,
          extras: calzado.extras,
          alertaStockMinimo: calzado.alertaStockMinimo,
          activo: true,
        });

        const calzadoGuardado = await queryRunner.manager.save(nuevoCalzado);

        const nuevoIngreso = queryRunner.manager.create(IngresoMercancia, {
          ...dto,
          codigoProducto: nuevoCodigo,
          talla: dto.talla || calzado.talla || "",
          fechaIngreso: new Date(dto.fechaIngreso),
          calzadoId: calzadoGuardado.id,
        });

        const ingresoGuardado = await queryRunner.manager.save(nuevoIngreso);
        await queryRunner.commitTransaction();

        await this.asegurarProveedorRegistrado(dto.proveedor);
        return ingresoGuardado;
      }

      // COM-004: Costo promedio ponderado si hay stock disponible positivo
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

      await queryRunner.manager.save(calzado);

      // COM-004: Actualizar precio de venta del modelo completo si fue seleccionado
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

      const nuevoIngreso = queryRunner.manager.create(IngresoMercancia, {
        ...dto,
        codigoProducto: calzado.codigoProducto,
        talla: dto.talla || calzado.talla || "",
        fechaIngreso: new Date(dto.fechaIngreso),
        calzadoId: calzado.id,
      });

      const ingresoGuardado = await queryRunner.manager.save(nuevoIngreso);
      await queryRunner.commitTransaction();

      await this.asegurarProveedorRegistrado(dto.proveedor);
      return ingresoGuardado;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // COM-001: Editar compras con reversión de stock y recálculo
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
      if (nuevoPrecioCompra <= 0) {
        throw new BadRequestException({
          codigo: "ERR-CALZ-004",
          mensaje: "El precio de compra unitario debe ser mayor a 0",
        });
      }

      const nuevoPrecioVenta =
        dto.precioVentaUnitario !== undefined
          ? Number(dto.precioVentaUnitario)
          : Number(ingreso.precioVentaUnitario);

      const cambiaCalzado =
        dto.codigoProducto &&
        normalizarCodigoProducto(dto.codigoProducto) !==
          normalizarCodigoProducto(ingreso.codigoProducto);

      if (cambiaCalzado) {
        // Al desasociar del calzado original, su stock no puede quedar negativo
        if (stockSinIngreso < 0) {
          throw new BadRequestException({
            codigo: "ERR-ING-005",
            mensaje:
              "No se puede transferir el ingreso porque el stock del calzado original quedaría negativo",
          });
        }

        calzadoOriginal.stockActual = stockSinIngreso;
        calzadoOriginal.totalIngresado = Math.max(0, totalIngresadoSinIngreso);
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
        await queryRunner.manager.save(nuevoCalzado);

        ingreso.calzadoId = nuevoCalzado.id;
        ingreso.codigoProducto = nuevoCalzado.codigoProducto;
      } else {
        // Mismo calzado: verificar que el stock final no sea negativo
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

      // Actualizar campos del ingreso
      if (dto.fechaIngreso) ingreso.fechaIngreso = new Date(dto.fechaIngreso);
      ingreso.cantidad = nuevaCantidad;
      if (dto.proveedor) ingreso.proveedor = dto.proveedor.trim();
      ingreso.precioCompraUnitario = nuevoPrecioCompra;
      ingreso.precioVentaUnitario = nuevoPrecioVenta;
      if (dto.talla !== undefined) ingreso.talla = dto.talla;
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
