# D400 · Alumnos · La ficha separa Individuales y Grupales con puntaje y nota · Implemented

**Decisión:** en la ficha (Editar alumno), «Tareas entregadas» se divide en dos listas con subtítulo, Individuales y Grupales (sin ninguna: «Ninguna todavía.»). Cada entrega muestra título, «Puntaje 17,5 / 20» (o «Por evaluar»), «No participó» si aplica y la nota en `GradePill`. `EntregaDeAlumno` suma `puntaje`, `estado` y `noParticipo`.
**Why:** César pidió ver las notas grupales del alumno y poder revisar el puntaje de cada tarea; hasta ahora la fila solo tenía título y nota.
