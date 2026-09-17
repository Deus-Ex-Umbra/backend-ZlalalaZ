import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Calzado } from './modulos/calzados/entidades/calzado.entidad';
import { Venta } from './modulos/ventas/entidades/venta.entidad';
import { DetalleVenta } from './modulos/ventas/entidades/detalle-venta.entidad';
import { IngresoMercancia } from './modulos/ingresos/entidades/ingreso-mercancia.entidad';
import { GastoCajaChica } from './modulos/gastos/entidades/gasto-caja-chica.entidad';
import { CalzadosModulo } from './modulos/calzados/calzados.modulo';
import { IngresosModulo } from './modulos/ingresos/ingresos.modulo';
import { VentasModulo } from './modulos/ventas/ventas.modulo';
import { GastosModulo } from './modulos/gastos/gastos.modulo';
import { PanelCentralModulo } from './modulos/panel-central/panel-central.modulo';
import { AlmacenamientoModulo } from './modulos/almacenamiento/almacenamiento.modulo';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const urlDb = configService.get<string>('DATABASE_URL');
        if (urlDb) {
          return {
            type: 'postgres',
            url: urlDb,
            entities: [Calzado, Venta, DetalleVenta, IngresoMercancia, GastoCajaChica],
            synchronize: true, // Sincroniza esquemas en desarrollo
            ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
          };
        }

        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST', '127.0.0.1'),
          port: parseInt(configService.get<string>('DB_PORT', '5432'), 10),
          username: configService.get<string>('DB_USERNAME', 'postgres'),
          password: configService.get<string>('DB_PASSWORD', 'postgres'),
          database: configService.get<string>('DB_DATABASE', 'zlalalaz_calzado_db'),
          entities: [Calzado, Venta, DetalleVenta, IngresoMercancia, GastoCajaChica],
          synchronize: true,
        };
      },
    }),
    AlmacenamientoModulo,
    CalzadosModulo,
    IngresosModulo,
    VentasModulo,
    GastosModulo,
    PanelCentralModulo,
  ],
})
export class AppModulo {}
