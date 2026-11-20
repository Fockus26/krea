-- Las tablas creadas por las migraciones 0004–0006 se aplicaron con `psql` como `postgres`, así que
-- quedaron con dueño `postgres` y el rol de la app no puede leerlas («permission denied for table
-- partes / analisis_ia» en producción, 2026-11-15 a 2026-11-19). Este script le da cada tabla del
-- esquema public al mismo dueño que `tareas` (el rol de la app). Idempotente: se puede repetir.
-- Correrlo en krea_preview y en krea.
BEGIN;

DO $$
DECLARE
  dueno text;
  t record;
BEGIN
  SELECT tableowner INTO dueno FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tareas';
  IF dueno IS NULL THEN
    RAISE EXCEPTION 'No existe public.tareas: ¿base equivocada?';
  END IF;
  FOR t IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tableowner <> dueno
  LOOP
    EXECUTE format('ALTER TABLE public.%I OWNER TO %I', t.tablename, dueno);
    RAISE NOTICE 'public.% → %', t.tablename, dueno;
  END LOOP;
  FOR t IN
    SELECT sequencename FROM pg_sequences WHERE schemaname = 'public' AND sequenceowner <> dueno
  LOOP
    EXECUTE format('ALTER SEQUENCE public.%I OWNER TO %I', t.sequencename, dueno);
  END LOOP;
END $$;

-- Comprobación: debe dar una sola fila (un solo dueño para todas las tablas).
SELECT tableowner, count(*) AS tablas FROM pg_tables WHERE schemaname = 'public' GROUP BY tableowner;

COMMIT;
