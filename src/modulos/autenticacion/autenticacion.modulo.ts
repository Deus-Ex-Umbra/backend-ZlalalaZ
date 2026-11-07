import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { UsuariosModulo } from "../usuarios/usuarios.modulo";
import { AutenticacionServicio } from "./autenticacion.servicio";
import { AutenticacionControlador } from "./autenticacion.controlador";
import { EstrategiaJwt } from "./estrategias/estrategia-jwt";
import { GuardiaJwt } from "./guardias/guardia-jwt";
import { GuardiaRoles } from "./guardias/guardia-roles";
import { EXPIRACION_JWT_DEFECTO } from "../../comun/configuracion/seguridad.configuracion";

@Module({
  imports: [
    UsuariosModulo,
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: configService.get<string>(
            "JWT_EXPIRACION",
            EXPIRACION_JWT_DEFECTO,
          ),
        },
      }),
    }),
  ],
  controllers: [AutenticacionControlador],
  providers: [AutenticacionServicio, EstrategiaJwt, GuardiaJwt, GuardiaRoles],
  exports: [
    AutenticacionServicio,
    GuardiaJwt,
    GuardiaRoles,
    JwtModule,
    PassportModule,
  ],
})
export class AutenticacionModulo {}
