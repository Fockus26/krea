# D528 · Data · Evaluada sin puntos por pregunta muestra «Sin puntaje por pregunta», no «Pendiente» · Implemented

**Decision:** `QuestionCardDetail` acepta `sinPuntaje`: con `obtenido = null` y ese texto, la cabecera dice «vale N» y el texto va en lugar de la barra. `/tareas/[tarea]` lo pasa cuando la entrega está evaluada sin `puntos` («Sin puntaje por pregunta», o «No participaste en esta entrega del equipo» si el profe lo marcó) y Evaluar del profe en solo lectura también («Sin puntaje por pregunta»).
**Why:** «Pendiente» es solo sin evaluación (D003, D505); con puntaje final o nota del Excel la pregunta decía «Pendiente» bajo «Tu profe ya la evaluó» (backlog L77).
**Discarded alternative:** ocultar la cabecera de valor: pierde cuánto valía la pregunta.
