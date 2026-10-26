# design/handoff — Diseño completo + HANDOFF

**Fecha:** 25/10/2026 · **Rama:** `design/handoff` · **Base:** `main`

## Qué
- Lienzo de diseño (Claude Design canvas): https://claude.ai/artifact/FtZd2CDYpe3sjJhAqfwZkc — 45 tableros en 5 páginas (sistema, estudiante, profesor, estados, acentos). Todas las pantallas a 1440 y 390.
- `design/HANDOFF.md`: tokens con contrastes medidos, componentes, secciones, grilla, assets, estados, correo, movimiento, orden, trampas, 12 preguntas abiertas.
- `design/assets/brand/`: isotipo (la "a" del logo con gotas), favicon SVG claro/oscuro + PNG 16/32, apple touch 180, PWA 192/512/maskable.
- `design/canvas/`: markup de cada tablero + `krea.css` de referencia. Excluido del lint en `biome.json` (como `design/prototype`).

## Verificado
- Contraste AA de todos los pares en 4 acentos × claro/oscuro (script). Se corrigieron 2: texto acento sobre `accent-soft-2` (→ `--text`) y chips ok/warn (tinte 10 %).
- Sin scroll horizontal a 320/390/1440 en 16 pantallas (render local con Playwright).
- `bun run lint` verde.

## No verificado
- Render del lienzo publicado (la herramienta no lo permite sin pedirlo); a11y con axe sobre código real (no hay código aún).

## Decisiones
- Fórmula HSL de notas sobre los hex de control del brief (5 y 8 no coinciden).
- Puntaje con stepper cuando la pregunta vale > 6.
- Puntos de equipo = notas grupales ≥ 10 + ajustes al equipo.
