# D067 · Sections · `ActionBar` compartida: sticky sobre la barra inferior con `bottom-action`, márgenes `-(--page-px)` · Implemented

**Decision:** `components/sections/shared/action-bar.tsx`. < 1024: `sticky`, `bottom-action` (`calc(var(--h-bnav) + env(safe-area-inset-bottom))`, utilidad nueva en `globals.css`) o `bottom-0` con `sinBarraInferior` (constructor de tareas, §8), fondo `bg-bg/94`, borde superior, padding 12 16 y `-mx-(--page-px)`. ≥ 1024: estática, sin fondo, borde ni padding (va al final o en el aside). `z-action-bar` (25) bajo la topbar.
**Why:** HANDOFF §4 la define una vez para entregar, evaluar y publicar. Los márgenes negativos con la variable del padding de página llegan al borde también a 768 (padding 24), no solo a 320 (16 fijo del handoff).
**Discarded alternative:** `position: fixed` — taparía el final del contenido y duplicaría la reserva de la barra inferior (mismo motivo que D021).
