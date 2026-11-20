# D440 · Evaluar · En una entrega, Anterior/Saltar/Guardar y «entrega i de n» siguen la lista del estado elegido · Implemented

**Decision:** `/profe/evaluar/[entrega]?estado=evaluadas` (o `todas`) recorre esa lista (`listaSegunEstado` + `colaFiltradaCon`), no la de espera; amplía D385. El eyebrow lo dice: «Evaluadas · entrega 2 de 9», «Todas · entrega 3 de 16» (`eyebrowCola`); sin `estado`, «Por evaluar · entrega i de n» como siempre. Fuera de la lista: «Ya evaluada · puedes corregir la nota» si está evaluada, «Por evaluar» si no.
**Why:** corregir varias seguidas desde Evaluadas sin volver a la lista; coherente con D385.
**Discarded alternative:** que Guardar de una evaluada lleve siempre a la primera por evaluar (D204) — rompe el recorrido de corrección.
