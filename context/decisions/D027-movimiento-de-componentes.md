# D027 · Components · Movimiento de componentes: keyframes `k-*` y utilidades `animate-*` en globals.css, para los estados de Radix · Implemented

**Decision:** bloque "Movimiento de componentes" en `app/globals.css` (HANDOFF §6), solo `transform`/`opacity`, duraciones y curvas de tokens. Utilidades (se combinan con `data-[state=open]:` / `data-[state=closed]:`):

| Utilidad | Para | Entra / sale | Reducido |
|---|---|---|---|
| `spinner` | aro del `Spinner` (borde 2,5 px, `--d-spin` 800 ms lineal) | — | quieto |
| `animate-skeleton` | pulso 1 → .45 → 1, `--d-skeleton` 1400 ms | — | quieto |
| `origin-trigger` | `transform-origin` = `--radix-{dropdown-menu,select,popover}-content-transform-origin` | — | — |
| `animate-pop-in` / `animate-pop-out` | select, menú, popover: opacidad + `scale(.96)` | `--d-fast` / `--d-exit` (100) | solo opacidad |
| `animate-overlay-in` / `animate-overlay-out` | overlay de diálogo y hoja | `--d-normal` / `--d-fast` | — |
| `animate-dialog-in` / `animate-dialog-out` | caja: opacidad + `translateY(.5rem)` + `scale(.98)` | `--d-normal` / `--d-fast` | solo opacidad |
| `animate-sheet-in` / `animate-sheet-out` | hoja inferior `translateY(100%)` | `--d-normal` / `--d-sheet-exit` (200) | solo opacidad |
| `animate-toast-in` / `animate-toast-out` | `translateY(1rem)` + opacidad / opacidad | `--d-normal` / `--d-fast` | solo opacidad |
| `animate-fade-in` | panel de pestañas, opciones nuevas del dado | `--d-fast` | — |
| `animate-accordion-in` | contenido de `details` `translateY(-.25rem)` | `--d-normal` | ninguna |
| `animate-live` | onda del punto "En vivo" `scale(1→2,6)`, `--d-live` 1600 ms | — | ninguna (onda oculta) |
| `animate-shake` | caer a zona de riesgo, `--d-shake` 400 ms, una vez | — | ninguna |
| `animate-pop` | avatar al podio `scale(.6→1)`, `--d-rank` con `--bounce` | — | ninguna |

Botón: `shadow-btn-primary`, `shadow-btn-outline`, `shadow-btn-outline-dis`, `translate-y-btn` (`--btn-depth` 2 px). Tokens nuevos: `--d-exit`, `--d-sheet-exit`, `--d-shake` (a 0 con reduced motion), `--d-spin`, `--d-skeleton`, `--d-live` (bucles: se apagan con `animation: none` dentro de la utilidad), `--w-btn-border`, `--w-spin-border`, `--btn-depth`.
**Why:** las olas 2–3 corren en paralelo y no tocan este bloque; un nombre por gesto evita que cada familia invente el suyo. Con reduced motion las duraciones ya valen 0 (D017) y además las entradas cambian a keyframes solo de opacidad, para que nunca haya desplazamiento. El spinner queda quieto con reduce porque el estado ya lo dicen `aria-busy` y la etiqueta en gerundio ("reduced motion → texto").
**Discarded alternative:** `tw-animate-css` (lo trae shadcn) — sus duraciones y curvas no son las nuestras y anima sin respetar los tokens. El brillo `k-glow` del lienzo anima `box-shadow` y el FLIP del ranking es de JS: quedan para `feat/ui-ranking`.
