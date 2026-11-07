# D290 · Colors · La cinta de la zona de riesgo alterna `--error` con un tinte del mismo rojo · Implemented

**Decision:** `cinta-riesgo` usa `var(--error)` y `color-mix(in srgb, var(--error) var(--cinta-tinte), var(--bg))`, con `--cinta-tinte: 20%` (token nuevo junto a `--error`, igual en claro y oscuro). Sin `--warning`. Animación y reduced motion igual que D257. Reemplaza el color de D257 (decisión de César).
**Why:** pedido de César (47): el amarillo no combinaba y en oscuro se veía mal. Contraste como gráfico (≥ 3:1) comprobado en `tests/unit/contraste-tokens.test.ts` en 4 acentos × claro/oscuro: `--error` contra `--bg` y contra la raya suave (el rojo no depende del acento, así que el resultado es el mismo en los 4).
**Discarded alternative:** rojo con `--surface`/transparente: contra el fondo de la página se pierde la raya suave en oscuro.
