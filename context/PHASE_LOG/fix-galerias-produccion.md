# fix/galerias-produccion · PR #65 · 2026-11-06

**Qué:** layout con `notFound()` en `/secciones`, `/componentes` y `/tokens` si no es desarrollo ni vista previa (`lib/galerias.ts`, D220). `galeriaEstadosVisible` queda como alias.
**Repro:** `krea-wt/wt5/.qa/repro/d-a4-galerias-produccion.sh` (curl a `krea-hazel.vercel.app`). En main: FAIL, 4 galerías con 200. El PASS solo se puede ver después del merge.
**Prueba:** `tests/unit/galerias.test.ts`. Sin los layouts: 6 fail; con ellos: 7 pass. Suite completa: 763 pass.
**Pendiente:** correr el repro en producción después del merge.
