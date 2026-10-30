# D045 · Components · EmptyState con nivel de título configurable; Skeleton decorativo (`aria-hidden`) y Separator con `--divider` · Implemented

**Decision:** `components/krea/empty-state.tsx`: `icon` (LucideIcon), `title`, `description?`, `action?` (normalmente un `Button`) y `headingLevel` 2–6 (por defecto 3) para no romper la jerarquía de la página; burbuja 72 × 72 radio 24 `--accent-soft`, ícono 32 `--accent-ink`. `Skeleton` usa `animate-skeleton` (D027), `bg-surface-3`, radio 10 y `aria-hidden="true"` por defecto: el contenedor que los agrupa lleva `aria-busy="true"` + `aria-label` ("Cargando notas"). `Separator` (Radix) con `bg-divider`, decorativo por defecto.
**Why:** HANDOFF §2.14. Un título de nivel fijo rompería la jerarquía según dónde se use el vacío.
**Discarded alternative:** que `Skeleton` anuncie por sí mismo `role="status"` — una lista de 10 bloques anunciaría 10 veces; se anuncia el contenedor una vez.
