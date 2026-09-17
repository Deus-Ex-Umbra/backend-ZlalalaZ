-- ==============================================================================
-- SEMILLAS DE BASE DE DATOS: ZLALALAZ (TIENDA DE CALZADO)
-- Extraído y normalizado directamente de la hoja de cálculo del negocio
-- ==============================================================================

-- 1. TABLA DE CALZADOS (INVENTARIO PRINCIPAL)
INSERT INTO calzados (id, codigo_producto, nombre_producto, categoria, talla, color, precio_compra, precio_venta, stock_inicial, total_ingresado, total_vendido, stock_actual, alerta_stock_minimo, activo, creado_en, actualizado_en)
VALUES
  (gen_random_uuid(), 'P001', 'Nike Air Force One', 'Lifestyle', '34', 'Blanco', 150.00, 280.00, 1, 3, 1, 3, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P002', 'Nike Air Force One', 'Lifestyle', '35', 'Blanco', 150.00, 280.00, 3, 0, 0, 3, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P003', 'Nike Air Force One', 'Lifestyle', '36', 'Blanco', 150.00, 280.00, 5, 0, 0, 5, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P004', 'Nike Air Force One', 'Lifestyle', '37', 'Blanco', 150.00, 280.00, 3, 0, 0, 3, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P005', 'Nike Air Force One', 'Lifestyle', '38', 'Blanco', 150.00, 280.00, 4, 0, 1, 3, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P006', 'Nike Air Force One', 'Lifestyle', '41', 'Blanco', 150.00, 280.00, 2, 0, 0, 2, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P007', 'Nike Air Force One', 'Lifestyle', '42', 'Blanco', 150.00, 280.00, 2, 0, 0, 2, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P008', 'Nike Air Force One Nocta', 'Drake', '34', 'Blanco', 187.00, 350.00, 1, 0, 1, 0, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P009', 'Nike Air Force One Nocta', 'Drake', '35', 'Blanco', 187.00, 350.00, 1, 0, 1, 0, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P010', 'Nike Air Force One Nocta', 'Drake', '36', 'Blanco', 187.00, 350.00, 3, 0, 0, 3, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P011', 'Nike Air Force One Nocta', 'Drake', '37', 'Blanco', 187.00, 350.00, 4, 0, 0, 4, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P012', 'Nike Air Force One Nocta', 'Drake', '38', 'Blanco', 187.00, 350.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P013', 'Nike Air Force One Nocta', 'Drake', '39', 'Blanco', 187.00, 350.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P014', 'Nike Air Force One Nocta', 'Drake', '40', 'Blanco', 187.00, 350.00, 3, 0, 0, 3, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P015', 'Nike Air Force One Nocta', 'Drake', '41', 'Blanco', 187.00, 350.00, 3, 0, 0, 3, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P016', 'Nike Air Force One Nocta', 'Drake', '42', 'Blanco', 187.00, 350.00, 2, 0, 0, 2, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P017', 'Nike Air Force One Nocta', 'Drake', '43', 'Blanco', 187.00, 350.00, 1, 0, 1, 0, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P018', 'Nike Air Force One', 'Panda', '38', 'Negro/Blanco', 150.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P019', 'Nike Air Force One', 'Panda', '39', 'Negro/Blanco', 150.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P020', 'Nike Air Force One', 'Panda', '41', 'Negro/Blanco', 150.00, 280.00, 2, 0, 0, 2, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P021', 'Nike Air Force One', 'Panda', '42', 'Negro/Blanco', 150.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P022', 'Nike Air Force One', 'Supreme', '38', 'Negro', 150.00, 280.00, 2, 0, 0, 2, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P023', 'Nike Air Force One', 'Supreme', '41', 'Negro', 150.00, 280.00, 2, 0, 0, 2, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P024', 'Nike Air Force One', 'Supreme', '42', 'Negro', 150.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P025', 'Adidas Forum', 'Low 84', '40', 'Negro', 145.00, 280.00, 2, 0, 1, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P026', 'Adidas Forum', 'Low 84', '41', 'Negro', 145.00, 280.00, 2, 0, 0, 2, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P027', 'Adidas Forum', 'Low 84', '42', 'Negro', 145.00, 280.00, 2, 0, 0, 2, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P028', 'Adidas Forum', 'Low 84', '43', 'Negro', 145.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P029', 'Adidas Samba', 'Messi', '34', 'Blanco/Celeste', 173.00, 250.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P030', 'Adidas Samba', 'Messi', '35', 'Blanco/Celeste', 173.00, 250.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P031', 'Adidas Samba', 'Messi', '36', 'Blanco/Celeste', 173.00, 250.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P032', 'Adidas Samba', 'Messi', '37', 'Blanco/Celeste', 173.00, 250.00, 2, 0, 0, 2, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P033', 'Adidas Samba', 'Messi', '38', 'Blanco/Celeste', 173.00, 250.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P034', 'Adidas Samba', 'Messi', '39', 'Blanco/Celeste', 173.00, 250.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P035', 'Adidas Samba', 'Messi', '40', 'Blanco/Celeste', 173.00, 250.00, 2, 0, 0, 2, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P036', 'Adidas Samba', 'Messi', '41', 'Blanco/Celeste', 173.00, 250.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P037', 'Adidas Samba', 'Messi', '42', 'Blanco/Celeste', 173.00, 250.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P038', 'Adidas Samba', 'Messi', '43', 'Blanco/Celeste', 173.00, 250.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P039', 'Adidas Samba', 'Brasil/Mundial', '34', 'Amarillo/Verde', 162.00, 250.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P040', 'Adidas Samba', 'Brasil/Mundial', '35', 'Amarillo/Verde', 162.00, 250.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P041', 'Adidas Samba', 'Brasil/Mundial', '36', 'Amarillo/Verde', 162.00, 250.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P042', 'Adidas Samba', 'Brasil/Mundial', '37', 'Amarillo/Verde', 162.00, 250.00, 2, 0, 0, 2, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P043', 'Adidas Samba', 'Brasil/Mundial', '38', 'Amarillo/Verde', 162.00, 250.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P044', 'Adidas Galaxy', 'VI', '38', 'Negro/Blanco', 155.00, 270.00, 1, 0, 1, 0, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P045', 'Adidas Galaxy', 'VI', '39', 'Negro/Blanco', 155.00, 270.00, 2, 0, 0, 2, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P046', 'Adidas Galaxy', 'VI', '40', 'Negro/Blanco', 155.00, 270.00, 2, 0, 0, 2, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P047', 'Adidas Galaxy', 'VI', '42', 'Negro/Blanco', 155.00, 270.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P060', 'Adidas Samba', 'Pink', '34', 'Blanco/Rosado', 150.00, 280.00, 1, 0, 2, -1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P096', 'Adidas Samba', 'Animal Print', '34', 'Leopardo', 155.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P107', 'Puma 180', 'Park', '38', 'Blanco/Negro', 150.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P119', 'Adidas Campus', 'Chunky', '36', 'Blanco', 145.00, 250.00, 2, 0, 0, 2, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P129', 'Puma Karmen Rebelle', 'Smash Platform', '37', 'Blanco', 155.00, 280.00, 1, 0, 1, 0, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P145', 'Vans', 'Off The Wall', '38', 'Negro/Blanco', 169.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW())
ON CONFLICT (codigo_producto) DO NOTHING;

-- 2. GASTOS EXTRA DE CAJA CHICA
INSERT INTO gastos_caja_chica (id, fecha_gasto, nombre_empleado, concepto_motivo, monto, forma_pago, autorizado_por, creado_en)
VALUES
  (gen_random_uuid(), '2026-06-06', 'Esther Belen', 'Compra de pan', 10.00, 'Efectivo', 'Gerente Tienda', NOW()),
  (gen_random_uuid(), '2026-06-06', 'Esther Belen', 'Pasajes de Transporte', 10.00, 'Efectivo', 'Gerente Tienda', NOW()),
  (gen_random_uuid(), '2026-06-06', 'Junior Conde', 'Almuerzo 2 personas', 30.00, 'Transferencia', 'Gerente Tienda', NOW()),
  (gen_random_uuid(), '2026-06-06', 'Junior Conde', 'Detergente para manos', 21.00, 'Transferencia', 'Gerente Tienda', NOW()),
  (gen_random_uuid(), '2026-06-06', 'Junior Conde', 'Ola Lavaplatos', 15.00, 'Transferencia', 'Gerente Tienda', NOW());
