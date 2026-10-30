# D078 · Sections · Ancho `lectura` = 760 alineado al inicio (`container-reading-start`) · Implemented

**Decision:** `containerClass(rol, "lectura")` devuelve `container-reading-start` (máx. 760, `margin-inline: 0 auto`), utilidad nueva de `app/globals.css` junto a `container-reading`, que se queda centrada para el índice `/secciones`. La usan Mis notas, Detalle de nota y, en esta ola, Tarea y Perfil.
**Why:** HANDOFF §3 Mis notas: "`wrap-narrow` (máx. 760, alineado a la izquierda en escritorio)"; los cuatro lienzos de lectura (Notas, DetalleNota, Tarea, Perfil) llevan `margin-left: 0`.
**Discarded alternative:** cambiar `container-reading` — también centra el índice `/secciones`, que no tiene barra lateral.
