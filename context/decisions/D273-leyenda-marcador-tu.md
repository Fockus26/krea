# D273 · Sections · Leyenda de Mis notas: marcador «Tú: 15,5» en la posición del promedio · Implemented

**Decision:** `GradeLegend` recibe `promedio?: number | null`. Con valor, una marca vertical cruza la barra en `posicionEnEscala(promedio)` y debajo va la etiqueta «Tú: 15,5» (coma decimal); el valor también va en el `aria-label` de la barra. Sin notas evaluadas no hay marca. El promedio es la media de las notas evaluadas (Pendiente no cuenta, D003) redondeada a la décima (`promedioNotas`, `promedioDelAlumno`). `MARCA_10_PCT` ahora sale de `posicionEnEscala(10)`. La etiqueta se alinea al borde cerca de 0 % y 100 % para no desbordar a 320 px. La galería `/secciones/notas` usa 15,5 de ejemplo.
**Why:** pedido 36. Texto + forma, no solo color; no se tocó `gradeColor` (W17).
**Discarded alternative:** marcador solo con triángulo de color: dependería del color.
