# D471 · Data · Evaluar pasa `ahora`: «Devolver» y «cerrada» miran la tarea vencida (cierra lo pendiente de D457) · Implemented

**Decision:** `app/(profesor)/profe/evaluar/[entrega]/page.tsx` toma `ahora = Date.now()` después de leer los datos (patrón de `/profe/tareas/[id]/entregas`) y pasa `puedeDevolver(entrega, tarea, ahora)` y `tareaCerrada={estadoEfectivo(tarea, ahora, entrega.titularId) !== "abierta"}`: con la tarea vencida sin prórroga para ese titular ya no se ofrece «Devolver al alumno» (antes el servidor respondía `tarea-cerrada`, D411). El servidor sigue comprobando igual.
**Why:** D457 dejó la costura pendiente hasta que Evaluar se liberara; en la ola 2 de la tanda 2026-11-20 lo toca Q7.
**Discarded alternative:** dejarlo al servidor — el profe ve un botón que siempre falla.
