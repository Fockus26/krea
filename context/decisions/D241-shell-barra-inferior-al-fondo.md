# D241 · Layout · La barra inferior queda al fondo del viewport con contenido corto · Implemented

**Decision:** la raíz de `AppShell` pasa de `min-h-dvh lg:flex` a `flex min-h-dvh flex-col lg:flex-row`. Antes, bajo `lg` la raíz era un bloque y la columna interna no se estiraba, así que el `flex-1` del `main` no empujaba la barra. Ahora el `main` crece y la barra queda abajo. Se mantiene `sticky bottom-0` en flujo (HANDOFF §2.7: sticky, z 30), no `fixed`: así reserva su espacio y no tapa el último elemento, el toast ni la `ActionBar`. Aplica a ambos roles.

**Why:** pedido de César (punto 34): con Evaluar vacío la barra quedaba a media pantalla.
