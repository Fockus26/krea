# D431 · Data · Elegible = entrega evaluada de esa tarea con puntaje 20 / 20 · Implemented

**Decision:** una entrega puede ser la ideal si es de esa tarea, está `evaluada` y `evaluacion.puntaje === 20` (`esElegible`), sin mirar la base del alumno (D006) ni la nota final. En la lista de entregas solo esas filas suman «Marcar como entrega ideal» al menú «Más acciones» (prop nueva `idealHref` de `AccionesEntrega`); la ideal vigente lleva la etiqueta «Entrega ideal» en su fila. Guardar vuelve a comprobarlo en la transacción con la entrega bloqueada (`FOR UPDATE`).
**Why:** «la de 20» es el puntaje de las preguntas: con base 15 una entrega perfecta tiene nota 15 y sigue siendo ideal.
**Discarded alternative:** dejar marcar cualquier entrega evaluada — César pidió explícitamente la de 20.
