# D386 · Responsive · Anterior y Saltar visibles en móvil, bajo el eyebrow a ancho completo · Implemented

**Decision:** se quita `max-lg:hidden` de la `nav` de `ReviewHeader`: en < lg ocupa el ancho completo bajo el eyebrow, dos botones `ghost sm` que reparten el ancho y miden 44 px de alto (`max-lg:min-h-11`), sin scroll a 320 px.
**Why:** pedido 7: en el teléfono no se podía saltar ni volver. Conservador: no toca la barra de acción fija de Guardar.
**Discarded alternative:** poner Anterior/Saltar en la barra de acción fija junto a Guardar (más alcanzable con el pulgar, pero la barra ya lleva el total en vivo y Guardar; se puede revisar si César lo prefiere).
