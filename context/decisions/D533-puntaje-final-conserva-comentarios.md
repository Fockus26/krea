# D533 · Data · Poner el puntaje final conserva los comentarios y el comentario general de la evaluación · Implemented

**Decision:** `ponerPuntajeFinalEnTransaccion` arma la evaluación nueva con los `comentarios` por pregunta y el `comentarioGeneral` de la evaluación que ya tenía la entrega (si los había); solo cambian `puntaje`, `puntos: null`, autor e instante. La anterior sigue en `evaluacionAnterior` para «Deshacer» (D205).
**Why:** con `comentarios: {}` fijo, poner o corregir el puntaje final borraba lo que el profe ya había escrito (backlog L55, Medio).
**Discarded alternative:** conservar también `puntos` — el puntaje final es sin desglose por pregunta (`puntos: null`) a propósito; mezclar el desglose viejo con un total nuevo daría una suma que no cuadra.
