# D365 · Grades · El integrante marcado «No participó» queda con NOTA_MIN fija en esa grupal · Implemented

**Decision:** `notaDeIntegrante(entrega, base, cedula)` (`lib/ranking-datos.ts`) es la única fuente: si la cédula está en `evaluacion.noParticiparon` de una grupal evaluada, devuelve `NOTA_MIN` (1) sin aplicar base; si no, `notaFinal(puntaje, base)` como hasta ahora (D177). En una individual la marca se ignora. Todos los usos pasan la cédula: ranking del alumno (`puntosDeAlumno`: el 1 aporta 0, D007), Mis notas, Detalle, Inicio, ficha del alumno del profe y Panel (cuenta como raspado). La nota del equipo (`puntosDeEquipoDatos`, el puntaje sin base) y la de los demás integrantes no cambian.
**Why:** César eligió «nota 1 fija (sin base)» para quien no participó; el equipo conserva su nota.
**Discarded alternative:** bajar la nota con su base (1 × base / 20 no es 1) o restar puntos al equipo (castiga a quien sí trabajó).
