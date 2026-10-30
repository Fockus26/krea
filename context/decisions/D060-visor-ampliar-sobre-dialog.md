# D060 · Components · Visor "Ampliar" sobre Dialog a pantalla completa, con su propio botón disparador · Implemented

**Decision:** `ImageViewer` es un `Dialog` (D037) cuyo `DialogTrigger` es el botón "Ampliar" (secondary sm, ícono Maximize2, `sr-only` " imagen de la respuesta"). El contenido ocupa `100dvh`, con la imagen `object-contain`; el título es el enunciado en `sr-only` y no lleva descripción. Esc y el botón de cerrar lo cierran y el foco vuelve al disparador (Radix). Monta en el `PortalScope` más cercano (D034).
**Why:** el patrón dialog de Radix ya da foco, Esc y retorno de foco; el disparador dentro del componente garantiza el retorno al botón correcto.
**Discarded alternative:** visor controlado desde fuera con `open` — más API para el mismo resultado.
