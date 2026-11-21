# D518 · A11y · El stepper de puntos anuncia «más 2 puntos» / «menos 1,5 puntos» y parte de 0 desde «sin valor» · Implemented

**Decision:** `NumberStepper` acepta `formatValueText` (texto del `aria-valuetext` con valor) y `startAt` (desde «sin valor», de dónde parte el primer −/+; por defecto `min`, D103). `PuntosStepper` pasa `puntosValueText` y `startAt={0}`; desaparece el truco de la dirección del último clic. Cédula en listas: `cedulaPuntos` (`lib/perfil.ts`) reemplaza el `replace` de `lib/alumnos.ts`.
**Why:** el lector decía «−1,5» sin signo hablado y el primer − desde vacío daba −20 corregido a mano por el envoltorio.
**Discarded alternative:** una prop `signed` booleana — no cubre el texto «puntos» ni el singular.
