# D024 · SEO · Fuentes de la OG descargadas de Google Fonts al construir; themeColor oscuro = --bg oscuro · Implemented

**Decision:** `opengraph-image.tsx` descarga Poppins 700 y Nunito Sans 600 (TTF) al construir la imagen, con respaldo a la fuente por defecto si falla la red. `themeColor` oscuro = `#14121a` (`--bg` oscuro de `globals.css`); claro = `#295AC3`.
**Why:** `ImageResponse` no lee woff2 (lo que sirve `next/font`) y no hay TTF en el repo; descargar evita versionar binarios. El handoff no define `themeColor` oscuro.
**Discarded alternative:** versionar los TTF en el repo (más pesado, hay que mantener licencias/archivos); ahí es el cambio si se quiere un build sin red.
