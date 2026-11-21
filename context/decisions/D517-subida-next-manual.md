# D517 · Data · La subida de Next se hace a mano con bun y en su propio PR, sin `next upgrade --agent` · Implemented

**Decision:** se edita la versión de `next` y se corre `bun install` (o `bun add --exact next@<v>`); no se ejecuta `next upgrade --agent` ni lo que sugiera el aviso sin entenderlo. La subida va en un PR propio (solo `package.json` y `bun.lock`).
**Why:** decisión de César (2026-11-21, L78): una subida de dependencia crítica debe poder revisarse y revertirse sola, y el comando automático toca más de lo necesario.
**Discarded alternative:** `next upgrade --agent` — aplica codemods y cambios que no se revisan antes.
