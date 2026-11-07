# D320 · Data · `decisionesPremio` pasa a registro por código de sección · Implemented

**Decision:** `zDecisionesPremio = z.record(zSeccion, zDecisionPremio)` en vez de un objeto con claves fijas `"5A"`/`"5C"`. Lee igual los documentos guardados (`{ "5C": { tipo: "dar", … } }`), una clave ausente sigue dando `undefined` (`t.decisionesPremio?.[seccion]`) y una clave que no es código («5a») no valida.
**Why:** con el catálogo (D317) el premio se decide en cualquier sección que exista; las claves fijas rechazarían la decisión de una sección nueva.
**Discarded alternative:** `z.partialRecord`: mismo resultado en ejecución; el registro es la forma del brief compartido de X5 y el tipo `Record<string, DecisionPremio>` no cambia a quien ya lo lee con `?.`.
