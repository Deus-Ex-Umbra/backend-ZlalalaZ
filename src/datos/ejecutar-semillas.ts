/**
 * Script de ejecución de semillas oficiales en la base de datos PostgreSQL.
 * Ejecuta el contenido de semillas.sql respetando las entidades de LaLaLa.
 *
 * Ejecutable mediante: npm run semillar (en backend)
 * O desde la raíz:     npm run bd:semillar
 */

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { Client } from "pg";

// Cargar variables de entorno desde backend/.env o raíz .env
const rutaEnvBackend = path.resolve(__dirname, "../../.env");
const rutaEnvRaiz = path.resolve(__dirname, "../../../.env");

if (fs.existsSync(rutaEnvBackend)) {
  dotenv.config({ path: rutaEnvBackend });
} else if (fs.existsSync(rutaEnvRaiz)) {
  dotenv.config({ path: rutaEnvRaiz });
}

async function ejecutarSemillas() {
  console.log("========================================================");
  console.log("  🌱 LaLaLa - Cargador de Semillas Oficiales a la BD    ");
  console.log("========================================================");

  // Obtener cadena de conexión (preferir DIRECT_URL para transacciones directas DDL)
  const cadenaConexion =
    process.env.DIRECT_URL ||
    process.env.DATABASE_URL ||
    `postgresql://${process.env.DB_USERNAME || "postgres"}:${encodeURIComponent(
      process.env.DB_PASSWORD || "postgres",
    )}@${process.env.DB_HOST || "127.0.0.1"}:${process.env.DB_PORT || "5432"}/${
      process.env.DB_DATABASE || "zlalalazdb"
    }`;

  const urlOculta = cadenaConexion.replace(/:[^:@]+@/, ":***@");
  console.log(`📡 Conectando a base de datos: ${urlOculta}`);

  const cliente = new Client({
    connectionString: cadenaConexion,
    ssl:
      cadenaConexion.includes("localhost") ||
      cadenaConexion.includes("127.0.0.1")
        ? false
        : { rejectUnauthorized: false },
  });

  try {
    await cliente.connect();
    console.log("✅ Conexión establecida exitosamente con PostgreSQL.");

    const rutaSemillas = path.join(__dirname, "semillas.sql");
    if (!fs.existsSync(rutaSemillas)) {
      throw new Error(
        `No se encontró el archivo de semillas en: ${rutaSemillas}`,
      );
    }

    const contenidoSql = fs.readFileSync(rutaSemillas, "utf-8");
    console.log(`📄 Leyendo archivo: ${rutaSemillas}`);
    console.log("⏳ Ejecutando sentencias SQL de semillas...");

    await cliente.query("BEGIN;");
    await cliente.query(contenidoSql);
    await cliente.query("COMMIT;");

    console.log(
      "✅ Semillas SQL ejecutadas y confirmadas (COMMIT) correctamente.\n",
    );

    // Consultar conteos actualizados
    console.log("📊 Estado de las tablas tras la carga:");
    const tablasVerificar = [
      { tabla: "calzados", etiqueta: "Calzados (SKUs)" },
      { tabla: "gastos_caja_chica", etiqueta: "Gastos de Caja Chica" },
      { tabla: "clientes", etiqueta: "Clientes" },
      { tabla: "ventas", etiqueta: "Ventas Históricas" },
      { tabla: "detalles_venta", etiqueta: "Detalles de Venta" },
      { tabla: "usuarios", etiqueta: "Usuarios del Sistema" },
      { tabla: "bancos", etiqueta: "Bancos Registrados" },
      { tabla: "proveedores", etiqueta: "Proveedores" },
    ];

    for (const item of tablasVerificar) {
      try {
        const respuesta = await cliente.query(
          `SELECT COUNT(*)::int AS total FROM "${item.tabla}";`,
        );
        console.log(
          `  • ${item.etiqueta.padEnd(26)}: ${respuesta.rows[0].total} registros`,
        );
      } catch (errConteo: unknown) {
        const mensaje =
          errConteo instanceof Error ? errConteo.message : String(errConteo);
        console.log(
          `  • ${item.etiqueta.padEnd(26)}: Error al contar (${mensaje})`,
        );
      }
    }

    // Sincronizar y verificar secuencia de tickets
    try {
      await cliente.query(
        "CREATE SEQUENCE IF NOT EXISTS secuencia_ticket START 1;",
      );
      await cliente.query(`
        DO $$
        DECLARE
          total_ventas int;
        BEGIN
          SELECT COUNT(*)::int INTO total_ventas FROM ventas;
          IF total_ventas > 0 THEN
            PERFORM setval('secuencia_ticket', total_ventas, true);
          END IF;
        END $$;
      `);
      const resSeq = await cliente.query(
        "SELECT last_value, is_called FROM secuencia_ticket;",
      );
      if (resSeq.rows.length > 0) {
        console.log(
          `  • Secuencia de tickets     : Valor ${resSeq.rows[0].last_value} (Próximo ticket: ${parseInt(resSeq.rows[0].last_value, 10) + 1})`,
        );
      }
    } catch {
      // Secuencia opcional
    }

    console.log(
      "\n✨ ¡Carga de semillas completada con éxito en la base de datos!",
    );
    console.log("========================================================");
  } catch (error: unknown) {
    await cliente.query("ROLLBACK;").catch(() => {});
    const mensaje = error instanceof Error ? error.message : String(error);
    console.error("❌ Error al ejecutar las semillas:", mensaje);
    process.exit(1);
  } finally {
    await cliente.end();
  }
}

ejecutarSemillas().catch((err) => {
  console.error("Fallo inesperado:", err);
  process.exit(1);
});
