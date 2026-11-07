# D305 · Design · Controles de alto mínimo: relleno calculado en vez de `min-h` con `items-center` · Implemented

**Decision:** donde el contenedor lleva `icono-linea` (alineado arriba) y además un alto mínimo (chip 28, ítem de menú 40, toast 52, resumen de reglas 44), el `min-h` se cambia por `padding-block: calc((alto - 1lh) / 2)` con el alto sacado de la escala de espaciado (`--spacing(N)`); en el toast, `max(--spacing(3), …)` para no bajar de su relleno de 12. El botón de acción del toast va `self-center` con margen negativo, y en el banner offline el mensaje con su ícono va en un grupo `icono-linea` y el botón queda centrado fuera de él.
**Why:** con `items-start` un `min-h` deja el contenido pegado arriba; el relleno calculado mide igual con una línea (el mismo alto de antes) y crece con más.
**Discarded alternative:** `my-auto` en cada hijo: centra bien una línea pero, con varias, también centra el ícono respecto al texto entero.
