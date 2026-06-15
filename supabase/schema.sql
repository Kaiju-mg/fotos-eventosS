-- ============================================================
-- Schema para la app de fotos en vivo para eventos
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- Tabla de organizadores (clientes que contratan el servicio)
CREATE TABLE IF NOT EXISTS organizadores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  plan_contratado TEXT DEFAULT 'basico',
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de eventos
CREATE TABLE IF NOT EXISTS eventos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  fecha DATE NOT NULL,
  fecha_expiracion TIMESTAMPTZ NOT NULL,
  codigo_unico TEXT UNIQUE NOT NULL,
  id_organizador UUID REFERENCES organizadores(id) ON DELETE SET NULL,
  estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'expirado', 'pausado')),
  plan TEXT DEFAULT 'basico',
  max_fotos INTEGER DEFAULT 200,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de fotos
CREATE TABLE IF NOT EXISTS fotos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_evento UUID NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  url_archivo TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  nombre_invitado TEXT,
  mensaje TEXT,
  fecha_subida TIMESTAMPTZ DEFAULT NOW(),
  aprobada BOOLEAN DEFAULT TRUE
);

-- Índices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_eventos_codigo ON eventos(codigo_unico);
CREATE INDEX IF NOT EXISTS idx_eventos_estado ON eventos(estado);
CREATE INDEX IF NOT EXISTS idx_eventos_expiracion ON eventos(fecha_expiracion) WHERE estado = 'activo';
CREATE INDEX IF NOT EXISTS idx_fotos_evento ON fotos(id_evento, fecha_subida DESC);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE organizadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE fotos ENABLE ROW LEVEL SECURITY;

-- Eventos: anónimos pueden ver eventos activos, admin puede todo
CREATE POLICY "anon_read_active_eventos" ON eventos
  FOR SELECT TO anon
  USING (estado = 'activo');

CREATE POLICY "authenticated_all_eventos" ON eventos
  FOR ALL TO authenticated
  USING (TRUE) WITH CHECK (TRUE);

-- Fotos: anónimos pueden ver fotos aprobadas de eventos activos
CREATE POLICY "anon_read_approved_fotos" ON fotos
  FOR SELECT TO anon
  USING (
    aprobada = TRUE
    AND EXISTS (
      SELECT 1 FROM eventos e WHERE e.id = fotos.id_evento AND e.estado = 'activo'
    )
  );

-- Fotos: anónimos pueden insertar fotos en eventos activos
CREATE POLICY "anon_insert_fotos" ON fotos
  FOR INSERT TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM eventos e WHERE e.id = id_evento AND e.estado = 'activo'
    )
  );

CREATE POLICY "authenticated_all_fotos" ON fotos
  FOR ALL TO authenticated
  USING (TRUE) WITH CHECK (TRUE);

-- Organizadores: solo admin
CREATE POLICY "authenticated_all_organizadores" ON organizadores
  FOR ALL TO authenticated
  USING (TRUE) WITH CHECK (TRUE);

-- ============================================================
-- Storage: ejecutar estos comandos también
-- ============================================================
-- 1. Crear el bucket (puede hacerse desde el dashboard de Supabase)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('fotos-eventos', 'fotos-eventos', true)
-- ON CONFLICT DO NOTHING;

-- 2. Política de lectura pública
-- CREATE POLICY "public_read" ON storage.objects
--   FOR SELECT TO anon, authenticated
--   USING (bucket_id = 'fotos-eventos');

-- 3. Política para que los invitados puedan subir fotos
-- CREATE POLICY "anon_upload" ON storage.objects
--   FOR INSERT TO anon
--   WITH CHECK (bucket_id = 'fotos-eventos');

-- 4. Política para que el admin pueda eliminar fotos
-- CREATE POLICY "authenticated_delete" ON storage.objects
--   FOR DELETE TO authenticated
--   USING (bucket_id = 'fotos-eventos');

-- ============================================================
-- Realtime: habilitar para la tabla fotos
-- ============================================================
-- ALTER PUBLICATION supabase_realtime ADD TABLE fotos;
