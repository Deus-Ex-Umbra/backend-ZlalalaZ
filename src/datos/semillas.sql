-- ==============================================================================
-- SEMILLAS COMPLETAS DE BASE DE DATOS: LALALA (TIENDA DE CALZADO)
-- Generado automáticamente desde Google Sheets por backend/src/datos/importar-hoja.ts
-- ==============================================================================

-- 1. TABLA DE CALZADOS (149 SKUS REALES NORMALIZADOS)
INSERT INTO calzados (id, codigo_producto, nombre_producto, marca, tipo_producto, categoria, talla, color, precio_compra, precio_venta, stock_inicial, total_ingresado, total_vendido, stock_actual, alerta_stock_minimo, activo, creado_en, actualizado_en)
VALUES
  (gen_random_uuid(), 'P-1', 'Nike Air Force One', 'Nike', 'CALZADO', 'Lifestyle', '34', 'Blanco', 150.00, 280.00, 1, 3, 1, 3, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-2', 'Nike Air Force One', 'Nike', 'CALZADO', 'Lifestyle', '35', 'Blanco', 150.00, 280.00, 3, 0, 0, 3, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-3', 'Nike Air Force One', 'Nike', 'CALZADO', 'Lifestyle', '36', 'Blanco', 150.00, 280.00, 5, 0, 0, 5, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-4', 'Nike Air Force One', 'Nike', 'CALZADO', 'Lifestyle', '37', 'Blanco', 150.00, 280.00, 3, 0, 0, 3, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-5', 'Nike Air Force One', 'Nike', 'CALZADO', 'Lifestyle', '38', 'Blanco', 150.00, 280.00, 4, 0, 1, 3, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-6', 'Nike Air Force One', 'Nike', 'CALZADO', 'Lifestyle', '41', 'Blanco', 150.00, 280.00, 2, 0, 0, 2, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-7', 'Nike Air Force One', 'Nike', 'CALZADO', 'Lifestyle', '42', 'Blanco', 150.00, 280.00, 2, 0, 0, 2, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-8', 'Nike Air Force One Nocta', 'Nike', 'CALZADO', 'Drake', '34', 'Blanco', 187.00, 350.00, 1, 0, 1, 0, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-9', 'Nike Air Force One Nocta', 'Nike', 'CALZADO', 'Drake', '35', 'Blanco', 187.00, 350.00, 1, 0, 1, 0, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-10', 'Nike Air Force One Nocta', 'Nike', 'CALZADO', 'Drake', '36', 'Blanco', 187.00, 350.00, 3, 0, 0, 3, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-11', 'Nike Air Force One Nocta', 'Nike', 'CALZADO', 'Drake', '37', 'Blanco', 187.00, 350.00, 4, 0, 0, 4, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-12', 'Nike Air Force One Nocta', 'Nike', 'CALZADO', 'Drake', '38', 'Blanco', 187.00, 350.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-13', 'Nike Air Force One Nocta', 'Nike', 'CALZADO', 'Drake', '39', 'Blanco', 187.00, 350.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-14', 'Nike Air Force One Nocta', 'Nike', 'CALZADO', 'Drake', '40', 'Blanco', 187.00, 350.00, 3, 0, 0, 3, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-15', 'Nike Air Force One Nocta', 'Nike', 'CALZADO', 'Drake', '41', 'Blanco', 187.00, 350.00, 3, 0, 0, 3, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-16', 'Nike Air Force One Nocta', 'Nike', 'CALZADO', 'Drake', '42', 'Blanco', 187.00, 350.00, 2, 0, 0, 2, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-17', 'Nike Air Force One Nocta', 'Nike', 'CALZADO', 'Drake', '43', 'Blanco', 187.00, 350.00, 1, 0, 1, 0, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-18', 'Nike Air Force One', 'Nike', 'CALZADO', 'Panda', '38', 'Negro/Blanco', 150.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-19', 'Nike Air Force One', 'Nike', 'CALZADO', 'Panda', '39', 'Negro/Blanco', 150.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-20', 'Nike Air Force One', 'Nike', 'CALZADO', 'Panda', '41', 'Negro/Blanco', 150.00, 280.00, 2, 0, 0, 2, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-21', 'Nike Air Force One', 'Nike', 'CALZADO', 'Panda', '42', 'Negro/Blanco', 150.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-22', 'Nike Air Force One', 'Nike', 'CALZADO', 'Supreme', '38', 'Negro', 150.00, 280.00, 2, 0, 0, 2, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-23', 'Nike Air Force One', 'Nike', 'CALZADO', 'Supreme', '41', 'Negro', 150.00, 280.00, 2, 0, 0, 2, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-24', 'Nike Air Force One', 'Nike', 'CALZADO', 'Supreme', '42', 'Negro', 150.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-25', 'Adidas Forum', 'Adidas', 'CALZADO', 'Low 84', '40', 'Negro', 145.00, 280.00, 2, 0, 1, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-26', 'Adidas Forum', 'Adidas', 'CALZADO', 'Low 84', '41', 'Negro', 145.00, 280.00, 2, 0, 0, 2, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-27', 'Adidas Forum', 'Adidas', 'CALZADO', 'Low 84', '42', 'Negro', 145.00, 280.00, 2, 0, 0, 2, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-28', 'Adidas Forum', 'Adidas', 'CALZADO', 'Low 84', '43', 'Negro', 145.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-29', 'Adidas Samba', 'Adidas', 'CALZADO', 'Messi', '34', 'Blanco/Celeste', 173.00, 250.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-30', 'Adidas Samba', 'Adidas', 'CALZADO', 'Messi', '35', 'Blanco/Celeste', 173.00, 250.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-31', 'Adidas Samba', 'Adidas', 'CALZADO', 'Messi', '36', 'Blanco/Celeste', 173.00, 250.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-32', 'Adidas Samba', 'Adidas', 'CALZADO', 'Messi', '37', 'Blanco/Celeste', 173.00, 250.00, 2, 0, 0, 2, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-33', 'Adidas Samba', 'Adidas', 'CALZADO', 'Messi', '38', 'Blanco/Celeste', 173.00, 250.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-34', 'Adidas Samba', 'Adidas', 'CALZADO', 'Messi', '39', 'Blanco/Celeste', 173.00, 250.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-35', 'Adidas Samba', 'Adidas', 'CALZADO', 'Messi', '40', 'Blanco/Celeste', 173.00, 250.00, 2, 0, 0, 2, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-36', 'Adidas Samba', 'Adidas', 'CALZADO', 'Messi', '41', 'Blanco/Celeste', 173.00, 250.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-37', 'Adidas Samba', 'Adidas', 'CALZADO', 'Messi', '42', 'Blanco/Celeste', 173.00, 250.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-38', 'Adidas Samba', 'Adidas', 'CALZADO', 'Messi', '43', 'Blanco/Celeste', 173.00, 250.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-39', 'Adidas Samba', 'Adidas', 'CALZADO', 'Brasil/Mundial', '34', 'Amarillo/Verde', 162.00, 250.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-40', 'Adidas Samba', 'Adidas', 'CALZADO', 'Brasil/Mundial', '35', 'Amarillo/Verde', 162.00, 250.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-41', 'Adidas Samba', 'Adidas', 'CALZADO', 'Brasil/Mundial', '36', 'Amarillo/Verde', 162.00, 250.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-42', 'Adidas Samba', 'Adidas', 'CALZADO', 'Brasil/Mundial', '37', 'Amarillo/Verde', 162.00, 250.00, 2, 0, 0, 2, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-43', 'Adidas Samba', 'Adidas', 'CALZADO', 'Brasil/Mundial', '38', 'Amarillo/Verde', 162.00, 250.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-44', 'Adidas Galaxy', 'Adidas', 'CALZADO', 'VI', '38', 'Negro/Blanco', 155.00, 270.00, 1, 0, 1, 0, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-45', 'Adidas Galaxy', 'Adidas', 'CALZADO', 'VI', '39', 'Negro/Blanco', 155.00, 270.00, 2, 0, 0, 2, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-46', 'Adidas Galaxy', 'Adidas', 'CALZADO', 'VI', '40', 'Negro/Blanco', 155.00, 270.00, 2, 0, 0, 2, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-47', 'Adidas Galaxy', 'Adidas', 'CALZADO', 'VI', '42', 'Negro/Blanco', 155.00, 270.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-48', 'Nike Air Force One', 'Nike', 'CALZADO', 'Gelo/Graf', '38', 'Plomo', 150.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-49', 'Nike Air Force One', 'Nike', 'CALZADO', 'Gelo/Graf', '41', 'Plomo', 150.00, 280.00, 2, 0, 0, 2, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-50', 'Nike Air Force One', 'Nike', 'CALZADO', 'Gelo/Graf', '42', 'Plomo', 150.00, 280.00, 2, 0, 0, 2, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-51', 'Adidas', 'Adidas', 'CALZADO', 'For Low 84', '34', 'Blanco/Rosado', 150.00, 280.00, 1, 0, 1, 0, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-52', 'Adidas', 'Adidas', 'CALZADO', 'For Low 84', '35', 'Blanco/Rosado', 150.00, 280.00, 1, 0, 1, 0, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-53', 'Adidas', 'Adidas', 'CALZADO', 'For Low 84', '36', 'Blanco/Rosado', 150.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-54', 'Adidas', 'Adidas', 'CALZADO', 'For Low 84', '37', 'Blanco/Rosado', 150.00, 280.00, 2, 0, 1, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-55', 'Adidas', 'Adidas', 'CALZADO', 'For Low 84', '38', 'Blanco/Rosado', 150.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-56', 'Nike Air Force One', 'Nike', 'CALZADO', 'Stussy', '34', 'Crema', 150.00, 280.00, 1, 0, 1, 0, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-57', 'Nike Air Force One', 'Nike', 'CALZADO', 'Stussy', '35', 'Crema', 150.00, 280.00, 1, 0, 1, 0, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-58', 'Nike Air Force One', 'Nike', 'CALZADO', 'Stussy', '36', 'Crema', 150.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-59', 'Nike Air Force One', 'Nike', 'CALZADO', 'Stussy', '37', 'Crema', 150.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-60', 'Adidas Samba', 'Adidas', 'CALZADO', 'Pink', '34', 'Blanco/Rosado', 150.00, 280.00, 2, 0, 2, 0, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-61', 'Adidas Samba', 'Adidas', 'CALZADO', 'Pink', '35', 'Blanco/Rosado', 150.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-62', 'Adidas Samba', 'Adidas', 'CALZADO', 'Pink', '36', 'Blanco/Rosado', 150.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-63', 'Adidas Samba', 'Adidas', 'CALZADO', 'Pink', '37', 'Blanco/Rosado', 150.00, 280.00, 2, 0, 0, 2, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-64', 'Adidas Samba', 'Adidas', 'CALZADO', 'Pink', '38', 'Blanco/Rosado', 150.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-65', 'Adidas Samba', 'Adidas', 'CALZADO', 'Pink', '39', 'Blanco/Rosado', 150.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-66', 'Adidas Samba', 'Adidas', 'CALZADO', 'Pink', '40', 'Blanco/Rosado', 150.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-67', 'Adidas Samba', 'Adidas', 'CALZADO', 'Clasica', '34', 'Blanco/Azul', 150.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-68', 'Adidas Samba', 'Adidas', 'CALZADO', 'Clasica', '35', 'Blanco/Azul', 150.00, 280.00, 2, 0, 2, 0, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-69', 'Adidas Samba', 'Adidas', 'CALZADO', 'Clasica', '36', 'Blanco/Azul', 150.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-70', 'Adidas Samba', 'Adidas', 'CALZADO', 'Clasica', '38', 'Blanco/Azul', 150.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-71', 'Adidas Samba', 'Adidas', 'CALZADO', 'Clasica', '39', 'Blanco/Azul', 150.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-72', 'Adidas Samba', 'Adidas', 'CALZADO', 'Bege Bronce', '34', 'Crema/Bronce', 155.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-73', 'Adidas Samba', 'Adidas', 'CALZADO', 'Bege Bronce', '35', 'Crema/Bronce', 155.00, 280.00, 2, 0, 1, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-74', 'Adidas Samba', 'Adidas', 'CALZADO', 'Bege Bronce', '36', 'Crema/Bronce', 155.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-75', 'Adidas Samba', 'Adidas', 'CALZADO', 'Bege Bronce', '37', 'Crema/Bronce', 155.00, 280.00, 3, 0, 0, 3, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-76', 'Adidas Samba', 'Adidas', 'CALZADO', 'Bege Bronce', '38', 'Crema/Bronce', 155.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-77', 'Adidas Samba', 'Adidas', 'CALZADO', 'Bege Bronce', '39', 'Crema/Bronce', 155.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-78', 'Mochilas Pequeñas', 'Sin marca', 'ACCESORIO', 'Cuerina', 'Única', 'Crema', 71.00, 180.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-79', 'Mochilas Pequeñas', 'Sin marca', 'ACCESORIO', 'Cuerina', 'Única', 'Ladrillo', 71.00, 180.00, 3, 0, 0, 3, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-80', 'Mochilas Pequeñas', 'Sin marca', 'ACCESORIO', 'Charol', 'Única', 'Ladrillo', 71.00, 180.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-81', 'Mochilas Pequeñas', 'Sin marca', 'ACCESORIO', 'Cuerina', 'Única', 'Guindo', 71.00, 180.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-82', 'Adidas Samba', 'Adidas', 'CALZADO', 'White Scarlet', '40', 'Blanco/Rojo', 150.00, 280.00, 2, 0, 0, 2, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-83', 'Adidas Samba', 'Adidas', 'CALZADO', 'White Scarlet', '41', 'Blanco/Rojo', 150.00, 280.00, 3, 0, 0, 3, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-84', 'Adidas Samba', 'Adidas', 'CALZADO', 'White Scarlet', '42', 'Blanco/Rojo', 150.00, 280.00, 2, 0, 0, 2, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-85', 'Adidas Samba', 'Adidas', 'CALZADO', 'White Scarlet', '43', 'Blanco/Rojo', 150.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-86', 'Adidas Samba', 'Adidas', 'CALZADO', 'White Green', '39', 'Blanco/Verde', 150.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-87', 'Adidas Samba', 'Adidas', 'CALZADO', 'White Green', '41', 'Blanco/Verde', 150.00, 280.00, 2, 0, 0, 2, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-88', 'Adidas Samba', 'Adidas', 'CALZADO', 'White Green', '42', 'Blanco/Verde', 150.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-89', 'Adidas Samba', 'Adidas', 'CALZADO', 'Mary Jane', '37', 'Blanco/Azul', 145.00, 250.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-90', 'Adidas Samba', 'Adidas', 'CALZADO', 'Mary Jane', '38', 'Blanco/Azul', 145.00, 250.00, 2, 0, 0, 2, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-91', 'Adidas Samba', 'Adidas', 'CALZADO', 'Mary Jane', '39', 'Blanco/Azul', 145.00, 250.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-92', 'Adidas Samba', 'Adidas', 'CALZADO', 'Schuh Ohne', '39', 'Blanco/Plomo', 150.00, 280.00, 1, 0, 1, 0, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-93', 'Adidas Samba', 'Adidas', 'CALZADO', 'Schuh Ohne', '40', 'Blanco/Plomo', 150.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-94', 'Adidas Samba', 'Adidas', 'CALZADO', 'Schuh Ohne', '41', 'Blanco/Plomo', 150.00, 280.00, 3, 0, 0, 3, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-95', 'Adidas Samba', 'Adidas', 'CALZADO', 'Schuh Ohne', '42', 'Blanco/Plomo', 150.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-96', 'Adidas Samba', 'Adidas', 'CALZADO', 'Animal Print', '34', 'Leopardo', 155.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-97', 'Adidas Samba', 'Adidas', 'CALZADO', 'Animal Print', '35', 'Leopardo', 155.00, 280.00, 2, 0, 0, 2, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-98', 'Adidas Samba', 'Adidas', 'CALZADO', 'Animal Print', '36', 'Leopardo', 155.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-99', 'Adidas Samba', 'Adidas', 'CALZADO', 'Animal Print', '37', 'Leopardo', 155.00, 280.00, 3, 0, 0, 3, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-100', 'Adidas Samba', 'Adidas', 'CALZADO', 'Animal Print', '38', 'Leopardo', 155.00, 280.00, 2, 0, 0, 2, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-101', 'Nike Zoom X', 'Nike', 'CALZADO', 'Invincible Run 3', '34', 'Lila', 150.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-102', 'Nike Zoom X', 'Nike', 'CALZADO', 'Invincible Run 3', '35', 'Lila', 150.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-103', 'Nike Zoom X', 'Nike', 'CALZADO', 'Invincible Run 3', '36', 'Lila', 150.00, 280.00, 2, 0, 0, 2, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-104', 'Nike Zoom X', 'Nike', 'CALZADO', 'Invincible Run 3', '37', 'Lila', 150.00, 280.00, 3, 0, 0, 3, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-105', 'Nike Zoom X', 'Nike', 'CALZADO', 'Invincible Run 3', '38', 'Lila', 150.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-106', 'Adidas Samba', 'Adidas', 'CALZADO', 'White', '39', 'Blanco', 150.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-107', 'Puma 180', 'Puma', 'CALZADO', 'Park', '38', 'Blanco/Negro', 150.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-108', 'Puma 180', 'Puma', 'CALZADO', 'Park', '39', 'Blanco/Negro', 150.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-109', 'Puma 180', 'Puma', 'CALZADO', 'Park', '40', 'Blanco/Negro', 150.00, 280.00, 3, 0, 0, 3, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-110', 'Adidas Samba', 'Adidas', 'CALZADO', 'Black', '36', 'Negro', 150.00, 280.00, 2, 0, 0, 2, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-111', 'Adidas Samba', 'Adidas', 'CALZADO', 'Black', '37', 'Negro', 150.00, 280.00, 3, 0, 0, 3, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-112', 'Adidas Samba', 'Adidas', 'CALZADO', 'Black', '39', 'Negro', 150.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-113', 'Adidas Samba', 'Adidas', 'CALZADO', 'Black/Coffee', '43', 'Negro/Cafe', 150.00, 280.00, 1, 0, 1, 0, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-114', 'Adidas Samba', 'Adidas', 'CALZADO', 'Deluxe Kicks', '34', 'Negro/Plomo', 155.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-115', 'Adidas Samba', 'Adidas', 'CALZADO', 'Deluxe Kicks', '36', 'Negro/Plomo', 155.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-116', 'Adidas Samba', 'Adidas', 'CALZADO', 'Deluxe Kicks', '37', 'Negro/Plomo', 155.00, 280.00, 2, 0, 0, 2, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-117', 'Adidas Samba', 'Adidas', 'CALZADO', 'Black', '37', 'Negro/Cafe', 155.00, 280.00, 2, 0, 0, 2, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-118', 'Puma 180', 'Puma', 'CALZADO', 'Pink', '38', 'Plomo/Rosado', 155.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-119', 'Adidas Campus', 'Adidas', 'CALZADO', 'Chunky', '36', 'Blanco', 145.00, 250.00, 2, 0, 0, 2, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-120', 'Adidas Campus', 'Adidas', 'CALZADO', 'Chunky', '37', 'Blanco', 145.00, 250.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-121', 'Adidas Campus', 'Adidas', 'CALZADO', 'Chunky', '39', 'Blanco', 145.00, 250.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-122', 'Adidas Zoom X', 'Adidas', 'CALZADO', 'Invincible Run 3', '38', 'Crema', 155.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-123', 'Adidas For Low 84', 'Adidas', 'CALZADO', 'Forum', '42', 'Blanco', 155.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-124', 'Nike Air Force One', 'Nike', 'CALZADO', 'Gamuza', '42', 'Negro', 125.00, 250.00, 2, 0, 0, 2, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-125', 'Vans', 'Vans', 'CALZADO', 'Hyland Black', '36', 'Negro', 125.00, 250.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-126', 'Jordan Retro 4', 'Jordan', 'CALZADO', 'Caña Alta', '41', 'Celeste', 125.00, 250.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-127', 'Nike Air Force One', 'Nike', 'CALZADO', 'Lifestyle', '36', 'Blanco/Verde', 145.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-128', 'Nike Air Force One', 'Nike', 'CALZADO', 'Lifestyle', '38', 'Blanco/Verde', 145.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-129', 'Puma Karmen Rebelle', 'Puma', 'CALZADO', 'Smash Platform', '37', 'Blanco', 155.00, 280.00, 1, 0, 1, 0, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-130', 'Puma Karmen Rebelle', 'Puma', 'CALZADO', 'Smash Platform', '38', 'Blanco', 155.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-131', 'Nike Air Force One', 'Nike', 'CALZADO', 'Lifestyle', '43', 'Blanco/Guindo', 145.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-132', 'Nike Jordan Air Low', 'Nike', 'CALZADO', 'Lifestyle', '36', 'Blanco/Guindo', 145.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-133', 'Nike Air Force One', 'Nike', 'CALZADO', 'Lifestyle', '43', 'Blanco/Plomo', 125.00, 150.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-134', 'Adidas Monky House', 'Adidas', 'CALZADO', 'Forum', '37', 'Rosada/Celeste', 125.00, 180.00, 2, 0, 0, 2, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-135', 'Adidas Monky House', 'Adidas', 'CALZADO', 'Forum', '39', 'Rosada/Celeste', 125.00, 180.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-136', 'Nike Air Force One', 'Nike', 'CALZADO', 'Medalla', '35', 'Beige/Verde', 145.00, 280.00, 1, 0, 1, 0, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-137', 'Nike Air Force One', 'Nike', 'CALZADO', 'Medalla', '36', 'Beige/Verde', 145.00, 280.00, 2, 0, 0, 2, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-138', 'Nike Air Force One', 'Nike', 'CALZADO', 'Medalla', '37', 'Beige/Verde', 145.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-139', 'Nike Air Force One', 'Nike', 'CALZADO', 'Medalla', '38', 'Beige/Verde', 145.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-140', 'Nike Air Force One', 'Nike', 'CALZADO', 'Medalla', '39', 'Beige/Verde', 145.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-141', 'Nike Air Force One', 'Nike', 'CALZADO', 'Corazon Rosado', '34', 'Negro/Rosado', 150.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-142', 'Nike Air Force One', 'Nike', 'CALZADO', 'Corazon Rosado', '35', 'Negro/Rosado', 150.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-143', 'Nike Air Force One', 'Nike', 'CALZADO', 'Corazon Rosado', '36', 'Negro/Rosado', 150.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-144', 'Nike Air Force One', 'Nike', 'CALZADO', 'Corazon Rosado', '38', 'Negro/Rosado', 150.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-145', 'Vans', 'Vans', 'CALZADO', 'Off The Wall', '38', 'Negro/Blanco', 169.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-146', 'Vans', 'Vans', 'CALZADO', 'Off The Wall', '39', 'Negro/Blanco', 169.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-147', 'Vans', 'Vans', 'CALZADO', 'Off The Wall', '40', 'Negro/Blanco', 169.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-148', 'Vans', 'Vans', 'CALZADO', 'Off The Wall', '41', 'Negro/Blanco', 169.00, 280.00, 2, 0, 0, 2, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'P-149', 'Vans', 'Vans', 'CALZADO', 'Off The Wall', '42', 'Negro/Blanco', 169.00, 280.00, 1, 0, 0, 1, 1, true, NOW(), NOW())
ON CONFLICT (codigo_producto) DO UPDATE SET
  nombre_producto = EXCLUDED.nombre_producto,
  marca = EXCLUDED.marca,
  tipo_producto = EXCLUDED.tipo_producto,
  precio_compra = EXCLUDED.precio_compra,
  precio_venta = EXCLUDED.precio_venta;

-- 2. GASTOS EXTRA DE CAJA CHICA
INSERT INTO gastos_caja_chica (id, fecha_gasto, nombre_empleado, concepto_motivo, monto, forma_pago, autorizado_por, creado_en)
SELECT gen_random_uuid(), '2026-06-06', 'Esther Belen', 'compra de pan', 10.00, 'Efectivo', 'Gerente Tienda', NOW()
WHERE NOT EXISTS (SELECT 1 FROM gastos_caja_chica WHERE fecha_gasto = '2026-06-06' AND concepto_motivo = 'compra de pan' AND monto = 10.00);

INSERT INTO gastos_caja_chica (id, fecha_gasto, nombre_empleado, concepto_motivo, monto, forma_pago, autorizado_por, creado_en)
SELECT gen_random_uuid(), '2026-06-06', 'Esther Belen', 'Pasajes de Transporte', 10.00, 'Efectivo', 'Gerente Tienda', NOW()
WHERE NOT EXISTS (SELECT 1 FROM gastos_caja_chica WHERE fecha_gasto = '2026-06-06' AND concepto_motivo = 'Pasajes de Transporte' AND monto = 10.00);

INSERT INTO gastos_caja_chica (id, fecha_gasto, nombre_empleado, concepto_motivo, monto, forma_pago, autorizado_por, creado_en)
SELECT gen_random_uuid(), '2026-06-06', 'Junior Conde', 'almuerzo 2 personas', 30.00, 'Transferencia', 'Gerente Tienda', NOW()
WHERE NOT EXISTS (SELECT 1 FROM gastos_caja_chica WHERE fecha_gasto = '2026-06-06' AND concepto_motivo = 'almuerzo 2 personas' AND monto = 30.00);

INSERT INTO gastos_caja_chica (id, fecha_gasto, nombre_empleado, concepto_motivo, monto, forma_pago, autorizado_por, creado_en)
SELECT gen_random_uuid(), '2026-06-06', 'Junior Conde', 'Detergente para manos', 21.00, 'Transferencia', 'Gerente Tienda', NOW()
WHERE NOT EXISTS (SELECT 1 FROM gastos_caja_chica WHERE fecha_gasto = '2026-06-06' AND concepto_motivo = 'Detergente para manos' AND monto = 21.00);

INSERT INTO gastos_caja_chica (id, fecha_gasto, nombre_empleado, concepto_motivo, monto, forma_pago, autorizado_por, creado_en)
SELECT gen_random_uuid(), '2026-06-06', 'Junior Conde', 'Ola Lavaplatos', 15.00, 'Transferencia', 'Gerente Tienda', NOW()
WHERE NOT EXISTS (SELECT 1 FROM gastos_caja_chica WHERE fecha_gasto = '2026-06-06' AND concepto_motivo = 'Ola Lavaplatos' AND monto = 15.00);

-- 3. CLIENTES IDENTIFICADOS
INSERT INTO clientes (id, nombre_completo, total_compras, monto_total_comprado, fecha_primera_compra, fecha_ultima_compra, activo, creado_en, actualizado_en)
SELECT gen_random_uuid(), 'Jesica Velasquez', 1, 280.00, '2026-06-06', '2026-06-06', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nombre_completo = 'Jesica Velasquez');

INSERT INTO clientes (id, nombre_completo, total_compras, monto_total_comprado, fecha_primera_compra, fecha_ultima_compra, activo, creado_en, actualizado_en)
SELECT gen_random_uuid(), 'Juan Perez', 1, 270.00, '2026-07-07', '2026-07-07', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nombre_completo = 'Juan Perez');

INSERT INTO clientes (id, nombre_completo, total_compras, monto_total_comprado, fecha_primera_compra, fecha_ultima_compra, activo, creado_en, actualizado_en)
SELECT gen_random_uuid(), 'Gabriella Vaca', 1, 280.00, '2026-07-09', '2026-07-09', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nombre_completo = 'Gabriella Vaca');

INSERT INTO clientes (id, nombre_completo, total_compras, monto_total_comprado, fecha_primera_compra, fecha_ultima_compra, activo, creado_en, actualizado_en)
SELECT gen_random_uuid(), 'Elizabeth Soria', 1, 280.00, '2026-07-11', '2026-07-11', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nombre_completo = 'Elizabeth Soria');

INSERT INTO clientes (id, nombre_completo, total_compras, monto_total_comprado, fecha_primera_compra, fecha_ultima_compra, activo, creado_en, actualizado_en)
SELECT gen_random_uuid(), 'Manuel Patzi', 1, 280.00, '2026-07-11', '2026-07-11', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nombre_completo = 'Manuel Patzi');

INSERT INTO clientes (id, nombre_completo, total_compras, monto_total_comprado, fecha_primera_compra, fecha_ultima_compra, activo, creado_en, actualizado_en)
SELECT gen_random_uuid(), 'Alejandro Gomez', 1, 350.00, '2026-07-15', '2026-07-15', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nombre_completo = 'Alejandro Gomez');

INSERT INTO clientes (id, nombre_completo, total_compras, monto_total_comprado, fecha_primera_compra, fecha_ultima_compra, activo, creado_en, actualizado_en)
SELECT gen_random_uuid(), 'Maritza Choque', 1, 280.00, '2026-07-18', '2026-07-18', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nombre_completo = 'Maritza Choque');

INSERT INTO clientes (id, nombre_completo, total_compras, monto_total_comprado, fecha_primera_compra, fecha_ultima_compra, activo, creado_en, actualizado_en)
SELECT gen_random_uuid(), 'Julio Rodriguez', 1, 280.00, '2026-07-20', '2026-07-20', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nombre_completo = 'Julio Rodriguez');

INSERT INTO clientes (id, nombre_completo, total_compras, monto_total_comprado, fecha_primera_compra, fecha_ultima_compra, activo, creado_en, actualizado_en)
SELECT gen_random_uuid(), 'Marisol Cortez', 1, 275.00, '2026-07-21', '2026-07-21', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nombre_completo = 'Marisol Cortez');

INSERT INTO clientes (id, nombre_completo, total_compras, monto_total_comprado, fecha_primera_compra, fecha_ultima_compra, activo, creado_en, actualizado_en)
SELECT gen_random_uuid(), 'Roberto Miranda', 1, 260.00, '2026-07-21', '2026-07-21', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nombre_completo = 'Roberto Miranda');

INSERT INTO clientes (id, nombre_completo, total_compras, monto_total_comprado, fecha_primera_compra, fecha_ultima_compra, activo, creado_en, actualizado_en)
SELECT gen_random_uuid(), 'Juliana Duran', 1, 250.00, '2026-07-21', '2026-07-21', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nombre_completo = 'Juliana Duran');

INSERT INTO clientes (id, nombre_completo, total_compras, monto_total_comprado, fecha_primera_compra, fecha_ultima_compra, activo, creado_en, actualizado_en)
SELECT gen_random_uuid(), 'Romina Flores', 1, 280.00, '2026-07-21', '2026-07-21', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nombre_completo = 'Romina Flores');

INSERT INTO clientes (id, nombre_completo, total_compras, monto_total_comprado, fecha_primera_compra, fecha_ultima_compra, activo, creado_en, actualizado_en)
SELECT gen_random_uuid(), 'Maria Flores', 1, 260.00, '2026-07-23', '2026-07-23', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nombre_completo = 'Maria Flores');

INSERT INTO clientes (id, nombre_completo, total_compras, monto_total_comprado, fecha_primera_compra, fecha_ultima_compra, activo, creado_en, actualizado_en)
SELECT gen_random_uuid(), 'Juan Chuquimia', 1, 260.00, '2026-07-23', '2026-07-23', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nombre_completo = 'Juan Chuquimia');

INSERT INTO clientes (id, nombre_completo, total_compras, monto_total_comprado, fecha_primera_compra, fecha_ultima_compra, activo, creado_en, actualizado_en)
SELECT gen_random_uuid(), 'Javier Barron Chavar', 1, 350.00, '2026-07-25', '2026-07-25', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nombre_completo = 'Javier Barron Chavar');

INSERT INTO clientes (id, nombre_completo, total_compras, monto_total_comprado, fecha_primera_compra, fecha_ultima_compra, activo, creado_en, actualizado_en)
SELECT gen_random_uuid(), 'Alex Soria', 1, 260.00, '2026-07-28', '2026-07-28', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nombre_completo = 'Alex Soria');

INSERT INTO clientes (id, nombre_completo, total_compras, monto_total_comprado, fecha_primera_compra, fecha_ultima_compra, activo, creado_en, actualizado_en)
SELECT gen_random_uuid(), 'Marisol Herrera', 1, 280.00, '2026-09-16', '2026-09-16', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nombre_completo = 'Marisol Herrera');

INSERT INTO clientes (id, nombre_completo, total_compras, monto_total_comprado, fecha_primera_compra, fecha_ultima_compra, activo, creado_en, actualizado_en)
SELECT gen_random_uuid(), 'Augusto Lopez', 1, 350.00, '2026-09-16', '2026-09-16', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nombre_completo = 'Augusto Lopez');

INSERT INTO clientes (id, nombre_completo, total_compras, monto_total_comprado, fecha_primera_compra, fecha_ultima_compra, activo, creado_en, actualizado_en)
SELECT gen_random_uuid(), 'Carmen Villanueva', 1, 280.00, '2026-09-16', '2026-09-16', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nombre_completo = 'Carmen Villanueva');

INSERT INTO clientes (id, nombre_completo, total_compras, monto_total_comprado, fecha_primera_compra, fecha_ultima_compra, activo, creado_en, actualizado_en)
SELECT gen_random_uuid(), 'Luis Ortube', 1, 560.00, '2026-09-16', '2026-09-16', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nombre_completo = 'Luis Ortube');

-- 4. VENTAS HISTÓRICAS Y DETALLES (21 TRANSACCIONES)
DO $$
DECLARE
  id_venta uuid := gen_random_uuid();
  id_calzado uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ventas WHERE numero_ticket = 'TCK-202606-0001') THEN
    SELECT id INTO id_calzado FROM calzados WHERE codigo_producto = 'P-25' LIMIT 1;
    INSERT INTO ventas (id, numero_ticket, fecha_venta, nombre_cliente, forma_pago, subtotal, descuento, motivo_descuento, total_venta, monto_recibido, cambio, notas, creado_en)
    VALUES (id_venta, 'TCK-202606-0001', '2026-06-06', 'Jesica Velasquez', 'Efectivo', 280.00, 0.00, NULL, 280.00, 280.00, 0.00, '', NOW());
    IF id_calzado IS NOT NULL THEN
      INSERT INTO detalles_venta (id, venta_id, calzado_id, codigo_producto, nombre_producto, talla, cantidad, precio_unitario, costo_unitario, descuento, total)
      VALUES (gen_random_uuid(), id_venta, id_calzado, 'P-25', (SELECT nombre_producto FROM calzados WHERE id = id_calzado), '40', 1, 280.00, 145.00, 0.00, 280.00);
    END IF;
  END IF;
END $$;

DO $$
DECLARE
  id_venta uuid := gen_random_uuid();
  id_calzado uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ventas WHERE numero_ticket = 'TCK-202607-0002') THEN
    SELECT id INTO id_calzado FROM calzados WHERE codigo_producto = 'P-44' LIMIT 1;
    INSERT INTO ventas (id, numero_ticket, fecha_venta, nombre_cliente, forma_pago, subtotal, descuento, motivo_descuento, total_venta, monto_recibido, cambio, notas, creado_en)
    VALUES (id_venta, 'TCK-202607-0002', '2026-07-07', 'Juan Perez', 'Efectivo', 270.00, 0.00, NULL, 270.00, 270.00, 0.00, '', NOW());
    IF id_calzado IS NOT NULL THEN
      INSERT INTO detalles_venta (id, venta_id, calzado_id, codigo_producto, nombre_producto, talla, cantidad, precio_unitario, costo_unitario, descuento, total)
      VALUES (gen_random_uuid(), id_venta, id_calzado, 'P-44', (SELECT nombre_producto FROM calzados WHERE id = id_calzado), '38', 1, 270.00, 155.00, 0.00, 270.00);
    END IF;
  END IF;
END $$;

DO $$
DECLARE
  id_venta uuid := gen_random_uuid();
  id_calzado uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ventas WHERE numero_ticket = 'TCK-202607-0003') THEN
    SELECT id INTO id_calzado FROM calzados WHERE codigo_producto = 'P-129' LIMIT 1;
    INSERT INTO ventas (id, numero_ticket, fecha_venta, nombre_cliente, forma_pago, subtotal, descuento, motivo_descuento, total_venta, monto_recibido, cambio, notas, creado_en)
    VALUES (id_venta, 'TCK-202607-0003', '2026-07-09', 'Gabriella Vaca', 'Efectivo', 280.00, 0.00, NULL, 280.00, 280.00, 0.00, '', NOW());
    IF id_calzado IS NOT NULL THEN
      INSERT INTO detalles_venta (id, venta_id, calzado_id, codigo_producto, nombre_producto, talla, cantidad, precio_unitario, costo_unitario, descuento, total)
      VALUES (gen_random_uuid(), id_venta, id_calzado, 'P-129', (SELECT nombre_producto FROM calzados WHERE id = id_calzado), '37', 1, 280.00, 155.00, 0.00, 280.00);
    END IF;
  END IF;
END $$;

DO $$
DECLARE
  id_venta uuid := gen_random_uuid();
  id_calzado uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ventas WHERE numero_ticket = 'TCK-202607-0004') THEN
    SELECT id INTO id_calzado FROM calzados WHERE codigo_producto = 'P-1' LIMIT 1;
    INSERT INTO ventas (id, numero_ticket, fecha_venta, nombre_cliente, forma_pago, subtotal, descuento, motivo_descuento, total_venta, monto_recibido, cambio, notas, creado_en)
    VALUES (id_venta, 'TCK-202607-0004', '2026-07-11', 'Elizabeth Soria', 'QR', 280.00, 0.00, NULL, 280.00, 280.00, 0.00, '', NOW());
    IF id_calzado IS NOT NULL THEN
      INSERT INTO detalles_venta (id, venta_id, calzado_id, codigo_producto, nombre_producto, talla, cantidad, precio_unitario, costo_unitario, descuento, total)
      VALUES (gen_random_uuid(), id_venta, id_calzado, 'P-1', (SELECT nombre_producto FROM calzados WHERE id = id_calzado), '34', 1, 280.00, 150.00, 0.00, 280.00);
    END IF;
  END IF;
END $$;

DO $$
DECLARE
  id_venta uuid := gen_random_uuid();
  id_calzado uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ventas WHERE numero_ticket = 'TCK-202607-0005') THEN
    SELECT id INTO id_calzado FROM calzados WHERE codigo_producto = 'P-92' LIMIT 1;
    INSERT INTO ventas (id, numero_ticket, fecha_venta, nombre_cliente, forma_pago, subtotal, descuento, motivo_descuento, total_venta, monto_recibido, cambio, notas, creado_en)
    VALUES (id_venta, 'TCK-202607-0005', '2026-07-11', 'Manuel Patzi', 'QR', 280.00, 0.00, NULL, 280.00, 280.00, 0.00, '', NOW());
    IF id_calzado IS NOT NULL THEN
      INSERT INTO detalles_venta (id, venta_id, calzado_id, codigo_producto, nombre_producto, talla, cantidad, precio_unitario, costo_unitario, descuento, total)
      VALUES (gen_random_uuid(), id_venta, id_calzado, 'P-92', (SELECT nombre_producto FROM calzados WHERE id = id_calzado), '39', 1, 280.00, 150.00, 0.00, 280.00);
    END IF;
  END IF;
END $$;

DO $$
DECLARE
  id_venta uuid := gen_random_uuid();
  id_calzado uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ventas WHERE numero_ticket = 'TCK-202607-0006') THEN
    SELECT id INTO id_calzado FROM calzados WHERE codigo_producto = 'P-8' LIMIT 1;
    INSERT INTO ventas (id, numero_ticket, fecha_venta, nombre_cliente, forma_pago, subtotal, descuento, motivo_descuento, total_venta, monto_recibido, cambio, notas, creado_en)
    VALUES (id_venta, 'TCK-202607-0006', '2026-07-15', 'Alejandro Gomez', 'Efectivo', 350.00, 0.00, NULL, 350.00, 350.00, 0.00, '', NOW());
    IF id_calzado IS NOT NULL THEN
      INSERT INTO detalles_venta (id, venta_id, calzado_id, codigo_producto, nombre_producto, talla, cantidad, precio_unitario, costo_unitario, descuento, total)
      VALUES (gen_random_uuid(), id_venta, id_calzado, 'P-8', (SELECT nombre_producto FROM calzados WHERE id = id_calzado), '34', 1, 350.00, 187.00, 0.00, 350.00);
    END IF;
  END IF;
END $$;

DO $$
DECLARE
  id_venta uuid := gen_random_uuid();
  id_calzado uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ventas WHERE numero_ticket = 'TCK-202607-0007') THEN
    SELECT id INTO id_calzado FROM calzados WHERE codigo_producto = 'P-56' LIMIT 1;
    INSERT INTO ventas (id, numero_ticket, fecha_venta, nombre_cliente, forma_pago, subtotal, descuento, motivo_descuento, total_venta, monto_recibido, cambio, notas, creado_en)
    VALUES (id_venta, 'TCK-202607-0007', '2026-07-18', 'Maritza Choque', 'QR', 280.00, 0.00, NULL, 280.00, 280.00, 0.00, '', NOW());
    IF id_calzado IS NOT NULL THEN
      INSERT INTO detalles_venta (id, venta_id, calzado_id, codigo_producto, nombre_producto, talla, cantidad, precio_unitario, costo_unitario, descuento, total)
      VALUES (gen_random_uuid(), id_venta, id_calzado, 'P-56', (SELECT nombre_producto FROM calzados WHERE id = id_calzado), '34', 1, 280.00, 150.00, 0.00, 280.00);
    END IF;
  END IF;
END $$;

DO $$
DECLARE
  id_venta uuid := gen_random_uuid();
  id_calzado uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ventas WHERE numero_ticket = 'TCK-202607-0008') THEN
    SELECT id INTO id_calzado FROM calzados WHERE codigo_producto = 'P-136' LIMIT 1;
    INSERT INTO ventas (id, numero_ticket, fecha_venta, nombre_cliente, forma_pago, subtotal, descuento, motivo_descuento, total_venta, monto_recibido, cambio, notas, creado_en)
    VALUES (id_venta, 'TCK-202607-0008', '2026-07-20', 'Julio Rodriguez', 'QR', 280.00, 0.00, NULL, 280.00, 280.00, 0.00, '', NOW());
    IF id_calzado IS NOT NULL THEN
      INSERT INTO detalles_venta (id, venta_id, calzado_id, codigo_producto, nombre_producto, talla, cantidad, precio_unitario, costo_unitario, descuento, total)
      VALUES (gen_random_uuid(), id_venta, id_calzado, 'P-136', (SELECT nombre_producto FROM calzados WHERE id = id_calzado), '35', 1, 280.00, 145.00, 0.00, 280.00);
    END IF;
  END IF;
END $$;

DO $$
DECLARE
  id_venta uuid := gen_random_uuid();
  id_calzado uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ventas WHERE numero_ticket = 'TCK-202607-0009') THEN
    SELECT id INTO id_calzado FROM calzados WHERE codigo_producto = 'P-113' LIMIT 1;
    INSERT INTO ventas (id, numero_ticket, fecha_venta, nombre_cliente, forma_pago, subtotal, descuento, motivo_descuento, total_venta, monto_recibido, cambio, notas, creado_en)
    VALUES (id_venta, 'TCK-202607-0009', '2026-07-21', 'Marisol Cortez', 'Efectivo', 280.00, 5.00, 'CLIENTE_FRECUENTE', 275.00, 275.00, 0.00, 'Se desconto por ser cliente consecuente', NOW());
    IF id_calzado IS NOT NULL THEN
      INSERT INTO detalles_venta (id, venta_id, calzado_id, codigo_producto, nombre_producto, talla, cantidad, precio_unitario, costo_unitario, descuento, total)
      VALUES (gen_random_uuid(), id_venta, id_calzado, 'P-113', (SELECT nombre_producto FROM calzados WHERE id = id_calzado), '43', 1, 280.00, 150.00, 5.00, 275.00);
    END IF;
  END IF;
END $$;

DO $$
DECLARE
  id_venta uuid := gen_random_uuid();
  id_calzado uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ventas WHERE numero_ticket = 'TCK-202607-0010') THEN
    SELECT id INTO id_calzado FROM calzados WHERE codigo_producto = 'P-51' LIMIT 1;
    INSERT INTO ventas (id, numero_ticket, fecha_venta, nombre_cliente, forma_pago, subtotal, descuento, motivo_descuento, total_venta, monto_recibido, cambio, notas, creado_en)
    VALUES (id_venta, 'TCK-202607-0010', '2026-07-21', 'Roberto Miranda', 'Efectivo', 280.00, 20.00, 'CLIENTE_FRECUENTE', 260.00, 260.00, 0.00, 'Se desconto por ser cliente consecuente', NOW());
    IF id_calzado IS NOT NULL THEN
      INSERT INTO detalles_venta (id, venta_id, calzado_id, codigo_producto, nombre_producto, talla, cantidad, precio_unitario, costo_unitario, descuento, total)
      VALUES (gen_random_uuid(), id_venta, id_calzado, 'P-51', (SELECT nombre_producto FROM calzados WHERE id = id_calzado), '34', 1, 280.00, 150.00, 20.00, 260.00);
    END IF;
  END IF;
END $$;

DO $$
DECLARE
  id_venta uuid := gen_random_uuid();
  id_calzado uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ventas WHERE numero_ticket = 'TCK-202607-0011') THEN
    SELECT id INTO id_calzado FROM calzados WHERE codigo_producto = 'P-52' LIMIT 1;
    INSERT INTO ventas (id, numero_ticket, fecha_venta, nombre_cliente, forma_pago, subtotal, descuento, motivo_descuento, total_venta, monto_recibido, cambio, notas, creado_en)
    VALUES (id_venta, 'TCK-202607-0011', '2026-07-21', 'Juliana Duran', 'Efectivo', 280.00, 30.00, 'CLIENTE_FRECUENTE', 250.00, 250.00, 0.00, 'Se desconto por ser cliente consecuente', NOW());
    IF id_calzado IS NOT NULL THEN
      INSERT INTO detalles_venta (id, venta_id, calzado_id, codigo_producto, nombre_producto, talla, cantidad, precio_unitario, costo_unitario, descuento, total)
      VALUES (gen_random_uuid(), id_venta, id_calzado, 'P-52', (SELECT nombre_producto FROM calzados WHERE id = id_calzado), '35', 1, 280.00, 150.00, 30.00, 250.00);
    END IF;
  END IF;
END $$;

DO $$
DECLARE
  id_venta uuid := gen_random_uuid();
  id_calzado uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ventas WHERE numero_ticket = 'TCK-202607-0012') THEN
    SELECT id INTO id_calzado FROM calzados WHERE codigo_producto = 'P-60' LIMIT 1;
    INSERT INTO ventas (id, numero_ticket, fecha_venta, nombre_cliente, forma_pago, subtotal, descuento, motivo_descuento, total_venta, monto_recibido, cambio, notas, creado_en)
    VALUES (id_venta, 'TCK-202607-0012', '2026-07-21', 'Romina Flores', 'Efectivo', 280.00, 0.00, NULL, 280.00, 280.00, 0.00, '', NOW());
    IF id_calzado IS NOT NULL THEN
      INSERT INTO detalles_venta (id, venta_id, calzado_id, codigo_producto, nombre_producto, talla, cantidad, precio_unitario, costo_unitario, descuento, total)
      VALUES (gen_random_uuid(), id_venta, id_calzado, 'P-60', (SELECT nombre_producto FROM calzados WHERE id = id_calzado), '34', 1, 280.00, 150.00, 0.00, 280.00);
    END IF;
  END IF;
END $$;

DO $$
DECLARE
  id_venta uuid := gen_random_uuid();
  id_calzado uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ventas WHERE numero_ticket = 'TCK-202607-0013') THEN
    SELECT id INTO id_calzado FROM calzados WHERE codigo_producto = 'P-5' LIMIT 1;
    INSERT INTO ventas (id, numero_ticket, fecha_venta, nombre_cliente, forma_pago, subtotal, descuento, motivo_descuento, total_venta, monto_recibido, cambio, notas, creado_en)
    VALUES (id_venta, 'TCK-202607-0013', '2026-07-23', 'Maria Flores', 'QR', 280.00, 20.00, 'CLIENTE_FRECUENTE', 260.00, 260.00, 0.00, 'Se desconto por ser cliente frecuente', NOW());
    IF id_calzado IS NOT NULL THEN
      INSERT INTO detalles_venta (id, venta_id, calzado_id, codigo_producto, nombre_producto, talla, cantidad, precio_unitario, costo_unitario, descuento, total)
      VALUES (gen_random_uuid(), id_venta, id_calzado, 'P-5', (SELECT nombre_producto FROM calzados WHERE id = id_calzado), '38', 1, 280.00, 150.00, 20.00, 260.00);
    END IF;
  END IF;
END $$;

DO $$
DECLARE
  id_venta uuid := gen_random_uuid();
  id_calzado uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ventas WHERE numero_ticket = 'TCK-202607-0014') THEN
    SELECT id INTO id_calzado FROM calzados WHERE codigo_producto = 'P-73' LIMIT 1;
    INSERT INTO ventas (id, numero_ticket, fecha_venta, nombre_cliente, forma_pago, subtotal, descuento, motivo_descuento, total_venta, monto_recibido, cambio, notas, creado_en)
    VALUES (id_venta, 'TCK-202607-0014', '2026-07-23', 'Juan Chuquimia', 'Efectivo', 280.00, 20.00, 'CLIENTE_FRECUENTE', 260.00, 260.00, 0.00, 'Se desconto por ser cliente frecuente', NOW());
    IF id_calzado IS NOT NULL THEN
      INSERT INTO detalles_venta (id, venta_id, calzado_id, codigo_producto, nombre_producto, talla, cantidad, precio_unitario, costo_unitario, descuento, total)
      VALUES (gen_random_uuid(), id_venta, id_calzado, 'P-73', (SELECT nombre_producto FROM calzados WHERE id = id_calzado), '35', 1, 280.00, 155.00, 20.00, 260.00);
    END IF;
  END IF;
END $$;

DO $$
DECLARE
  id_venta uuid := gen_random_uuid();
  id_calzado uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ventas WHERE numero_ticket = 'TCK-202607-0015') THEN
    SELECT id INTO id_calzado FROM calzados WHERE codigo_producto = 'P-17' LIMIT 1;
    INSERT INTO ventas (id, numero_ticket, fecha_venta, nombre_cliente, forma_pago, subtotal, descuento, motivo_descuento, total_venta, monto_recibido, cambio, notas, creado_en)
    VALUES (id_venta, 'TCK-202607-0015', '2026-07-25', 'Javier Barron Chavar', 'QR', 350.00, 0.00, NULL, 350.00, 350.00, 0.00, '', NOW());
    IF id_calzado IS NOT NULL THEN
      INSERT INTO detalles_venta (id, venta_id, calzado_id, codigo_producto, nombre_producto, talla, cantidad, precio_unitario, costo_unitario, descuento, total)
      VALUES (gen_random_uuid(), id_venta, id_calzado, 'P-17', (SELECT nombre_producto FROM calzados WHERE id = id_calzado), '43', 1, 350.00, 187.00, 0.00, 350.00);
    END IF;
  END IF;
END $$;

DO $$
DECLARE
  id_venta uuid := gen_random_uuid();
  id_calzado uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ventas WHERE numero_ticket = 'TCK-202607-0016') THEN
    SELECT id INTO id_calzado FROM calzados WHERE codigo_producto = 'P-54' LIMIT 1;
    INSERT INTO ventas (id, numero_ticket, fecha_venta, nombre_cliente, forma_pago, subtotal, descuento, motivo_descuento, total_venta, monto_recibido, cambio, notas, creado_en)
    VALUES (id_venta, 'TCK-202607-0016', '2026-07-28', 'Alex Soria', 'Efectivo', 280.00, 20.00, 'CLIENTE_FRECUENTE', 260.00, 260.00, 0.00, 'Se desconto por ser cliento antiguo', NOW());
    IF id_calzado IS NOT NULL THEN
      INSERT INTO detalles_venta (id, venta_id, calzado_id, codigo_producto, nombre_producto, talla, cantidad, precio_unitario, costo_unitario, descuento, total)
      VALUES (gen_random_uuid(), id_venta, id_calzado, 'P-54', (SELECT nombre_producto FROM calzados WHERE id = id_calzado), '37', 1, 280.00, 150.00, 20.00, 260.00);
    END IF;
  END IF;
END $$;

DO $$
DECLARE
  id_venta uuid := gen_random_uuid();
  id_calzado uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ventas WHERE numero_ticket = 'TCK-202609-0017') THEN
    SELECT id INTO id_calzado FROM calzados WHERE codigo_producto = 'P-57' LIMIT 1;
    INSERT INTO ventas (id, numero_ticket, fecha_venta, nombre_cliente, forma_pago, subtotal, descuento, motivo_descuento, total_venta, monto_recibido, cambio, notas, creado_en)
    VALUES (id_venta, 'TCK-202609-0017', '2026-09-16', 'Marisol Herrera', 'Efectivo', 280.00, 0.00, NULL, 280.00, 280.00, 0.00, '', NOW());
    IF id_calzado IS NOT NULL THEN
      INSERT INTO detalles_venta (id, venta_id, calzado_id, codigo_producto, nombre_producto, talla, cantidad, precio_unitario, costo_unitario, descuento, total)
      VALUES (gen_random_uuid(), id_venta, id_calzado, 'P-57', (SELECT nombre_producto FROM calzados WHERE id = id_calzado), '35', 1, 280.00, 150.00, 0.00, 280.00);
    END IF;
  END IF;
END $$;

DO $$
DECLARE
  id_venta uuid := gen_random_uuid();
  id_calzado uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ventas WHERE numero_ticket = 'TCK-202609-0018') THEN
    SELECT id INTO id_calzado FROM calzados WHERE codigo_producto = 'P-9' LIMIT 1;
    INSERT INTO ventas (id, numero_ticket, fecha_venta, nombre_cliente, forma_pago, subtotal, descuento, motivo_descuento, total_venta, monto_recibido, cambio, notas, creado_en)
    VALUES (id_venta, 'TCK-202609-0018', '2026-09-16', 'Augusto Lopez', 'QR', 350.00, 0.00, NULL, 350.00, 350.00, 0.00, '', NOW());
    IF id_calzado IS NOT NULL THEN
      INSERT INTO detalles_venta (id, venta_id, calzado_id, codigo_producto, nombre_producto, talla, cantidad, precio_unitario, costo_unitario, descuento, total)
      VALUES (gen_random_uuid(), id_venta, id_calzado, 'P-9', (SELECT nombre_producto FROM calzados WHERE id = id_calzado), '35', 1, 350.00, 187.00, 0.00, 350.00);
    END IF;
  END IF;
END $$;

DO $$
DECLARE
  id_venta uuid := gen_random_uuid();
  id_calzado uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ventas WHERE numero_ticket = 'TCK-202609-0019') THEN
    SELECT id INTO id_calzado FROM calzados WHERE codigo_producto = 'P-60' LIMIT 1;
    INSERT INTO ventas (id, numero_ticket, fecha_venta, nombre_cliente, forma_pago, subtotal, descuento, motivo_descuento, total_venta, monto_recibido, cambio, notas, creado_en)
    VALUES (id_venta, 'TCK-202609-0019', '2026-09-16', 'Carmen Villanueva', 'QR', 280.00, 0.00, NULL, 280.00, 280.00, 0.00, '', NOW());
    IF id_calzado IS NOT NULL THEN
      INSERT INTO detalles_venta (id, venta_id, calzado_id, codigo_producto, nombre_producto, talla, cantidad, precio_unitario, costo_unitario, descuento, total)
      VALUES (gen_random_uuid(), id_venta, id_calzado, 'P-60', (SELECT nombre_producto FROM calzados WHERE id = id_calzado), '34', 1, 280.00, 150.00, 0.00, 280.00);
    END IF;
  END IF;
END $$;

DO $$
DECLARE
  id_venta uuid := gen_random_uuid();
  id_calzado uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ventas WHERE numero_ticket = 'TCK-202609-0020') THEN
    SELECT id INTO id_calzado FROM calzados WHERE codigo_producto = 'P-68' LIMIT 1;
    INSERT INTO ventas (id, numero_ticket, fecha_venta, nombre_cliente, forma_pago, subtotal, descuento, motivo_descuento, total_venta, monto_recibido, cambio, notas, creado_en)
    VALUES (id_venta, 'TCK-202609-0020', '2026-09-16', 'Luis Ortube', 'QR', 560.00, 0.00, NULL, 560.00, 560.00, 0.00, '', NOW());
    IF id_calzado IS NOT NULL THEN
      INSERT INTO detalles_venta (id, venta_id, calzado_id, codigo_producto, nombre_producto, talla, cantidad, precio_unitario, costo_unitario, descuento, total)
      VALUES (gen_random_uuid(), id_venta, id_calzado, 'P-68', (SELECT nombre_producto FROM calzados WHERE id = id_calzado), '35', 2, 280.00, 150.00, 0.00, 560.00);
    END IF;
  END IF;
END $$;

-- 5. SECUENCIA DE TICKETS
CREATE SEQUENCE IF NOT EXISTS secuencia_ticket START 1;
SELECT setval('secuencia_ticket', GREATEST((SELECT COUNT(*)::int FROM ventas), 1), true);

