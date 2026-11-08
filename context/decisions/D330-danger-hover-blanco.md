# D330 · Colors · Rellenos error/success verificados por prueba versionada, incluido el hover de danger · Implemented

**Decision:** `tests/unit/contraste-rellenos.test.ts` (como D238) lee `app/globals.css` y comprueba, en claro, oscuro explícito y oscuro por sistema: texto/relleno ≥ 4,5:1, relleno vs `--bg` y `--surface` ≥ 3:1, y el hover de danger (`brightness-92`, que multiplica cada canal) con blanco ≥ 4,5:1. `contraste-tokens.test.ts` ahora mide `--on-error` sobre `--error-fill`. El hover queda en `brightness-92`: oscurecer solo sube el contraste del blanco.
**Why:** cualquier cambio futuro de los tokens que rompa el blanco sobre estos rellenos falla en CI.
**Discarded alternative:** medir a ojo o solo en el PR.
