# feat/sec-evaluar — W3 (fase 04, ola 3) · PR #30 · 2026-10-30

Evaluar entrega: cabecera (eyebrow + Anterior/Saltar, logo/avatar 56, chips), medidor `LiveTotal` bar sticky en móvil y
card en el aside, índice de chips desde 6 preguntas, `<ol>` de `QuestionCardReview` con `ScorePicker`, «Guardar nota y
seguir» con motivo + Ctrl+Enter + toast «Nota guardada» con Deshacer, `ActionBar` móvil. API retrocompatible:
`GradePill` `size="total"` y `raspado` (D102); `NumberStepper` `value: null` + `aria-labelledby` (D103); `ScorePicker`
sin el rodeo de D055. También tocó `live-total.tsx` (fuera de la excepción, solo la tarjeta) y `lib/utils.ts`
(`TEXT_ROLES`). Lógica `lib/evaluar.ts`; datos `lib/demo/evaluar.ts` (`DemoEntrega`, `COLA` de 7). Vista
`/secciones/evaluar/[estado]` (7 estados), Toaster local en `app/secciones/evaluar/layout.tsx`. D102–D105.

- Verificado: typecheck, lint, test (352), build; `/componentes` y las 7 vistas estáticas, un `<h1>`/`<main>`; grep limpio. a11y por código.
- No verificado: teclado real, visual (QA final).
- Abierto: X «Salir de la evaluación» en `TopBar` móvil (fase 05); altos de sticky medidos del lienzo (62/68).
- Visto de paso: toast (88 px) se superpone a la `ActionBar` en móvil (D035 sin coordinar); `<kbd>` sin estilo en lienzo ni handoff.
