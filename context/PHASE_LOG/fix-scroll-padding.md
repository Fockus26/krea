# fix/scroll-padding · PR #68 · 2026-11-06

**Qué:** `scroll-padding-bottom` del documento = barra inferior + zona segura + 1rem (<lg, alto ≥ 30rem), D222.
**Repro:** `wt1/.qa/repro/6-foco-tapado-barra.mjs` FAIL 4 con el CSS de main, PASS en la rama (mismo servidor, HMR).
