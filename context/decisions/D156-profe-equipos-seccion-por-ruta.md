# D156 · Pages · Equipos del profesor: `/profe/equipos` (5A) y `/profe/equipos/[seccion]` (`5a`, `5c`) · Implemented

**Decision:** el segmentado 5A | 5C del encabezado enlaza a `/profe/equipos/5a` y `/profe/equipos/5c` (D110). `/profe/equipos` (destino de la navegación) pinta 5A con el mismo componente (`_equipos.tsx`); el aviso «pasó a …» usa el Toaster global (D131). Un slug fuera de `5a`/`5c` → `notFound()`.
**Why:** cada sección es una URL compartible y el atrás recorre las secciones; `/profe/equipos` tiene que ser página (el ítem del menú apunta ahí), no redirect.
**Discarded alternative:** redirigir `/profe/equipos` a `/profe/equipos/5a` — el 5A queda con una URL canónica, pero el menú pasaría por un redirect y el build no tendría `/profe/equipos`. 5A existe en dos URLs `noindex`, sin coste.
