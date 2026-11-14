-- Semillas de avatar sin cédula (D388). SQL de DATOS, no es una migración de esquema: lo aplica
-- César a mano, primero en krea_preview y luego en krea (ver el PR, «Acción manual").
--
-- Antes de D388 la semilla del DiceBear era la cédula (o `<cédula>-<tanda>-<i>` si eligió otra
-- opción) y la URL del avatar (`?seed=…`) la mostraba a cualquiera que viera la imagen. Esto:
--   1. A todo usuario cuya `avatar->>'semilla'` contenga su cédula le pone una semilla nueva al azar
--      (32 cifras hex, como `semillaAvatarNueva`), conservando el estilo. Su dibujo cambia una vez.
--   2. Copia esa semilla a su fila del ranking (`ranking.alumnos.<cédula>.semilla`) cuando la del
--      ranking falta (documentos viejos: el ranking caía a la cédula) o contiene la cédula.
-- Idempotente: una segunda pasada no encuentra nada que cambiar. `actualizado_en` no se toca
-- (es un cambio técnico, no de la persona).
-- Requiere `gen_random_uuid()` (nativa desde Postgres 13).

BEGIN;

UPDATE usuarios
SET avatar = jsonb_set(
  avatar,
  '{semilla}',
  to_jsonb(replace(gen_random_uuid()::text, '-', ''))
)
WHERE strpos(avatar->>'semilla', cedula) > 0;

UPDATE ranking r
SET alumnos = (
  SELECT jsonb_object_agg(
    e.key,
    CASE
      WHEN e.value->>'semilla' IS NULL OR strpos(e.value->>'semilla', e.key) > 0
        THEN jsonb_set(
          e.value,
          '{semilla}',
          to_jsonb(
            COALESCE(
              u.avatar->>'semilla',
              -- Fila del ranking de alguien sin perfil: igual se le quita la cédula
              replace(gen_random_uuid()::text, '-', '')
            )
          )
        )
      ELSE e.value
    END
  )
  FROM jsonb_each(r.alumnos) e
  LEFT JOIN usuarios u ON u.cedula = e.key
)
WHERE EXISTS (
  SELECT 1
  FROM jsonb_each(r.alumnos) e
  WHERE e.value->>'semilla' IS NULL OR strpos(e.value->>'semilla', e.key) > 0
);

-- Comprobación: las dos cuentas deben dar 0.
SELECT
  (SELECT count(*) FROM usuarios WHERE strpos(avatar->>'semilla', cedula) > 0) AS usuarios_con_cedula,
  (
    SELECT count(*)
    FROM ranking r, jsonb_each(r.alumnos) e
    WHERE e.value->>'semilla' IS NULL OR strpos(e.value->>'semilla', e.key) > 0
  ) AS ranking_con_cedula;

COMMIT;
