# D523 · SEO · Los `not-found` no declaran `robots`: el noindex de la 404 viene de Next y del layout del grupo · Implemented

**Decision:** se quita `robots` de `app/not-found.tsx`, `app/(estudiante)/not-found.tsx` y `app/(profesor)/not-found.tsx` (conservan el título). Next añade su `noindex` a toda 404; los layouts de estudiante y profesor siguen declarando el suyo para sus páginas (D023). Una prueba (`tests/unit/not-found-shell.test.ts`) cuenta las fuentes: cero en los `not-found`, una en cada layout.
**Why:** el `noindex` salía repetido (not-found + layout + el de Next). En la raíz queda solo el de Next; en las 404 dentro del shell, el del layout y el de Next (ambos `noindex`).
**Discarded alternative:** quitar también `robots` de los layouts para que la 404 en shell tenga una sola etiqueta — dejaría sin `noindex` explícito a todas las páginas con sesión (D023).
