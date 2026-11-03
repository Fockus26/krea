# D162 · States · Galería `/estados?screen=…` en desarrollo y vistas previas de Vercel; 404 en producción · Implemented

**Decision:** `app/estados/page.tsx` pinta cada variante (404 ×3, 500 ×2, sin conexión con y sin hora) con un selector arriba. `galeriaEstadosVisible`: `NODE_ENV=development` o `VERCEL_ENV=preview`; si no, `notFound()` (el build de producción la deja como 404 estático). `check:paginas` la trata como interna (como `/secciones`). El código de la galería es el de ejemplo del handoff (`KR-500-7F3A9C`, fila 113).
**Why:** César revisa en las vistas previas sin servidor local (2026-11-03); el kit pide la galería para que `design-qa` audite el 500.
**Discarded alternative:** solo en desarrollo — César no la vería en la vista previa del PR.
