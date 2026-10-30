# D110 · Sections · Equipos del profesor: la sección 5A/5C es una ruta y el segmentado son enlaces · Implemented

**Decision:** `/secciones/equipos-profe/[estado]` con `5a` y `5c` (`generateStaticParams`, D072). El segmentado del encabezado es `SegmentedLinks` (nav + enlaces con `aria-current`, D095), no el radiogroup del lienzo, porque cambia de página. No se monta la barra `Estados` de la vista previa: repetiría el mismo control. El eyebrow («5A · 6 equipos · 30 de 35 con equipo») se calcula del mismo estado local que las tarjetas.
**Why:** un control que cambia de ruta no es un radiogroup (D095); el handoff pide «segmentado sección» y el lienzo no distingue.
**Discarded alternative:** `ToggleGroup` con estado local y una sola ruta — habría que cargar los 69 alumnos y perder la URL por sección.
