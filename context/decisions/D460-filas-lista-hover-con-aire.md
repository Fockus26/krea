# D460 · Components · `CardListItem asChild`: hover con padding horizontal y margen negativo · Implemented

**Decision:** con `asChild` la fila usa `px-3 -mx-2` (antes `px-1`): el texto queda a 4 px del borde de la tarjeta como antes, y el fondo `--surface-2` del hover se extiende 8 px más a cada lado. Sin `asChild` no cambia. «Volver al inicio» pasa a «Volver a tareas» (`volverHref`, `/tareas`; D140).
**Why:** César: al pasar el mouse el fondo llegaba al borde del texto. La tarjeta tiene `p-4` (16 px) en móvil, así que -8 px no desborda ni genera scroll a 320 px.
**Discarded alternative:** padding en cada instancia: seis sitios con el mismo defecto, y el siguiente lo repetiría.
