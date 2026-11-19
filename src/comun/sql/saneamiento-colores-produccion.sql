-- =============================================================================
-- Saneamiento y unificación segura de colores en producción (PostgreSQL)
-- Tarea: [BKL-04] - IDEMPOTENTE
--
-- Contenido:
--   1. Reparación de hex grises erróneos (#64748B) en `catalogo_colores` para
--      colores reales que no son grises: Bronce, Guindo, Ladrillo, y
--      verificación defensiva de Cafe claro (#A67B5B si estuviera gris/vacío).
--      No modifica Plomo, Estándar, Amarillo, Amarillo Ocre, Caramelo ni Cuero.
--   2. Unificación segura de duplicados (Cafe -> Café, Marrón -> Café,
--      Rosada -> Rosado) actualizando `calzados_colores`, `calzados.color_id`
--      y tokens exactos en `calzados.color` (respetando combinaciones con `/`
--      sin afectar `Cafe claro`), y eliminando el duplicado de `catalogo_colores`
--      tras verificar 0 referencias.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Reparar hex grises erróneos (#64748B) en catalogo_colores
-- -----------------------------------------------------------------------------

-- Bronce -> #CD7F32
UPDATE catalogo_colores
SET hex_primario = '#CD7F32',
    colores_hex = '["#CD7F32"]'::jsonb
WHERE LOWER(BTRIM(nombre)) = 'bronce'
  AND (
    hex_primario IS NULL
    OR BTRIM(hex_primario) = ''
    OR UPPER(BTRIM(hex_primario)) = '#64748B'
  );

-- Guindo -> #800020
UPDATE catalogo_colores
SET hex_primario = '#800020',
    colores_hex = '["#800020"]'::jsonb
WHERE LOWER(BTRIM(nombre)) = 'guindo'
  AND (
    hex_primario IS NULL
    OR BTRIM(hex_primario) = ''
    OR UPPER(BTRIM(hex_primario)) = '#64748B'
  );

-- Ladrillo -> #B22222
UPDATE catalogo_colores
SET hex_primario = '#B22222',
    colores_hex = '["#B22222"]'::jsonb
WHERE LOWER(BTRIM(nombre)) = 'ladrillo'
  AND (
    hex_primario IS NULL
    OR BTRIM(hex_primario) = ''
    OR UPPER(BTRIM(hex_primario)) = '#64748B'
  );

-- Cafe claro -> #A67B5B (solo si estuviera gris o vacío)
UPDATE catalogo_colores
SET hex_primario = '#A67B5B',
    colores_hex = '["#A67B5B"]'::jsonb
WHERE LOWER(BTRIM(nombre)) = 'cafe claro'
  AND (
    hex_primario IS NULL
    OR BTRIM(hex_primario) = ''
    OR UPPER(BTRIM(hex_primario)) = '#64748B'
  );

-- Asegurar que Café (#4E342E) y Rosado (#F472B6) tengan su hex oficial activo
UPDATE catalogo_colores
SET hex_primario = '#4E342E',
    colores_hex = '["#4E342E"]'::jsonb,
    activo = true,
    eliminado_en = NULL
WHERE BTRIM(nombre) = 'Café'
  AND (
    hex_primario IS NULL
    OR BTRIM(hex_primario) = ''
    OR UPPER(BTRIM(hex_primario)) = '#64748B'
    OR activo = false
    OR eliminado_en IS NOT NULL
  );

UPDATE catalogo_colores
SET hex_primario = '#F472B6',
    colores_hex = '["#F472B6"]'::jsonb,
    activo = true,
    eliminado_en = NULL
WHERE BTRIM(nombre) = 'Rosado'
  AND (
    hex_primario IS NULL
    OR BTRIM(hex_primario) = ''
    OR UPPER(BTRIM(hex_primario)) = '#64748B'
    OR activo = false
    OR eliminado_en IS NOT NULL
  );

-- -----------------------------------------------------------------------------
-- 2. Unificar duplicados exactos / confusos sin romper FKs
--    Pares:
--      - Cafe   -> Café
--      - Marrón -> Café
--      - Rosada -> Rosado
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_par RECORD;
  v_origen_id UUID;
  v_destino_id UUID;
  v_refs_calzados BIGINT;
  v_refs_pivote BIGINT;
BEGIN
  FOR v_par IN
    SELECT * FROM (
      VALUES
        ('Cafe',   'Café'),
        ('Marrón', 'Café'),
        ('Marron', 'Café'),
        ('Rosada', 'Rosado')
    ) AS pares(origen_nombre, destino_nombre)
  LOOP
    -- Resolver IDs buscando coincidencia exacta (sensible a tildes para distinguir Cafe vs Café)
    SELECT id INTO v_destino_id
    FROM catalogo_colores
    WHERE BTRIM(nombre) = v_par.destino_nombre
    LIMIT 1;

    SELECT id INTO v_origen_id
    FROM catalogo_colores
    WHERE BTRIM(nombre) = v_par.origen_nombre
      AND (v_destino_id IS NULL OR id <> v_destino_id)
    LIMIT 1;

    -- Si ambos existen en catalogo_colores, migrar referencias relacionales
    IF v_origen_id IS NOT NULL AND v_destino_id IS NOT NULL THEN
      -- 1a) En calzados_colores: borrar fila origen SOLO si ese mismo calzado_id ya tiene el color destino
      DELETE FROM calzados_colores cc_orig
      WHERE cc_orig.color_catalogo_id = v_origen_id
        AND EXISTS (
          SELECT 1
          FROM calzados_colores cc_dest
          WHERE cc_dest.calzado_id = cc_orig.calzado_id
            AND cc_dest.color_catalogo_id = v_destino_id
        );

      -- 1b) En calzados_colores: reasignar las filas restantes del origen al destino
      UPDATE calzados_colores
      SET color_catalogo_id = v_destino_id
      WHERE color_catalogo_id = v_origen_id;

      -- 2) En calzados: reasignar color_id del origen al destino
      UPDATE calzados
      SET color_id = v_destino_id
      WHERE color_id = v_origen_id;
    END IF;

    -- 3) En calzados.color (texto): reemplazar token exacto respetando combinaciones separadas por '/'
    --    (ej. 'Marrón/Negro' -> 'Café/Negro', 'Cafe' -> 'Café', sin alterar 'Cafe claro')
    UPDATE calzados c
    SET color = sub.nuevo_color
    FROM (
      SELECT
        c2.id,
        string_agg(
          CASE
            WHEN BTRIM(tok.val) = v_par.origen_nombre
              OR (
                LOWER(v_par.origen_nombre) IN ('marrón', 'marron', 'rosada')
                AND LOWER(BTRIM(tok.val)) = LOWER(v_par.origen_nombre)
              )
            THEN v_par.destino_nombre
            ELSE BTRIM(tok.val)
          END,
          '/' ORDER BY tok.ord
        ) AS nuevo_color
      FROM calzados c2
      CROSS JOIN LATERAL unnest(string_to_array(c2.color, '/')) WITH ORDINALITY AS tok(val, ord)
      WHERE c2.color IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM unnest(string_to_array(c2.color, '/')) AS t(v)
          WHERE BTRIM(t.v) = v_par.origen_nombre
             OR (
               LOWER(v_par.origen_nombre) IN ('marrón', 'marron', 'rosada')
               AND LOWER(BTRIM(t.v)) = LOWER(v_par.origen_nombre)
             )
        )
      GROUP BY c2.id
    ) sub
    WHERE c.id = sub.id
      AND c.color IS DISTINCT FROM sub.nuevo_color;

    -- 4) Verificar 0 referencias al origen y eliminar/desactivar el duplicado en catalogo_colores
    IF v_origen_id IS NOT NULL AND v_destino_id IS NOT NULL THEN
      SELECT COUNT(*) INTO v_refs_calzados FROM calzados WHERE color_id = v_origen_id;
      SELECT COUNT(*) INTO v_refs_pivote FROM calzados_colores WHERE color_catalogo_id = v_origen_id;

      IF v_refs_calzados = 0 AND v_refs_pivote = 0 THEN
        BEGIN
          DELETE FROM catalogo_colores WHERE id = v_origen_id;
        EXCEPTION WHEN foreign_key_violation THEN
          UPDATE catalogo_colores
          SET activo = false,
              eliminado_en = NOW()
          WHERE id = v_origen_id;
        END;
      ELSE
        RAISE EXCEPTION 'ERR-SANEAMIENTO-COLORES: Aún quedan referencias para color origen % (calzados=%, pivote=%)',
          v_par.origen_nombre, v_refs_calzados, v_refs_pivote;
      END IF;
    END IF;
  END LOOP;
END $$;

COMMIT;
