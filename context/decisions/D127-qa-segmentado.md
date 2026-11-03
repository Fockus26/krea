# D127 · QA · `scripts/qa/segmentado.mjs` mide los segmentados con el CSS compilado, sin servidor · Implemented

**Decision:** `bun run qa:segmentado` (tras `bun run build`) carga el CSS de `.next/static` con `page.setContent()` y mide ancho del grupo, solapes, desbordes y ocultado de íconos en las anatomías de `/secciones` y Perfil. Falla si el grupo de ancho propio es menor que la suma de sus ítems.
**Why:** sin servidor de la app (brief de la ola) y el bug solo se ve midiendo layout; queda como guardia contra regresiones. `CHROMIUM_PATH` fuerza el binario si el Chromium preinstalado no coincide con la versión de Playwright.
**Discarded alternative:** capturas de pantalla — no autorizadas y no miden.
