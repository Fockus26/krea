# D310 · Code · Shift+clic (o Shift+Espacio) en una casilla del lote aplica su estado a todo el rango desde el ancla · Implemented

**Decision:** `alternarRango(seleccion, ids, ancla, id, marcar)` (`lib/lote.ts`, puro) pone `marcar` en el rango ancla→clicada, ambos incluidos, en el orden visible. Clic normal alterna una y fija el ancla; Shift+clic no mueve el ancla. Sin ancla, o con el ancla fuera de la lista visible (filtro o búsqueda nuevos), se comporta como clic normal. El estado que se aplica es el que toma la casilla clicada (marcar o desmarcar).
**Why:** César (2026-11-07): en las acciones en lote, mantener Shift y pulsar debe seleccionar todo el rango, como en Gmail.
**Discarded alternative:** que Shift+clic siempre marque: no permite desmarcar un tramo.
