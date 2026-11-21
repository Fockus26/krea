# D526 · Data · Quien entró al equipo después de la entrega grupal la ve en solo lectura, sin nota suya · Implemented

**Decision:** si el alumno no figura en ninguna entrega de una grupal, `/tareas/[tarea]` lee la de su equipo actual (`entregaDelEquipo`, por `idEntrega(tarea, equipo)`) y la muestra como entregada con «Tu equipo la envió antes de que entraras…»; sin «Ver mi nota» ni «Editar entrega», y cada pregunta dice «No cuenta para tu nota» en vez de puntos o «Pendiente». Vale abierta o cerrada.
**Why:** caía en `lector` con «aparecen aquí cuando se envíen» aunque ya se había enviado (backlog L28); la nota sigue siendo solo de los integrantes de la entrega (D221, D396).
**Discarded alternative:** mostrarle los puntos del equipo por pregunta: parecería su nota. La lista de /tareas no cambia (sigue en «Por entregar» mientras esté abierta): va en «Vistos de pasada».
