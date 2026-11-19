-- =============================================================================
-- Sistema de Auditoría Integral con Triggers PostgreSQL - IDEMPOTENTE
-- Tarea: [BKL-05]
--
-- Contenido:
--   1. Tabla `logs_auditoria` e índices de consulta rápida.
--   2. Función `fn_registrar_auditoria()` con sanitización de campos sensibles,
--      detección de cambios reales campo por campo en UPDATE, lectura de
--      variables de sesión (`lalala.*`) y generación de resúmenes en español.
--   3. Instalación idempotente de triggers AFTER INSERT OR UPDATE OR DELETE
--      en las 13 tablas operativas del sistema (nunca sobre `logs_auditoria`).
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Tabla `logs_auditoria` e índices
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS logs_auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tabla VARCHAR(80) NOT NULL,
  modulo VARCHAR(60) NOT NULL,
  accion VARCHAR(20) NOT NULL CHECK (accion IN ('CREAR', 'ACTUALIZAR', 'ELIMINAR')),
  registro_id VARCHAR(120),
  resumen TEXT NOT NULL,
  campos_modificados TEXT[] NOT NULL DEFAULT '{}',
  valores_anteriores JSONB,
  valores_nuevos JSONB,
  usuario_id UUID,
  usuario_nombre VARCHAR(160),
  usuario_rol VARCHAR(40),
  ip VARCHAR(80),
  metodo_http VARCHAR(16),
  ruta_http VARCHAR(300),
  origen VARCHAR(30) NOT NULL DEFAULT 'TRIGGER_DB',
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_auditoria_creado_en
  ON logs_auditoria (creado_en DESC);

CREATE INDEX IF NOT EXISTS idx_logs_auditoria_tabla_accion_creado
  ON logs_auditoria (tabla, accion, creado_en DESC);

CREATE INDEX IF NOT EXISTS idx_logs_auditoria_usuario_creado
  ON logs_auditoria (usuario_id, creado_en DESC);

CREATE INDEX IF NOT EXISTS idx_logs_auditoria_registro_id
  ON logs_auditoria (registro_id);

-- -----------------------------------------------------------------------------
-- 2. Función de trigger `fn_registrar_auditoria()`
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_registrar_auditoria()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_accion VARCHAR(20);
  v_modulo VARCHAR(60);
  v_registro_id VARCHAR(120);
  v_old_raw JSONB;
  v_new_raw JSONB;
  v_old_limpio JSONB;
  v_new_limpio JSONB;
  v_ref JSONB;
  v_campos TEXT[] := '{}';
  v_resumen TEXT;
  v_etiqueta_entidad TEXT;
  v_identificador TEXT;
  v_usuario_id UUID := NULL;
  v_usuario_nombre VARCHAR(160) := NULL;
  v_usuario_rol VARCHAR(40) := NULL;
  v_ip VARCHAR(80) := NULL;
  v_metodo_http VARCHAR(16) := NULL;
  v_ruta_http VARCHAR(300) := NULL;
  v_origen VARCHAR(30) := 'TRIGGER_DB';
  v_claves_sensibles CONSTANT TEXT[] := ARRAY[
    'contrasena_hash',
    'version_token',
    'fecha_revocacion_sesiones'
  ];
BEGIN
  -- Nunca auditar la propia tabla de auditoría
  IF TG_TABLE_NAME = 'logs_auditoria' THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  -- Determinar acción y payloads JSONB sanitizados
  IF TG_OP = 'INSERT' THEN
    v_accion := 'CREAR';
    v_new_raw := to_jsonb(NEW);
    v_new_limpio := v_new_raw - v_claves_sensibles;
    v_old_limpio := NULL;
    v_ref := v_new_limpio;
  ELSIF TG_OP = 'UPDATE' THEN
    v_accion := 'ACTUALIZAR';
    v_old_raw := to_jsonb(OLD);
    v_new_raw := to_jsonb(NEW);
    v_old_limpio := v_old_raw - v_claves_sensibles;
    v_new_limpio := v_new_raw - v_claves_sensibles;
    v_ref := v_new_limpio;

    -- Calcular campos modificados comparando clave por clave (ignorando timestamps automáticos)
    SELECT COALESCE(array_agg(k ORDER BY k), '{}')
    INTO v_campos
    FROM (
      SELECT COALESCE(o.key, n.key) AS k
      FROM jsonb_each(v_old_raw) o
      FULL OUTER JOIN jsonb_each(v_new_raw) n ON o.key = n.key
      WHERE COALESCE(o.key, n.key) NOT IN ('actualizado_en', 'updated_at', 'fecha_actualizacion')
        AND o.value IS DISTINCT FROM n.value
    ) diff;

    -- Si no cambió ningún campo real, no insertar ruido
    IF COALESCE(array_length(v_campos, 1), 0) = 0 THEN
      RETURN NEW;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    v_accion := 'ELIMINAR';
    v_old_raw := to_jsonb(OLD);
    v_old_limpio := v_old_raw - v_claves_sensibles;
    v_new_limpio := NULL;
    v_ref := v_old_limpio;
  ELSE
    RETURN NULL;
  END IF;

  -- Extraer identificador del registro
  v_registro_id := COALESCE(
    v_ref->>'id',
    v_ref->>'codigo_producto',
    v_ref->>'numero_ticket',
    v_ref->>'nombre'
  );

  -- Resolver módulo legible en español
  CASE
    WHEN TG_TABLE_NAME = 'calzados' THEN
      v_modulo := 'Inventario';
    WHEN TG_TABLE_NAME IN ('ventas', 'detalles_venta') THEN
      v_modulo := 'Ventas';
    WHEN TG_TABLE_NAME = 'ingresos_mercancia' THEN
      v_modulo := 'Ingresos';
    WHEN TG_TABLE_NAME = 'gastos_caja_chica' THEN
      v_modulo := 'Gastos';
    WHEN TG_TABLE_NAME = 'clientes' THEN
      v_modulo := 'Clientes';
    WHEN TG_TABLE_NAME = 'proveedores' THEN
      v_modulo := 'Proveedores';
    WHEN TG_TABLE_NAME = 'usuarios' THEN
      v_modulo := 'Usuarios';
    WHEN TG_TABLE_NAME = 'bancos' THEN
      v_modulo := 'Bancos';
    WHEN TG_TABLE_NAME LIKE 'catalogo_%' THEN
      v_modulo := 'Catálogos';
    ELSE
      v_modulo := 'Sistema';
  END CASE;

  -- Construir resumen descriptivo en español según la tabla y acción
  IF TG_TABLE_NAME = 'calzados' THEN
    v_identificador := BTRIM(COALESCE(v_ref->>'codigo_producto', '') || ' ' || COALESCE(v_ref->>'nombre_producto', ''));
    IF v_accion = 'CREAR' THEN
      v_resumen := 'Calzado creado: ' || v_identificador || ' (Color: ' || COALESCE(v_ref->>'color', '-') || ', Stock: ' || COALESCE(v_ref->>'stock_actual', '0') || ', Bs ' || COALESCE(v_ref->>'precio_venta', '0') || ')';
    ELSIF v_accion = 'ACTUALIZAR' THEN
      v_resumen := 'Calzado actualizado: ' || v_identificador || ' (Stock: ' || COALESCE(v_ref->>'stock_actual', '0') || ', Bs ' || COALESCE(v_ref->>'precio_venta', '0') || ') [' || array_to_string(v_campos, ', ') || ']';
    ELSE
      v_resumen := 'Calzado eliminado: ' || v_identificador;
    END IF;

  ELSIF TG_TABLE_NAME = 'ventas' THEN
    v_identificador := COALESCE(v_ref->>'numero_ticket', COALESCE(v_registro_id, 'S/N'));
    IF v_accion = 'CREAR' THEN
      v_resumen := 'Venta registrada: Ticket ' || v_identificador || ' por Bs ' || COALESCE(v_ref->>'total_venta', '0') || ' (' || COALESCE(v_ref->>'forma_pago', 'Efectivo') || COALESCE(' - Vendedor: ' || NULLIF(BTRIM(v_ref->>'nombre_vendedor'), ''), '') || ')';
    ELSIF v_accion = 'ACTUALIZAR' THEN
      v_resumen := 'Venta actualizada: Ticket ' || v_identificador || ' — Estado: ' || COALESCE(v_ref->>'estado', '-') || ', Total: Bs ' || COALESCE(v_ref->>'total_venta', '0') || ' [' || array_to_string(v_campos, ', ') || ']';
    ELSE
      v_resumen := 'Venta eliminada: Ticket ' || v_identificador || ' (Bs ' || COALESCE(v_ref->>'total_venta', '0') || ')';
    END IF;

  ELSIF TG_TABLE_NAME = 'detalles_venta' THEN
    v_identificador := BTRIM(COALESCE(v_ref->>'codigo_producto', '') || ' ' || COALESCE(v_ref->>'nombre_producto', ''));
    IF v_accion = 'CREAR' THEN
      v_resumen := 'Detalle de venta registrado: ' || v_identificador || ' (Talla ' || COALESCE(v_ref->>'talla', '-') || ', Cant. ' || COALESCE(v_ref->>'cantidad', '1') || ', Bs ' || COALESCE(v_ref->>'total', '0') || ')';
    ELSIF v_accion = 'ACTUALIZAR' THEN
      v_resumen := 'Detalle de venta actualizado: ' || v_identificador || ' (Talla ' || COALESCE(v_ref->>'talla', '-') || ') [' || array_to_string(v_campos, ', ') || ']';
    ELSE
      v_resumen := 'Detalle de venta eliminado: ' || v_identificador || ' (Talla ' || COALESCE(v_ref->>'talla', '-') || ')';
    END IF;

  ELSIF TG_TABLE_NAME = 'ingresos_mercancia' THEN
    v_identificador := COALESCE(v_ref->>'codigo_producto', COALESCE(v_registro_id, ''));
    IF v_accion = 'CREAR' THEN
      v_resumen := 'Ingreso de mercancía: ' || v_identificador || ' (Talla ' || COALESCE(v_ref->>'talla', '-') || ', +' || COALESCE(v_ref->>'cantidad', '0') || ' pares, Prov.: ' || COALESCE(v_ref->>'proveedor', '-') || ')';
    ELSIF v_accion = 'ACTUALIZAR' THEN
      v_resumen := 'Ingreso de mercancía actualizado: ' || v_identificador || ' [' || array_to_string(v_campos, ', ') || ']';
    ELSE
      v_resumen := 'Ingreso de mercancía eliminado: ' || v_identificador || ' (' || COALESCE(v_ref->>'cantidad', '0') || ' pares)';
    END IF;

  ELSIF TG_TABLE_NAME = 'gastos_caja_chica' THEN
    v_identificador := COALESCE(v_ref->>'concepto_motivo', 'Gasto');
    IF v_accion = 'CREAR' THEN
      v_resumen := 'Gasto de caja chica registrado: ' || v_identificador || ' por Bs ' || COALESCE(v_ref->>'monto', '0') || ' (Empleado: ' || COALESCE(v_ref->>'nombre_empleado', '-') || ')';
    ELSIF v_accion = 'ACTUALIZAR' THEN
      v_resumen := 'Gasto de caja chica actualizado: ' || v_identificador || ' (Bs ' || COALESCE(v_ref->>'monto', '0') || ') [' || array_to_string(v_campos, ', ') || ']';
    ELSE
      v_resumen := 'Gasto de caja chica eliminado: ' || v_identificador || ' (Bs ' || COALESCE(v_ref->>'monto', '0') || ')';
    END IF;

  ELSIF TG_TABLE_NAME = 'clientes' THEN
    v_identificador := COALESCE(v_ref->>'nombre_completo', COALESCE(v_registro_id, 'Cliente'));
    IF v_accion = 'CREAR' THEN
      v_resumen := 'Cliente registrado: ' || v_identificador;
    ELSIF v_accion = 'ACTUALIZAR' THEN
      v_resumen := 'Cliente actualizado: ' || v_identificador || ' [' || array_to_string(v_campos, ', ') || ']';
    ELSE
      v_resumen := 'Cliente eliminado: ' || v_identificador;
    END IF;

  ELSIF TG_TABLE_NAME = 'proveedores' THEN
    v_identificador := COALESCE(v_ref->>'nombre', COALESCE(v_registro_id, 'Proveedor'));
    IF v_accion = 'CREAR' THEN
      v_resumen := 'Proveedor registrado: ' || v_identificador;
    ELSIF v_accion = 'ACTUALIZAR' THEN
      v_resumen := 'Proveedor actualizado: ' || v_identificador || ' [' || array_to_string(v_campos, ', ') || ']';
    ELSE
      v_resumen := 'Proveedor eliminado: ' || v_identificador;
    END IF;

  ELSIF TG_TABLE_NAME = 'usuarios' THEN
    v_identificador := COALESCE(v_ref->>'nombre', COALESCE(v_ref->>'correo', 'Usuario'));
    IF v_accion = 'CREAR' THEN
      v_resumen := 'Usuario creado: ' || v_identificador || ' (Rol: ' || COALESCE(v_ref->>'rol', '-') || ')';
    ELSIF v_accion = 'ACTUALIZAR' THEN
      v_resumen := 'Usuario actualizado: ' || v_identificador || ' (Rol: ' || COALESCE(v_ref->>'rol', '-') || ') [' || array_to_string(v_campos, ', ') || ']';
    ELSE
      v_resumen := 'Usuario eliminado: ' || v_identificador;
    END IF;

  ELSE
    v_etiqueta_entidad := CASE TG_TABLE_NAME
      WHEN 'bancos' THEN 'Banco'
      WHEN 'catalogo_colores' THEN 'Color de catálogo'
      WHEN 'catalogo_categorias' THEN 'Categoría de catálogo'
      WHEN 'catalogo_marcas' THEN 'Marca de catálogo'
      WHEN 'catalogo_extras' THEN 'Extra de catálogo'
      ELSE TG_TABLE_NAME
    END;
    v_identificador := COALESCE(v_ref->>'nombre', COALESCE(v_registro_id, ''));
    IF v_accion = 'CREAR' THEN
      v_resumen := v_etiqueta_entidad || ' creado: ' || v_identificador;
    ELSIF v_accion = 'ACTUALIZAR' THEN
      v_resumen := v_etiqueta_entidad || ' actualizado: ' || v_identificador || ' [' || array_to_string(v_campos, ', ') || ']';
    ELSE
      v_resumen := v_etiqueta_entidad || ' eliminado: ' || v_identificador;
    END IF;
  END IF;

  -- Leer contexto de sesión (si fue inyectado por el backend)
  BEGIN
    v_usuario_id := NULLIF(BTRIM(current_setting('lalala.usuario_id', true)), '')::uuid;
  EXCEPTION WHEN others THEN
    v_usuario_id := NULL;
  END;

  v_usuario_nombre := NULLIF(BTRIM(current_setting('lalala.usuario_nombre', true)), '');
  v_usuario_rol := NULLIF(BTRIM(current_setting('lalala.usuario_rol', true)), '');
  v_ip := NULLIF(BTRIM(current_setting('lalala.ip', true)), '');
  v_metodo_http := NULLIF(BTRIM(current_setting('lalala.metodo_http', true)), '');
  v_ruta_http := NULLIF(BTRIM(current_setting('lalala.ruta_http', true)), '');

  IF v_usuario_nombre IS NOT NULL OR v_ruta_http IS NOT NULL THEN
    v_origen := 'API_TRIGGER';
  END IF;

  -- Fallback a columnas de operador en ventas y gastos_caja_chica cuando no hay setting de sesión
  IF v_usuario_nombre IS NULL THEN
    IF TG_TABLE_NAME = 'ventas' THEN
      v_usuario_nombre := NULLIF(BTRIM(v_ref->>'nombre_vendedor'), '');
    ELSIF TG_TABLE_NAME = 'gastos_caja_chica' THEN
      v_usuario_nombre := NULLIF(BTRIM(v_ref->>'nombre_empleado'), '');
    END IF;
  END IF;

  INSERT INTO logs_auditoria (
    tabla,
    modulo,
    accion,
    registro_id,
    resumen,
    campos_modificados,
    valores_anteriores,
    valores_nuevos,
    usuario_id,
    usuario_nombre,
    usuario_rol,
    ip,
    metodo_http,
    ruta_http,
    origen
  ) VALUES (
    TG_TABLE_NAME,
    v_modulo,
    v_accion,
    v_registro_id,
    v_resumen,
    v_campos,
    v_old_limpio,
    v_new_limpio,
    v_usuario_id,
    v_usuario_nombre,
    v_usuario_rol,
    v_ip,
    v_metodo_http,
    v_ruta_http,
    v_origen
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- 3. Instalación idempotente de triggers en las 13 tablas operativas
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_tabla TEXT;
  v_trigger TEXT;
  v_tablas CONSTANT TEXT[] := ARRAY[
    'calzados',
    'ventas',
    'detalles_venta',
    'ingresos_mercancia',
    'gastos_caja_chica',
    'clientes',
    'proveedores',
    'usuarios',
    'bancos',
    'catalogo_colores',
    'catalogo_categorias',
    'catalogo_marcas',
    'catalogo_extras'
  ];
BEGIN
  FOREACH v_tabla IN ARRAY v_tablas LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = v_tabla
    ) THEN
      v_trigger := 'trg_auditoria_' || v_tabla;
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', v_trigger, v_tabla);
      EXECUTE format(
        'CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION fn_registrar_auditoria()',
        v_trigger,
        v_tabla
      );
    END IF;
  END LOOP;
END $$;

-- Proteger tabla y función frente a accesos directos desde roles públicos de PostgREST
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON logs_auditoria FROM anon;
    REVOKE ALL ON FUNCTION fn_registrar_auditoria() FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON logs_auditoria FROM authenticated;
    REVOKE ALL ON FUNCTION fn_registrar_auditoria() FROM authenticated;
  END IF;
END $$;

COMMIT;
