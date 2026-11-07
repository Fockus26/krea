# D254 · Alumnos · `alumno=<cédula>` abre la ficha (diálogo Editar) de ese alumno y lo deja visible en la lista · Implemented

**Decision:** la lista se abre en la sección del alumno y su fila se queda aunque no cumpla `estado`. El diálogo Editar se monta abierto; al abrir o cerrar a mano la URL se actualiza (`alumno` aparece o se quita). Cédula que no existe o no es de un estudiante: se ignora. El foco lo maneja Radix (entra al diálogo y vuelve al botón Editar al cerrar).
**Why:** W9/W10 enlazarán desde otras pantallas a la ficha de un alumno (la «ficha» de Alumnos es hoy el diálogo Editar, D108).
