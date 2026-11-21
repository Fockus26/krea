# D529 · Design · La galería de Entrega muestra el reparto: capitana y integrante, una pregunta por estado · Implemented

**Decision:** `/secciones/tareas/reparto-capitan` (panel Reparto con entregada, aceptada, asignada y tomada, y el formulario con sus bloqueos) y `/secciones/tareas/reparto-integrante` (Tus preguntas de Paola: aceptada, asignada, otra bloqueada y una tomada por la capitana), con datos a mano en `repartoDe` (`lib/demo/entrega.ts`) y los textos reales de `lib/partes`. Sin acciones: los controles no hacen nada. Las demos ya no filtran el premio a solo grupal (D263).
**Why:** la galería no tenía los estados del reparto (backlog L53, L35).
**Discarded alternative:** armarla con `repartoVista` sobre usuarios del seed: más fiel, pero ata la galería al modelo de Postgres (cédulas, ids públicos).
