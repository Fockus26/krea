# feat/secciones-dinamicas (X5b, tanda 2026-11-07, ola 3)

- Todo lo que listaba 5A/5C lee `catalogoSecciones()`: `SECCIONES` sale de `lib/modelo.ts`; los alias `Seccion{Alumnos,Equipos,Panel,Puntos,Ranking,Tarea}` pasan a `SeccionId`; los 11 `as` de D321 quitados (D321 → Superseded by D323).
- Selector compartido `components/sections/shared/selector-seccion.tsx` (D322): segmentado ≤ 4 secciones, `Select` agrupado por año con más. En Ranking, Equipos, Alumnos, Puntos y Panel («Todas» + cada sección).
- Rutas (D323): `/profe/ranking/[seccion]` (+ `/equipos`) reemplaza `5c/`; `/profe/equipos/[seccion]` del catálogo; base = primera sección; slug fuera del catálogo = 404.
- Loaders y puros (D323): `conteos()`/`conteosDe`, `rankingsTodos()`, `seccionesDelProfe(u, secciones)`, `candidatosDe` y `panelDatosDe` con `secciones` (sin `undefined.push`), `busquedaVacia` sugiere la sección con más coincidencias, `leerFiltrosAlumnos(params, secciones)`.
- Acciones (D323): `crearAlumno`, `crearEquipo`, `guardarTarea`, `aplicarAjuste` comprueban que la sección exista → error `seccion`.
- Tareas (D324): casillas por sección agrupadas por año (`TaskSections`), al menos una; `secciones: string[]` en borrador y entrada; textos con `listaSecciones`.
- Vacío sin secciones (D325, `SinSecciones`); copy sin «5.º año» en auth, login, Panel y `SITE_DESCRIPTION` (D326).
- Copy provisional: filas 168 (selector, casillas, «Todas»), 169 (vacíos, sección que ya no existe), 170 (sin año fijo) — en el informe.
- Verificado: typecheck, lint, suite unitaria, a11y por código. `test:rules` lo corre el CI. Sin servidor, sin capturas, sin build local.
