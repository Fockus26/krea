# D010 · Components · Avatar con DiceBear: 4 estilos, dado de 8 opciones · Pending

**Decision:** estilos adventurer-neutral, fun-emoji, bottts-neutral, notionists-neutral (DiceBear 9.x). El selector muestra pestañas por estilo y una cuadrícula de 8 avatares con semillas aleatorias; el botón "dado" genera 8 nuevas. Se guarda `{estilo, semilla}`. Se pide como SVG por URL (`api.dicebear.com/9.x/<estilo>/svg?seed=`) y se cachea.
**Why:** pedido de César.
