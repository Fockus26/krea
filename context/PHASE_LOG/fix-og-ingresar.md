# fix/og-ingresar · PR #69 · 2026-11-06

**Qué:** `OPEN_GRAPH_BASE`/`TWITTER_BASE` en lib/site.ts; `/ingresar/opengraph-image.tsx` reexporta la del sitio (D223).
**Repro:** curl en prod: falta og:image (FAIL); preview: 18 etiquetas + imagen 200 (PASS).
