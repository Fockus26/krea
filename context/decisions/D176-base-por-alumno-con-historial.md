# D176 · Grading · La base de evaluación es por alumno, con historial · Implemented

**Decision:** decisión de César (2026-11-03), cierra la pregunta abierta de D006. `usuarios/{cedula}.base` es la base vigente; cada cambio se guarda en `historialBase` (de, a, autor, instante) y recalcula todas las notas del alumno y su ranking (la nota no se guarda: se deriva de `puntaje × base / 20`, D013).
**Why:** es lo que ya muestran Alumnos y Evaluar, y el profe no tiene que elegir la base en cada evaluación.
**Discarded alternative:** base por tarea — cada entrega guarda la suya; obliga a elegirla al evaluar.
