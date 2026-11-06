# D226 · Responsive · En filas estrechas el chip y los botones bajan de línea antes que recortar el nombre · Implemented

**Decision:** elegida por César (2026-11-06, opción «Chip debajo del nombre» entre tres).
- **Fila del ranking:** es un `@container`. Con menos de `--container-fila` (20rem = 320 px; con texto grande se alcanza antes), el chip «Empate» o el delta sale de su columna y se pinta junto al subtítulo. El nombre recupera el ancho. El contenido visual ya es `aria-hidden` y el `<li>` lleva la etiqueta completa, así que pintarlo en dos sitios no lo repite al lector.
- **Tarjeta de equipo del profe:** la columna del nombre tiene un mínimo de 8rem y baja bajo el logo si no cabe. En cada integrante el nombre tiene 6rem de mínimo, y «Mover a…» pasa a la línea siguiente.

Alternativas descartadas: un chip solo con ícono (había que aprenderlo y seguía quitando ancho) y el nombre en dos líneas (filas de alto desigual).
**Why:** QA de la versión 1, D-M3: a 320 px, con «Empate», el nombre quedaba en 27 px («Á…»). D-A1b: con el texto al 200 %, la fila del ranking y la de equipos producían scroll horizontal.
