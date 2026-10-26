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

Con `prefers-reduced-motion: reduce`: duraciones a 0, sin confeti ni temblor; el cambio de
puesto se anuncia con texto ("subió 2 puestos") en una región `aria-live="polite"`.
