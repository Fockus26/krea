# D346 · Brand · Favicon: la «a» completa, siempre blanca sobre el azul de marca · Superseded by D391

**Decision:** `app/icon.svg` recorta la «a» del logo sin la «e» (clip que excluye la «e» y una elipse que redondea el borde donde se unían) y la deja dentro del cuadro con margen (antes el recorte `1322 120 470 600` cortaba el lado izquierdo y la parte de abajo). En oscuro ya no cambia a fondo `#7AA2F7` con «a» `#14121A`: siempre fondo `#295AC3` y «a» blanca. Los PNG (`icon-192`, `icon-512`, `icon-maskable-512` con la «a» en el 60 % central, `apple-icon` a sangre) y `favicon.ico` (16 y 32) salen del SVG con `node scripts/generar-iconos.mjs`.
**Why:** pedido de César (2026-11-08): la «a» se veía oscura (en oscuro) y cortada.
**Discarded alternative:** mostrar la palabra entera «krea» (ilegible a 16 px); oscurecer el fondo en oscuro como D301 (el ícono de pestaña no necesita seguir el tema y así es uno solo).
