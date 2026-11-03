# D159 · Pages · Cierre de la fase 05: sin `RUTAS_PLANIFICADAS`; SEO coherente · Implemented

**Decision:** `scripts/qa/paginas.mjs` pierde `RUTAS_PLANIFICADAS` y su lógica: todo enlace interno debe ir a una página generada (o a una ruta interna `/secciones`, `/componentes`, `/tokens`). Páginas reales con `noindex` salvo `/ingresar`; `sitemap.ts` lista solo `/ingresar` y `robots.ts` hace `allow: /ingresar`, `disallow: /` (D023): coherentes, sin cambios. `/secciones`, `/componentes` y `/tokens` no se tocan hasta la fase 09.
**Why:** con las 46 páginas generadas la excusa ya no tiene sentido; dejarla taparía enlaces rotos futuros.
**Discarded alternative:** dejar la lista vacía con su lógica — código muerto.
