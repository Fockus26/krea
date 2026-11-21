# D551 · Data · Quitar la entrega ideal lleva la versión de la lista, como guardarla (D532) · Implemented

**Decision:** `zQuitarIdeal` acepta `version` (opcional) y `quitarIdealEnTransaccion` la compara con la de la fila (bloqueada `FOR UPDATE`): si no coincide —otro profe la cambió o ya la quitó— no borra y devuelve `cambio` con la versión de ahora; la acción refresca la lista. `EstadoIdeal` manda la que le pasa la página (`VERSION_IDEAL_SIN_FILA` si no hay) y, con `cambio`, muestra `QUITAR_IDEAL_CAMBIO_TEXTO` (fila 302): lo de «volver a guardar» del aviso de guardar no aplica a quitar. Sin `version`, quita igual (la cascada de D531 sigue usando `quitarIdeal`).
**Why:** quitar una ideal que otro profe acababa de reemplazar la borraba sin avisar, justo lo que D532 evita al guardar.
**Discarded alternative:** reusar el aviso de guardar tal cual: dice «lo tuyo sigue aquí» y «si vuelves a guardar», que no tienen sentido al quitar.
