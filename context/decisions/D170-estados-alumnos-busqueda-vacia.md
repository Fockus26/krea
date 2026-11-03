# D170 · States · Alumnos: búsqueda sin resultados con el vacío del lienzo y «Buscar en {otra sección}» · Implemented

**Decision:** si la búsqueda no da nada en la sección elegida, `StudentsDirectory` cambia la tabla por un `EmptyState` (ícono Search): «Nadie con «{q}» en 5A» · «Revisa las tildes o busca por cédula. ¿Quizás está en 5C?» · ghost «Buscar en 5C». La pista y el botón salen solo si en la otra sección sí hay coincidencias (`busquedaVacia`, `lib/alumnos.ts`). La fila de texto de la tabla queda para una sección sin alumnos.
**Why:** es el vacío diseñado (Vacios.dc.html); sugerir 5C sin coincidencias allí sería una salida falsa.
**Discarded alternative:** el vacío dentro de una celda de la tabla — anuncia una tabla de una fila sin datos.
