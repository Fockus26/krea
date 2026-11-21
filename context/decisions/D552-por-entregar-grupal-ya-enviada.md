# D552 · Data · La grupal que el equipo envió antes de que el alumno entrara no queda en «Por entregar» (Inicio y /tareas) · Implemented

**Decision:** `datosAlumno` trae además `delEquipo` (las grupales de su equipo actual en las que no figura) y `entregaParaListas` la usa en `tareasAbiertas`, `filasPorEntregar` y `tareasVista`: si el equipo ya la envió (o está evaluada) sale de «Por entregar» y va a «Entregadas» con la fecha de envío; un borrador del equipo o la de otro equipo no cuentan. Complementa D526 (que ya la mostraba en solo lectura en `/tareas/[tarea]`); no es su nota, así que no cambia notas ni ranking.
**Why:** D526 dejó la lista de /tareas en «Por entregar» mientras la tarea estuviera abierta, aunque su detalle dijera «tu equipo la envió»; contradictorio y empujaba a abrirla otra vez.
**Discarded alternative:** una sección aparte «Enviadas por tu equipo»: más UI por un caso raro; «Entregadas» ya dice la fecha.
