import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Venta, MetodoPago } from './entidades/venta.entidad';
import { DetalleVenta } from './entidades/detalle-venta.entidad';
import { Calzado } from '../calzados/entidades/calzado.entidad';
import { CrearVentaDto } from './dto/crear-venta.dto';

@Injectable()
export class VentasServicio {
  constructor(
    @InjectRepository(Venta)
    private readonly ventaRepositorio: Repository<Venta>,
    @InjectRepository(DetalleVenta)
    private readonly detalleRepositorio: Repository<DetalleVenta>,
    @InjectRepository(Calzado)
    private readonly calzadoRepositorio: Repository<Calzado>,
    private readonly dataSource: DataSource,
  ) {}

  async obtenerTodas(limite: number = 50) {
    return this.ventaRepositorio.find({
      relations: ['detalles'],
      order: { creadoEn: 'DESC' },
      take: limite,
    });
  }

  async obtenerPorId(id: string): Promise<Venta> {
    const venta = await this.ventaRepositorio.findOne({
      where: { id },
      relations: ['detalles', 'detalles.calzado'],
    });

    if (!venta) {
      throw new NotFoundException({
        codigo: 'ERR-VENT-004',
        mensaje: `Venta con ID ${id} no encontrada`,
      });
    }

    return venta;
  }

  async registrarVenta(dto: CrearVentaDto): Promise<Venta> {
    if (!dto.lineas || dto.lineas.length === 0) {
      throw new BadRequestException({
        codigo: 'ERR-VENT-001',
        mensaje: 'El carrito de venta no puede estar vacío',
      });
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let subtotalCalculado = 0;
      let descuentoTotal = 0;
      const detallesParaGuardar: DetalleVenta[] = [];

      for (const linea of dto.lineas) {
        const calzado = await queryRunner.manager.findOne(Calzado, {
          where: { codigoProducto: linea.codigoProducto, activo: true },
        });

        if (!calzado) {
          throw new NotFoundException({
            codigo: 'ERR-CALZ-001',
            mensaje: `Calzado con código ${linea.codigoProducto} no encontrado`,
          });
        }

        if (calzado.stockActual < linea.cantidad) {
          throw new BadRequestException({
            codigo: 'ERR-CALZ-003',
            mensaje: `Stock insuficiente para ${calzado.nombreProducto} (Talla: ${linea.talla}). Disponible: ${calzado.stockActual}`,
          });
        }

        // Descontar del inventario
        calzado.stockActual -= linea.cantidad;
        calzado.totalVendido += linea.cantidad;
        await queryRunner.manager.save(calzado);

        const subtotalLinea = Number(linea.precioUnitario) * linea.cantidad;
        const descuentoLinea = Number(linea.descuento || 0);
        const totalLinea = Math.max(0, subtotalLinea - descuentoLinea);

        subtotalCalculado += subtotalLinea;
        descuentoTotal += descuentoLinea;

        const detalle = queryRunner.manager.create(DetalleVenta, {
          calzadoId: calzado.id,
          codigoProducto: calzado.codigoProducto,
          nombreProducto: calzado.nombreProducto,
          talla: linea.talla,
          cantidad: linea.cantidad,
          precioUnitario: linea.precioUnitario,
          descuento: descuentoLinea,
          total: totalLinea,
        });

        detallesParaGuardar.push(detalle);
      }

      const totalVenta = Math.max(0, subtotalCalculado - descuentoTotal);
      let cambio = 0;

      if (dto.formaPago === MetodoPago.EFECTIVO && dto.montoRecibido !== undefined) {
        if (dto.montoRecibido < totalVenta) {
          throw new BadRequestException({
            codigo: 'ERR-VENT-002',
            mensaje: `El monto recibido (Bs ${dto.montoRecibido}) es menor al total de la venta (Bs ${totalVenta})`,
          });
        }
        cambio = dto.montoRecibido - totalVenta;
      }

      // Generar correlativo de ticket
      const contadorVentas = await queryRunner.manager.count(Venta);
      const fechaHoy = new Date();
      const prefijo = `TCK-${fechaHoy.getFullYear()}${String(fechaHoy.getMonth() + 1).padStart(2, '0')}`;
      const numeroTicket = `${prefijo}-${String(contadorVentas + 1).padStart(4, '0')}`;

      const nuevaVenta = queryRunner.manager.create(Venta, {
        numeroTicket,
        fechaVenta: fechaHoy,
        nombreCliente: dto.nombreCliente?.trim() || 'Cliente Casual',
        formaPago: dto.formaPago,
        subtotal: subtotalCalculado,
        descuento: descuentoTotal,
        totalVenta,
        montoRecibido: dto.montoRecibido || totalVenta,
        cambio,
        notas: dto.notas || '',
        detalles: detallesParaGuardar,
      });

      const ventaGuardada = await queryRunner.manager.save(nuevaVenta);
      await queryRunner.commitTransaction();

      return this.obtenerPorId(ventaGuardada.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
