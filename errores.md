# Registro Central de Errores: ZLaLaLaZ

Este documento es el catálogo oficial de códigos de error estandarizados para el backend y frontend del proyecto **ZLaLaLaZ**. Todo nuevo error detectado o lanzado en el sistema **DEBE** registrarse aquí con su código único, descripción, causa probable y módulo de origen.

---

## Estructura de Códigos
- `ERR-CALZ-XXX`: Módulo de Calzados, Inventario y Variantes de Talla/Color.
- `ERR-VENT-XXX`: Módulo de Ventas y Punto de Venta (POS).
- `ERR-ING-XXX`: Módulo de Ingreso de Mercancía y Proveedores.
- `ERR-GAST-XXX`: Módulo de Gastos de Caja Chica.
- `ERR-PAN-XXX`: Módulo de Panel Central y Reportes Analíticos.
- `ERR-ALM-XXX`: Módulo de Almacenamiento de Archivos (Cloudflare R2, S3, Supabase).
- `ERR-AUTH-XXX`: Módulo de Autenticación y Autorización (JWT).

---

## Catálogo de Errores

| Código | Módulo | Descripción | Causa Probable |
| :--- | :--- | :--- | :--- |
| **ERR-CALZ-001** | Calzados | Calzado no encontrado | El ID de producto o código de barras no existe en la base de datos. |
| **ERR-CALZ-002** | Calzados | Variante no disponible | La combinación de talla (ej. 38) y color solicitada no está registrada. |
| **ERR-CALZ-003** | Calzados | Stock insuficiente | La cantidad solicitada supera las unidades disponibles en inventario. |
| **ERR-CALZ-004** | Calzados | Precio inválido | El precio de compra o de venta es negativo o no numérico. |
| **ERR-CALZ-005** | Calzados | Código de producto duplicado | Ya existe un calzado registrado con el mismo ID (ej. `P001`). |
| **ERR-VENT-001** | Ventas | Carrito de venta vacío | Se intentó procesar una venta en el POS sin calzados seleccionados. |
| **ERR-VENT-002** | Ventas | Efectivo recibido insuficiente | El monto entregado por el cliente es menor que el total de la venta. |
| **ERR-VENT-003** | Ventas | Método de pago no soportado | Se especificó una forma de pago distinta a Efectivo, QR, Tarjeta o Transferencia. |
| **ERR-VENT-004** | Ventas | Fallo en transacción de venta | Error al debitar el stock o registrar la venta en la base de datos (rollback ejecutado). |
| **ERR-VENT-005** | Ventas | Descuento superior al permitido | El descuento aplicado supera el valor total de la venta. |
| **ERR-ING-001** | Ingresos | Proveedor no especificado | Se intentó ingresar mercancía sin indicar el nombre del proveedor. |
| **ERR-ING-002** | Ingresos | Cantidad de ingreso no válida | La cantidad de pares a ingresar debe ser un número entero mayor a cero. |
| **ERR-ING-003** | Ingresos | Calzado no vinculado | El ingreso no referencia un ID de calzado válido del catálogo. |
| **ERR-GAST-001** | Gastos | Monto de gasto inválido | El monto del gasto de caja chica debe ser mayor a cero. |
| **ERR-GAST-002** | Gastos | Autorización ausente | El gasto requiere el nombre del gerente o encargado que lo autoriza. |
| **ERR-GAST-003** | Gastos | Empleado no identificado | Falta el nombre del empleado que realizó el gasto. |
| **ERR-PAN-001** | Panel Central | Rango de fechas no válido | La fecha inicial del filtro es posterior a la fecha final. |
| **ERR-PAN-002** | Panel Central | Métrica no computable | No existen transacciones en el periodo para calcular la rotación o ganancia. |
| **ERR-ALM-001** | Almacenamiento | Error de conexión a Cloudflare R2 | Credenciales incorrectas, S3 Endpoint inaccesible o bucket inexistente. |
| **ERR-ALM-002** | Almacenamiento | Formato de imagen no permitido | Solo se admiten archivos WebP, JPEG o PNG. Se recomienda WebP comprimido en cliente. |
| **ERR-ALM-003** | Almacenamiento | Tamaño de imagen excedido | La fotografía excede el tamaño máximo permitido de 5 MB. |
| **ERR-AUTH-001** | Autenticación | Credenciales inválidas | Usuario o contraseña incorrectos al iniciar sesión. |
| **ERR-AUTH-002** | Autenticación | Token expirado o ausente | La petición requiere un Bearer Token válido en la cabecera `Authorization`. |
