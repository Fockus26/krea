-- Base por alumno en cada tarea (D403, D407). SQL de DATOS, no es una migración de esquema: lo
-- aplica César a mano, primero en krea_preview y luego en krea (ver el PR, «Acción manual»).
--
-- Desde D403 cada evaluación guarda en `entregas.evaluacion.bases` (jsonb: cédula → base) la base
-- con la que se evaluó a cada integrante, y la nota sale de ahí; una evaluación sin `bases` sigue
-- la base vigente del alumno (`usuarios.base`). Esto congela las ya evaluadas con la base que
-- tienen HOY, para que un cambio de base posterior en «Editar alumno» ya no las mueva:
--   1. A cada entrega `evaluada` cuya evaluación no trae `bases` le pone la base vigente de cada
--      integrante que sigue existiendo (en una grupal, una por integrante).
--   2. Lo mismo a la evaluación anterior (`evaluacion_anterior.previa`, la que devuelve
--      «Deshacer», D205) cuando existe y no trae `bases`.
-- La nota no cambia (es la misma base) y por eso el ranking tampoco: no se toca. Un integrante
-- que ya no existe se queda sin clave (su nota no se muestra en ningún lado). Idempotente: una
-- segunda pasada no encuentra nada que cambiar.

BEGIN;

WITH vigentes AS (
  SELECT e.id, jsonb_object_agg(u.cedula, u.base) AS bases
  FROM entregas e
  CROSS JOIN LATERAL unnest(e.integrantes) AS i(cedula)
  JOIN usuarios u ON u.cedula = i.cedula
  WHERE e.estado = 'evaluada'
    AND jsonb_typeof(e.evaluacion) = 'object'
    AND e.evaluacion->'bases' IS NULL
  GROUP BY e.id
)
UPDATE entregas e
SET evaluacion = e.evaluacion || jsonb_build_object('bases', v.bases)
FROM vigentes v
WHERE e.id = v.id;

WITH vigentes AS (
  SELECT e.id, jsonb_object_agg(u.cedula, u.base) AS bases
  FROM entregas e
  CROSS JOIN LATERAL unnest(e.integrantes) AS i(cedula)
  JOIN usuarios u ON u.cedula = i.cedula
  WHERE jsonb_typeof(e.evaluacion_anterior->'previa') = 'object'
    AND e.evaluacion_anterior->'previa'->'bases' IS NULL
  GROUP BY e.id
)
UPDATE entregas e
SET evaluacion_anterior = jsonb_set(e.evaluacion_anterior, '{previa,bases}', v.bases)
FROM vigentes v
WHERE e.id = v.id;

-- Comprobación: las dos cuentas deben dar 0 (salvo entregas cuyos integrantes ya no existen).
SELECT
  (
    SELECT count(*)
    FROM entregas
    WHERE estado = 'evaluada'
      AND jsonb_typeof(evaluacion) = 'object'
      AND evaluacion->'bases' IS NULL
  ) AS evaluadas_sin_bases,
  (
    SELECT count(*)
    FROM entregas
    WHERE jsonb_typeof(evaluacion_anterior->'previa') = 'object'
      AND evaluacion_anterior->'previa'->'bases' IS NULL
  ) AS anteriores_sin_bases;

COMMIT;
