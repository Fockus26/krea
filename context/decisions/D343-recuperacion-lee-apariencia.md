# D343 · Backend · La recuperación lee nombre y apariencia en una sola consulta (`leerPerfil`); una apariencia inválida va como azul en claro · Implemented

**Decision:** `DepsRecuperacion.leerNombres` pasa a `leerPerfil(cedula) → { nombres, apariencia }`; `depsRecuperacion` selecciona `usuarios.nombres` y `usuarios.apariencia` juntos y valida la apariencia con `zApariencia` (si no valida, `null`). `procesarRecuperacion` la pasa a `correoRestablecer`. El flujo no cambia: misma respuesta, mismo límite, mismo `after`, nada se registra.
**Why:** una consulta en vez de dos; el jsonb no garantiza forma y un valor roto no puede impedir que el alumno recupere su cuenta. El correo solo usa acento y tema: ningún dato nuevo del alumno sale en el correo.
**Discarded alternative:** un `leerApariencia` aparte — otra ida a la base para la misma fila.
