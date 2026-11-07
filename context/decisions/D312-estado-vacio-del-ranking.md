# D312 · UI · Ranking sin filas muestra un EmptyState en una Card en vez de podio y lista · Implemented

**Decision:** `RankingBoard` llama a `vacioRanking(vista, seccion, items.length)` (`lib/ranking-vista.ts`); si hay texto, pinta `EmptyState` (icono Trophy) dentro de una `Card`, igual que `teams-board.tsx`. Vale para estudiante y profesor y en vivo, porque `items` se recalcula con cada `onSnapshot`. «Hay alumnos pero nadie tiene puntos» no se toca: salen todos empatados en 0 y se ve bien.
**Why:** César (2026-11-07): en Ranking, sin datos no se mostraba ningún texto, solo podio y lista vacíos. Textos provisionales (fila 160 del checklist).
**Discarded alternative:** ocultar solo el podio y dejar la lista: deja la pantalla sin explicación.
