-- ==============================================================================
-- SEMILLAS COMPLETAS DE BASE DE DATOS: ZLALALAZ (TIENDA DE CALZADO)
-- Generado automáticamente desde Google Sheets por backend/src/datos/importar-hoja.ts
-- ==============================================================================

-- 1. TABLA DE CALZADOS (149 SKUS REALES NORMALIZADOS)
INSERT INTO calzados (id, codigo_producto, nombre_producto, marca, tipo_producto, categoria, talla, color, precio_compra, precio_venta, stock_inicial, total_ingresado, total_vendido, stock_actual, alerta_stock_minimo, activo, creado_en, actualizado_en)
VALUES
  (gen_random_uuid(), 'P001', 'Nike Air Force One', 'Nike', 'CALZADO', 'Lifestyle', '34', 'Blanco', 150.00, 280.00, 1, 3, 1, 3, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P002', 'Nike Air Force One', 'Nike', 'CALZADO', 'Lifestyle', '35', 'Blanco', 150.00, 280.00, 3, 0, 0, 3, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P003', 'Nike Air Force One', 'Nike', 'CALZADO', 'Lifestyle', '36', 'Blanco', 150.00, 280.00, 5, 0, 0, 5, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P004', 'Nike Air Force One', 'Nike', 'CALZADO', 'Lifestyle', '37', 'Blanco', 150.00, 280.00, 3, 0, 0, 3, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P005', 'Nike Air Force One', 'Nike', 'CALZADO', 'Lifestyle', '38', 'Blanco', 150.00, 280.00, 4, 0, 1, 3, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P006', 'Nike Air Force One', 'Nike', 'CALZADO', 'Lifestyle', '41', 'Blanco', 150.00, 280.00, 2, 0, 0, 2, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P007', 'Nike Air Force One', 'Nike', 'CALZADO', 'Lifestyle', '42', 'Blanco', 150.00, 280.00, 2, 0, 0, 2, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P008', 'Nike Air Force One Nocta', 'Nike', 'CALZADO', 'Drake', '34', 'Blanco', 187.00, 350.00, 1, 0, 1, 0, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P009', 'Nike Air Force One Nocta', 'Nike', 'CALZADO', 'Drake', '35', 'Blanco', 187.00, 350.00, 1, 0, 1, 0, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P010', 'Nike Air Force One Nocta', 'Nike', 'CALZADO', 'Drake', '36', 'Blanco', 187.00, 350.00, 3, 0, 0, 3, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P011', 'Nike Air Force One Nocta', 'Nike', 'CALZADO', 'Drake', '37', 'Blanco', 187.00, 350.00, 4, 0, 0, 4, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P012', 'Nike Air Force One Nocta', 'Nike', 'CALZADO', 'Drake', '38', 'Blanco', 187.00, 350.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P013', 'Nike Air Force One Nocta', 'Nike', 'CALZADO', 'Drake', '39', 'Blanco', 187.00, 350.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P014', 'Nike Air Force One Nocta', 'Nike', 'CALZADO', 'Drake', '40', 'Blanco', 187.00, 350.00, 3, 0, 0, 3, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P015', 'Nike Air Force One Nocta', 'Nike', 'CALZADO', 'Drake', '41', 'Blanco', 187.00, 350.00, 3, 0, 0, 3, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P016', 'Nike Air Force One Nocta', 'Nike', 'CALZADO', 'Drake', '42', 'Blanco', 187.00, 350.00, 2, 0, 0, 2, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P017', 'Nike Air Force One Nocta', 'Nike', 'CALZADO', 'Drake', '43', 'Blanco', 187.00, 350.00, 1, 0, 1, 0, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P018', 'Nike Air Force One', 'Nike', 'CALZADO', 'Panda', '38', 'Negro/Blanco', 150.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P019', 'Nike Air Force One', 'Nike', 'CALZADO', 'Panda', '39', 'Negro/Blanco', 150.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P020', 'Nike Air Force One', 'Nike', 'CALZADO', 'Panda', '41', 'Negro/Blanco', 150.00, 280.00, 2, 0, 0, 2, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P021', 'Nike Air Force One', 'Nike', 'CALZADO', 'Panda', '42', 'Negro/Blanco', 150.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P022', 'Nike Air Force One', 'Nike', 'CALZADO', 'Supreme', '38', 'Negro', 150.00, 280.00, 2, 0, 0, 2, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P023', 'Nike Air Force One', 'Nike', 'CALZADO', 'Supreme', '41', 'Negro', 150.00, 280.00, 2, 0, 0, 2, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P024', 'Nike Air Force One', 'Nike', 'CALZADO', 'Supreme', '42', 'Negro', 150.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P025', 'Adidas Forum', 'Adidas', 'CALZADO', 'Low 84', '40', 'Negro', 145.00, 280.00, 2, 0, 1, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P026', 'Adidas Forum', 'Adidas', 'CALZADO', 'Low 84', '41', 'Negro', 145.00, 280.00, 2, 0, 0, 2, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P027', 'Adidas Forum', 'Adidas', 'CALZADO', 'Low 84', '42', 'Negro', 145.00, 280.00, 2, 0, 0, 2, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P028', 'Adidas Forum', 'Adidas', 'CALZADO', 'Low 84', '43', 'Negro', 145.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P029', 'Adidas Samba', 'Adidas', 'CALZADO', 'Messi', '34', 'Blanco/Celeste', 173.00, 250.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P030', 'Adidas Samba', 'Adidas', 'CALZADO', 'Messi', '35', 'Blanco/Celeste', 173.00, 250.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P031', 'Adidas Samba', 'Adidas', 'CALZADO', 'Messi', '36', 'Blanco/Celeste', 173.00, 250.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P032', 'Adidas Samba', 'Adidas', 'CALZADO', 'Messi', '37', 'Blanco/Celeste', 173.00, 250.00, 2, 0, 0, 2, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P033', 'Adidas Samba', 'Adidas', 'CALZADO', 'Messi', '38', 'Blanco/Celeste', 173.00, 250.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P034', 'Adidas Samba', 'Adidas', 'CALZADO', 'Messi', '39', 'Blanco/Celeste', 173.00, 250.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P035', 'Adidas Samba', 'Adidas', 'CALZADO', 'Messi', '40', 'Blanco/Celeste', 173.00, 250.00, 2, 0, 0, 2, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P036', 'Adidas Samba', 'Adidas', 'CALZADO', 'Messi', '41', 'Blanco/Celeste', 173.00, 250.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P037', 'Adidas Samba', 'Adidas', 'CALZADO', 'Messi', '42', 'Blanco/Celeste', 173.00, 250.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P038', 'Adidas Samba', 'Adidas', 'CALZADO', 'Messi', '43', 'Blanco/Celeste', 173.00, 250.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P039', 'Adidas Samba', 'Adidas', 'CALZADO', 'Brasil/Mundial', '34', 'Amarillo/Verde', 162.00, 250.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P040', 'Adidas Samba', 'Adidas', 'CALZADO', 'Brasil/Mundial', '35', 'Amarillo/Verde', 162.00, 250.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P041', 'Adidas Samba', 'Adidas', 'CALZADO', 'Brasil/Mundial', '36', 'Amarillo/Verde', 162.00, 250.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P042', 'Adidas Samba', 'Adidas', 'CALZADO', 'Brasil/Mundial', '37', 'Amarillo/Verde', 162.00, 250.00, 2, 0, 0, 2, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P043', 'Adidas Samba', 'Adidas', 'CALZADO', 'Brasil/Mundial', '38', 'Amarillo/Verde', 162.00, 250.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P044', 'Adidas Galaxy', 'Adidas', 'CALZADO', 'VI', '38', 'Negro/Blanco', 155.00, 270.00, 1, 0, 1, 0, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P045', 'Adidas Galaxy', 'Adidas', 'CALZADO', 'VI', '39', 'Negro/Blanco', 155.00, 270.00, 2, 0, 0, 2, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P046', 'Adidas Galaxy', 'Adidas', 'CALZADO', 'VI', '40', 'Negro/Blanco', 155.00, 270.00, 2, 0, 0, 2, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P047', 'Adidas Galaxy', 'Adidas', 'CALZADO', 'VI', '42', 'Negro/Blanco', 155.00, 270.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P048', 'Nike Air Force One', 'Nike', 'CALZADO', 'Gelo/Graf', '38', 'Plomo', 150.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P049', 'Nike Air Force One', 'Nike', 'CALZADO', 'Gelo/Graf', '41', 'Plomo', 150.00, 280.00, 2, 0, 0, 2, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P050', 'Nike Air Force One', 'Nike', 'CALZADO', 'Gelo/Graf', '42', 'Plomo', 150.00, 280.00, 2, 0, 0, 2, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P051', 'Adidas', 'Adidas', 'CALZADO', 'For Low 84', '34', 'Blanco/Rosado', 150.00, 280.00, 1, 0, 1, 0, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P052', 'Adidas', 'Adidas', 'CALZADO', 'For Low 84', '35', 'Blanco/Rosado', 150.00, 280.00, 1, 0, 1, 0, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P053', 'Adidas', 'Adidas', 'CALZADO', 'For Low 84', '36', 'Blanco/Rosado', 150.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P054', 'Adidas', 'Adidas', 'CALZADO', 'For Low 84', '37', 'Blanco/Rosado', 150.00, 280.00, 2, 0, 1, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P055', 'Adidas', 'Adidas', 'CALZADO', 'For Low 84', '38', 'Blanco/Rosado', 150.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P056', 'Nike Air Force One', 'Nike', 'CALZADO', 'Stussy', '34', 'Crema', 150.00, 280.00, 1, 0, 1, 0, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P057', 'Nike Air Force One', 'Nike', 'CALZADO', 'Stussy', '35', 'Crema', 150.00, 280.00, 1, 0, 1, 0, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P058', 'Nike Air Force One', 'Nike', 'CALZADO', 'Stussy', '36', 'Crema', 150.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P059', 'Nike Air Force One', 'Nike', 'CALZADO', 'Stussy', '37', 'Crema', 150.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P060', 'Adidas Samba', 'Adidas', 'CALZADO', 'Pink', '34', 'Blanco/Rosado', 150.00, 280.00, 1, 0, 2, -1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P061', 'Adidas Samba', 'Adidas', 'CALZADO', 'Pink', '35', 'Blanco/Rosado', 150.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P062', 'Adidas Samba', 'Adidas', 'CALZADO', 'Pink', '36', 'Blanco/Rosado', 150.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P063', 'Adidas Samba', 'Adidas', 'CALZADO', 'Pink', '37', 'Blanco/Rosado', 150.00, 280.00, 2, 0, 0, 2, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P064', 'Adidas Samba', 'Adidas', 'CALZADO', 'Pink', '38', 'Blanco/Rosado', 150.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P065', 'Adidas Samba', 'Adidas', 'CALZADO', 'Pink', '39', 'Blanco/Rosado', 150.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P066', 'Adidas Samba', 'Adidas', 'CALZADO', 'Pink', '40', 'Blanco/Rosado', 150.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P067', 'Adidas Samba', 'Adidas', 'CALZADO', 'Clasica', '34', 'Blanco/Azul', 150.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P068', 'Adidas Samba', 'Adidas', 'CALZADO', 'Clasica', '35', 'Blanco/Azul', 150.00, 280.00, 1, 0, 2, -1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P069', 'Adidas Samba', 'Adidas', 'CALZADO', 'Clasica', '36', 'Blanco/Azul', 150.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P070', 'Adidas Samba', 'Adidas', 'CALZADO', 'Clasica', '38', 'Blanco/Azul', 150.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P071', 'Adidas Samba', 'Adidas', 'CALZADO', 'Clasica', '39', 'Blanco/Azul', 150.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P072', 'Adidas Samba', 'Adidas', 'CALZADO', 'Bege Bronce', '34', 'Crema/Bronce', 155.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P073', 'Adidas Samba', 'Adidas', 'CALZADO', 'Bege Bronce', '35', 'Crema/Bronce', 155.00, 280.00, 2, 0, 1, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P074', 'Adidas Samba', 'Adidas', 'CALZADO', 'Bege Bronce', '36', 'Crema/Bronce', 155.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P075', 'Adidas Samba', 'Adidas', 'CALZADO', 'Bege Bronce', '37', 'Crema/Bronce', 155.00, 280.00, 3, 0, 0, 3, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P076', 'Adidas Samba', 'Adidas', 'CALZADO', 'Bege Bronce', '38', 'Crema/Bronce', 155.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P077', 'Adidas Samba', 'Adidas', 'CALZADO', 'Bege Bronce', '39', 'Crema/Bronce', 155.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P078', 'Mochilas Pequeñas', 'Sin marca', 'ACCESORIO', 'Cuerina', 'Única', 'Crema', 71.00, 180.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P079', 'Mochilas Pequeñas', 'Sin marca', 'ACCESORIO', 'Cuerina', 'Única', 'Ladrillo', 71.00, 180.00, 3, 0, 0, 3, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P080', 'Mochilas Pequeñas', 'Sin marca', 'ACCESORIO', 'Charol', 'Única', 'Ladrillo', 71.00, 180.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P081', 'Mochilas Pequeñas', 'Sin marca', 'ACCESORIO', 'Cuerina', 'Única', 'Guindo', 71.00, 180.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P082', 'Adidas Samba', 'Adidas', 'CALZADO', 'White Scarlet', '40', 'Blanco/Rojo', 150.00, 280.00, 2, 0, 0, 2, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P083', 'Adidas Samba', 'Adidas', 'CALZADO', 'White Scarlet', '41', 'Blanco/Rojo', 150.00, 280.00, 3, 0, 0, 3, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P084', 'Adidas Samba', 'Adidas', 'CALZADO', 'White Scarlet', '42', 'Blanco/Rojo', 150.00, 280.00, 2, 0, 0, 2, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P085', 'Adidas Samba', 'Adidas', 'CALZADO', 'White Scarlet', '43', 'Blanco/Rojo', 150.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P086', 'Adidas Samba', 'Adidas', 'CALZADO', 'White Green', '39', 'Blanco/Verde', 150.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P087', 'Adidas Samba', 'Adidas', 'CALZADO', 'White Green', '41', 'Blanco/Verde', 150.00, 280.00, 2, 0, 0, 2, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P088', 'Adidas Samba', 'Adidas', 'CALZADO', 'White Green', '42', 'Blanco/Verde', 150.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P089', 'Adidas Samba', 'Adidas', 'CALZADO', 'Mary Jane', '37', 'Blanco/Azul', 145.00, 250.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P090', 'Adidas Samba', 'Adidas', 'CALZADO', 'Mary Jane', '38', 'Blanco/Azul', 145.00, 250.00, 2, 0, 0, 2, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P091', 'Adidas Samba', 'Adidas', 'CALZADO', 'Mary Jane', '39', 'Blanco/Azul', 145.00, 250.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P092', 'Adidas Samba', 'Adidas', 'CALZADO', 'Schuh Ohne', '39', 'Blanco/Plomo', 150.00, 280.00, 1, 0, 1, 0, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P093', 'Adidas Samba', 'Adidas', 'CALZADO', 'Schuh Ohne', '40', 'Blanco/Plomo', 150.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P094', 'Adidas Samba', 'Adidas', 'CALZADO', 'Schuh Ohne', '41', 'Blanco/Plomo', 150.00, 280.00, 3, 0, 0, 3, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P095', 'Adidas Samba', 'Adidas', 'CALZADO', 'Schuh Ohne', '42', 'Blanco/Plomo', 150.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P096', 'Adidas Samba', 'Adidas', 'CALZADO', 'Animal Print', '34', 'Leopardo', 155.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P097', 'Adidas Samba', 'Adidas', 'CALZADO', 'Animal Print', '35', 'Leopardo', 155.00, 280.00, 2, 0, 0, 2, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P098', 'Adidas Samba', 'Adidas', 'CALZADO', 'Animal Print', '36', 'Leopardo', 155.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P099', 'Adidas Samba', 'Adidas', 'CALZADO', 'Animal Print', '37', 'Leopardo', 155.00, 280.00, 3, 0, 0, 3, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P100', 'Adidas Samba', 'Adidas', 'CALZADO', 'Animal Print', '38', 'Leopardo', 155.00, 280.00, 2, 0, 0, 2, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P101', 'Nike Zoom X', 'Nike', 'CALZADO', 'Invincible Run 3', '34', 'Lila', 150.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P102', 'Nike Zoom X', 'Nike', 'CALZADO', 'Invincible Run 3', '35', 'Lila', 150.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P103', 'Nike Zoom X', 'Nike', 'CALZADO', 'Invincible Run 3', '36', 'Lila', 150.00, 280.00, 2, 0, 0, 2, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P104', 'Nike Zoom X', 'Nike', 'CALZADO', 'Invincible Run 3', '37', 'Lila', 150.00, 280.00, 3, 0, 0, 3, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P105', 'Nike Zoom X', 'Nike', 'CALZADO', 'Invincible Run 3', '38', 'Lila', 150.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P106', 'Adidas Samba', 'Adidas', 'CALZADO', 'White', '39', 'Blanco', 150.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P107', 'Puma 180', 'Puma', 'CALZADO', 'Park', '38', 'Blanco/Negro', 150.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P108', 'Puma 180', 'Puma', 'CALZADO', 'Park', '39', 'Blanco/Negro', 150.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P109', 'Puma 180', 'Puma', 'CALZADO', 'Park', '40', 'Blanco/Negro', 150.00, 280.00, 3, 0, 0, 3, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P110', 'Adidas Samba', 'Adidas', 'CALZADO', 'Black', '36', 'Negro', 150.00, 280.00, 2, 0, 0, 2, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P111', 'Adidas Samba', 'Adidas', 'CALZADO', 'Black', '37', 'Negro', 150.00, 280.00, 3, 0, 0, 3, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P112', 'Adidas Samba', 'Adidas', 'CALZADO', 'Black', '39', 'Negro', 150.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P113', 'Adidas Samba', 'Adidas', 'CALZADO', 'Black/Coffee', '43', 'Negro/Cafe', 150.00, 280.00, 1, 0, 1, 0, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P114', 'Adidas Samba', 'Adidas', 'CALZADO', 'Deluxe Kicks', '34', 'Negro/Plomo', 155.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P115', 'Adidas Samba', 'Adidas', 'CALZADO', 'Deluxe Kicks', '36', 'Negro/Plomo', 155.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P116', 'Adidas Samba', 'Adidas', 'CALZADO', 'Deluxe Kicks', '37', 'Negro/Plomo', 155.00, 280.00, 2, 0, 0, 2, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P117', 'Adidas Samba', 'Adidas', 'CALZADO', 'Black', '37', 'Negro/Cafe', 155.00, 280.00, 2, 0, 0, 2, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P118', 'Puma 180', 'Puma', 'CALZADO', 'Pink', '38', 'Plomo/Rosado', 155.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P119', 'Adidas Campus', 'Adidas', 'CALZADO', 'Chunky', '36', 'Blanco', 145.00, 250.00, 2, 0, 0, 2, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P120', 'Adidas Campus', 'Adidas', 'CALZADO', 'Chunky', '37', 'Blanco', 145.00, 250.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P121', 'Adidas Campus', 'Adidas', 'CALZADO', 'Chunky', '39', 'Blanco', 145.00, 250.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P122', 'Adidas Zoom X', 'Adidas', 'CALZADO', 'Invincible Run 3', '38', 'Crema', 155.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P123', 'Adidas For Low 84', 'Adidas', 'CALZADO', 'Forum', '42', 'Blanco', 155.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P124', 'Nike Air Force One', 'Nike', 'CALZADO', 'Gamuza', '42', 'Negro', 125.00, 250.00, 2, 0, 0, 2, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P125', 'Vans', 'Vans', 'CALZADO', 'Hyland Black', '36', 'Negro', 125.00, 250.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P126', 'Jordan Retro 4', 'Jordan', 'CALZADO', 'Caña Alta', '41', 'Celeste', 125.00, 250.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P127', 'Nike Air Force One', 'Nike', 'CALZADO', 'Lifestyle', '36', 'Blanco/Verde', 145.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P128', 'Nike Air Force One', 'Nike', 'CALZADO', 'Lifestyle', '38', 'Blanco/Verde', 145.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P129', 'Puma Karmen Rebelle', 'Puma', 'CALZADO', 'Smash Platform', '37', 'Blanco', 155.00, 280.00, 1, 0, 1, 0, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P130', 'Puma Karmen Rebelle', 'Puma', 'CALZADO', 'Smash Platform', '38', 'Blanco', 155.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P131', 'Nike Air Force One', 'Nike', 'CALZADO', 'Lifestyle', '43', 'Blanco/Guindo', 145.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P132', 'Nike Jordan Air Low', 'Nike', 'CALZADO', 'Lifestyle', '36', 'Blanco/Guindo', 145.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P133', 'Nike Air Force One', 'Nike', 'CALZADO', 'Lifestyle', '43', 'Blanco/Plomo', 125.00, 150.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P134', 'Adidas Monky House', 'Adidas', 'CALZADO', 'Forum', '37', 'Rosada/Celeste', 125.00, 180.00, 2, 0, 0, 2, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P135', 'Adidas Monky House', 'Adidas', 'CALZADO', 'Forum', '39', 'Rosada/Celeste', 125.00, 180.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P136', 'Nike Air Force One', 'Nike', 'CALZADO', 'Medalla', '35', 'Beige/Verde', 145.00, 280.00, 1, 0, 1, 0, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P137', 'Nike Air Force One', 'Nike', 'CALZADO', 'Medalla', '36', 'Beige/Verde', 145.00, 280.00, 2, 0, 0, 2, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P138', 'Nike Air Force One', 'Nike', 'CALZADO', 'Medalla', '37', 'Beige/Verde', 145.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P139', 'Nike Air Force One', 'Nike', 'CALZADO', 'Medalla', '38', 'Beige/Verde', 145.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P140', 'Nike Air Force One', 'Nike', 'CALZADO', 'Medalla', '39', 'Beige/Verde', 145.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P141', 'Nike Air Force One', 'Nike', 'CALZADO', 'Corazon Rosado', '34', 'Negro/Rosado', 150.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P142', 'Nike Air Force One', 'Nike', 'CALZADO', 'Corazon Rosado', '35', 'Negro/Rosado', 150.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P143', 'Nike Air Force One', 'Nike', 'CALZADO', 'Corazon Rosado', '36', 'Negro/Rosado', 150.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P144', 'Nike Air Force One', 'Nike', 'CALZADO', 'Corazon Rosado', '38', 'Negro/Rosado', 150.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P145', 'Vans', 'Vans', 'CALZADO', 'Off The Wall', '38', 'Negro/Blanco', 169.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P146', 'Vans', 'Vans', 'CALZADO', 'Off The Wall', '39', 'Negro/Blanco', 169.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P147', 'Vans', 'Vans', 'CALZADO', 'Off The Wall', '40', 'Negro/Blanco', 169.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P148', 'Vans', 'Vans', 'CALZADO', 'Off The Wall', '41', 'Negro/Blanco', 169.00, 280.00, 2, 0, 0, 2, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'P149', 'Vans', 'Vans', 'CALZADO', 'Off The Wall', '42', 'Negro/Blanco', 169.00, 280.00, 1, 0, 0, 1, 2, true, NOW(), NOW())
ON CONFLICT (codigo_producto) DO UPDATE SET
  nombre_producto = EXCLUDED.nombre_producto,
  marca = EXCLUDED.marca,
  tipo_producto = EXCLUDED.tipo_producto,
  precio_compra = EXCLUDED.precio_compra,
  precio_venta = EXCLUDED.precio_venta;

-- 2. GASTOS EXTRA DE CAJA CHICA
INSERT INTO gastos_caja_chica (id, fecha_gasto, nombre_empleado, concepto_motivo, monto, forma_pago, autorizado_por, creado_en)
VALUES
  (gen_random_uuid(), '2026-06-06', 'Esther Belen', 'compra de pan', 10.00, 'Efectivo', 'Gerente Tienda', NOW()),
  (gen_random_uuid(), '2026-06-06', 'Esther Belen', 'Pasajes de Transporte', 10.00, 'Efectivo', 'Gerente Tienda', NOW()),
  (gen_random_uuid(), '2026-06-06', 'Junior Conde', 'almuerzo 2 personas', 30.00, 'Transferencia', 'Gerente Tienda', NOW()),
  (gen_random_uuid(), '2026-06-06', 'Junior Conde', 'Detergente para manos', 21.00, 'Transferencia', 'Gerente Tienda', NOW()),
  (gen_random_uuid(), '2026-06-06', 'Junior Conde', 'Ola Lavaplatos', 15.00, 'Transferencia', 'Gerente Tienda', NOW());

-- 3. CLIENTES IDENTIFICADOS
INSERT INTO clientes (id, nombre_completo, total_compras, monto_total_comprado, fecha_primera_compra, fecha_ultima_compra, activo, creado_en, actualizado_en)
VALUES
  (gen_random_uuid(), 'Jesica Velasquez', 1, 280.00, '2026-06-06', '2026-06-06', true, NOW(), NOW()),
  (gen_random_uuid(), 'Juan Perez', 1, 270.00, '2026-07-07', '2026-07-07', true, NOW(), NOW()),
  (gen_random_uuid(), 'Gabriella Vaca', 1, 280.00, '2026-07-09', '2026-07-09', true, NOW(), NOW()),
  (gen_random_uuid(), 'Elizabeth Soria', 1, 280.00, '2026-07-11', '2026-07-11', true, NOW(), NOW()),
  (gen_random_uuid(), 'Manuel Patzi', 1, 280.00, '2026-07-11', '2026-07-11', true, NOW(), NOW()),
  (gen_random_uuid(), 'Alejandro Gomez', 1, 350.00, '2026-07-15', '2026-07-15', true, NOW(), NOW()),
  (gen_random_uuid(), 'Maritza Choque', 1, 280.00, '2026-07-18', '2026-07-18', true, NOW(), NOW()),
  (gen_random_uuid(), 'Julio Rodriguez', 1, 280.00, '2026-07-20', '2026-07-20', true, NOW(), NOW()),
  (gen_random_uuid(), 'Marisol Cortez', 1, 275.00, '2026-07-21', '2026-07-21', true, NOW(), NOW()),
  (gen_random_uuid(), 'Roberto Miranda', 1, 260.00, '2026-07-21', '2026-07-21', true, NOW(), NOW()),
  (gen_random_uuid(), 'Juliana Duran', 1, 250.00, '2026-07-21', '2026-07-21', true, NOW(), NOW()),
  (gen_random_uuid(), 'Romina Flores', 1, 280.00, '2026-07-21', '2026-07-21', true, NOW(), NOW()),
  (gen_random_uuid(), 'Maria Flores', 1, 260.00, '2026-07-23', '2026-07-23', true, NOW(), NOW()),
  (gen_random_uuid(), 'Juan Chuquimia', 1, 260.00, '2026-07-23', '2026-07-23', true, NOW(), NOW()),
  (gen_random_uuid(), 'Javier Barron Chavar', 1, 350.00, '2026-07-25', '2026-07-25', true, NOW(), NOW()),
  (gen_random_uuid(), 'Alex Soria', 1, 260.00, '2026-07-28', '2026-07-28', true, NOW(), NOW()),
  (gen_random_uuid(), 'Marisol Herrera', 1, 280.00, '2026-09-16', '2026-09-16', true, NOW(), NOW()),
  (gen_random_uuid(), 'Augusto Lopez', 1, 350.00, '2026-09-16', '2026-09-16', true, NOW(), NOW()),
  (gen_random_uuid(), 'Carmen Villanueva', 1, 280.00, '2026-09-16', '2026-09-16', true, NOW(), NOW()),
  (gen_random_uuid(), 'Luis Ortube', 1, 560.00, '2026-09-16', '2026-09-16', true, NOW(), NOW());

-- 4. VENTAS HISTÓRICAS Y DETALLES (21 TRANSACCIONES)
DO $$
DECLARE
  id_venta uuid := gen_random_uuid();
  id_calzado uuid;
BEGIN
  SELECT id INTO id_calzado FROM calzados WHERE codigo_producto = 'P025' LIMIT 1;
  INSERT INTO ventas (id, numero_ticket, fecha_venta, nombre_cliente, forma_pago, subtotal, descuento, motivo_descuento, total_venta, monto_recibido, cambio, notas, creado_en)
  VALUES (id_venta, 'TCK-202606-0001', '2026-06-06', 'Jesica Velasquez', 'Efectivo', 280.00, 0.00, NULL, 280.00, 280.00, 0.00, '', NOW());
  IF id_calzado IS NOT NULL THEN
    INSERT INTO detalles_venta (id, venta_id, calzado_id, codigo_producto, nombre_producto, talla, cantidad, precio_unitario, costo_unitario, descuento, total)
    VALUES (gen_random_uuid(), id_venta, id_calzado, 'P025', (SELECT nombre_producto FROM calzados WHERE id = id_calzado), '40', 1, 280.00, 145.00, 0.00, 280.00);
  END IF;
END $$;

DO $$
DECLARE
  id_venta uuid := gen_random_uuid();
  id_calzado uuid;
BEGIN
  SELECT id INTO id_calzado FROM calzados WHERE codigo_producto = 'P044' LIMIT 1;
  INSERT INTO ventas (id, numero_ticket, fecha_venta, nombre_cliente, forma_pago, subtotal, descuento, motivo_descuento, total_venta, monto_recibido, cambio, notas, creado_en)
  VALUES (id_venta, 'TCK-202607-0002', '2026-07-07', 'Juan Perez', 'Efectivo', 270.00, 0.00, NULL, 270.00, 270.00, 0.00, '', NOW());
  IF id_calzado IS NOT NULL THEN
    INSERT INTO detalles_venta (id, venta_id, calzado_id, codigo_producto, nombre_producto, talla, cantidad, precio_unitario, costo_unitario, descuento, total)
    VALUES (gen_random_uuid(), id_venta, id_calzado, 'P044', (SELECT nombre_producto FROM calzados WHERE id = id_calzado), '38', 1, 270.00, 155.00, 0.00, 270.00);
  END IF;
END $$;

DO $$
DECLARE
  id_venta uuid := gen_random_uuid();
  id_calzado uuid;
BEGIN
  SELECT id INTO id_calzado FROM calzados WHERE codigo_producto = 'P129' LIMIT 1;
  INSERT INTO ventas (id, numero_ticket, fecha_venta, nombre_cliente, forma_pago, subtotal, descuento, motivo_descuento, total_venta, monto_recibido, cambio, notas, creado_en)
  VALUES (id_venta, 'TCK-202607-0003', '2026-07-09', 'Gabriella Vaca', 'Efectivo', 280.00, 0.00, NULL, 280.00, 280.00, 0.00, '', NOW());
  IF id_calzado IS NOT NULL THEN
    INSERT INTO detalles_venta (id, venta_id, calzado_id, codigo_producto, nombre_producto, talla, cantidad, precio_unitario, costo_unitario, descuento, total)
    VALUES (gen_random_uuid(), id_venta, id_calzado, 'P129', (SELECT nombre_producto FROM calzados WHERE id = id_calzado), '37', 1, 280.00, 155.00, 0.00, 280.00);
  END IF;
END $$;

DO $$
DECLARE
  id_venta uuid := gen_random_uuid();
  id_calzado uuid;
BEGIN
  SELECT id INTO id_calzado FROM calzados WHERE codigo_producto = 'P001' LIMIT 1;
  INSERT INTO ventas (id, numero_ticket, fecha_venta, nombre_cliente, forma_pago, subtotal, descuento, motivo_descuento, total_venta, monto_recibido, cambio, notas, creado_en)
  VALUES (id_venta, 'TCK-202607-0004', '2026-07-11', 'Elizabeth Soria', 'QR', 280.00, 0.00, NULL, 280.00, 280.00, 0.00, '', NOW());
  IF id_calzado IS NOT NULL THEN
    INSERT INTO detalles_venta (id, venta_id, calzado_id, codigo_producto, nombre_producto, talla, cantidad, precio_unitario, costo_unitario, descuento, total)
    VALUES (gen_random_uuid(), id_venta, id_calzado, 'P001', (SELECT nombre_producto FROM calzados WHERE id = id_calzado), '34', 1, 280.00, 150.00, 0.00, 280.00);
  END IF;
END $$;

DO $$
DECLARE
  id_venta uuid := gen_random_uuid();
  id_calzado uuid;
BEGIN
  SELECT id INTO id_calzado FROM calzados WHERE codigo_producto = 'P092' LIMIT 1;
  INSERT INTO ventas (id, numero_ticket, fecha_venta, nombre_cliente, forma_pago, subtotal, descuento, motivo_descuento, total_venta, monto_recibido, cambio, notas, creado_en)
  VALUES (id_venta, 'TCK-202607-0005', '2026-07-11', 'Manuel Patzi', 'QR', 280.00, 0.00, NULL, 280.00, 280.00, 0.00, '', NOW());
  IF id_calzado IS NOT NULL THEN
    INSERT INTO detalles_venta (id, venta_id, calzado_id, codigo_producto, nombre_producto, talla, cantidad, precio_unitario, costo_unitario, descuento, total)
    VALUES (gen_random_uuid(), id_venta, id_calzado, 'P092', (SELECT nombre_producto FROM calzados WHERE id = id_calzado), '39', 1, 280.00, 150.00, 0.00, 280.00);
  END IF;
END $$;

DO $$
DECLARE
  id_venta uuid := gen_random_uuid();
  id_calzado uuid;
BEGIN
  SELECT id INTO id_calzado FROM calzados WHERE codigo_producto = 'P008' LIMIT 1;
  INSERT INTO ventas (id, numero_ticket, fecha_venta, nombre_cliente, forma_pago, subtotal, descuento, motivo_descuento, total_venta, monto_recibido, cambio, notas, creado_en)
  VALUES (id_venta, 'TCK-202607-0006', '2026-07-15', 'Alejandro Gomez', 'Efectivo', 350.00, 0.00, NULL, 350.00, 350.00, 0.00, '', NOW());
  IF id_calzado IS NOT NULL THEN
    INSERT INTO detalles_venta (id, venta_id, calzado_id, codigo_producto, nombre_producto, talla, cantidad, precio_unitario, costo_unitario, descuento, total)
    VALUES (gen_random_uuid(), id_venta, id_calzado, 'P008', (SELECT nombre_producto FROM calzados WHERE id = id_calzado), '34', 1, 350.00, 187.00, 0.00, 350.00);
  END IF;
END $$;

DO $$
DECLARE
  id_venta uuid := gen_random_uuid();
  id_calzado uuid;
BEGIN
  SELECT id INTO id_calzado FROM calzados WHERE codigo_producto = 'P056' LIMIT 1;
  INSERT INTO ventas (id, numero_ticket, fecha_venta, nombre_cliente, forma_pago, subtotal, descuento, motivo_descuento, total_venta, monto_recibido, cambio, notas, creado_en)
  VALUES (id_venta, 'TCK-202607-0007', '2026-07-18', 'Maritza Choque', 'QR', 280.00, 0.00, NULL, 280.00, 280.00, 0.00, '', NOW());
  IF id_calzado IS NOT NULL THEN
    INSERT INTO detalles_venta (id, venta_id, calzado_id, codigo_producto, nombre_producto, talla, cantidad, precio_unitario, costo_unitario, descuento, total)
    VALUES (gen_random_uuid(), id_venta, id_calzado, 'P056', (SELECT nombre_producto FROM calzados WHERE id = id_calzado), '34', 1, 280.00, 150.00, 0.00, 280.00);
  END IF;
END $$;

DO $$
DECLARE
  id_venta uuid := gen_random_uuid();
  id_calzado uuid;
BEGIN
  SELECT id INTO id_calzado FROM calzados WHERE codigo_producto = 'P136' LIMIT 1;
  INSERT INTO ventas (id, numero_ticket, fecha_venta, nombre_cliente, forma_pago, subtotal, descuento, motivo_descuento, total_venta, monto_recibido, cambio, notas, creado_en)
  VALUES (id_venta, 'TCK-202607-0008', '2026-07-20', 'Julio Rodriguez', 'QR', 280.00, 0.00, NULL, 280.00, 280.00, 0.00, '', NOW());
  IF id_calzado IS NOT NULL THEN
    INSERT INTO detalles_venta (id, venta_id, calzado_id, codigo_producto, nombre_producto, talla, cantidad, precio_unitario, costo_unitario, descuento, total)
    VALUES (gen_random_uuid(), id_venta, id_calzado, 'P136', (SELECT nombre_producto FROM calzados WHERE id = id_calzado), '35', 1, 280.00, 145.00, 0.00, 280.00);
  END IF;
END $$;

DO $$
DECLARE
  id_venta uuid := gen_random_uuid();
  id_calzado uuid;
BEGIN
  SELECT id INTO id_calzado FROM calzados WHERE codigo_producto = 'P113' LIMIT 1;
  INSERT INTO ventas (id, numero_ticket, fecha_venta, nombre_cliente, forma_pago, subtotal, descuento, motivo_descuento, total_venta, monto_recibido, cambio, notas, creado_en)
  VALUES (id_venta, 'TCK-202607-0009', '2026-07-21', 'Marisol Cortez', 'Efectivo', 280.00, 5.00, 'CLIENTE_FRECUENTE', 275.00, 275.00, 0.00, 'Se desconto por ser cliente consecuente', NOW());
  IF id_calzado IS NOT NULL THEN
    INSERT INTO detalles_venta (id, venta_id, calzado_id, codigo_producto, nombre_producto, talla, cantidad, precio_unitario, costo_unitario, descuento, total)
    VALUES (gen_random_uuid(), id_venta, id_calzado, 'P113', (SELECT nombre_producto FROM calzados WHERE id = id_calzado), '43', 1, 280.00, 150.00, 5.00, 275.00);
  END IF;
END $$;

DO $$
DECLARE
  id_venta uuid := gen_random_uuid();
  id_calzado uuid;
BEGIN
  SELECT id INTO id_calzado FROM calzados WHERE codigo_producto = 'P051' LIMIT 1;
  INSERT INTO ventas (id, numero_ticket, fecha_venta, nombre_cliente, forma_pago, subtotal, descuento, motivo_descuento, total_venta, monto_recibido, cambio, notas, creado_en)
  VALUES (id_venta, 'TCK-202607-0010', '2026-07-21', 'Roberto Miranda', 'Efectivo', 280.00, 20.00, 'CLIENTE_FRECUENTE', 260.00, 260.00, 0.00, 'Se desconto por ser cliente consecuente', NOW());
  IF id_calzado IS NOT NULL THEN
    INSERT INTO detalles_venta (id, venta_id, calzado_id, codigo_producto, nombre_producto, talla, cantidad, precio_unitario, costo_unitario, descuento, total)
    VALUES (gen_random_uuid(), id_venta, id_calzado, 'P051', (SELECT nombre_producto FROM calzados WHERE id = id_calzado), '34', 1, 280.00, 150.00, 20.00, 260.00);
  END IF;
END $$;

DO $$
DECLARE
  id_venta uuid := gen_random_uuid();
  id_calzado uuid;
BEGIN
  SELECT id INTO id_calzado FROM calzados WHERE codigo_producto = 'P052' LIMIT 1;
  INSERT INTO ventas (id, numero_ticket, fecha_venta, nombre_cliente, forma_pago, subtotal, descuento, motivo_descuento, total_venta, monto_recibido, cambio, notas, creado_en)
  VALUES (id_venta, 'TCK-202607-0011', '2026-07-21', 'Juliana Duran', 'Efectivo', 280.00, 30.00, 'CLIENTE_FRECUENTE', 250.00, 250.00, 0.00, 'Se desconto por ser cliente consecuente', NOW());
  IF id_calzado IS NOT NULL THEN
    INSERT INTO detalles_venta (id, venta_id, calzado_id, codigo_producto, nombre_producto, talla, cantidad, precio_unitario, costo_unitario, descuento, total)
    VALUES (gen_random_uuid(), id_venta, id_calzado, 'P052', (SELECT nombre_producto FROM calzados WHERE id = id_calzado), '35', 1, 280.00, 150.00, 30.00, 250.00);
  END IF;
END $$;

DO $$
DECLARE
  id_venta uuid := gen_random_uuid();
  id_calzado uuid;
BEGIN
  SELECT id INTO id_calzado FROM calzados WHERE codigo_producto = 'P060' LIMIT 1;
  INSERT INTO ventas (id, numero_ticket, fecha_venta, nombre_cliente, forma_pago, subtotal, descuento, motivo_descuento, total_venta, monto_recibido, cambio, notas, creado_en)
  VALUES (id_venta, 'TCK-202607-0012', '2026-07-21', 'Romina Flores', 'Efectivo', 280.00, 0.00, NULL, 280.00, 280.00, 0.00, '', NOW());
  IF id_calzado IS NOT NULL THEN
    INSERT INTO detalles_venta (id, venta_id, calzado_id, codigo_producto, nombre_producto, talla, cantidad, precio_unitario, costo_unitario, descuento, total)
    VALUES (gen_random_uuid(), id_venta, id_calzado, 'P060', (SELECT nombre_producto FROM calzados WHERE id = id_calzado), '34', 1, 280.00, 150.00, 0.00, 280.00);
  END IF;
END $$;

DO $$
DECLARE
  id_venta uuid := gen_random_uuid();
  id_calzado uuid;
BEGIN
  SELECT id INTO id_calzado FROM calzados WHERE codigo_producto = 'P005' LIMIT 1;
  INSERT INTO ventas (id, numero_ticket, fecha_venta, nombre_cliente, forma_pago, subtotal, descuento, motivo_descuento, total_venta, monto_recibido, cambio, notas, creado_en)
  VALUES (id_venta, 'TCK-202607-0013', '2026-07-23', 'Maria Flores', 'QR', 280.00, 20.00, 'CLIENTE_FRECUENTE', 260.00, 260.00, 0.00, 'Se desconto por ser cliente frecuente', NOW());
  IF id_calzado IS NOT NULL THEN
    INSERT INTO detalles_venta (id, venta_id, calzado_id, codigo_producto, nombre_producto, talla, cantidad, precio_unitario, costo_unitario, descuento, total)
    VALUES (gen_random_uuid(), id_venta, id_calzado, 'P005', (SELECT nombre_producto FROM calzados WHERE id = id_calzado), '38', 1, 280.00, 150.00, 20.00, 260.00);
  END IF;
END $$;

DO $$
DECLARE
  id_venta uuid := gen_random_uuid();
  id_calzado uuid;
BEGIN
  SELECT id INTO id_calzado FROM calzados WHERE codigo_producto = 'P073' LIMIT 1;
  INSERT INTO ventas (id, numero_ticket, fecha_venta, nombre_cliente, forma_pago, subtotal, descuento, motivo_descuento, total_venta, monto_recibido, cambio, notas, creado_en)
  VALUES (id_venta, 'TCK-202607-0014', '2026-07-23', 'Juan Chuquimia', 'Efectivo', 280.00, 20.00, 'CLIENTE_FRECUENTE', 260.00, 260.00, 0.00, 'Se desconto por ser cliente frecuente', NOW());
  IF id_calzado IS NOT NULL THEN
    INSERT INTO detalles_venta (id, venta_id, calzado_id, codigo_producto, nombre_producto, talla, cantidad, precio_unitario, costo_unitario, descuento, total)
    VALUES (gen_random_uuid(), id_venta, id_calzado, 'P073', (SELECT nombre_producto FROM calzados WHERE id = id_calzado), '35', 1, 280.00, 155.00, 20.00, 260.00);
  END IF;
END $$;

DO $$
DECLARE
  id_venta uuid := gen_random_uuid();
  id_calzado uuid;
BEGIN
  SELECT id INTO id_calzado FROM calzados WHERE codigo_producto = 'P017' LIMIT 1;
  INSERT INTO ventas (id, numero_ticket, fecha_venta, nombre_cliente, forma_pago, subtotal, descuento, motivo_descuento, total_venta, monto_recibido, cambio, notas, creado_en)
  VALUES (id_venta, 'TCK-202607-0015', '2026-07-25', 'Javier Barron Chavar', 'QR', 350.00, 0.00, NULL, 350.00, 350.00, 0.00, '', NOW());
  IF id_calzado IS NOT NULL THEN
    INSERT INTO detalles_venta (id, venta_id, calzado_id, codigo_producto, nombre_producto, talla, cantidad, precio_unitario, costo_unitario, descuento, total)
    VALUES (gen_random_uuid(), id_venta, id_calzado, 'P017', (SELECT nombre_producto FROM calzados WHERE id = id_calzado), '43', 1, 350.00, 187.00, 0.00, 350.00);
  END IF;
END $$;

DO $$
DECLARE
  id_venta uuid := gen_random_uuid();
  id_calzado uuid;
BEGIN
  SELECT id INTO id_calzado FROM calzados WHERE codigo_producto = 'P054' LIMIT 1;
  INSERT INTO ventas (id, numero_ticket, fecha_venta, nombre_cliente, forma_pago, subtotal, descuento, motivo_descuento, total_venta, monto_recibido, cambio, notas, creado_en)
  VALUES (id_venta, 'TCK-202607-0016', '2026-07-28', 'Alex Soria', 'Efectivo', 280.00, 20.00, 'CLIENTE_FRECUENTE', 260.00, 260.00, 0.00, 'Se desconto por ser cliento antiguo', NOW());
  IF id_calzado IS NOT NULL THEN
    INSERT INTO detalles_venta (id, venta_id, calzado_id, codigo_producto, nombre_producto, talla, cantidad, precio_unitario, costo_unitario, descuento, total)
    VALUES (gen_random_uuid(), id_venta, id_calzado, 'P054', (SELECT nombre_producto FROM calzados WHERE id = id_calzado), '37', 1, 280.00, 150.00, 20.00, 260.00);
  END IF;
END $$;

DO $$
DECLARE
  id_venta uuid := gen_random_uuid();
  id_calzado uuid;
BEGIN
  SELECT id INTO id_calzado FROM calzados WHERE codigo_producto = 'P057' LIMIT 1;
  INSERT INTO ventas (id, numero_ticket, fecha_venta, nombre_cliente, forma_pago, subtotal, descuento, motivo_descuento, total_venta, monto_recibido, cambio, notas, creado_en)
  VALUES (id_venta, 'TCK-202609-0017', '2026-09-16', 'Marisol Herrera', 'Efectivo', 280.00, 0.00, NULL, 280.00, 280.00, 0.00, '', NOW());
  IF id_calzado IS NOT NULL THEN
    INSERT INTO detalles_venta (id, venta_id, calzado_id, codigo_producto, nombre_producto, talla, cantidad, precio_unitario, costo_unitario, descuento, total)
    VALUES (gen_random_uuid(), id_venta, id_calzado, 'P057', (SELECT nombre_producto FROM calzados WHERE id = id_calzado), '35', 1, 280.00, 150.00, 0.00, 280.00);
  END IF;
END $$;

DO $$
DECLARE
  id_venta uuid := gen_random_uuid();
  id_calzado uuid;
BEGIN
  SELECT id INTO id_calzado FROM calzados WHERE codigo_producto = 'P009' LIMIT 1;
  INSERT INTO ventas (id, numero_ticket, fecha_venta, nombre_cliente, forma_pago, subtotal, descuento, motivo_descuento, total_venta, monto_recibido, cambio, notas, creado_en)
  VALUES (id_venta, 'TCK-202609-0018', '2026-09-16', 'Augusto Lopez', 'QR', 350.00, 0.00, NULL, 350.00, 350.00, 0.00, '', NOW());
  IF id_calzado IS NOT NULL THEN
    INSERT INTO detalles_venta (id, venta_id, calzado_id, codigo_producto, nombre_producto, talla, cantidad, precio_unitario, costo_unitario, descuento, total)
    VALUES (gen_random_uuid(), id_venta, id_calzado, 'P009', (SELECT nombre_producto FROM calzados WHERE id = id_calzado), '35', 1, 350.00, 187.00, 0.00, 350.00);
  END IF;
END $$;

DO $$
DECLARE
  id_venta uuid := gen_random_uuid();
  id_calzado uuid;
BEGIN
  SELECT id INTO id_calzado FROM calzados WHERE codigo_producto = 'P060' LIMIT 1;
  INSERT INTO ventas (id, numero_ticket, fecha_venta, nombre_cliente, forma_pago, subtotal, descuento, motivo_descuento, total_venta, monto_recibido, cambio, notas, creado_en)
  VALUES (id_venta, 'TCK-202609-0019', '2026-09-16', 'Carmen Villanueva', 'QR', 280.00, 0.00, NULL, 280.00, 280.00, 0.00, '', NOW());
  IF id_calzado IS NOT NULL THEN
    INSERT INTO detalles_venta (id, venta_id, calzado_id, codigo_producto, nombre_producto, talla, cantidad, precio_unitario, costo_unitario, descuento, total)
    VALUES (gen_random_uuid(), id_venta, id_calzado, 'P060', (SELECT nombre_producto FROM calzados WHERE id = id_calzado), '34', 1, 280.00, 150.00, 0.00, 280.00);
  END IF;
END $$;

DO $$
DECLARE
  id_venta uuid := gen_random_uuid();
  id_calzado uuid;
BEGIN
  SELECT id INTO id_calzado FROM calzados WHERE codigo_producto = 'P068' LIMIT 1;
  INSERT INTO ventas (id, numero_ticket, fecha_venta, nombre_cliente, forma_pago, subtotal, descuento, motivo_descuento, total_venta, monto_recibido, cambio, notas, creado_en)
  VALUES (id_venta, 'TCK-202609-0020', '2026-09-16', 'Luis Ortube', 'QR', 560.00, 0.00, NULL, 560.00, 560.00, 0.00, '', NOW());
  IF id_calzado IS NOT NULL THEN
    INSERT INTO detalles_venta (id, venta_id, calzado_id, codigo_producto, nombre_producto, talla, cantidad, precio_unitario, costo_unitario, descuento, total)
    VALUES (gen_random_uuid(), id_venta, id_calzado, 'P068', (SELECT nombre_producto FROM calzados WHERE id = id_calzado), '35', 2, 280.00, 150.00, 0.00, 560.00);
  END IF;
END $$;

-- 5. SECUENCIA DE TICKETS
CREATE SEQUENCE IF NOT EXISTS secuencia_ticket START 21;

