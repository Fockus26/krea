# D023 · SEO · Solo /ingresar es indexable; el resto del portal, bloqueado · Pending

**Decision:** `robots.ts` permite `/ingresar` y bloquea `/`; `sitemap.ts` lista solo `/ingresar`. Cuando existan las páginas con sesión, cada una llevará `robots: { index: false }` en su metadata.
**Why:** portal privado con login (notas de menores): nada de su contenido debe aparecer en buscadores. Decisión conservadora provisional hasta que César diga otra cosa.
**Discarded alternative:** indexar también la home pública (no hay home pública; `/` redirige al portal).
