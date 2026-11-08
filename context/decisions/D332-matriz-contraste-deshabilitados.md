# D332 · Design · La matriz mide también los botones deshabilitados, con el umbral de texto normal (4,5:1) y sin tratar el texto grande aparte · Implemented

**Decision:** Los botones deshabilitados se muestran y se miden como los demás (WCAG 1.4.3 los exime, pero César quiere ver cuánto contraste tienen). Todas las muestras se juzgan con 4,5:1, aunque el texto sea de botón mediano/grande: es el criterio más estricto y evita falsos «AA».
**Why:** Es la opción conservadora; un «No AA» en un deshabilitado es informativo, no un error. La descripción de la familia lo aclara.
**Discarded alternative:** Umbral 3:1 para texto grande (más permisivo y exige decidir el tamaño en vivo).
