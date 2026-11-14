# D401 · Evaluar · «Corregir» una evaluación desde la ficha y la lista de entregas · Implemented

**Decisión:** corregir una evaluación hecha = abrir `rutaEntrega(id)` SIN `?ver` (la forma compartida; Evaluar ya muestra `EYEBROW_REEVALUAR`). En la ficha y en la lista de entregas cada entrega tiene «Ver» (`?ver`, solo lectura) y, al lado, «Corregir» si está evaluada o «Evaluar» si está por evaluar. Cada enlace lleva en su nombre accesible la tarea o el titular («Corregir la entrega de Logo»). La fila entera ya no es un único enlace: son dos acciones separadas, ambas ≥ 44 px en móvil (`Button sm`).
**Why:** antes la ficha solo abría `?ver`, sin camino a corregir; el profe tenía que buscar la entrega en la cola, donde ya no está.
