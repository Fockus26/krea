# D230 · Layout · El título de la barra superior pasa a dos líneas; fuera los SVG de la plantilla · Implemented

**Decision:**
- **Título:** el título de la barra superior (pantallas de detalle, < lg) usa `line-clamp-2` en vez de `truncate`. Dos líneas de `text-h4` miden 44 px y caben en los 56 px de la barra. Es el mismo criterio que D226 y D227: partir el texto antes que recortarlo.
- **SVG:** se eliminan `public/next.svg`, `vercel.svg`, `file.svg`, `globe.svg` y `window.svg`. Venían de la plantilla de Next y nada los usaba. César pidió arreglar los bajos (2026-11-06).

**Why:** QA de la versión 1:
- **D-B1:** a 320 px, junto a «Guardar borrador», el título quedaba en «Nueva t…». El `<h1>` lo repite debajo, así que no se perdía información, pero se veía roto.
- **D-B2:** los cinco SVG respondían 200 en producción sin uso.
