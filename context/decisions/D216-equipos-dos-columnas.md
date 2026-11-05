# D216 · Responsive · Equipos del profesor: dos columnas hasta 1440 y tres desde ahí · Implemented

**Decision:** el tablero de Equipos usa 1 columna en móvil, 2 desde 768 y 3 solo desde 1440 (`g2` + `xl:grid-cols-3`). Se aparta del `g3` de HANDOFF §3, que pide 3 columnas desde 1024. Elegido por César (2026-11-05). Además, el chip de puesto de la tarjeta puede pasar a dos líneas: a 320 px su columna mide 129 y el chip 140, y «· empate» lo alarga en cualquier ancho.
**Why:** con la barra lateral de 248 px, a 1024 cada tarjeta medía 221 px y a su columna de texto le quedaban 46 px, frente a un chip de puesto de 140. Había scroll horizontal hasta unos 1100 px y el chip no cabía hasta unos 1300. Es el rango de laptop de los profesores.
**Discarded alternative:** logo arriba del texto con tres columnas — respeta el `g3`, pero las tarjetas crecen en alto y las filas de integrantes siguen apretadas en 221 px; dejar que el texto se parta — quita el scroll, pero 46 px siguen siendo ilegibles.
