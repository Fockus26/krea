# D154 · Pages · Títulos de las páginas de Tareas del profesor: «Tareas del profesor», «Nueva tarea», «Constructor · {título}» · Implemented

**Decision:** `/profe/tareas` → «Tareas del profesor»; `/profe/tareas/nueva` → «Nueva tarea»; `/profe/tareas/[id]` → «Constructor · {título}» (`generateMetadata`). Todas heredan `noindex` del layout del profe (D023).
**Why:** `title` único por página (`check:paginas`), mismo patrón que `/notas/[tarea]` (D136). Copy provisional: fila 112.
**Discarded alternative:** «Constructor de tareas» como título de las dos rutas del constructor — repetido; y «Tareas» a secas repite el título de /tareas (unicidad).
