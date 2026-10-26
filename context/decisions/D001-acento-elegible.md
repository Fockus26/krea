# D001 · Colors · Acento elegible por el usuario (4 colores) + claro/oscuro/sistema · Pending

**Decision:** el acento es una variable (`--accent`, `--accent-ink`, `--accent-contrast`, `--krea-logo-ink`, `--krea-logo-splash`) con 4 valores: Rojo #EE0400, Verde #115445, Morado #734AD1, Azul #295AC3 (por defecto). En oscuro cada uno usa su tinte claro: #FF6B5E, #4FC4A6, #A98BF0, #7AA2F7. El rojo como texto en claro usa #C80300.
**Why:** pedido de César. #EE0400 sobre #F6F4FA da 4.13:1 (falla AA) → `accent-ink` #C80300 (5.55:1). En oscuro los 4 originales caen a 2–4:1 sobre #14121A; los tintes dan ≥ 6.6:1.
**Discarded alternative:** usar el acento sin ajustar en oscuro — 2.1:1 con el verde.
