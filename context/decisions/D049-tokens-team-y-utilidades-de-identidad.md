# D049 · Tokens · Bloque «Identidad» en globals.css: `--team-1…6`, anillos y utilidades de avatar/logo · Implemented

**Decision:** un bloque propio antes de «Tailwind v4: exposición de los tokens» con `--team-1…6` (#8A3B12 · #1F5E8C · #6A3FB0 · #0E6B5C · #A3361F · #295AC3, blanco encima ≥ 6,28:1; fijos, no siguen tema ni acento), `--team-ink`, `--team-edge` (`rgb(0 0 0/.08)`), `--ring-sep`/`--ring-you`, su `@theme inline` (`bg-team-N`) y las utilidades `shadow-avatar-ring`, `shadow-avatar-sep`, `shadow-team-edge`, `cq-size`, `text-cq-avatar` (38 %), `text-cq-team` (42 %), `text-stack-count`, `rounded-team` (28 %), `krea-mask-*`, `krea-iso-*`.
**Why:** `tests/unit/tokens.test.ts` prohíbe hex fuera de `globals.css`; las unidades de contenedor evitan escribir el tamaño de letra por cada lado.
**Discarded alternative:** tamaño de letra calculado en JS con `style` en línea — ruido por componente y valores en píxeles sueltos.
