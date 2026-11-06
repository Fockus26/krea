# fix/evaluacion-version · PR #70 · 2026-11-06

**Qué:** `version` (evaluadaEn al abrir) en `zGuardarEvaluacion`; `armarEvaluacion` → `cambio` si no es la vigente (D224).
**Repro:** `wt1/.qa/repro/7b-correccion-por-la-interfaz.mjs` FAIL con main (20 → 0 sin aviso), PASS en la rama; emulador 2 fail main / 54 pass.
**Fuera:** Editar alumno sigue «el último gana».
