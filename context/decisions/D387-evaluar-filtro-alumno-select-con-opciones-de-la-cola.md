# D387 · Components · Filtros de Evaluar: Tarea y Alumno son `Select` con las opciones de la cola · Implemented

**Decision:** la barra de filtros usa `ToggleGroup` (Tipo), `SelectorSeccion` (Sección, del catálogo) y dos `Select` (Tarea y Alumno) cuyas opciones salen de las entregas por evaluar de la cola entera (más la elegida si ya no tiene entregas), ordenadas por texto. No hay buscador de texto en Alumno.
**Why:** solo se puede filtrar por algo que tenga entregas pendientes, así que la lista es corta; reutiliza primitivos del proyecto y no edita `recipient-combobox`.
**Discarded alternative:** combobox con búsqueda para Alumno (útil con listas largas de 69 alumnos; se puede añadir si la lista de pendientes crece).
