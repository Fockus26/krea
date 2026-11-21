# D543 · Movimiento · FLIP anidado: las posiciones se miden relativas a una `raiz` opcional · Implemented

**Decision:** `useFlip` devuelve también `raiz` (`ref` de una caja). Con ella, las posiciones son relativas a esa caja y no a la página: si la caja entera se mueve (una tarjeta de equipo que baja porque la de arriba creció) sus integrantes no calculan además ese desplazamiento. Lo usan `team-card.tsx` (los integrantes dentro de una tarjeta que anima el tablero) y `unassigned-card.tsx` (la tarjeta no se anima, pero sus alumnos no deben «viajar» solo porque la tarjeta baja). Sin `raiz`, coordenadas de documento (ranking y listas, como antes).
**Why:** con dos `useFlip` anidados, ambos invertían el mismo desplazamiento y el integrante viajaba el doble.
**Discarded alternative:** animar solo la tarjeta y quitar el FLIP de sus integrantes: perdería el viaje del capitán al reordenar (D281).
