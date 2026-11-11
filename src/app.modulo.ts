import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Calzado } from "./modulos/calzados/entidades/calzado.entidad";
import { Venta } from "./modulos/ventas/entidades/venta.entidad";
import { DetalleVenta } from "./modulos/ventas/entidades/detalle-venta.entidad";
import { Banco } from "./modulos/ventas/entidades/banco.entidad";
import { IngresoMercancia } from "./modulos/ingresos/entidades/ingreso-mercancia.entidad";
import { Proveedor } from "./modulos/ingresos/entidades/proveedor.entidad";
import { GastoCajaChica } from "./modulos/gastos/entidades/gasto-caja-chica.entidad";
import { Usuario } from "./modulos/usuarios/entidades/usuario.entidad";
import { Cliente } from "./modulos/clientes/entidades/cliente.entidad";
import { ArchivoAlmacenamiento } from "./modulos/almacenamiento/entidades/archivo-almacenamiento.entidad";
import { CalzadosModulo } from "./modulos/calzados/calzados.modulo";
import { IngresosModulo } from "./modulos/ingresos/ingresos.modulo";
import { VentasModulo } from "./modulos/ventas/ventas.modulo";
import { GastosModulo } from "./modulos/gastos/gastos.modulo";
import { PanelCentralModulo } from "./modulos/panel-central/panel-central.modulo";
import { AlmacenamientoModulo } from "./modulos/almacenamiento/almacenamiento.modulo";
import { SupabaseModulo } from "./modulos/supabase/supabase.modulo";
import { UsuariosModulo } from "./modulos/usuarios/usuarios.modulo";
import { AutenticacionModulo } from "./modulos/autenticacion/autenticacion.modulo";
import { ClientesModulo } from "./modulos/clientes/clientes.modulo";
import { validarEntorno } from "./comun/configuracion/seguridad.configuracion";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validarEntorno,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const urlDb = configService.get<string>("DATABASE_URL");
        const esProduccion =
          configService.get<string>("NODE_ENV") === "production";

        if (urlDb) {
          return {
            type: "postgres",
            url: urlDb,
            entities: [
              Calzado,
              Venta,
              DetalleVenta,
              Banco,
              IngresoMercancia,
              Proveedor,
              GastoCajaChica,
              Usuario,
              Cliente,
              ArchivoAlmacenamiento,
            ],
            synchronize: true, // Sincroniza esquemas automáticamente en la base de datos
            ssl: { rejectUnauthorized: false },
            extra: {
              max: 10,
              ssl: { rejectUnauthorized: false },
            },
          };
        }

        return {
          type: "postgres",
          host: configService.get<string>("DB_HOST", "127.0.0.1"),
          port: parseInt(configService.get<string>("DB_PORT", "5432"), 10),
          username: configService.get<string>("DB_USERNAME", "postgres"),
          password: configService.get<string>("DB_PASSWORD", "postgres"),
          database: configService.get<string>(
            "DB_DATABASE",
            "lalala_calzado_db",
          ),
          entities: [
            Calzado,
            Venta,
            DetalleVenta,
            Banco,
            IngresoMercancia,
            Proveedor,
            GastoCajaChica,
            Usuario,
            Cliente,
            ArchivoAlmacenamiento,
          ],
          synchronize: true,
        };
      },
    }),
    SupabaseModulo,
    AlmacenamientoModulo,
    CalzadosModulo,
    IngresosModulo,
    VentasModulo,
    GastosModulo,
    PanelCentralModulo,
    UsuariosModulo,
    AutenticacionModulo,
    ClientesModulo,
  ],
})
export class AppModulo {}
