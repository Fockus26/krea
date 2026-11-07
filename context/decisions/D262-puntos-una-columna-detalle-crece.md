# D262 · Puntos · Formulario en una columna (Motivo → Puntos → Detalle) y `Textarea autoGrow` que crece con el texto · Implemented

**Decision:** Puntos y Detalle van uno bajo el otro a todo el ancho (`flex-col gap-6`). `Textarea` gana `autoGrow`: `field-sizing: content` con mínimo de `compact` y `max-h-60` con scroll; sin soporte del navegador, un `useLayoutEffect` ajusta el alto. Solo el Detalle de Puntos lo usa.
**Why:** César eligió una columna; el Detalle debe crecer con lo escrito. Otros textarea de texto libre parecidos (respuesta de pregunta, comentario de evaluación, editor de pregunta, Editar alumno) quedan sin cambio, reutilizable luego.
