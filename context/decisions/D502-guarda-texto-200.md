# D502 · QA · La guarda de texto al 200 % vive en `scripts/qa/texto-200.mjs` y recorre todas las rutas · Implemented

**Decision:** `node scripts/qa/texto-200.mjs <base>` abre cada ruta de alumno y de profe (y los enlaces internos que encuentra, hasta 2 por forma de ruta, para entrar a las dinámicas) a 390 px con la fuente del navegador al 200 % (CDP `Page.setFontSizes` a 32 px, que escala `rem` y las media queries como el ajuste real) y falla si `scrollWidth > clientWidth`. `EXTRA=/ruta,/otra` suma rutas con datos de QA. Solo contra servidor local con la base sembrada. Se corre antes de cerrar cualquier unidad que añada una pantalla o una fila de botones/chips.
**Why:** en la versión 1 y en la 2 el mismo patrón volvió en rutas nuevas (chips y botones `shrink-0` en filas sin salida); el grep orienta pero solo la medida decide.
**Discarded alternative:** una prueba unitaria que busque `shrink-0` sin `flex-wrap` (no hay DOM en `bun:test` y da falsos positivos).
