# D256 · Ranking · El separador dice solo «Zona de riesgo» y los empatados dentro de la zona salen como duelo VS · Obsolete → D288 (el VS; el rótulo «Zona de riesgo» sigue)

**Decision:** `RIESGO_SEPARADOR = "Zona de riesgo"` (sin «· 5 últimos», que no valía para equipos). Dentro de la zona, `conectoresVs(filas)` marca los pares consecutivos con el mismo puesto y `RankRow` pinta un «VS» decorativo (`aria-hidden`) en el hueco de abajo (`pb-6`); cada fila sigue siendo un `<li>` con su nombre accesible. Fuera de la zona, los empates no cambian.
**Why:** pedido de César (17). El empate ya lo dice el nombre accesible; el VS es solo texto visual, no depende del color.
