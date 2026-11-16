-- =============================================================================
-- Integridad de inventario y ventas (PostgreSQL / Supabase) - IDEMPOTENTE
-- Propietario: arq-db-supabase
--
-- Contenido:
--   1. Saneamiento NO destructivo de datos en `calzados` (no altera cantidades
--      reales de stock ni precios; solo normaliza formato).
--   2. Constraints CHECK en calzados, detalles_venta e ingresos_mercancia.
--   3. Trigger de validacion de stock por talla (SIN descuento automatico:
--      el backend NestJS ya descuenta stock dentro de su transaccion).
--   4. Vista de auditoria v_auditoria_inventario_ventas.
-- Se puede ejecutar multiples veces sin efectos adversos.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Saneamiento de datos en calzados
-- -----------------------------------------------------------------------------
UPDATE calzados SET extras_incluidos = '[]'::jsonb WHERE extras_incluidos IS NULL;
UPDATE calzados SET stock_por_talla = '{}'::jsonb WHERE stock_por_talla IS NULL;

-- Valores de stock_por_talla que sean numericos enteros pero guardados como
-- texto ("2") o con decimales nulos (2.0) se convierten a entero JSON.
-- Valores con decimales reales o no numericos NO se tocan (los rechazara el trigger).
UPDATE calzados c
SET stock_por_talla = (
  SELECT COALESCE(jsonb_object_agg(
    e.key,
    CASE
      WHEN jsonb_typeof(e.value) = 'string' AND (e.value #>> '{}') ~ '^[0-9]+$'
        THEN to_jsonb((e.value #>> '{}')::integer)
      WHEN jsonb_typeof(e.value) = 'number' AND (e.value #>> '{}') ~ '^[0-9]+\.0+$'
        THEN to_jsonb(((e.value #>> '{}')::numeric)::integer)
      ELSE e.value
    END), '{}'::jsonb)
  FROM jsonb_each(c.stock_por_talla) e
)
WHERE jsonb_typeof(c.stock_por_talla) = 'object'
  AND c.stock_por_talla <> '{}'::jsonb
  AND EXISTS (
    SELECT 1 FROM jsonb_each(c.stock_por_talla) e
    WHERE (jsonb_typeof(e.value) = 'string' AND (e.value #>> '{}') ~ '^[0-9]+$')
       OR (jsonb_typeof(e.value) = 'number' AND (e.value #>> '{}') ~ '^[0-9]+\.0+$')
  );

-- `talla` = claves de stock_por_talla ordenadas numericamente ("38, 39, 40").
UPDATE calzados c
SET talla = s.tallas
FROM (
  SELECT x.id,
         string_agg(k.key, ', ' ORDER BY
           CASE WHEN k.key ~ '^[0-9]+(\.[0-9]+)?$' THEN 0 ELSE 1 END,
           CASE WHEN k.key ~ '^[0-9]+(\.[0-9]+)?$' THEN k.key::numeric END,
           k.key) AS tallas
  FROM calzados x, jsonb_each(x.stock_por_talla) k
  WHERE jsonb_typeof(x.stock_por_talla) = 'object'
  GROUP BY x.id
) s
WHERE c.id = s.id
  AND c.talla IS DISTINCT FROM s.tallas;

-- -----------------------------------------------------------------------------
-- 2. Constraints CHECK (idempotentes)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_calzados_cantidades_no_negativas') THEN
    ALTER TABLE calzados ADD CONSTRAINT chk_calzados_cantidades_no_negativas
      CHECK (stock_inicial >= 0 AND total_ingresado >= 0 AND total_vendido >= 0 AND stock_actual >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_calzados_formula_stock') THEN
    ALTER TABLE calzados ADD CONSTRAINT chk_calzados_formula_stock
      CHECK (stock_actual = stock_inicial + total_ingresado - total_vendido);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_calzados_precios_no_negativos') THEN
    ALTER TABLE calzados ADD CONSTRAINT chk_calzados_precios_no_negativos
      CHECK (precio_compra >= 0 AND precio_venta >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_detalles_venta_positivos') THEN
    ALTER TABLE detalles_venta ADD CONSTRAINT chk_detalles_venta_positivos
      CHECK (cantidad > 0 AND precio_unitario >= 0 AND descuento >= 0 AND total >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_ingresos_positivos') THEN
    ALTER TABLE ingresos_mercancia ADD CONSTRAINT chk_ingresos_positivos
      CHECK (cantidad > 0 AND precio_compra_unitario >= 0 AND precio_venta_unitario >= 0);
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 3. Trigger de integridad de stock por talla (solo validacion, sin descuento)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_validar_integridad_stock_calzado()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_clave text;
  v_valor jsonb;
  v_suma  bigint := 0;
BEGIN
  IF NEW.stock_por_talla IS NULL
     OR jsonb_typeof(NEW.stock_por_talla) <> 'object'
     OR NEW.stock_por_talla = '{}'::jsonb THEN
    RETURN NEW;
  END IF;

  FOR v_clave, v_valor IN SELECT key, value FROM jsonb_each(NEW.stock_por_talla) LOOP
    IF jsonb_typeof(v_valor) <> 'number'
       OR (v_valor #>> '{}') !~ '^-?[0-9]+(\.0+)?$' THEN
      RAISE EXCEPTION 'ERR-DB-STOCK: el stock de la talla % del calzado % no es un entero valido (%)',
        v_clave, NEW.codigo_producto, v_valor USING ERRCODE = 'check_violation';
    END IF;
    IF (v_valor #>> '{}')::numeric < 0 THEN
      RAISE EXCEPTION 'ERR-DB-STOCK: el stock de la talla % del calzado % es negativo (%)',
        v_clave, NEW.codigo_producto, v_valor USING ERRCODE = 'check_violation';
    END IF;
    v_suma := v_suma + (v_valor #>> '{}')::numeric::bigint;
  END LOOP;

  IF v_suma <> NEW.stock_actual THEN
    RAISE EXCEPTION 'ERR-DB-STOCK: la suma de stock_por_talla (%) no coincide con stock_actual (%) del calzado %',
      v_suma, NEW.stock_actual, NEW.codigo_producto USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validar_integridad_stock_calzado ON calzados;
CREATE TRIGGER trg_validar_integridad_stock_calzado
  BEFORE INSERT OR UPDATE ON calzados
  FOR EACH ROW EXECUTE FUNCTION fn_validar_integridad_stock_calzado();

-- -----------------------------------------------------------------------------
-- 4. Vista de auditoria
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_auditoria_inventario_ventas
WITH (security_invoker = true) AS
WITH ing AS (
  SELECT calzado_id, SUM(cantidad)::bigint AS cant FROM ingresos_mercancia GROUP BY calzado_id
), ven AS (
  SELECT d.calzado_id, SUM(d.cantidad)::bigint AS cant
  FROM detalles_venta d
  JOIN ventas v ON v.id = d.venta_id
  WHERE v.estado IS DISTINCT FROM 'ANULADA_DEVUELTA'
  GROUP BY d.calzado_id
), tal AS (
  SELECT c.id AS calzado_id,
         SUM(CASE WHEN jsonb_typeof(e.value) = 'number' THEN (e.value #>> '{}')::numeric ELSE 0 END)::bigint AS suma,
         COUNT(*) AS n
  FROM calzados c, jsonb_each(c.stock_por_talla) e
  WHERE jsonb_typeof(c.stock_por_talla) = 'object'
  GROUP BY c.id
)
SELECT
  c.id AS calzado_id,
  c.codigo_producto,
  c.nombre_producto,
  c.stock_inicial,
  c.total_ingresado,
  c.total_vendido,
  c.stock_actual,
  COALESCE(i.cant, 0) AS ingresos_reales,
  COALESCE(v.cant, 0) AS ventas_reales,
  COALESCE(t.suma, 0) AS suma_stock_por_talla,
  CASE
    WHEN c.stock_actual <> c.stock_inicial + c.total_ingresado - c.total_vendido
      THEN 'DESFASE: formula stock_actual <> stock_inicial + total_ingresado - total_vendido'
    WHEN c.total_ingresado <> COALESCE(i.cant, 0)
      THEN 'DESFASE: total_ingresado (' || c.total_ingresado || ') <> ingresos reales (' || COALESCE(i.cant, 0) || ')'
    WHEN c.total_vendido <> COALESCE(v.cant, 0)
      THEN 'DESFASE: total_vendido (' || c.total_vendido || ') <> ventas reales (' || COALESCE(v.cant, 0) || ')'
    WHEN COALESCE(t.n, 0) > 0 AND t.suma <> c.stock_actual
      THEN 'DESFASE: suma stock_por_talla (' || t.suma || ') <> stock_actual (' || c.stock_actual || ')'
    ELSE 'OK'
  END AS estado_consistencia
FROM calzados c
LEFT JOIN ing i ON i.calzado_id = c.id
LEFT JOIN ven v ON v.calzado_id = c.id
LEFT JOIN tal t ON t.calzado_id = c.id;

-- La vista y la funcion no deben quedar expuestas por la API publica de Supabase.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON v_auditoria_inventario_ventas FROM anon;
    REVOKE ALL ON FUNCTION fn_validar_integridad_stock_calzado() FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON v_auditoria_inventario_ventas FROM authenticated;
    REVOKE ALL ON FUNCTION fn_validar_integridad_stock_calzado() FROM authenticated;
  END IF;
END $$;

COMMIT;
