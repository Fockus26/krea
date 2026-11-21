# D527 · Data · El premio individual ganado se muestra en el detalle de la nota, calculado en el servidor · Implemented

**Decision:** `/notas/[tarea]` de una individual con premio, cerrada para todos (D453), calcula en el servidor los ganadores de su sección con `notasPremioIndividual` + `ganadoresPremio` (nota final con base, D264; empate = decisión del profe, D123/D124) y, si el alumno gana, pinta `PrizeCard ganado` («¡Ganaste el premio!», Trophy, foto firmada si hay) bajo el resumen de la nota. Al cliente solo llega el premio.
**Why:** el alumno no veía en ningún lado que ganó (backlog L34); César eligió el detalle de la nota (2026-11-21).
**Discarded alternative:** Inicio o un aviso en Mis notas: César pidió el detalle.
