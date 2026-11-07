# D299 · Data · El lote va en trozos de 25 cédulas por llamada; el cliente parte la selección · Implemented

**Decision:** `TOPE_LOTE = 25` (`lib/lote.ts`): `zCedulasLote` acepta 1..25 cédulas válidas sin repetir; más es `invalida`. El cliente (`eliminarPorTrozos`) llama una vez por trozo, en orden, y junta los resultados; un trozo caído deja sus cédulas como `red` (siguen seleccionadas para reintentar). Lo mismo para el resumen previo de Alumnos.
**Why:** cada borrado de alumno es una transacción con el ranking más el borrado de Auth e imágenes; 25 seguidos caben con holgura en el tiempo de una función. Una sección tiene menos de 40 alumnos: «todos» son 1–2 llamadas. El tope es invisible para el profe.
**Discarded alternative:** un tope visible («máximo 25 a la vez»): obliga a seleccionar por tandas sin motivo para el usuario.
