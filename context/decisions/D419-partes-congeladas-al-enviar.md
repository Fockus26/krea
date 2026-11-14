# D419 · Data · Con la entrega enviada (o la tarea cerrada) el reparto queda congelado · Implemented

**Decision:** toda acción de partes devuelve `enviada` si la entrega del equipo ya existe y no es borrador (`repartoCongelado`), o si la fila existe y no valida; `cerrada` si la tarea ya no está abierta. La subida de imagen del integrante también se corta. El capitán edita la entrega enviada como siempre (D395) sin tocar las partes. Si el profe elimina la entrega (X1), el reparto vuelve a estar activo tal cual estaba; si la devuelve (X1, `entregada` sin evaluación), sigue enviada y congelada.
**Why:** lo que se evalúa es la entrega; cambiar partes después movería `sinParte` sin que nadie lo vea.
**Discarded alternative:** borrar las partes al enviar — se perdería el rastro si el profe elimina la entrega y el equipo tiene que volver a enviarla.
