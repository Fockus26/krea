# fix/grupal-cambio-equipo · PR #66 · 2026-11-06

**Qué:** `enviarEnTransaccion` lee en la misma transacción las demás entregas de la tarea y `armarEntrega` deja fuera a quien ya está en otra entrega enviada (`enOtraEntrega`, D221, regla (a) de César).
**Repro:** caso nuevo en `tests/rules/entregas.test.ts`: FAIL con el código de main, PASS en la rama. 765 unitarias + 53 de emulador.
**No verificado:** el repro por la interfaz (`wt2/.qa/repro/3-…`).
**Abierto:** el capitán movido tras una entrega no puede enviar la del equipo nuevo desde la interfaz (ya pasaba antes). No hay migración para dobles que ya existan.
**Producción tras #62–#65:** galerías 404 (repro PASS); `/ingresar` y `/recuperar` con `method="post"` en el HTML. El repro 4b/5b ya no sirve en producción porque usaba `/componentes`.
