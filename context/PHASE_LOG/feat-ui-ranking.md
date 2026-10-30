# feat/ui-ranking — W7 (fase 03, ola 3) · PR #17 · 2026-10-30

RankRow (top, propia, normal, riesgo, empate; estudiante/equipo), RankDelta, RankList con separador de riesgo en dos `<ol>`,
Podium 2-1-3 de estudiantes y equipos con empates, RankAnnouncer, `useFlip` + `lib/flip.ts`, dos bloques en `globals.css`
(«Ranking: medidas» con `--r-rank`, `rounded-rank`, `rounded-pod-step` y tipografías; y movimiento: `animate-glow`,
`data-moving`). Familia `/componentes#ranking` con simulador. D050–D053. Pruebas: `rank-row.test.ts`, `flip.test.ts`.

- Verificado: typecheck, lint, test (169), build; grep limpio. a11y por código.
- No verificado: nada en navegador (acentos × tema, 320 px, FLIP, glow, reduced motion).
- Pendiente (ranking en vivo): conteo de puntos, chip ▲n 10 s, confeti, toast, región viva conectada a datos reales.
- Visto de paso: el reset de Tailwind quita `list-style` a `ol/ul` (Safari/VoiceOver puede perder la semántica de lista) — decisión global; `cn` no fusiona tipografías propias con las de Tailwind.
