import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { IngresoMercancia } from "./entidades/ingreso-mercancia.entidad";
import { Calzado } from "../calzados/entidades/calzado.entidad";
import { CrearIngresoDto } from "./dto/crear-ingreso.dto";

@Injectable()
export class IngresosServicio {
  constructor(
    @InjectRepository(IngresoMercancia)
    private readonly ingresoRepositorio: Repository<IngresoMercancia>,
    @InjectRepository(Calzado)
    private readonly calzadoRepositorio: Repository<Calzado>,
    private readonly dataSource: DataSource,
  ) {}

  async obtenerTodos() {
    return this.ingresoRepositorio.find({
      relations: ["calzado"],
      order: { fechaIngreso: "DESC", creadoEn: "DESC" },
    });
  }

  async registrar(dto: CrearIngresoDto): Promise<IngresoMercancia> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const calzado = await queryRunner.manager.findOne(Calzado, {
        where: { codigoProducto: dto.codigoProducto, activo: true },
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

      // NEG-004: Costo promedio ponderado si hay stock disponible positivo
      const stockPrevio = Math.max(0, Number(calzado.stockActual));
      const costoPrevio = Number(calzado.precioCompra);
      const cantidadIngreso = Number(dto.cantidad);
      const costoIngreso = Number(dto.precioCompraUnitario);

      let nuevoCostoCompra = costoIngreso;
      if (stockPrevio > 0) {
        const costoTotalPonderado =
          stockPrevio * costoPrevio + cantidadIngreso * costoIngreso;
        const totalUnidades = stockPrevio + cantidadIngreso;
        nuevoCostoCompra =
          Math.round((costoTotalPonderado / totalUnidades) * 100) / 100;
      }

      calzado.precioCompra = nuevoCostoCompra;
      if (dto.precioVentaUnitario > 0) {
        calzado.precioVenta = dto.precioVentaUnitario;
      }

      // Actualizar existencias
      calzado.totalIngresado += cantidadIngreso;
      calzado.stockActual += cantidadIngreso;

      await queryRunner.manager.save(calzado);

      // Crear el registro de ingreso
      const nuevoIngreso = queryRunner.manager.create(IngresoMercancia, {
        ...dto,
        talla: dto.talla || calzado.talla || "",
        fechaIngreso: new Date(dto.fechaIngreso),
        calzadoId: calzado.id,
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
}
