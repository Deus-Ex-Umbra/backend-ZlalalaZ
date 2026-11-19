import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import {
  AuditoriaServicio,
  LogAuditoriaItem,
  RespuestaPaginadaAuditoria,
  ResumenAuditoria,
} from "./auditoria.servicio";
import { ConsultarAuditoriaDto } from "./dto/consultar-auditoria.dto";
import { RespuestaApi } from "../../comun/interfaces/respuesta-api.interfaz";
import { GuardiaJwt } from "../autenticacion/guardias/guardia-jwt";
import { GuardiaRoles } from "../autenticacion/guardias/guardia-roles";
import { RolesRequeridos } from "../autenticacion/decoradores/roles-requeridos.decorador";
import { RolUsuario } from "../usuarios/enums/rol-usuario.enum";

@Controller("auditoria")
@UseGuards(GuardiaJwt, GuardiaRoles)
@RolesRequeridos(RolUsuario.ADMINISTRADOR)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class AuditoriaControlador {
  constructor(private readonly auditoriaServicio: AuditoriaServicio) {}

  @Get()
  async listar(
    @Query() filtros: ConsultarAuditoriaDto,
  ): Promise<RespuestaApi<RespuestaPaginadaAuditoria>> {
    const datos = await this.auditoriaServicio.listar(filtros);
    return {
      exito: true,
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Get("resumen")
  async obtenerResumen(): Promise<RespuestaApi<ResumenAuditoria>> {
    const datos = await this.auditoriaServicio.obtenerResumen();
    return {
      exito: true,
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }

  @Get(":id")
  async obtenerPorId(
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<RespuestaApi<LogAuditoriaItem>> {
    const datos = await this.auditoriaServicio.obtenerPorId(id);
    return {
      exito: true,
      datos,
      marcaTiempo: new Date().toISOString(),
    };
  }
}
