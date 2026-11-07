# D287 · Colors · Usos de `gradeColor` fuera de la píldora: sin texto sobre el fondo, nada que cambiar · Implemented

**Decision:** se revisaron todos los usos de `gradeColor`: `GradePill` y el ejemplo de `ranking-rules` ya usan `gradeInk`; `question-bar` (relleno de barra), la leyenda (`escalaDegradado` en `lib/notas.ts`) y `lib/question.ts` pintan solo el fondo, sin texto encima. Ningún texto oscuro fijo queda sobre `gradeColor`, así que no se tocó más código (la leyenda toma los extremos nuevos sola; `grade-legend.tsx` y `lib/notas.ts` no se editan por coordinación con W13).
**Why:** regla 16 del brief: arreglar la clase completa. Los colores de `PILL_*` de `lib/site.ts` (imagen Open Graph) son literales propios, no `gradeColor`, y no cambian.
**Discarded alternative:** reflejar los extremos en `PILL_HIGH`/`PILL_LOW` del Open Graph: no es la escala de notas real y no hay pedido.
