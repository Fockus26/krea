# D253 · Alumnos · Con `tarea`, la tabla muestra la nota de cada alumno en esa tarea; `estado` filtra sobre ella · Implemented

**Decision:** con `?tarea=`, la columna pasa a «Nota en la tarea» (`GradePill`; sin nota = Pendiente, D003) y un chip con «Quitar filtro». `estado`: evaluados = con nota en esa tarea, raspados = nota < 10, pendientes = sin nota. Sin `tarea`, `estado` usa la nota individual vigente. La nota es la del alumno con su base (D013), en individuales y grupales (si es integrante). Los recuentos del segmentado de sección reflejan el filtro y el contador anuncia una frase completa («3 raspados en 5A · Identidad de marca»).
**Why:** «Ver notas» debe mostrar la nota de cada alumno en esa tarea, y Evaluados/Raspados del Panel miden una tarea, no la nota vigente.
**Discarded alternative:** una columna extra por tarea: la tabla ya es ancha y a 320 px se desplaza.
