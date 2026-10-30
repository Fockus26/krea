# D122 · Sections · Premios: una vista `/secciones/premios`, cuatro tarjetas de ejemplo (ganado, en juego, empate, por definir) · Implemented

**Decision:** Una sola ruta `/secciones/premios` (`Vista rol="profesor" ruta="/profe/premios"`) con `PageHeader` (eyebrow del lienzo) y `PrizesBoard` (cliente) con un `<ul class="g3">` de tarjetas. Las tarjetas salen de `TAREAS` (ganado: Logo y paleta; en juego: Presentación del producto), del borrador `plan-redes` (por definir) y de un empate de ejemplo. Estado y textos en `lib/premios.ts` (`estadoPremio` reutiliza `ganadorPremio` de `lib/equipo.ts`).
**Why:** HANDOFF §3 Premios y D066/D069/D072; no hay estados de pantalla que merezcan ruta propia: son tarjetas.
**Discarded alternative:** `/secciones/premios/[estado]` — cada estado es una tarjeta, no una pantalla.
