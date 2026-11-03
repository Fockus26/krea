# D157 · Pages · Ranking del profesor en cuatro rutas sin query: 5A/5C × estudiantes/equipos · Implemented

**Decision:** `/profe/ranking` (5A estudiantes), `/profe/ranking/equipos`, `/profe/ranking/5c`, `/profe/ranking/5c/equipos`. Los 6 estados de la vista `/secciones/ranking` son 4 rutas del profe + las 2 del estudiante (D144). Sin fila «tú»; el segmentado de sección conserva la pestaña actual al cambiar de 5A a 5C. Títulos únicos: «Ranking de 5A», «Ranking de equipos de 5A», «Ranking de 5C», «Ranking de equipos de 5C». La topbar móvil ya lleva «En vivo» con `subrutas` (D128).
**Why:** mismo patrón que D144 (cada estado una URL, sin `?`); `check:paginas` exige `<title>` único y chocaba con `/ranking`.
**Discarded alternative:** `?seccion=5c` — las pestañas del catálogo son rutas (D095).
