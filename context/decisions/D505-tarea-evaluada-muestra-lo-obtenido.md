# D505 · Data · `/tareas/[tarea]` de una tarea evaluada muestra lo obtenido por pregunta, no «Pendiente» · Implemented

**Decision:** la página pasa `obtenido = evaluacion.puntos[pregunta.id] ?? 0` a cada pregunta cuando la entrega del alumno está `evaluada` (igual que `/notas/[tarea]`); `null` («Pendiente», D003) solo cuando de verdad no hay evaluación por pregunta.
**Why:** con `obtenido={null}` fijo, justo bajo «Tu profe ya la evaluó» cada pregunta decía «Pendiente · vale N» (QA v2, F-M2).
**Discarded alternative:** quitar el valor de la tarjeta evaluada: oculta información que `/notas` sí da.
