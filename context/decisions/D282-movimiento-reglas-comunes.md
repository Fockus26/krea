# D282 · Movimiento · Reglas comunes de las animaciones de la tanda: tokens, WAAPI, mejora progresiva y reduced motion · Implemented

**Decision:** toda animación nueva de W15 (D278–D281) cumple:
- Solo `transform` (también `translate`/`scale` individuales) y `opacity`; nunca `width`, `height`, `left`/`top` animados (lo vigila `tests/unit/animaciones.test.ts`, `indicador.test.ts`, `transicion.test.ts`).
- Duraciones y curvas de tokens: `--d-fast`, `--d-normal`, `--ease`, y los nuevos `--d-pagina`, `--d-pagina-salida`, `--desliz-pagina` (D278). En JS se leen de `:root` con `parseCssTime` (como `useFlip`), así que el bloque de reduced motion de `globals.css` (duraciones a 0) las apaga sin otra rama; además cada hook mira `prefers-reduced-motion: reduce` y no anima.
- Mejora progresiva: sin JS, sin WAAPI o sin View Transitions, todo se ve y funciona como antes (cambio directo).
- Nada nuevo en el ranking (W19 en paralelo): `useFlip` sin opciones queda igual y no se tocan `rank-list`, `rank-row`, `podium`, `lib/rank-row.ts` ni `cinta-riesgo`.
**Why:** CLAUDE.md (animaciones solo `transform`/`opacity`; reduced motion → sin movimiento) y HANDOFF §6.
**Discarded alternative:** una librería de animación — dependencia nueva para lo que dan React, WAAPI y CSS.
