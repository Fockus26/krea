# D261 · Puntos · En el Historial el nombre del destino es un enlace: alumno → su ficha (`rutaAlumnos`), equipo → `/profe/equipos/<sección>` · Implemented

**Decision:** `rutaDestinoHistorial(fila)`. El enlace vive en el `h3` y el menú de opciones sigue aparte (dos destinos de foco, sin anidar interactivos). El equipo lleva a la lista de equipos de su sección (no hay ruta por equipo).
**Why:** César: al tocar el alumno en el Historial ir a su perfil (D254 ya abre la ficha por URL).
