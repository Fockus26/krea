# feat/sec-ranking — W1 (fase 04, ola 3) · PR #28 · 2026-10-30

Ranking estudiantes/equipos: encabezado con chip «En vivo» (≥ 1024) y segmentados como enlaces (`SegmentedLinks`, variante
profesor 5A/5C), podio en card hero, lista 4–N con zona de riesgo, aside «Cómo se calculan» + «Últimos movimientos»
(`aria-live`, solo ≥ 1024), `<details>` móvil con memoria en `krea-ranking-ayuda`. Lógica en `lib/ranking-vista.ts`
(19 pruebas), datos en `lib/demo/ranking.ts`; vista `/secciones/ranking/[estado]` con 6 estados. D094–D097. Sin tocar
`globals.css` ni componentes compartidos.

- Verificado: typecheck, lint, test (335), build; HTML generado (un `<h1>`, 3 `<ol>`, separador, asides, `aria-current`); grep limpio. a11y por código.
- No verificado: nada en navegador.
- Pendiente: chip «En vivo» en la `TopBar` móvil (fase 05); `RankAnnouncer`/toast bajo 1024 con datos en vivo (fase 07).
- Visto de paso: el seed de 5C no tiene notas evaluadas → todos empatan en 0 (vista `profesor-5c` degenerada: todos puesto 1 y en riesgo).
