# D225 · States · Las 404 de rutas dinámicas con sesión responden 200 + `noindex` (aceptado) · Accepted

**Decision:** `/notas/[tarea]`, `/tareas/[tarea]`, `/profe/tareas/[id]`, `/profe/evaluar/[entrega]` y `/profe/equipos/[seccion]` muestran la pantalla 404 con HTTP 200 cuando el id no existe, y se deja así. El `notFound()` llega después de que `loading.tsx` empezó el streaming. Es el comportamiento documentado de Next (`loading.md` › Status codes): el estado queda en 200 y Next añade `<meta name="robots" content="noindex">`. Las 2–3 etiquetas `robots` del `<head>` son la del layout (`noindex, nofollow`) más la de Next, y no se tocan. Decidido por César (2026-11-06).
**Why:** QA de la versión 1 (D-M1 y D-B 10). Son rutas con sesión y sin indexar, así que el único costo es el estado HTTP para el monitoreo. Las alternativas costaban más:
- comprobar la existencia en `proxy.ts` suma una lectura de Firestore por visita;
- quitar los `loading.tsx` de esas rutas vuelve al error de prerender que resolvió D219.

**Revisar si:** se agrega monitoreo de enlaces rotos o analítica por estado HTTP.
