# D435 · UX · La ideal de un alumno se muestra con su nombre y avatar, sin pedirle permiso · Implemented

**Decision:** por pedido de César, no se pide permiso al alumno. El formulario del profe (`/profe/tareas/[id]/ideal?entrega=…`) muestra arriba el autor y un aviso (Alert `warn`), y al guardar abre un diálogo: «Cuando la tarea cierre, toda la sección verá estas respuestas con el nombre y el avatar de … No verán su nota ni tus comentarios.» (en grupal, el nombre y el logo del equipo).
**Why:** el profe tiene que saber lo que expone antes de hacerlo; el diálogo lo dice en el momento de la acción.
**Discarded alternative:** opción «mostrar sin nombre» — no se pidió y abre una tercera forma de la ideal.
