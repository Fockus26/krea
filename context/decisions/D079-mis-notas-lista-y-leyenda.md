# D079 · Sections · Mis notas: leyenda con el degradado de `gradeColor`, filtro local y meta con verbo · Implemented

**Decision:** `components/sections/notas/grade-legend.tsx` pinta la barra con paradas calculadas por `escalaDegradado()` (`lib/notas.ts`, una por nota entera 1–20 con `gradeColor`), `role="img"` con el texto del lienzo, y el 10 a `MARCA_10_PCT` (47,4 %). `grades-list.tsx` (cliente) filtra con `ToggleGroup` (Todas · Individuales · Grupales, radiogroup D038) sin cambiar el orden recibido; el h2 sigue al filtro ("Todas las notas", "Notas individuales"…). Las filas son `GradeRow` (D068) con la meta del lienzo: "evaluada el dd/mm/aaaa" o, pendientes, "vence el dd/mm/aaaa" (`fechaNotaTexto`).
**Why:** D004 (la fórmula manda: ningún hex escrito); HANDOFF §3 Mis notas y lienzo Notas.
**Discarded alternative:** los 8 hex del lienzo en un `linear-gradient` — valores mágicos que divergen de la fórmula. `Tabs` para el filtro — no hay paneles distintos, es la misma lista filtrada.
