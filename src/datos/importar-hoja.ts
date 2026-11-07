/**
 * Script de importación y reconciliación de datos desde Google Sheets.
 * Fuente: Google Sheet "Inventario_Tienda_Calzado_ LA,LA,LA"
 * ID: 1iNZzgtX59DzaCJ1fvvDzIYnBu_xVrx7mC-AcKCe35OQ
 *
 * Ejecutable vía: npm run importar:hoja (en backend)
 */

import * as fs from "fs";
import * as path from "path";
import {
  normalizarNombreProducto,
  extraerMarca,
  detectarTipoProducto,
  normalizarTalla,
  limpiarEspacios,
  normalizarCodigoProducto,
} from "../comun/utilidades/normalizacion-catalogo";

const ID_HOJA = "1iNZzgtX59DzaCJ1fvvDzIYnBu_xVrx7mC-AcKCe35OQ";

const GIDS = {
  INVENTARIO: "906814319",
  INGRESOS: "1286982929",
  VENTAS: "185648359",
  GASTOS: "257809406",
};

interface CalzadoImportado {
  codigoProducto: string;
  nombreProducto: string;
  marca: string;
  tipoProducto: string;
  categoria: string;
  talla: string;
  color: string;
  precioCompra: number;
  precioVenta: number;
  stockInicial: number;
  totalIngresado: number;
  totalVendido: number;
  stockActual: number;
}

interface IngresoImportado {
  fecha: string;
  codigoProducto: string;
  cantidad: number;
  proveedor: string;
  precioCompraUnitario: number;
  precioVentaUnitario: number;
  talla: string;
}

interface VentaImportada {
  fecha: string;
  codigoProducto: string;
  nombreCliente: string;
  cantidad: number;
  precioUnitario: number;
  formaPago: string;
  descuento: number;
  motivoDescuento: string | null;
  notas: string;
  talla: string;
}

interface GastoImportado {
  fecha: string;
  empleado: string;
  concepto: string;
  monto: number;
  formaPago: string;
  autorizadoPor: string;
  notas: string;
}

/** Divide una fila CSV respetando comillas */
function parsearLineaCsv(linea: string): string[] {
  const columnas: string[] = [];
  let actual = "";
  let entreComillas = false;

  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];
    if (c === '"') {
      if (entreComillas && linea[i + 1] === '"') {
        actual += '"';
        i++;
      } else {
        entreComillas = !entreComillas;
      }
    } else if (c === "," && !entreComillas) {
      columnas.push(actual.trim());
      actual = "";
    } else {
      actual += c;
    }
  }
  columnas.push(actual.trim());
  return columnas;
}

/** Convierte montos con formato 'Bs1.234,00' o '150,00' a número flotante */
function parsearMonto(texto: string | undefined): number {
  if (!texto) return 0;
  const limpio = texto
    .replace(/Bs\.?/gi, "")
    .replace(/\$/g, "")
    .replace(/\s+/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const num = parseFloat(limpio);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
}

/** Parsea fechas 'dd/MM/yyyy' o 'd/M/yy' a formato ISO YYYY-MM-DD */
function parsearFecha(texto: string | undefined): string {
  if (!texto || texto === "-" || texto === "") {
    return new Date().toISOString().split("T")[0];
  }
  const partes = texto.trim().split(/[\/-]/);
  if (partes.length === 3) {
    let [dia, mes, anio] = partes;
    if (anio.length === 2) {
      anio = "20" + anio;
    }
    dia = dia.padStart(2, "0");
    mes = mes.padStart(2, "0");
    return `${anio}-${mes}-${dia}`;
  }
  return new Date().toISOString().split("T")[0];
}

async function descargarCsv(gid: string): Promise<string> {
  const url = `https://docs.google.com/spreadsheets/d/${ID_HOJA}/gviz/tq?tqx=out:csv&gid=${gid}`;
  const respuesta = await fetch(url);
  if (!respuesta.ok) {
    throw new Error(
      `Error al descargar pestaña GID ${gid}: ${respuesta.statusText}`,
    );
  }
  return respuesta.text();
}

async function procesar() {
  console.log("=== INICIANDO IMPORTACIÓN DE HOJA DE CÁLCULO LALALA ===");
  const inconsistencias: string[] = [];

  // 1. INVENTARIO
  console.log("Descargando pestaña Inventario...");
  const csvInventario = await descargarCsv(GIDS.INVENTARIO);
  const lineasInventario = csvInventario
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);

  const calzados: CalzadoImportado[] = [];

  for (let i = 1; i < lineasInventario.length; i++) {
    const cols = parsearLineaCsv(lineasInventario[i]);
    const codigo = cols[0];
    if (!codigo || !codigo.startsWith("P")) continue;

    // Descartar filas vacías de plantilla (P150 en adelante o nombres vacíos)
    const numeroP = parseInt(codigo.substring(1), 10);
    const nombreOriginal = cols[1];
    if (numeroP > 149 || !nombreOriginal || nombreOriginal.trim() === "") {
      continue;
    }

    const nombreLimpio = normalizarNombreProducto(nombreOriginal);
    const marca = extraerMarca(nombreLimpio);
    const tipo = detectarTipoProducto(nombreLimpio);
    const categoria = cols[2]?.trim() || "General";
    const talla = normalizarTalla(cols[3], tipo);
    const color = cols[4]?.trim() || "Blanco";
    const precioCompra = parsearMonto(cols[5]);
    const precioVenta = parsearMonto(cols[6]);
    let stockInicial = parseInt(cols[7] || "0", 10);
    const totalIngresado = parseInt(cols[8] || "0", 10);
    const totalVendido = parseInt(cols[9] || "0", 10);
    let stockActual = parseInt(cols[10] || "0", 10);

    if (stockActual < 0) {
      inconsistencias.push(
        `[INVENTARIO] ${codigo} (${nombreLimpio}) tiene stock negativo en hoja: ${stockActual} (stockInicial=${stockInicial}, vendidos=${totalVendido}). Ajustado a stock no negativo para cumplir regla de dominio §1.`,
      );
      // Regla de dominio §1: El stock nunca puede ser negativo. Se ajusta stock inicial para cubrir ventas.
      stockInicial = Math.max(stockInicial, totalVendido);
      stockActual = Math.max(0, stockInicial + totalIngresado - totalVendido);
    }

    if (nombreOriginal !== nombreLimpio) {
      inconsistencias.push(
        `[INVENTARIO] Nombre normalizado: "${nombreOriginal}" -> "${nombreLimpio}".`,
      );
    }

    calzados.push({
      codigoProducto: normalizarCodigoProducto(codigo),
      nombreProducto: nombreLimpio,
      marca,
      tipoProducto: tipo,
      categoria,
      talla,
      color,
      precioCompra,
      precioVenta,
      stockInicial,
      totalIngresado,
      totalVendido,
      stockActual,
    });
  }
  console.log(
    `Calzados válidos procesados: ${calzados.length} (esperados: 149).`,
  );

  // 2. GASTOS EXTRA
  console.log("Descargando pestaña Gastos Extra...");
  const csvGastos = await descargarCsv(GIDS.GASTOS);
  const lineasGastos = csvGastos
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);

  const gastos: GastoImportado[] = [];

  for (let i = 1; i < lineasGastos.length; i++) {
    const cols = parsearLineaCsv(lineasGastos[i]);
    const fechaTexto = cols[0];
    if (
      !fechaTexto ||
      fechaTexto.trim() === "" ||
      fechaTexto.includes("Fecha") ||
      fechaTexto.includes("TOTAL")
    ) {
      continue;
    }

    const fecha = parsearFecha(fechaTexto);
    const empleado = cols[1]?.trim() || "Personal Tienda";
    const concepto = cols[2]?.trim();
    const monto = parsearMonto(cols[3]);
    let formaPago = cols[4]?.trim() || "Efectivo";
    if (formaPago.toLowerCase().includes("transferencia")) {
      formaPago = "Transferencia";
    } else {
      formaPago = "Efectivo";
    }
    const autorizadoPor = cols[5]?.trim() || "Gerente Tienda";
    const notas = cols[6]?.trim() || "";

    if (monto > 0 && concepto) {
      gastos.push({
        fecha,
        empleado,
        concepto,
        monto,
        formaPago,
        autorizadoPor,
        notas,
      });
    }
  }
  console.log(
    `Gastos procesados: ${gastos.length} (total monto Bs ${gastos.reduce((s, g) => s + g.monto, 0).toFixed(2)}).`,
  );

  // 3. INGRESOS DE MERCANCÍA
  console.log("Descargando pestaña Ingreso Mercancia...");
  const csvIngresos = await descargarCsv(GIDS.INGRESOS);
  const lineasIngresos = csvIngresos
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);
  const ingresos: IngresoImportado[] = [];

  for (let i = 1; i < lineasIngresos.length; i++) {
    const cols = parsearLineaCsv(lineasIngresos[i]);
    const fechaTexto = cols[0];
    if (
      !fechaTexto ||
      fechaTexto.trim() === "" ||
      fechaTexto.includes("FECHA") ||
      fechaTexto.includes("TOTAL")
    ) {
      continue;
    }

    const codigo = cols[1]?.trim();
    const nombre = cols[2]?.trim();
    const cantidad = parseInt(cols[3] || "0", 10);
    const proveedor = cols[4]?.trim() || "Distribuidora Calzado SRL";
    const precioCompra = parsearMonto(cols[5]);
    const precioVenta = parsearMonto(cols[6]);
    const talla = cols[7]?.trim() || "";

    if (nombre?.toLowerCase().includes("id no existe") || precioCompra === 0) {
      inconsistencias.push(
        `[INGRESOS] Fila con fecha ${fechaTexto}: Producto ${codigo} tiene nombre "${nombre}" y precio compra Bs ${precioCompra}. Omitido de la carga directa.`,
      );
      continue;
    }

    if (codigo && cantidad > 0) {
      ingresos.push({
        fecha: parsearFecha(fechaTexto),
        codigoProducto: normalizarCodigoProducto(codigo),
        cantidad,
        proveedor,
        precioCompraUnitario: precioCompra,
        precioVentaUnitario: precioVenta,
        talla,
      });
    }
  }
  console.log(`Ingresos procesados válidos: ${ingresos.length}.`);

  // 4. VENTAS
  console.log("Descargando pestaña Ventas...");
  const csvVentas = await descargarCsv(GIDS.VENTAS);
  const lineasVentas = csvVentas
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);

  const ventas: VentaImportada[] = [];

  for (let i = 1; i < lineasVentas.length; i++) {
    const cols = parsearLineaCsv(lineasVentas[i]);
    const fechaTexto = cols[0];
    if (
      !fechaTexto ||
      fechaTexto.trim() === "" ||
      fechaTexto.includes("Fecha") ||
      fechaTexto.includes("TOTAL")
    ) {
      continue;
    }

    const codigo = cols[1]?.trim();
    if (!codigo || !codigo.startsWith("P")) {
      if (fechaTexto && fechaTexto !== "-") {
        inconsistencias.push(
          `[VENTAS] Fila con fecha ${fechaTexto} no tiene código de producto válido ("${codigo || "vacío"}"). Descartada.`,
        );
      }
      continue;
    }

    const fecha = parsearFecha(fechaTexto);
    const cliente = cols[3]?.trim() || "Cliente Casual";
    const cantidad = parseInt(cols[4] || "1", 10);
    const precio = parsearMonto(cols[5]);
    let forma = cols[7]?.trim() || "Efectivo";
    if (forma.toLowerCase().includes("qr")) forma = "QR";
    else if (forma.toLowerCase().includes("tarjeta")) forma = "Tarjeta";
    else if (forma.toLowerCase().includes("transferencia"))
      forma = "Transferencia";
    else forma = "Efectivo";

    const descuento = parsearMonto(cols[8]);
    const notas = cols[9]?.trim() || "";
    const talla = cols[10]?.trim() || "";

    let motivo: string | null = null;
    if (descuento > 0) {
      const notasMinus = notas.toLowerCase();
      if (
        notasMinus.includes("frecuente") ||
        notasMinus.includes("consecuente") ||
        notasMinus.includes("antiguo")
      ) {
        motivo = "CLIENTE_FRECUENTE";
      } else if (notasMinus.includes("promo")) {
        motivo = "PROMOCION";
      } else {
        motivo = "OTRO";
      }
    }

    ventas.push({
      fecha,
      codigoProducto: normalizarCodigoProducto(codigo),
      nombreCliente: limpiarEspacios(cliente),
      cantidad,
      precioUnitario: precio,
      formaPago: forma,
      descuento,
      motivoDescuento: motivo,
      notas,
      talla,
    });
  }
  console.log(`Ventas procesadas: ${ventas.length} (esperadas: 21).`);

  // 4. GENERAR REPORTE DE INCONSISTENCIAS
  const rutaReporte = path.join(__dirname, "reporte-importacion.md");
  const contenidoReporte = `# Reporte de Reconciliación e Importación de Datos

Fecha de generación: ${new Date().toISOString()}
Fuente: Google Sheet ID \`${ID_HOJA}\`

## Resumen Cuantitativo
- **Calzados reales (P001–P149):** ${calzados.length}
- **Filas vacías descartadas (P150–P476):** ${lineasInventario.length - 1 - calzados.length}
- **Ventas registradas:** ${ventas.length}
- **Gastos de caja chica:** ${gastos.length} (Total: Bs ${gastos.reduce((a, b) => a + b.monto, 0).toFixed(2)})

## Inconsistencias Detectadas
${inconsistencias.length > 0 ? inconsistencias.map((inc) => `- ${inc}`).join("\n") : "No se detectaron inconsistencias mayores."}
`;
  fs.writeFileSync(rutaReporte, contenidoReporte, "utf-8");
  console.log(`Reporte guardado en: ${rutaReporte}`);

  // 5. REGENERAR SEMILLAS.SQL
  const rutaSemillas = path.join(__dirname, "semillas.sql");
  let sql = `-- ==============================================================================
-- SEMILLAS COMPLETAS DE BASE DE DATOS: LALALA (TIENDA DE CALZADO)
-- Generado automáticamente desde Google Sheets por backend/src/datos/importar-hoja.ts
-- ==============================================================================

-- 1. TABLA DE CALZADOS (149 SKUS REALES NORMALIZADOS)
INSERT INTO calzados (id, codigo_producto, nombre_producto, marca, tipo_producto, categoria, talla, color, precio_compra, precio_venta, stock_inicial, total_ingresado, total_vendido, stock_actual, alerta_stock_minimo, activo, creado_en, actualizado_en)
VALUES
`;

  const filasCalzadoSql = calzados.map(
    (c) =>
      `  (gen_random_uuid(), '${c.codigoProducto}', '${c.nombreProducto.replace(/'/g, "''")}', '${c.marca.replace(/'/g, "''")}', '${c.tipoProducto}', '${c.categoria.replace(/'/g, "''")}', '${c.talla}', '${c.color.replace(/'/g, "''")}', ${c.precioCompra.toFixed(2)}, ${c.precioVenta.toFixed(2)}, ${c.stockInicial}, ${c.totalIngresado}, ${c.totalVendido}, ${c.stockActual}, 1, true, NOW(), NOW())`,
  );
  sql += filasCalzadoSql.join(",\n");
  sql += `\nON CONFLICT (codigo_producto) DO UPDATE SET
  nombre_producto = EXCLUDED.nombre_producto,
  marca = EXCLUDED.marca,
  tipo_producto = EXCLUDED.tipo_producto,
  precio_compra = EXCLUDED.precio_compra,
  precio_venta = EXCLUDED.precio_venta;\n\n`;

  // 2. GASTOS
  sql += `-- 2. GASTOS EXTRA DE CAJA CHICA\n`;
  sql += `INSERT INTO gastos_caja_chica (id, fecha_gasto, nombre_empleado, concepto_motivo, monto, forma_pago, autorizado_por, creado_en)\nVALUES\n`;
  const filasGastosSql = gastos.map(
    (g) =>
      `  (gen_random_uuid(), '${g.fecha}', '${g.empleado.replace(/'/g, "''")}', '${g.concepto.replace(/'/g, "''")}', ${g.monto.toFixed(2)}, '${g.formaPago}', '${g.autorizadoPor.replace(/'/g, "''")}', NOW())`,
  );
  sql += filasGastosSql.join(",\n");
  sql += `;\n\n`;

  // 3. CLIENTES ÚNICOS DESDE VENTAS
  sql += `-- 3. CLIENTES IDENTIFICADOS\n`;
  const mapaClientes = new Map<
    string,
    { total: number; monto: number; primera: string; ultima: string }
  >();
  for (const v of ventas) {
    if (!v.nombreCliente || v.nombreCliente.toLowerCase() === "cliente casual")
      continue;
    const previo = mapaClientes.get(v.nombreCliente) || {
      total: 0,
      monto: 0,
      primera: v.fecha,
      ultima: v.fecha,
    };
    previo.total += 1;
    previo.monto += Math.max(0, v.cantidad * v.precioUnitario - v.descuento);
    if (v.fecha < previo.primera) previo.primera = v.fecha;
    if (v.fecha > previo.ultima) previo.ultima = v.fecha;
    mapaClientes.set(v.nombreCliente, previo);
  }

  if (mapaClientes.size > 0) {
    sql += `INSERT INTO clientes (id, nombre_completo, total_compras, monto_total_comprado, fecha_primera_compra, fecha_ultima_compra, activo, creado_en, actualizado_en)\nVALUES\n`;
    const filasClientesSql: string[] = [];
    for (const [nombre, info] of mapaClientes.entries()) {
      filasClientesSql.push(
        `  (gen_random_uuid(), '${nombre.replace(/'/g, "''")}', ${info.total}, ${info.monto.toFixed(2)}, '${info.primera}', '${info.ultima}', true, NOW(), NOW())`,
      );
    }
    sql += filasClientesSql.join(",\n");
    sql += `;\n\n`;
  }

  // 4. VENTAS Y DETALLES DE VENTA
  sql += `-- 4. VENTAS HISTÓRICAS Y DETALLES (21 TRANSACCIONES)\n`;
  const mapaCostos = new Map<string, number>();
  for (const c of calzados) {
    mapaCostos.set(c.codigoProducto, c.precioCompra);
  }

  ventas.forEach((v, index) => {
    const idVenta = `v_${index + 1}`;
    const correlativo = String(index + 1).padStart(4, "0");
    const numTicket = `TCK-${v.fecha.replace(/-/g, "").substring(0, 6)}-${correlativo}`;
    const subtotal = v.cantidad * v.precioUnitario;
    const totalVenta = Math.max(0, subtotal - v.descuento);
    const costoUnit = mapaCostos.get(v.codigoProducto) || 0;
    const motivoSql = v.motivoDescuento ? `'${v.motivoDescuento}'` : "NULL";

    sql += `DO $$\nDECLARE\n  id_venta uuid := gen_random_uuid();\n  id_calzado uuid;\nBEGIN\n`;
    sql += `  SELECT id INTO id_calzado FROM calzados WHERE codigo_producto = '${v.codigoProducto}' LIMIT 1;\n`;
    sql += `  INSERT INTO ventas (id, numero_ticket, fecha_venta, nombre_cliente, forma_pago, subtotal, descuento, motivo_descuento, total_venta, monto_recibido, cambio, notas, creado_en)\n`;
    sql += `  VALUES (id_venta, '${numTicket}', '${v.fecha}', '${v.nombreCliente.replace(/'/g, "''")}', '${v.formaPago}', ${subtotal.toFixed(2)}, ${v.descuento.toFixed(2)}, ${motivoSql}, ${totalVenta.toFixed(2)}, ${totalVenta.toFixed(2)}, 0.00, '${v.notas.replace(/'/g, "''")}', NOW());\n`;
    sql += `  IF id_calzado IS NOT NULL THEN\n`;
    sql += `    INSERT INTO detalles_venta (id, venta_id, calzado_id, codigo_producto, nombre_producto, talla, cantidad, precio_unitario, costo_unitario, descuento, total)\n`;
    sql += `    VALUES (gen_random_uuid(), id_venta, id_calzado, '${v.codigoProducto}', (SELECT nombre_producto FROM calzados WHERE id = id_calzado), '${v.talla}', ${v.cantidad}, ${v.precioUnitario.toFixed(2)}, ${costoUnit.toFixed(2)}, ${v.descuento.toFixed(2)}, ${totalVenta.toFixed(2)});\n`;
    sql += `  END IF;\n`;
    sql += `END $$;\n\n`;
  });

  // 5. SECUENCIA DE TICKETS
  sql += `-- 5. SECUENCIA DE TICKETS\nCREATE SEQUENCE IF NOT EXISTS secuencia_ticket START ${ventas.length + 1};\n\n`;

  fs.writeFileSync(rutaSemillas, sql, "utf-8");
  console.log(
    `Archivo semillas.sql regenerado exitosamente en: ${rutaSemillas}`,
  );
  console.log("=== IMPORTACIÓN Y SINCRONIZACIÓN COMPLETADA CON ÉXITO ===");
}

procesar().catch((err) => {
  console.error("Fallo durante la importación:", err);
  process.exit(1);
});
