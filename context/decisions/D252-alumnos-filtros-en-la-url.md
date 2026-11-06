# D252 · Alumnos · Los filtros de Alumnos viajan en la URL (`seccion`, `estado`, `tarea`, `alumno`) · Implemented

**Decision:** `/profe/alumnos?seccion=5A|5C&estado=evaluados|raspados|pendientes&tarea=<id>&alumno=<cédula>`. `rutaAlumnos(filtros)` arma la ruta y `leerFiltrosAlumnos` la lee en `lib/alumnos.ts`; un valor inválido se ignora, nunca da error. La página lee `searchParams` en el servidor; la pantalla cambia la URL con `history.replaceState` (sin recargar ni llenar el historial). La búsqueda por texto no viaja.
**Why:** el Panel (Evaluados, Raspados) y «Ver notas» llegaban a la lista sin filtrar (pedidos 12 y 13 de César, 2026-11-06). W9, W10 y W12 enlazarán a la misma forma.
**Discarded alternative:** `useSearchParams` + `router.replace`: obliga a `<Suspense>` con `cacheComponents` y vuelve a pedir la página al servidor en cada cambio.
