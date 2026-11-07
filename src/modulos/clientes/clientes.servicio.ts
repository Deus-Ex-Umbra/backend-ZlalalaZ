import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, ILike } from "typeorm";
import { Cliente } from "./entidades/cliente.entidad";
import { CrearClienteDto } from "./dto/crear-cliente.dto";
import { ActualizarClienteDto } from "./dto/actualizar-cliente.dto";
import { limpiarEspacios } from "../../comun/utilidades/normalizacion-catalogo";

const redondear = (valor: number): number => Math.round(valor * 100) / 100;

@Injectable()
export class ClientesServicio {
  constructor(
    @InjectRepository(Cliente)
    private readonly clienteRepositorio: Repository<Cliente>,
  ) {}

  async obtenerTodos(
    busqueda?: string,
    limite: number = 50,
  ): Promise<Cliente[]> {
    if (busqueda && busqueda.trim()) {
      const termino = busqueda.trim();
      return this.clienteRepositorio.find({
        where: [
          { nombreCompleto: ILike(`%${termino}%`), activo: true },
          { telefono: ILike(`%${termino}%`), activo: true },
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
   * Si es 'Cliente Casual', no se registra como entidad.
   */
  async registrarCompraVenta(
    nombreCliente: string,
    montoTotalVenta: number,
    fechaVenta: Date,
  ): Promise<Cliente | null> {
    const nombreLimpio = limpiarEspacios(nombreCliente);
    if (!nombreLimpio || nombreLimpio.toLowerCase() === "cliente casual") {
      return null;
    }

    let cliente = await this.clienteRepositorio.findOne({
      where: { nombreCompleto: ILike(nombreLimpio) },
    });

    if (!cliente) {
      cliente = this.clienteRepositorio.create({
        nombreCompleto: nombreLimpio,
        totalCompras: 1,
        montoTotalComprado: redondear(montoTotalVenta),
        fechaPrimeraCompra: fechaVenta,
        fechaUltimaCompra: fechaVenta,
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
    }

    return this.clienteRepositorio.save(cliente);
  }
}
