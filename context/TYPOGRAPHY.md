# Typography — KREA

## Families

- Heading: Poppins — 600/700 (geométrica, eco del "Escuela Creativa" del logo)
- Body: Nunito Sans — 400/600/700 (redondeada, legible en pantallas pequeñas)
- Números (notas, puntos, ranking): Poppins 700 con `font-variant-numeric: tabular-nums`

## Scale (mobile-first)

| Level | xs (mobile) | md (tablet) | 1920px+ (large desktop) | Line-height | Letter-spacing |
|---|---|---|---|---|---|
| display (nota grande) | 48px | 56px | 64px | 1 | -0.02em |
| h1 | 26px | 32px | 38px | 1.2 | -0.01em |
| h2 | 21px | 24px | 28px | 1.25 | -0.005em |
| h3 | 18px | 19px | 21px | 1.3 | 0 |
| body | 16px | 16px | 17px | 1.55 | 0 |
| small/caption | 13px | 13px | 14px | 1.4 | 0 |
| eyebrow/label | 12px | 12px | 13px | 1.3 | 0.08em, uppercase |

## Implementación (D017)

Fuentes con `next/font/google` (`display: swap`, `latin` + `latin-ext`) en `app/layout.tsx`:
Poppins 600/700 → `--font-poppins`, Nunito Sans 400/600/700 → `--font-nunito`; Tailwind:
`font-heading`, `font-body` (respaldo `system-ui, sans-serif`). La tabla de arriba es la
aproximación original; los valores exactos (px/px) son los de HANDOFF §1.4 y viven en
`globals.css` como utilidades por rol, en rem, cambiando en ≥ 768 px y ≥ 1920 px (`3xl`):

| Utilidad | < 768 | ≥ 768 | ≥ 1920 | Fuente · tracking |
|---|---|---|---|---|
| `text-display` | 48/56 | 56/64 | 64/72 | Poppins 700 · −0,02em |
| `text-h1` | 26/32 | 32/40 | 38/46 | Poppins 700 · −0,01em |
| `text-h2` | 21/28 | 24/32 | 28/36 | Poppins 600 |
| `text-h3` | 18/24 | 19/26 | 21/28 | Poppins 600 |
| `text-h4` | 16/22 | = | = | Poppins 600 |
| `text-body` / `text-body-strong` | 16/24 | = | 17/26 | Nunito Sans 400 / 700 |
| `text-label` | 14/20 | = | = | Nunito Sans 700 |
| `text-small` / `text-small-b` | 13/18 | = | 14/20 | Nunito Sans 400 / 700 |
| `text-eyebrow` | 12/16 | = | = | Nunito Sans 700 · MAYÚSCULAS · +0,08em |
| `text-button` / `-sm` / `-lg` | 15 / 14 / 16 · lh 20 | = | = | Nunito Sans 700 |
| `text-grade-sm/md/lg` | 14 / 16 / 22 · lh 20 | = | = | Poppins 700 |
| `text-grade-xl` | 56/64 | 64/64 | = | Poppins 700 |

`nums` = `font-variant-numeric: tabular-nums` (display y píldoras ya la incluyen). h5–h6 no se usan.

## Rules

- Any font size not in this table is a new decision — record it in
  `decisions/D0NN-<topic>.md` before using it.
- Todo número mostrado lleva decimales con coma (`18,5`): `Intl.NumberFormat('es-VE')`.
