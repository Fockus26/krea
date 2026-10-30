# Design Tokens — KREA

## Spacing

Base unit: 4px

| Token | Value |
|---|---|
| spacing.xs | 4px |
| spacing.sm | 8px |
| spacing.md | 16px |
| spacing.lg | 24px |
| spacing.xl | 32px |
| spacing.2xl | 48px |

## Border radii

| Token | Value | Use |
|---|---|---|
| radius.sm | 10px | inputs, chips |
| radius.md | 16px | cards, buttons |
| radius.lg | 24px | modales, tarjeta de nota destacada, podio |
| radius.full | 999px | píldoras de nota, avatares |

## Shadows

| Token | Value | Use |
|---|---|---|
| shadow.sm | 0 1px 2px rgb(34 29 43 / .06), 0 2px 8px rgb(34 29 43 / .05) | tarjetas |
| shadow.md | 0 6px 20px rgb(34 29 43 / .10) | dropdown, popover, fila del ranking en movimiento |
| shadow.lg | 0 18px 48px rgb(34 29 43 / .18) | modal, sheet |

En oscuro las sombras pasan a negro con opacidad .4 y las tarjetas se separan por `surface`.

## Breakpoints

See `DESIGN_RULES.md` — they must match exactly; this file does not redefine them.

## Transitions / animation

| Token | Value |
|---|---|
| duration.fast | 150ms |
| duration.normal | 250ms |
| duration.rank | 600ms (cambio de puesto en el ranking, FLIP) |
| duration.celebrate | 1200ms (confeti del top 3) |
| easing.default | cubic-bezier(.2, .8, .2, 1) |
| easing.bounce | cubic-bezier(.34, 1.56, .64, 1) (podio, dado del avatar) |

## Implementación (`app/globals.css`, D016–D017)

| Concepto | Variable CSS | Clase Tailwind |
|---|---|---|
| Espaciado | escala por defecto de Tailwind (4 px); pasos del handoff (4 6 8 12 16 20 24 32 40 48 56 64 80 px) = `1 1.5 2 3 4 5 6 8 10 12 14 16 20` | `p-4`, `gap-6`… (6 px solo gap ícono-texto: `gap-1.5`) |
| Radios | `--r-sm` 10 · `--r-nav` 12 · `--r-md` 16 · `--r-lg` 24 · `--r-full` 999 | `rounded-sm`, `rounded-nav`, `rounded-md`, `rounded-lg`, `rounded-pill` (sobrescriben los de Tailwind) |
| Sombras | `--shadow-1..3` (cambian en oscuro) | `shadow-1`, `shadow-2`, `shadow-3` |
| Duraciones | `--d-fast/normal/rank/celebrate` | `duration-fast`, `duration-normal`, `duration-rank`, `duration-celebrate` |
| Curvas | `--ease`, `--bounce` | `ease-krea`, `ease-bounce` |
| z-index | `--z-table-head` 1 · `--z-rank-moving` 2 · `--z-sticky` 20 · `--z-action-bar` 25 · `--z-topbar` 30 · `--z-popover` 40 · `--z-offline` 40 · `--z-overlay` 50 · `--z-toast` 60 | `z-table-head`, `z-sticky`, `z-topbar`… |
| Breakpoint extra | `--breakpoint-3xl` 1920 px | `3xl:` |

En oscuro la tarjeta en reposo pierde sombra marcada y gana borde 1 px `--divider`: lo aplica
el componente Card (fase 03). Foco global: `outline: 2px solid var(--focus)` (`--focus` = `--accent-ink`),
offset 2 px. Selección y scrollbar (10 px, thumb 999 px) en `globals.css`.

Con `prefers-reduced-motion: reduce`: duraciones a 0, sin confeti ni temblor; el cambio de
puesto se anuncia con texto ("subió 2 puestos") en una región `aria-live="polite"`.
