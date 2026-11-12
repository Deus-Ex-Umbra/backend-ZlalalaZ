import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, ILike, Brackets } from "typeorm";
import { Cliente } from "./entidades/cliente.entidad";
import { Venta } from "../ventas/entidades/venta.entidad";
import { CrearClienteDto } from "./dto/crear-cliente.dto";
import { ActualizarClienteDto } from "./dto/actualizar-cliente.dto";
import { limpiarEspacios } from "../../comun/utilidades/normalizacion-catalogo";

const redondear = (valor: number): number => Math.round(valor * 100) / 100;

export interface ResumenMetodoPagoCliente {
  metodo: string;
  cantidad: number;
  montoTotalBs: number;
}

export interface HistorialClienteRespuesta {
  cliente: Cliente;
  metodoPagoMasUtilizado: string | null;
  metodoPagoMasUsado: string | null;
  conteoPorMetodoPago: Record<string, { cantidad: number; montoTotalBs: number }>;
  desgloseMetodos: Record<string, { cantidad: number; montoTotalBs: number }>;
  resumenMetodosPago: ResumenMetodoPagoCliente[];
  compras: Venta[];
}

@Injectable()
export class ClientesServicio implements OnModuleInit {
  constructor(
    @InjectRepository(Cliente)
    private readonly clienteRepositorio: Repository<Cliente>,
    @InjectRepository(Venta)
    private readonly ventaRepositorio: Repository<Venta>,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.clienteRepositorio.query(`
        ALTER TABLE clientes ADD COLUMN IF NOT EXISTS metodo_pago_preferido VARCHAR(50);
      `);
    } catch {
      // Ignorar si ya existe
    }
  }

  async obtenerTodos(
    busqueda?: string,
    limite: number = 100,
  ): Promise<Cliente[]> {
    if (busqueda && busqueda.trim()) {
      const termino = busqueda.trim();
      return this.clienteRepositorio.find({
        where: [
          { nombreCompleto: ILike(`%${termino}%`), activo: true },
          { telefono: ILike(`%${termino}%`), activo: true },
          { email: ILike(`%${termino}%`), activo: true },
        ],
        order: { totalCompras: "DESC", nombreCompleto: "ASC" },
        take: limite,
      });
    }

    return this.clienteRepositorio.find({
      where: { activo: true },
      order: { totalCompras: "DESC", nombreCompleto: "ASC" },
      take: limite,
    });
  }

  async obtenerPorId(id: string): Promise<Cliente> {
    const cliente = await this.clienteRepositorio.findOne({ where: { id } });
    if (!cliente) {
      throw new NotFoundException({
        codigo: "ERR-CLI-001",
        mensaje: "Cliente no encontrado",
      });
    }
    return cliente;
  }

  async obtenerFrecuentes(limite: number = 10): Promise<Cliente[]> {
    return this.clienteRepositorio.find({
      where: { activo: true },
      order: { totalCompras: "DESC", montoTotalComprado: "DESC" },
      take: limite,
    });
  }

  async obtenerHistorial(id: string): Promise<HistorialClienteRespuesta> {
    const cliente = await this.obtenerPorId(id);
    const nombreLimpio = limpiarEspacios(cliente.nombreCompleto);

    const compras = await this.ventaRepositorio
      .createQueryBuilder("venta")
      .leftJoinAndSelect("venta.detalles", "detalle")
      .where(
        new Brackets((qb) => {
          qb.where("venta.clienteId = :id", { id }).orWhere(
            "LOWER(TRIM(venta.nombreCliente)) = LOWER(TRIM(:nombre))",
            { nombre: nombreLimpio },
          );
        }),
      )
      .orderBy("venta.fechaVenta", "DESC")
      .addOrderBy("venta.creadoEn", "DESC")
      .getMany();

    const conteoPorMetodoPago: Record<
      string,
      { cantidad: number; montoTotalBs: number }
    > = {};

    for (const venta of compras) {
      if (
        Array.isArray(venta.desglosePagos) &&
        venta.desglosePagos.length > 0
      ) {
        for (const tramo of venta.desglosePagos) {
          const metodo = limpiarEspacios(tramo.metodo) || venta.formaPago;
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
        const metodo = limpiarEspacios(venta.formaPago) || "Efectivo";
        const monto = redondear(Number(venta.totalVenta || 0));
        if (!conteoPorMetodoPago[metodo]) {
          conteoPorMetodoPago[metodo] = { cantidad: 0, montoTotalBs: 0 };
        }
        conteoPorMetodoPago[metodo].cantidad += 1;
        conteoPorMetodoPago[metodo].montoTotalBs = redondear(
          conteoPorMetodoPago[metodo].montoTotalBs + monto,
        );
      }
    }

    const resumenMetodosPago: ResumenMetodoPagoCliente[] = Object.entries(
      conteoPorMetodoPago,
    )
      .map(([metodo, info]) => ({
        metodo,
        cantidad: info.cantidad,
        montoTotalBs: info.montoTotalBs,
      }))
      .sort((a, b) => {
        if (b.cantidad !== a.cantidad) return b.cantidad - a.cantidad;
        return b.montoTotalBs - a.montoTotalBs;
      });

    const metodoPagoMasUtilizado =
      resumenMetodosPago[0]?.metodo || cliente.metodoPagoPreferido || null;

    if (
      metodoPagoMasUtilizado &&
      cliente.metodoPagoPreferido !== metodoPagoMasUtilizado
    ) {
      cliente.metodoPagoPreferido = metodoPagoMasUtilizado;
      await this.clienteRepositorio.save(cliente);
    }

    return {
      cliente,
      metodoPagoMasUtilizado,
      metodoPagoMasUsado: metodoPagoMasUtilizado,
      conteoPorMetodoPago,
      desgloseMetodos: conteoPorMetodoPago,
      resumenMetodosPago,
      compras,
    };
  }

  async crear(dto: CrearClienteDto): Promise<Cliente> {
    const nombreNormalizado = limpiarEspacios(dto.nombreCompleto);
    const nuevo = this.clienteRepositorio.create({
      ...dto,
      nombreCompleto: nombreNormalizado,
      totalCompras: 0,
      montoTotalComprado: 0,
    });
    return this.clienteRepositorio.save(nuevo);
  }

  async actualizar(id: string, dto: ActualizarClienteDto): Promise<Cliente> {
    const cliente = await this.obtenerPorId(id);
    if (dto.nombreCompleto) {
      dto.nombreCompleto = limpiarEspacios(dto.nombreCompleto);
    }
    Object.assign(cliente, dto);
    return this.clienteRepositorio.save(cliente);
  }

  /**
   * Registra o actualiza el historial de un cliente al concretar una venta.
   * Si es 'Cliente Casual' y no tiene clienteId, no se registra como entidad.
   */
  async registrarCompraVenta(
    nombreCliente: string,
    montoTotalVenta: number,
    fechaVenta: Date,
    clienteId?: string | null,
    metodoPago?: string | null,
  ): Promise<Cliente | null> {
    const nombreLimpio = limpiarEspacios(nombreCliente);

    let cliente: Cliente | null = null;
    if (clienteId) {
      cliente = await this.clienteRepositorio.findOne({
        where: { id: clienteId },
      });
    }

    if (!cliente) {
      if (!nombreLimpio || nombreLimpio.toLowerCase() === "cliente casual") {
        return null;
      }
      cliente = await this.clienteRepositorio.findOne({
        where: { nombreCompleto: ILike(nombreLimpio) },
      });
    }

    if (!cliente) {
      cliente = this.clienteRepositorio.create({
        nombreCompleto: nombreLimpio,
        totalCompras: 1,
        montoTotalComprado: redondear(montoTotalVenta),
        fechaPrimeraCompra: fechaVenta,
        fechaUltimaCompra: fechaVenta,
        metodoPagoPreferido: metodoPago || null,
      });
    } else {
      cliente.totalCompras += 1;
      cliente.montoTotalComprado = redondear(
        Number(cliente.montoTotalComprado) + montoTotalVenta,
      );
      if (!cliente.fechaPrimeraCompra) {
        cliente.fechaPrimeraCompra = fechaVenta;
      }
      cliente.fechaUltimaCompra = fechaVenta;
      if (metodoPago && !cliente.metodoPagoPreferido) {
        cliente.metodoPagoPreferido = metodoPago;
      }
    }

    return this.clienteRepositorio.save(cliente);
  }
}
