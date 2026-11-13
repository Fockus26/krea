# D382 · Layout · «Por evaluar» y «Últimos ajustes» solo se igualan cuando «Por evaluar» está vacía · Implemented

**Decisión:** en `panel-view` el `lg:items-stretch!` y el `h-full` de las dos tarjetas (ahora la prop `className` de `PendingReviews` / `RecentAdjustments`) solo se aplican si `entregas.length === 0` (con el filtro de sección ya aplicado). Con filas, cada tarjeta mide su altura natural (`g-home` ya trae `align-items: start` en ≥ 64rem). Apiladas (< lg) sin cambios.
**Why:** César: la misma altura solo servía cuando no había alumnos por evaluar; con varias filas dejaba la tarjeta de ajustes con un hueco. Nota: `h-full` por sí solo igualaba la altura aunque la grilla fuera `start`, por eso también se quita de la tarjeta.
**Supersedes:** D240.
