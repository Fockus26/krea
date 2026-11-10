# D350 · Components · Cada año de Años y secciones es un colapsable, cerrado por defecto · Implementado

**Decisión:** cada año es un bloque plegable con aspecto de FAQ (chevron que gira, `aria-expanded`/`aria-controls`); el encabezado muestra nombre + «n secciones · uso». Cerrados al entrar; «Agregar sección» deja el año abierto.
**Por qué:** pedido de César; la lista de secciones por año crecía a 26 filas. Estado no solo por color: icono + `aria-expanded`.
**Alternativa descartada:** abrir el primer año por defecto (ocultaba la idea de colapsable y movía el foco inicial).
