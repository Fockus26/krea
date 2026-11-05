# D218 · Responsive · Con menos de 480 px de alto solo la barra de acción sigue fija · Implemented

**Decision:** nueva variante `bajo:` (`height < 30rem`). Con ella, la barra superior, la inferior y los medidores de Evaluar y del constructor se mueven con la página, y la `ActionBar` queda pegada al borde inferior. Elegido por César (2026-11-05).
**Why:** con el teléfono en horizontal, las barras fijas dejaban 55–125 px libres en Evaluar y 0–163 px en Entregar tarea. La acción principal (guardar o enviar) es lo único que debe seguir a mano.
**Discarded alternative:** soltar todas las barras — para guardar o enviar habría que bajar hasta el final; dejarlo como estaba — en un teléfono pequeño, Entregar tarea quedaba sin área visible.
