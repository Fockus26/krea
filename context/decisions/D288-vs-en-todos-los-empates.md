# D288 · Ranking · El «VS» sale entre todos los empatados de la lista principal y de la zona de riesgo · Implemented

**Decision:** `RankList` llama `conectoresVs` en las dos listas (antes solo en la zona, D256). Con 3 empatados salen 2 «VS»; cada fila sigue siendo un `<li>` con su nombre accesible y el «VS» es decorativo (`aria-hidden`). Reemplaza a D256 en lo del «VS» (el rótulo «Zona de riesgo» sigue). `splitRiesgo` deja al último de la principal y al primero de la zona en listas distintas: si empatan justo en el corte no hay «VS» entre listas (no se mueve el separador).
**Why:** pedido de César (46): un ranking con 3 estudiantes con la misma nota solo mostraba el «VS» en la zona de riesgo.
