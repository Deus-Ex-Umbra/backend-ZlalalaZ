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

@Module({
  imports: [
    UsuariosModulo,
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>(
          "JWT_SECRET",
          "zlalalaz_super_secret_jwt_key_2026_calzado_store_bolivia",
        ),
        signOptions: {
          expiresIn: configService.get<string>("JWT_EXPIRACION", "30d"),
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
