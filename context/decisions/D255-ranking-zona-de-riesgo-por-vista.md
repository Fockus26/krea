# D255 · Ranking · La zona de riesgo depende de la vista: estudiantes 5 últimos, equipos solo el último · Implemented

**Decision:** `rankCompetition(lista, zona = ZONA_RIESGO)` recibe el tamaño de la zona (5 por defecto; `ZONA_RIESGO_EQUIPOS = 1`). En equipos, riesgo = el último puesto con sus empatados. Lo usan Ranking en vivo, la demo y la galería.
**Why:** con 5–8 equipos por sección, 5 en riesgo era casi todos. Pedido de César (18).
**Discarded alternative:** un `if` por vista en el componente: la regla vive en la función pura y se prueba.
