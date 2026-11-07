# D289 · Ranking · Podio: «VS» entre columnas vecinas que comparten puesto · Implemented

**Decision:** `conectoresVsPodio(puestos)` (puro, `lib/rank-row.ts`) marca el hueco entre columnas visualmente vecinas (orden 2-1-3: índices 1, 0, 2 de la lista) con el mismo puesto; `Podium` pinta el mismo «VS» (`animate-vs`, `aria-hidden`) centrado en el hueco. Sin empate nada cambia. Limitación: con puestos 1, 2, 2 los dos 2.º quedan separados por el 1.º y no llevan «VS» (el empate lo dice el nombre accesible y el número del escalón); no se reordena el podio.
**Why:** pedido de César (46); coherente con D288.
**Discarded alternative:** reordenar las columnas para juntar a los empatados: rompe el 2-1-3 de D052.
