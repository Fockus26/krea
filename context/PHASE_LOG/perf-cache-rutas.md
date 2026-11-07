# perf/cache-rutas (W7, tanda 2026-11-06, pedido 14)

- `next.config.ts`: `experimental.staleTimes.dynamic = 180` (D250).
- `refresh()` añadido a `guardarAvatar` y `guardarApariencia`; el resto de acciones ya invalidaba.
- `/salir` e Ingresar navegan con `window.location.replace` (D251): sin caché del router ni rutas de `<Activity>` de la cuenta anterior.
- Guardián: `tests/unit/cache-rutas.test.ts` (acción que escribe sin invalidar → falla).
- Sin verificar en navegador (sin servidor): queda para el QA final.
