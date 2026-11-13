# Registro Central de Errores: LaLaLa

Este documento es el catálogo oficial de códigos de error estandarizados para el backend y frontend del proyecto **LaLaLa**. Todo nuevo error detectado o lanzado en el sistema **DEBE** registrarse aquí con su código único, descripción, causa probable y módulo de origen.

---

## Estructura de Códigos
- `ERR-CALZ-XXX`: Módulo de Calzados, Inventario y Variantes de Talla/Color.
- `ERR-VENT-XXX`: Módulo de Ventas y Punto de Venta (POS).
- `ERR-ING-XXX`: Módulo de Ingreso de Mercancía y Proveedores.
- `ERR-GAST-XXX`: Módulo de Gastos de Caja Chica.
- `ERR-PAN-XXX`: Módulo de Panel Central y Reportes Analíticos.
- `ERR-ALM-XXX`: Módulo de Almacenamiento de Archivos (Cloudflare R2, S3, Supabase).
- `ERR-SUP-XXX`: Módulo de Supabase (Clientes Admin y Público, conectividad).
- `ERR-AUTH-XXX`: Módulo de Autenticación y Autorización (JWT).
- `ERR-CFG-XXX`: Validación de variables de entorno al arrancar (JWT, CORS).

---

## Catálogo de Errores

| Código | Módulo | Descripción | Causa Probable |
| :--- | :--- | :--- | :--- |
| **ERR-CALZ-001** | Calzados | Calzado no encontrado | El ID de producto o código de barras no existe en la base de datos. |
| **ERR-CALZ-002** | Calzados | Variante no disponible | La combinación de talla (ej. 38) y color solicitada no está registrada. |
| **ERR-CALZ-003** | Calzados | Stock insuficiente | La cantidad solicitada supera las unidades disponibles en inventario. |
| **ERR-CALZ-004** | Calzados | Precio inválido | El precio de compra o de venta es negativo o no numérico. |
| **ERR-CALZ-005** | Calzados | Código de producto duplicado | Ya existe un calzado registrado con el mismo ID (ej. `P001`). |
| **ERR-CALZ-006** | Calzados | Talla obligatoria para calzado | Los productos de tipo calzado deben especificar una talla válida. |
| **ERR-CALZ-007** | Calzados | Nombre de color inválido | El nombre del color o combinación a registrar está vacío. |
| **ERR-CALZ-008** | Calzados | Color o extra de catálogo no encontrado o inválido | El identificador o nombre del color especial o extra promocional no existe o es inválido. |
| **ERR-CALZ-009** | Calzados | Categoría o marca inválida | El nombre de la categoría o marca está vacío o ya existe en el catálogo. |
| **ERR-CALZ-010** | Calzados | Categoría o marca no encontrada | No existe la categoría o marca solicitada en el catálogo. |
| **ERR-VENT-001** | Ventas | Carrito de venta vacío | Se intentó procesar una venta en el POS sin calzados seleccionados. |
| **ERR-VENT-002** | Ventas | Efectivo recibido insuficiente | El monto entregado por el cliente es menor que el total de la venta. |
| **ERR-VENT-003** | Ventas | Método de pago no soportado | Se especificó una forma de pago distinta a Efectivo, QR, Tarjeta o Transferencia. |
| **ERR-VENT-004** | Ventas | Fallo en transacción de venta | Error al debitar el stock o registrar la venta en la base de datos (rollback ejecutado). |
| **ERR-VENT-005** | Ventas | Descuento superior al permitido | El descuento aplicado supera el valor total de la venta. |
| **ERR-VENT-006** | Ventas | Motivo de descuento inválido o ausente | Se aplicó descuento sin indicar motivo del catálogo o sin nota justificativa. |
| **ERR-VENT-007** | Ventas | Fallo en sincronización de venta offline | La venta enviada en lote fuera de línea fue rechazada por falta de stock o datos inválidos. |
| **ERR-VENT-008** | Ventas | Nombre de banco inválido | El nombre del banco a registrar no puede estar vacío. |
| **ERR-ING-001** | Ingresos | Proveedor no especificado | Se intentó ingresar mercancía sin indicar el nombre del proveedor. |
| **ERR-ING-002** | Ingresos | Cantidad de ingreso no válida | La cantidad de pares a ingresar debe ser un número entero mayor a cero. |
| **ERR-ING-003** | Ingresos | Calzado no vinculado | El ingreso no referencia un ID de calzado válido del catálogo. |
| **ERR-ING-004** | Ingresos | Ingreso no encontrado | No existe ningún ingreso de mercancía registrado con el ID proporcionado. |
| **ERR-ING-005** | Ingresos | Stock resultante negativo al editar ingreso | Revertir o reducir la cantidad del ingreso causaría que el stock actual del calzado sea menor a cero debido a ventas ya efectuadas. |
| **ERR-ING-006** | Ingresos | Proveedor no encontrado | No existe ningún proveedor registrado con el identificador proporcionado. |
| **ERR-ING-007** | Ingresos | Lote de ingreso vacío o inválido | El lote multi-calzado no contiene ítems o las cantidades por talla son menores o iguales a cero. |
| **ERR-GAST-001** | Gastos | Monto de gasto inválido | El monto del gasto de caja chica debe ser mayor a cero. |
| **ERR-GAST-002** | Gastos | Autorización ausente | El gasto requiere el nombre del gerente o encargado que lo autoriza. |
| **ERR-GAST-003** | Gastos | Empleado no identificado | Falta el nombre del empleado que realizó el gasto. |
| **ERR-GAST-004** | Gastos | Gasto no encontrado | No se encontró el gasto solicitado con el ID especificado. |
| **ERR-GAST-005** | Gastos | Fecha de filtro inválida | `fechaInicio` o `fechaFin` de `GET /gastos` no es una fecha válida (`YYYY-MM-DD` o ISO datetime). |
| **ERR-GAST-006** | Gastos | Rango de fechas no válido | La fecha inicial del filtro de gastos es posterior a la fecha final. |
| **ERR-PAN-001** | Panel Central | Rango de fechas no válido | La fecha inicial del filtro es posterior a la fecha final. |
| **ERR-PAN-002** | Panel Central | Fecha de filtro inválida | `fechaInicio` o `fechaFin` no es una fecha válida (se aceptan `YYYY-MM-DD` o ISO datetime). |
| **ERR-PAN-003** | Panel Central | Métrica no computable | No existen transacciones en el periodo para calcular la rotación o ganancia. |
| **ERR-PAN-004** | Panel Central | Secret de webhook inválido | La cabecera `x-webhook-secret` no coincide con la variable `PANEL_WEBHOOK_SECRETO`. |
| **ERR-ALM-001** | Almacenamiento | Error de conexión a Cloudflare R2 | Credenciales incorrectas, S3 Endpoint inaccesible o bucket inexistente. |
| **ERR-ALM-002** | Almacenamiento | Formato de imagen no permitido | Solo se admiten archivos WebP, JPEG o PNG. Se recomienda WebP comprimido en cliente. |
| **ERR-ALM-003** | Almacenamiento | Tamaño de imagen excedido | La fotografía excede el tamaño máximo permitido de 5 MB. |
| **ERR-SUP-001** | Supabase | Cliente administrador no inicializado | Faltan las variables `SUPABASE_URL` o `SUPABASE_SECRET_KEY` en el entorno. |
| **ERR-SUP-002** | Supabase | Cliente público no inicializado | Faltan las variables `SUPABASE_URL` o `SUPABASE_PUBLISHABLE_KEY` en el entorno. |
| **ERR-AUTH-001** | Autenticación | Credenciales inválidas | Usuario o contraseña incorrectos al iniciar sesión. |
| **ERR-AUTH-002** | Autenticación | Token expirado o ausente | La petición requiere un Bearer Token válido en la cabecera `Authorization`. |
| **ERR-AUTH-003** | Autenticación | Acceso denegado por rol insuficiente | El usuario no cuenta con el rol requerido (Administración o Ventas) para esta acción. |
| **ERR-AUTH-004** | Autenticación | Usuario inactivo o suspendido | La cuenta del usuario se encuentra desactivada en el sistema. |
| **ERR-AUTH-005** | Autenticación | Correo electrónico ya registrado | Ya existe una cuenta asociada a la dirección de correo indicada. |
| **ERR-AUTH-006** | Autenticación | Sesión revocada remotamente | Cierre forzado de todos los dispositivos por cambio de contraseña o revocación de seguridad (401 Unauthorized). |
| **ERR-CFG-001** | Configuración | `JWT_SECRET` ausente o demasiado corto | La variable no está en el `.env` o tiene menos de 32 caracteres. Generar con `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`. |
| **ERR-CFG-002** | Configuración | `JWT_EXPIRACION` inválida | Formato no soportado. Usar segundos (`43200`) o número con unidad `s`, `m`, `h` o `d` (`12h`). |
| **ERR-CFG-003** | Configuración | `CORS_ORIGENES` ausente | No se definió ningún origen permitido. Separar con `;` (ej. `"http://localhost:3000";"https://tienda.com"`). |
| **ERR-CFG-004** | Configuración | Origen CORS inválido | Alguno de los orígenes no es `http(s)://host[:puerto]` o incluye una ruta. |

