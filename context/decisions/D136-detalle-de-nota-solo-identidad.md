# D136 · Pages · `/notas/[tarea]` genera una página por tarea del ejemplo; solo «Identidad de marca» trae el detalle pregunta a pregunta · Implemented

**Decision:** `generateStaticParams` sale de `TAREAS` (los enlaces de Mis notas apuntan a todas). «Identidad de marca» muestra el detalle de la vista previa (Heymi Sierra, como el lienzo, D069); las demás tareas muestran `EmptyState` «Todavía no hay detalle de esta nota» con el título de la tarea y el enlace de vuelta. `notFound()` si el id no existe.
**Why:** el seed solo trae respuestas y evaluación por pregunta de esa tarea; inventar el resto rompería «zero invented content». Así ningún enlace de Mis notas queda roto (`check:paginas`). La fase 07 lo reemplaza por Firestore.
**Discarded alternative:** `generateStaticParams` solo con «Identidad de marca» — deja enlaces rotos en Mis notas. Reusar el detalle de Identidad para otras tareas — mostraría preguntas ajenas.
