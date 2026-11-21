# D524 · Tests · Las pruebas que recorren `app/` y `components/` llevan timeout explícito de 20 s · Implemented

**Decision:** `tests/unit/formularios-post.test.ts` pasa `20_000` como timeout a su `test`; el recorrido síncrono se mantiene.
**Why:** con la máquina cargada (varios workers) el recorrido pasaba de los 5 s por defecto y fallaba sin que el código estuviera mal (L44).
**Discarded alternative:** reescribir con `Bun.Glob` — cambia la prueba por un problema que el timeout resuelve.
