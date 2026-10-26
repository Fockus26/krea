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

## Rules

- Any font size not in this table is a new decision — record it in
  `decisions/D0NN-<topic>.md` before using it.
- Todo número mostrado lleva decimales con coma (`18,5`): `Intl.NumberFormat('es-VE')`.
