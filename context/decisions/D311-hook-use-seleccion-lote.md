# D311 · Code · La selección del lote vive en `useSeleccionLote(ids)`; el Shift se lee en onClick/onKeyDown · Implemented

**Decision:** `components/sections/shared/use-seleccion-lote.ts` guarda la selección y el ancla y entrega `casilla(id)` (props `checked`, `onClick`, `onKeyDown`, `onBlur`, `onCheckedChange`), `alternarTodos`, `limpiar`, `quitar` y `podar`. Alumnos y Profesores lo usan; Tareas y Equipos (X4) deben usarlo. El `Checkbox` es un `button` y `onCheckedChange` no trae el evento: el Shift se toma de `onClick` (ratón) y de `onKeyDown` con Espacio (teclado), y se consume en `onCheckedChange`. `ids` = lo seleccionable en el orden visible.
**Why:** que las cuatro pantallas con lote compartan una sola lógica de selección y de rango.
**Discarded alternative:** leer `window.event` en `onCheckedChange`: es API obsoleta y frágil.
