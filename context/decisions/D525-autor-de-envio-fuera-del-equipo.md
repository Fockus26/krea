# D525 · Data · Grupal enviada por quien ya no está en el equipo: su nombre corto o «alguien que ya no está en el equipo» · Implemented

**Decision:** `entregaVista` busca a quien envió (`enviadaPor`) también fuera de los integrantes actuales: el servidor lee su nombre (`autorDeEnvio`, solo un alumno de su sección, solo nombres y apellidos) y la vista muestra su nombre corto; si no se encuentra, «La envió alguien que ya no está en el equipo» con la fecha. El texto del Excel queda solo para `enviadaPor = null`.
**Why:** con `quien = null` salía «se cargó con la nota, sin el registro del envío», que es falso (backlog L27).
**Discarded alternative:** solo el texto genérico sin buscar el nombre: más simple, pero el alumno pierde un dato que ya ve en el ranking.
