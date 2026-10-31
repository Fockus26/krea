# feat/sec-premios — F04 ola 4 · W4 (PR #31)

Premios del profesor. `lib/premios.ts` (estado del premio con `ganadorPremio`, `resolverEmpate`, textos), `lib/demo/premios.ts`,
`components/sections/premios/` (`PrizeCardTeacher`, `PrizesBoard`), vista `/secciones/premios` (→ `/profe/premios`) con Toaster local.
4 estados + «Compartido». D122–D125. Tests 416 pass; build/lint/typecheck OK; sin QA visual (decisión de César).
Abierto: menú de empate (D123), «Compartido» provisional (D124), foco al h3 con `onCloseAutoFocus` (D125, sin probar en vivo);
«vence» toma la fecha de `TAREAS` (07/11/2026), no la del lienzo. D086 sigue abierta.
