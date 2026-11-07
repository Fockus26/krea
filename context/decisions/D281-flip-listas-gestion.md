# D281 · Movimiento · FLIP con entrada en tres listas de gestión: alumnos, historial de ajustes e integrantes de equipo · Implemented

**Decision:** `useFlip` (`components/krea/use-flip.ts`) admite opciones: `duracion: "--d-normal"` (filtrar o dar de alta no es un cambio de puesto: 250 ms en vez de los 600 del ranking) y `entrada: true` (las filas que aparecen después de la primera medición entran con opacidad, `--d-normal`; `idsNuevos` en `lib/flip.ts`, puro). Sin opciones se comporta igual que antes: el ranking no cambia. Se usa en:
1. **Tabla de Alumnos** (`students-table.tsx`): sección, estado, tarea y búsqueda filtran; las filas que quedan viajan a su sitio y las que vuelven entran. Alumno creado: entra. Alumno eliminado: su fila se va con el diálogo y las de abajo suben.
2. **Historial de ajustes** (`adjustment-history.tsx`): el ajuste nuevo entra arriba y empuja al resto; los filtros reordenan.
3. **Integrantes de cada equipo** (`team-card.tsx`): cambiar el capitán lo sube al primer puesto; mover a alguien a este equipo lo hace entrar.
Solo `transform` (translateY) y `opacity`, por WAAPI. Reduced motion (o duración 0): cambio directo. Las altas/bajas visibles que ya animaban se dejan: toast (sonner), tarea eliminada (D243), podio y confeti.
**Why:** pedidos 39 y 44; son las listas que hoy saltan al filtrar o cambiar y las que más se usan en clase.
**Discarded alternative:** «Sin equipo» y los tableros de equipos y premios — son cuadrículas: al reflujo cambian de columna (X) y `useFlip` solo mide Y. Salida animada del alumno eliminado (como D243) — exige retener la fila tras el `refresh()` en `students-directory`, que comparte con W14 en esta ola.
