# D153 · Pages · El constructor recibe `guardarEnTopbar`: «Guardar borrador» < 1024 va en la topbar con `TopBarAccion` · Implemented

**Decision:** `TaskBuilder` gana la prop opcional `guardarEnTopbar` (por defecto `false`, así `/secciones/tareas-profe` no cambia). Con `true`, el botón móvil se pinta como `<TopBarAccion><Button variant="ghost" size="sm">` (D130) en lugar del botón secundario en el flujo; ≥ 1024 sigue el botón de la columna lateral. Las tres rutas reales lo activan. Sin barra inferior ya lo cubre `CONSTRUCTOR` en `lib/topbar.ts`.
**Why:** HANDOFF §3 pide la acción en la topbar; no se duplica el botón en la página real. El botón aparece tras hidratar (D130).
**Discarded alternative:** quitar el botón del flujo también en `/secciones` — esa vista no tiene topbar y perdería la acción.
