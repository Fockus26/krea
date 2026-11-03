# D173 · States · Cierre de la fase 06 · Implemented

**Decision:** fase 06 cerrada con 4 unidades (#44–#47): pantallas 404/500/sin conexión en la raíz + galería `/estados` (D160–D163), banner sin conexión (D164), `loading.tsx` por ruta (D167), vacíos y errores en pantalla (D170–D172). Criterios de `phases/06-STATES.md`: vacíos en todas las listas ✓, skeleton en cada carga ✓, cada error dice qué pasó y qué hacer ✓, cambios anunciados (`role="status"`/`alert`, regiones vivas siempre montadas) ✓, 404/500/sin conexión con diseño propio y su estado HTTP ✓ (mantenimiento no aplica, D163). **Pendiente:** el `a11y` con axe y teclado en navegador y el ancho de 320 px, sin servidor por decisión de César → QA final (fase 09).
**Why:** cierre explícito para que la fase 07 parta de un estado conocido.
**Discarded alternative:** —
