import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LogAuditoria } from "./entidades/log-auditoria.entidad";
import { AuditoriaServicio } from "./auditoria.servicio";
import { AuditoriaControlador } from "./auditoria.controlador";
import { SuscriptorAuditoriaTypeOrm } from "./auditoria.interceptor";
import { AutenticacionModulo } from "../autenticacion/autenticacion.modulo";

@Module({
  imports: [
    TypeOrmModule.forFeature([LogAuditoria]),
    AutenticacionModulo,
  ],
  controllers: [AuditoriaControlador],
  providers: [AuditoriaServicio, SuscriptorAuditoriaTypeOrm],
  exports: [AuditoriaServicio, SuscriptorAuditoriaTypeOrm],
})
export class AuditoriaModulo {}
