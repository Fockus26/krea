# D217 · Responsive · Tarjeta de puntos de Inicio: contraste AA con círculos atenuados y fondo `accent-ink` · Implemented

**Decision:** el círculo grande baja de opacidad 28 a 20 %, el chip de cambio semanal de 18 a 12 % y el fondo de la tarjeta pasa de `accent` a `accent-ink`. Se aparta de los valores de HANDOFF §3 (Inicio). César eligió bajar la opacidad (2026-11-05); el cambio de fondo se añadió porque en rojo no alcanzaba.
**Why:** axe marcaba 3,88–4,33:1 en azul, rojo y morado claros. El rojo solo llega a 4,51:1 sin nada encima, y admite 0,5 % de círculo: bajar la opacidad equivalía a quitarlo. `accent-ink` es igual a `accent` en todos los acentos y temas salvo rojo claro (`#c80300`, 6,05:1), así que solo oscurece esa tarjeta.
**Discarded alternative:** quitar los círculos en rojo — la tarjeta perdería su decoración solo en un acento; una opacidad por acento — cuatro valores que mantener, y el rojo seguiría en casi cero.
