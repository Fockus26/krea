# D360 · Motion · Los años de «Años y secciones» se despliegan animando la altura · Implemented

**Decision:** el panel de secciones de cada año pasa de `grid-rows-[0fr]` + `opacity-0` a `grid-rows-[1fr]` + `opacity-100` con `duration-normal` y `ease-krea` (el contenido en un hijo `min-h-0 overflow-hidden`). Cerrado lleva `inert` (fuera del teclado y del lector), en lugar de `hidden`. Con movimiento reducido no anima (`--d-normal` = 0 y `motion-reduce:transition-none`).
**Why:** pedido de César (2026-11-10): faltaba la animación de expandir y colapsar. Entre «despliegue de altura» y «solo aparición (transform/opacity)», eligió el despliegue.
**Excepción consciente:** rompe la regla «animaciones solo transform/opacity» (CLAUDE.md) en este componente. El QA final no debe reportarlo como fallo nuevo.
**Discarded alternative:** fundido + deslizamiento con `k-accordion-in` (el alto cambia de golpe y las tarjetas de abajo saltan).
