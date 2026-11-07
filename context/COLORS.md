# Colors — KREA

> Ratios calculados con la fórmula WCAG 2.1. El **acento** lo elige el usuario (D001); todo
> lo demás es neutro y fijo. Escala de notas: D004.

## Accents (user-selectable)

| Acento | Light `accent` (botones, superficies) | Light `accent-ink` (texto sobre fondo) | Dark `accent` | `splash` (gotas del logo, decorativo) |
|---|---|---|---|---|
| Rojo | #EE0400 — blanco encima 4.51:1 | #C80300 — 6.05:1 en #FFFFFF, 5.55:1 en #F6F4FA | #FF6B5E — 6.64:1 en #14121A | #FFC23D |
| Verde | #115445 — blanco 8.83:1 | #115445 — 8.09:1 en #F6F4FA | #4FC4A6 — 8.64:1 | #A0F25A |
| Morado | #734AD1 — blanco 5.79:1 | #734AD1 — 5.30:1 en #F6F4FA | #A98BF0 — 6.75:1 | #FF8AD8 |
| Azul (default) | #295AC3 — blanco 6.28:1 | #295AC3 — 5.75:1 en #F6F4FA | #7AA2F7 — 7.37:1 | #00E5F5 |

En oscuro, el texto sobre un botón de acento es `#14121A` (no blanco); los ratios de la
columna "Dark" son iguales en ambos sentidos.

## Light mode

| Role | Hex | Use | Contrast verified against |
|---|---|---|---|
| primary.main | var(--accent) | CTAs, links activos, tab activo | ver tabla de acentos |
| secondary.main | #FFC23D (amarillo KREA) | premio, chip "Capitán" | texto #221D2B encima → 11.2:1 |
| background.default | #F6F4FA | fondo de la app | — |
| background.paper / surface | #FFFFFF | tarjetas, paneles, tablas | — |
| text.primary | #221D2B | texto | #F6F4FA → 15.05:1 |
| text.secondary | #5E5869 | metadatos, ayudas | #F6F4FA → 6.26:1 · #FFFFFF → 6.83:1 |
| text.disabled | #8C8697 | deshabilitado (siempre con otro indicio) | #FFFFFF → 3.52:1 |
| success.main | #157A3B | "Entregado", "Aprobado" (+ icono ✓) | #FFFFFF → 5.4:1 |
| warning.main | #9A5B00 | "Pendiente" (+ icono reloj) | #FFFFFF → 5.6:1 |
| error.main | #C80300 | errores, "Raspado" (+ icono) | #FFFFFF → 6.05:1 |
| info.main | #295AC3 | avisos | #FFFFFF → 6.28:1 |
| divider | #E6E2EE | bordes decorativos de tarjetas | — |
| input border | #8C8697 | borde de input | #FFFFFF → 3.52:1 (≥ 3:1) |
| selection.bg / selection.text | #E4DCF7 / #221D2B | `::selection` | 12.4:1 |
| scrollbar.thumb / scrollbar.track | #7A7486 / #ECE9F2 | scrollbar | 3.6:1 |

## Dark mode

| Role | Hex | Use | Contrast verified against |
|---|---|---|---|
| primary.main | var(--accent) (tinte claro) | CTAs | ver tabla de acentos |
| secondary.main | #FFC23D | premio, capitán | #14121A → 11.5:1 |
| background.default | #14121A | fondo | — |
| background.paper / surface | #1E1B26 | tarjetas | — |
| text.primary | #F4F1F8 | texto | #14121A → 16.6:1 |
| text.secondary | #ABA5B8 | metadatos | #14121A → 7.78:1 · #1E1B26 → 7.10:1 |
| text.disabled | #6E687A | deshabilitado | — |
| success.main | #5BD68A | | #14121A → 10.3:1 |
| warning.main | #FFC23D | | #14121A → 11.5:1 |
| error.main | #FF6B5E | | #14121A → 6.64:1 |
| info.main | #7AA2F7 | | #14121A → 7.37:1 |
| divider | #2E2A38 | | — |
| input border | #8A8496 | | #1E1B26 → 4.6:1 |
| selection.bg / selection.text | #3B3350 / #F4F1F8 | `::selection` | 11.0:1 |
| scrollbar.thumb / scrollbar.track | #6E687A / #1E1B26 | | 3.3:1 |

## Grade scale (D004)

Degradado continuo, no por rangos. `gradeColor(n)` en HSL:
- 1 → 10: tono 0° → 52°, saturación 100 %, luminosidad 52 % → 48 % (rojo intenso → amarillo intenso).
- 10 → 20: tono 52° → 140°, saturación 100 % → 70 %, luminosidad 48 % → 34 % (amarillo → verde intenso).
- Puntos de control: 1 #FF0A0A · 5 #F55E00 · 8 #F5A500 · 10 #F5D400 · 12 #BDE007 · 15 #57C110 · 18 #17A51C · 20 #1A9342.
- **El color es el fondo de la píldora, nunca el color del texto.** Texto encima: `gradeInk(n)` elige
  #111111 (`--grade-ink`) o #FFFFFF (`--grade-ink-on-dark`), la de más contraste, en negrita ≥ 14 px
  (hoy siempre #111111: peor caso 20 → 4.76:1; D236).
- Nunca solo color: el número siempre visible y, si < 10, la etiqueta "Raspado".
- Sin nota (no entregado): píldora neutra con borde punteado y el texto "Pendiente".

## Contrast notes

- D001: #EE0400 como texto sobre #F6F4FA da 4.13:1 → el texto rojo usa `accent-ink` #C80300.
- Las gotas (`splash`) son decorativas y no tienen requisito de contraste (el logo tiene `<title>`).
- **Texto normal sobre `accent-soft-2` va en `--text`**, no en el acento (con los tintes de antes `accent-ink` ahí daba 4,09:1 en rojo claro y 3,77:1 en morado oscuro; desde D236 con 16/18 % llega a 4,5:1 en los 4 acentos y lo vigila `tests/unit/contraste-tokens.test.ts`). Sobre `accent-soft` sí vale `accent-ink` (≥ 4,74:1).
- **Acento lleno (botón primario, chip «tú», 1.º del podio)**: texto `--on-accent`. En oscuro es blanco y `--accent` es un relleno oscurecido (azul #5773AF, rojo #BF5046, verde #34816E, morado #7D67B2; blanco ≥ 4,66:1); el tono claro de antes vive en `--accent-ink` (D301). El destello del podio va detrás del número y el del 1.º es una sombra (D303). Auditoría: `bun run scripts/qa/contraste-acentos.ts` (D302).
- `--grade-ink` es #111111 y `--grade-ink-on-dark` #FFFFFF en claro y oscuro (no se invierten). `::selection` = acento al 22 % (claro) / 40 % (oscuro) sobre `--bg`, texto `--text` (D236). El toast sí invierte (`--toast-bg`/`--toast-text`).

## Implementación (`app/globals.css`, D015–D016)

Los hex viven solo en `globals.css` (un test lo comprueba). Variables CSS = nombres del handoff
(`--bg`, `--surface`, `--accent`…); Tailwind las expone con `@theme inline` como `--color-*`:
clases `bg-bg`, `bg-surface`, `bg-surface-2/3`, `text-text`, `text-text-2`, `text-text-dis`,
`border-divider`, `border-input`, `text-success|warning|error`, `bg-secondary`,
`text-on-secondary`, `text-grade-ink`, `bg-accent`, `text-on-accent`, `text-accent-ink`,
`bg-accent-soft`, `bg-accent-soft-2`, `bg-accent-hover`, `bg-splash`, `bg-chip-ok|warn|err|prize`,
`bg-alert-err|warn|ok`, `bg-toast-bg`, `text-toast-text`.

- Tema: `<html data-theme="light|dark">`; sin atributo = sistema (`prefers-color-scheme`).
  Acento: `<html data-accent="rojo|verde|morado">` (azul = sin atributo o `azul`). Se guardan
  en `localStorage` (`krea-theme`, `krea-accent`) y un script inline los aplica antes de pintar.
- Tintes: `color-mix(in srgb, <color> N%, var(--surface))` con N en `--tint-*` (acento 10/16 %
  claro y 12/18 % oscuro; card de premio 22/28 %; chips ok/warn 10 % claro y 14 % oscuro; err 12 %; premio 30/18 %;
  avisos 10/26/12 %, en oscuro sin medir todavía).
- Referencia visual: ruta `/tokens` (no indexada).
