# D244 · Sections · Acciones de la card de tarea arriba y a la derecha, a la altura de los chips · Implemented

**Decision:** `TeacherTaskCard`: el `<li>` pasa de `items-center` a `items-start`, y la fila de chips toma el alto de un botón `sm` (`min-h-9`, `max-lg:min-h-11`, `items-center`), así las acciones quedan arriba, centradas con los chips, y al final de la fila; si no caben siguen debajo (`flex-wrap`, como antes).
**Why:** pedido 32 de César: con la barra y la meta la tarjeta crece y los botones quedaban flotando en el medio.
**Discarded alternative:** margen negativo en los botones para centrarlos con chips de 28 — cuando envuelven debajo se comen la separación.
