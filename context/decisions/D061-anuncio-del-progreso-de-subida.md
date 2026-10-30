# D061 · Accessibility · El progreso de subida se anuncia solo al empezar y al terminar, no por porcentaje · Implemented

**Decision:** `ImageUpload` mantiene un `<output>` (`role="status"`) `sr-only` siempre montado que cambia de texto solo con el estado: "Subiendo la imagen. No cierres la app." y "Imagen lista: {nombre}". El "45 %" es visual (`aria-hidden`) y la barra es un `progressbar` con `aria-valuenow` sin región viva; el error usa el `Alert` (`role="alert"`).
**Why:** anunciar cada 1 % satura al lector de pantalla; una región ya montada sí anuncia el cambio (una que aparece con el texto, no siempre).
**Discarded alternative:** `aria-live` en el bloque visible de "Subiendo…" (como dice el handoff) — se re-lee entero con cada cambio de porcentaje.
