# fix/entrega-imagen · PR #75 · 2026-11-06

**Qué:** error `almacen` (subidas, logo); `Almacen.existe` (HEAD) + `comprobarImagenes` al enviar → `imagen-falta` (D229).
**Repro:** `9-…` y `5-…` FAIL main / PASS rama (qa:local sin B2). HEAD contra B2 real sin verificar: la clave necesita lectura.
