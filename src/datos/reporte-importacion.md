# Reporte de Reconciliación e Importación de Datos

Fecha de generación: 2026-10-04T14:17:36.385Z
Fuente: Google Sheet ID `1iNZzgtX59DzaCJ1fvvDzIYnBu_xVrx7mC-AcKCe35OQ`

## Resumen Cuantitativo
- **Calzados reales (P001–P149):** 149
- **Filas vacías descartadas (P150–P476):** 401
- **Ventas registradas:** 20
- **Gastos de caja chica:** 5 (Total: Bs 86.00)

## Inconsistencias Detectadas
- [INVENTARIO] Nombre normalizado: "NIke Air Force One Nocta" -> "Nike Air Force One Nocta".
- [INVENTARIO] P060 (Adidas Samba) tiene stock negativo: -1 (stockInicial=1, vendidos=2).
- [INVENTARIO] P068 (Adidas Samba) tiene stock negativo: -1 (stockInicial=1, vendidos=2).
- [INVENTARIO] Nombre normalizado: "NIke Air Force One" -> "Nike Air Force One".
- [INVENTARIO] Nombre normalizado: "NIke Air Force One" -> "Nike Air Force One".
- [INGRESOS] Fila con fecha 02/05/2026: Producto P001 tiene nombre "ID no existe" y precio compra Bs 0. Omitido de la carga directa.
- [VENTAS] Fila con fecha 16/09/2026 no tiene código de producto válido ("vacío"). Descartada.
