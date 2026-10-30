# feat/sec-profe-panel — W2 (fase 04, ola 3) · PR #29 · 2026-10-30

Panel del profesor: saludo por hora (`saludoPorHora`, cortes 5–11/12–18/19–4, «profe»), segmentado 5A·5C·Ambas como
`ToggleGroup` que filtra en cliente con `<output>`, métricas `g3` como tarjetas enlace (Raspados con TriangleAlert),
«Por evaluar» (5 filas como el lienzo, «Ver las 7») y «Últimos ajustes» (chip «N pts» con Plus/Minus). Lógica en
`lib/panel.ts` (17 pruebas); datos en `lib/demo/panel.ts` y `lib/demo/ajustes.ts` (`DemoAjuste`, para la ola 4).
Vista `/secciones/profe/[estado]` (manana/tarde/noche/5c). D098–D101. Sin tokens nuevos.

- Verificado: typecheck, lint, test (333), build; HTML (un `<h1>`, dos `h2`, tres tarjetas enlace, «Evaluar a …», «más 2 puntos»); grep limpio. a11y por código.
- No verificado: nada en navegador.
- Nota: la 1.ª entrega se titula «Logo y paleta del emprendimiento» (brief) frente a «Logo y paleta» del lienzo; W3 usa la misma.
