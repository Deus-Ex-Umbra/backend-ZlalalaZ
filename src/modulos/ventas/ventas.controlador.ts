import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { VentasServicio } from "./ventas.servicio";
import { Venta } from "./entidades/venta.entidad";
import { DetalleVenta } from "./entidades/detalle-venta.entidad";
import { Calzado } from "../calzados/entidades/calzado.entidad";
import {
  CrearVentaDto,
  ActualizarVentaDto,
  ProcesarCambioDevolucionDto,
} from "./dto/crear-venta.dto";
import { SincronizarVentasDto } from "./dto/sincronizar-ventas.dto";
import { CrearBancoDto } from "./dto/crear-banco.dto";
import { FiltrosVentasDto } from "./dto/filtros-ventas.dto";
import { RespuestaApi } from "../../comun/interfaces/respuesta-api.interfaz";
import { GuardiaJwt } from "../autenticacion/guardias/guardia-jwt";
import {
  UsuarioActual,
  UsuarioAutenticado,
} from "../autenticacion/decoradores/usuario-actual.decorador";
import { RolUsuario } from "../usuarios/enums/rol-usuario.enum";

type CalzadoSinCosto = Omit<Calzado, "precioCompra"> & {
  precioCompra?: number;
};

type DetalleVentaRespuesta = Omit<
  DetalleVenta,
  "costoUnitario" | "calzado"
> & {
  costoUnitario?: number;
  calzado?: CalzadoSinCosto;
};

type VentaRespuesta = Omit<Venta, "detalles"> & {
  detalles?: DetalleVentaRespuesta[];
};

@Controller("ventas")
@UseGuards(GuardiaJwt)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class VentasControlador {
  constructor(private readonly ventasServicio: VentasServicio) {}

  private esRolVendedor(usuario?: UsuarioAutenticado | null): boolean {
    return !usuario || usuario.rol === RolUsuario.VENDEDOR;
  }

  private sanitizarVenta(
    venta: Venta,
    usuario?: UsuarioAutenticado | null,
  ): VentaRespuesta {
    if (!this.esRolVendedor(usuario)) {
      return venta;
    }
    const detallesSanitizados = Array.isArray(venta.detalles)
      ? venta.detalles.map((detalle) => {
          const copiaDetalle: DetalleVentaRespuesta = { ...detalle };
          delete copiaDetalle.costoUnitario;
          if (copiaDetalle.calzado) {
            const copiaCalzado: CalzadoSinCosto = { ...copiaDetalle.calzado };
            delete copiaCalzado.precioCompra;
            copiaDetalle.calzado = copiaCalzado;
          }
          return copiaDetalle;
        })
      : venta.detalles;

    return {
      ...venta,
      detalles: detallesSanitizados,
    };
  }

  @Get()
  async obtenerTodas(
    @Query() filtros: FiltrosVentasDto,
    @UsuarioActual() usuario?: UsuarioAutenticado,
  ): Promise<RespuestaApi> {
    const datos = await this.ventasServicio.obtenerTodas(filtros);
    return {
      exito: true,
      datos: datos.map((v) => this.sanitizarVenta(v, usuario)),
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Get("bancos")
  async listarBancos(): Promise<RespuestaApi> {
    const datos = await this.ventasServicio.listarBancos();
    return {
      exito: true,
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Post("bancos")
  async crearBanco(@Body() dto: CrearBancoDto): Promise<RespuestaApi> {
    const datos = await this.ventasServicio.crearBanco(dto.nombre);
    return {
      exito: true,
      mensaje: `Banco "${datos.nombre}" registrado exitosamente`,
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Get(":id")
  async obtenerPorId(
    @Param("id") id: string,
    @UsuarioActual() usuario?: UsuarioAutenticado,
  ): Promise<RespuestaApi> {
    const datos = await this.ventasServicio.obtenerPorId(id);
    return {
      exito: true,
      datos: this.sanitizarVenta(datos, usuario),
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Post()
  async registrarVenta(
    @Body() dto: CrearVentaDto,
    @UsuarioActual() usuario?: UsuarioAutenticado,
  ): Promise<RespuestaApi> {
    const datos = await this.ventasServicio.registrarVenta(dto);
    return {
      exito: true,
      mensaje: `Venta registrada exitosamente con ticket ${datos.numeroTicket}`,
      datos: this.sanitizarVenta(datos, usuario),
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Patch(":id")
  async actualizarVentaParcial(
    @Param("id") id: string,
    @Body() dto: ActualizarVentaDto,
    @UsuarioActual() usuario?: UsuarioAutenticado,
  ): Promise<RespuestaApi> {
    const datos = await this.ventasServicio.actualizarVenta(id, dto);
    return {
      exito: true,
      mensaje: "Venta actualizada exitosamente",
      datos: this.sanitizarVenta(datos, usuario),
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Put(":id")
  async actualizarVenta(
    @Param("id") id: string,
    @Body() dto: ActualizarVentaDto,
    @UsuarioActual() usuario?: UsuarioAutenticado,
  ): Promise<RespuestaApi> {
    const datos = await this.ventasServicio.actualizarVenta(id, dto);
    return {
      exito: true,
      mensaje: "Venta actualizada exitosamente",
      datos: this.sanitizarVenta(datos, usuario),
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Post(":id/cambio-devolucion")
  async procesarCambioODevolucion(
    @Param("id") id: string,
    @Body() dto: ProcesarCambioDevolucionDto,
    @UsuarioActual() usuario?: UsuarioAutenticado,
  ): Promise<RespuestaApi> {
    const resultado = await this.ventasServicio.procesarCambioODevolucion(
      id,
      dto,
    );
    return {
      exito: true,
      mensaje:
        resultado.tipoMovimiento === "DEVOLUCION_TOTAL"
          ? `Devolución total registrada para ${resultado.venta.numeroTicket}`
          : resultado.tipoMovimiento === "CAMBIO"
            ? `Cambio procesado exitosamente para ${resultado.venta.numeroTicket}`
            : `Devolución parcial registrada para ${resultado.venta.numeroTicket}`,
      datos: {
        ...resultado,
        venta: this.sanitizarVenta(resultado.venta, usuario),
      },
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Post("sincronizar")
  async sincronizarLote(
    @Body() dto: SincronizarVentasDto,
  ): Promise<RespuestaApi> {
    const resultado = await this.ventasServicio.sincronizarLote(dto);
    return {
      exito: true,
      mensaje: `Sincronización procesada: ${resultado.exitosas.length} aprobadas, ${resultado.fallidas.length} rechazadas`,
      datos: resultado,
      marcaTiempo: new Date().toISOString(),
    };
  }
}
