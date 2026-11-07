# D259 · Ranking · Clic en un alumno: el profe va a su ficha, el estudiante ve una tarjeta de solo lectura · Implemented

**Decision:** filas y podio de la vista Estudiantes son interactivas. Profe: `<Link>` a `rutaAlumnos({ alumno, seccion })` (abre la ficha, D254). Estudiante: botón que abre `CompaneroCard` (Dialog): avatar, nombre, equipo, puesto, puntos; **nunca notas** ni lecturas nuevas. La fila propia también abre la tarjeta. El nombre accesible pasa del `<li>` al enlace/botón. El diálogo guarda el id y se resuelve contra las filas en vivo: no se cierra con las actualizaciones y sigue a la fila si se mueve. Vista Equipos: sin cambio.
**Why:** pedido de César (10); en el estudiante no se expone nada que no esté ya en el ranking.
