# D534 · Data · `sinParte` al enviar se calcula sobre el reparto vigente · Implemented

**Decision:** `enviarEnTransaccion` calcula `sinParte` con `sinParteAlEnviar`: `sinParteDe` sobre `partesVigentes(reparto, miembros, capitanId)`, como la vista (`repartoVista`) y `repartoParaEnviar`. Hoy el resultado no cambia (los integrantes de una entrega nueva salen del equipo actual, y la parte de quien se fue o pasó a capitán ya quedaba fuera por `integrantes` o por ser quien envía); la prueba fija eso y el caso en que sí cambia: la parte de alguien que ya no es del equipo no lo marca aunque siga en `integrantes`.
**Why:** las tres lecturas del reparto deben decir lo mismo sobre quién tiene una parte (D421); `sinParteDe` recibía el reparto sin filtrar (backlog L62, Bajo).
**Discarded alternative:** dejarlo como está porque hoy da lo mismo — un cambio futuro en cómo se arman `integrantes` (D396) volvería a marcar a quien ya no está.
