# D326 · Content · Login, auth, Panel y la descripción del sitio sin «5.º año» fijo · Implemented

**Decision:** «Escuela Creativa del liceo · 5.º año, secciones A y C» (aside de auth), «Escuela Creativa · 5.º año» (eyebrow del login y del Panel) y `SITE_DESCRIPTION` «Portal de la Escuela Creativa · 5.º año» pasan a «Escuela Creativa del liceo» / «Portal de la Escuela Creativa del liceo». En login no se lee el catálogo (no hay sesión y el estudiante no lo puede leer, D317). Copy PROVISIONAL (CONTENT_CHECKLIST fila 170).
**Why:** con años y secciones administrables (pedido 58) el año fijo deja de ser verdad en cuanto se crea otro.
**Discarded alternative:** armar el texto con el catálogo («4.º y 5.º año») en el Panel (otra lectura y un texto que cambia con cada año creado; en login no se puede); quitar el eyebrow (cambia el diseño aprobado).
