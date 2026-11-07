# D302 · Accessibility · Auditoría versionada del contraste texto/fondo en 4 acentos × claro/oscuro · Implemented

**Decision:** `scripts/qa/contraste-acentos.ts` (`bun run scripts/qa/contraste-acentos.ts`, sale 1 si algún par falla; `--json` para filas) lee los tokens de `app/globals.css`, recalcula los derivados (`color-mix` sRGB) y mide botones (primario, secundario, ghost; reposo, hover y activo), chips (`acc`, «tú») y podio (números, nombre/puntos, destello, corona). Umbral 4,5:1 para texto (también el número del podio, aunque sea grande) y 3:1 para gráficos. `tests/unit/contraste-acentos.test.ts` lo importa: cada par es un test, así un cambio de token que rompa un par falla en CI.
**Why:** pedido de César (53): probar los colores de fondo y texto por acento, no a ojo. Complementa `contraste-tokens.test.ts` (D236/D238) con los pares de botones, chips y podio.
**Discarded alternative:** ampliar solo `contraste-tokens.test.ts`: no deja una tabla que se pueda leer ni correr suelta.
