# fix/validacion-espacios · PR #67 · 2026-11-06

**Qué:** `validarEdicion` exige primer nombre/apellido si vienen; `validarPassword` trata solo espacios como vacía.
**Repro:** unitarias 2 fail en main / pass en rama; UI `8-…` y `10-…` PASS con qa:local (ids regenerados con `ids2.mjs`).
