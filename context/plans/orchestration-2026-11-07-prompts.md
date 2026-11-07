# Prompts — tanda 2026-11-07

Antes que nada lee el brief: `C:\Users\Cesar\Documents\Work\krea\context\plans\orchestration-2026-11-07.md`.

---

## X1 — Eliminar equipo con entregas grupales

**Rama** `fix/eliminar-equipo-con-entregas` · **Decisiones** D307–D309 · **Fila** 159 · opus · medium

**César (literal):** «No puedo eliminar los grupos que tienen entregas grupales, si se debe poder
hacer ya que algunos grupos se pueden deshacer y la tarea grupal va a seguir en pie»

**Decidido con César:** se deshace todo. Al eliminar un equipo: sus entregas grupales **se
quedan** (con su nota, sus `integrantes` fijos y su evaluación), cada una recibe `titularNombre`
(forma fija en el brief); los integrantes pasan a «Sin equipo» (`equipoId: null`, sin capitán);
los ajustes de puntos del equipo (`ajustes` con `destinoId == equipoId` y `destino != "alumno"`)
se borran; el equipo sale del ranking de equipos. El diálogo dice todo eso con números antes de
confirmar («Tiene 3 integrantes, 2 entregas grupales y 1 ajuste: los integrantes quedan sin
equipo, las notas se quedan con cada alumno y los ajustes se borran»). Reemplaza a **D271**
(cámbiale el estado a «Reemplazada por D307»).

**Dónde:**
- Regla pura: `lib/equipos-gestion.ts:65-84` (`BloqueoEquipo`, `bloqueoEliminar`) y textos
  `:118-142` (`bloqueoTexto`, `errorGestionEquipoTexto`). Ya no hay bloqueo: pasa a un resumen
  `consecuenciasEliminar({integrantes, entregas, ajustes})` + su texto. Quita los errores
  `integrantes|entregas|ajustes` que dejen de existir (busca sus usos).
- Transacción: `lib/firebase/equipos-gestion.ts:80-130` (`eliminarEquipoEnTransaccion`). Cómo
  se saca a un alumno de su equipo hoy (capitán que pasa al siguiente, ranking reescrito):
  `lib/firebase/alumnos-alta.ts` (comentario de la línea 9) y las funciones de mover integrante
  en `lib/firebase/equipos-gestion.ts` — reutilízalas, no dupliques. Todo en **una** transacción
  (lecturas antes que escrituras; límite de 500 escrituras: si un equipo pudiera superarlo,
  devuelve un error claro, no un commit a medias).
- Acción: `lib/acciones/equipos.ts:186-216` (`eliminarEquipo`, borra el logo de B2 después).
- Diálogo: `components/sections/equipos-profe/team-dialogs.tsx:~300` (el texto «No tiene
  integrantes, entregas grupales ni ajustes…»).
- Modelo: `lib/modelo.ts:335` `zEntrega` → `titularNombre` opcional.
- Nombre del titular: `lib/evaluar-datos.ts:257` y `:367` (`m.equipos.get(e.titularId)`), y todo
  sitio que busque el equipo de una entrega grupal por `titularId` (`grep -rn "titularId" lib
  components app`). Sitios a revisar: `lib/equipo.ts:78-95`, `lib/equipos-datos.ts:206-216`,
  `lib/vistas-estudiante.ts` (notas del alumno en la grupal: deben salir de `integrantes`, no del
  `equipoId` actual — si salen del equipo actual, el alumno perdería su nota: es el bug a evitar).

**Trampas:**
- Después de eliminar, un integrante que entra a otro equipo **no** hereda las entregas del
  equipo viejo, y en `/tareas/<id>` la grupal ya entregada por su equipo viejo cuenta como
  entregada para él (ya hay un pendiente «capitán movido tras una entrega», D221: no lo
  resuelvas, pero no lo empeores; descríbelo en el informe si aplica).
- `firebase/firestore.rules`: si un estudiante lee entregas por `titularId == miEquipo`, uno sin
  equipo debe seguir viendo las suyas por `integrantes` (mira la regla y `tests/rules/`).

**Verificar:** tests puros de `consecuenciasEliminar` y de su texto; test de emuladores de la
transacción (equipo con 2 integrantes, 1 entrega evaluada, 1 ajuste → equipo borrado,
integrantes con `equipoId: null`, entrega intacta con `titularNombre`, ajuste borrado, ranking sin
el equipo) en `tests/rules/` o donde estén los de `equipos-gestion`; test de que la nota del
alumno en esa grupal sigue saliendo. `bun run test:rules`.

---

## X2 — Shift+clic selecciona el rango

**Rama** `feat/lote-rango-shift` · **Decisiones** D310–D311 · sin filas · sonnet · medium

**César (literal):** «Quiero que en las bulk actions se pueda utilizar lo de shift es decir si lo
mantenga donde presione se seleccionan todos los de ese rango»

**Enfoque:** helper puro `alternarRango` en `lib/lote.ts` (firma fija en el brief), junto a
`alternarUno`/`alternarTodos` (`lib/lote.ts:95-136`). Comportamiento tipo Gmail: clic normal
alterna uno y fija el ancla; Shift+clic aplica al rango ancla→clicado (ambos incluidos, en el
orden visible ya filtrado) el estado que toma la casilla clicada (marcar o desmarcar); el ancla
se queda. Si el filtro o la búsqueda cambian y el ancla ya no está visible, se comporta como
clic normal. Teclado: Shift+Espacio sobre una casilla enfocada hace lo mismo que Shift+clic
(el `Checkbox` de shadcn es un `button`: lee `event.shiftKey` en `onClick`/`onKeyDown`, no en
`onCheckedChange`, que no trae el evento).

**Dónde:** `components/sections/alumnos/students-table.tsx:115-175` (casillas, `seleccion.onTodos`,
`onCheckedChange` de la fila), `components/sections/alumnos/students-directory.tsx` (estado de
la selección), `components/sections/profesores/profesores-directory.tsx`, y
`components/sections/shared/eliminar-en-lote.tsx` si la selección vive ahí. Hazlo de modo que X4
(ola 2: Tareas y Equipos) lo reutilice: si hay un hook de selección, que quede en un solo lugar
(p. ej. `useSeleccionLote(ids)` con `alternar(id, {shift})`).

**a11y:** sin anuncios nuevos obligatorios, pero el contador «N seleccionados» (ya existe,
`seleccionadosTexto`) debe actualizarse; un `title`/texto de ayuda corto opcional cerca de la
barra («Mantén Shift para elegir varios seguidos») — si lo pones es copy provisional: descríbelo
en el informe, sin fila (no tienes rango).

**Verificar:** tests puros de `alternarRango` (rango hacia abajo, hacia arriba, desmarcar rango,
ancla nula, ancla fuera de la lista, con ids filtrados).

---

## X3 — Estado vacío del ranking

**Rama** `fix/ranking-vacio` · **Decisión** D312 · **Fila** 160 · sonnet · low

**César (literal):** «en ranknig cuando no hay datos no se musetra nada de placeholder en la
lista de alumnos y tareas si ocurre esto como "todavia no hay tareas"»

**Enfoque:** cuando una sección no tiene filas (sin alumnos, o sin equipos en la pestaña
Equipos), en lugar del podio y la lista vacíos se muestra `EmptyState` de
`components/krea/empty-state.tsx` dentro de una `Card`, igual que
`components/sections/equipos-profe/teams-board.tsx:224-233` (patrón a copiar: `icon`,
`headingLevel`, `title`, `description`). Textos propuestos (provisionales, fila 160):
- Estudiantes: «Todavía no hay alumnos en {sección}» · «Cuando haya alumnos y notas, aquí verás
  quién va adelante.»
- Equipos: «Todavía no hay equipos en {sección}» · «Cuando se armen los equipos, aquí verás su
  posición.»
Decide también el caso «hay alumnos pero nadie tiene puntos aún» solo si hoy se ve roto (mídelo
leyendo la lógica de `lib/ranking-vista.ts` y `components/sections/ranking/ranking-board.tsx`);
si se ve bien (todos empatados en 0), no lo toques.

**Dónde:** `components/sections/ranking/ranking-board.tsx`, `ranking.tsx`, `ranking-en-vivo.tsx`
(el vacío debe valer también cuando llega por `onSnapshot`: pasa de vacío a con datos y al
revés sin recargar), `lib/ranking-vista.ts`. Vale para estudiante y profesor (D094, D157). El
feed `ranking-feed.tsx:41` ya tiene su vacío: no lo dupliques. Vista previa: si
`app/secciones/ranking/[estado]/page.tsx` tiene estados, añade «vacio» (D072).

**Verificar:** test puro de la función que decide vacío/no vacío; typecheck, lint, a11y por código.

---

## X4 — Tareas y Equipos en dos vistas (tarjetas / lista) con eliminar en lote

**Rama** `feat/vista-lista-tareas-equipos` · **Decisiones** D313–D316 · **Filas** 164–165 · opus · medium · Docker: no
**Base:** `main` @ b617c92 (X1 #104, X2 #103 y X3 #102 ya mergeados; D307–D312 en `context/decisions/`).

**César (pedido 56):** Tareas y Equipos del profesor en dos vistas: la actual y una lista como la
de Alumnos/Profesores, con eliminar en lote.

**Decidido con César:** interruptor **Tarjetas / Lista** en Tareas (`/profe/tareas`) y en Equipos
(`/profe/equipos`, `/profe/equipos/[seccion]`). Arranca en la vista actual (Tarjetas) y recuerda la
última elegida en `localStorage` (este navegador; una clave por pantalla). La vista Lista es una
tabla como Alumnos/Profesores con casillas, Shift+clic por rango y la barra «N seleccionados ·
Eliminar» con su confirmación.

**Dónde:**
- **Selección:** `components/sections/shared/use-seleccion-lote.ts` (hook `useSeleccionLote(ids)`,
  D311: `casilla(id)`, `alternarTodos`, `limpiar`, `quitar`, `podar`). Úsalo tal cual; `ids` = las
  filas visibles **en el orden de la tabla y ya filtradas**. Patrón de uso:
  `components/sections/alumnos/students-directory.tsx:199`, `students-table.tsx:105,167`,
  `components/sections/profesores/profesores-directory.tsx:55,93,117`.
- **Barra y diálogo del lote:** `components/sections/shared/eliminar-en-lote.tsx` (`EliminarEnLote`,
  D298–D300). Hoy habla de `cedula` (`ItemLote = { cedula, nombre }`, `onAbrir(cedulas)`,
  `eliminar(cedulas)`, `onEliminados(cedulas)`). Generalízalo a `id` (`ItemLote = { id, nombre }`)
  y actualiza sus dos usos (`alumnos/delete-students-batch.tsx:87`, `profesores-directory.tsx:93`)
  sin cambiar su comportamiento. Textos por `Sustantivo` en `lib/lote.ts:164-210`: añade
  `TAREAS = { uno: "tarea", varios: "tareas" }` y `EQUIPOS`; revisa que `seleccionadosTexto` y
  compañía concuerden en género («1 tarea seleccionada», «Ninguna tarea seleccionada»); si el
  helper asume masculino, añade el género al `Sustantivo`, con tests.
  Etiquetas de casilla: `seleccionarLabel` y `SELECCIONAR_TODOS_*` (`lib/lote.ts:206-210`).
- **Acciones de servidor en lote** (nuevas, junto a las de uno): `eliminarTareas(ids)` en
  `lib/acciones/tareas.ts` (reutiliza el cuerpo de `eliminarTarea`, `:113-135`, sin duplicar: extrae
  el «uno sin sesión ni refresh» como hace `lib/acciones/alumnos.ts:178-195` con `borrarUnAlumno`) y
  `eliminarEquipos(ids)` en `lib/acciones/equipos.ts` (igual con `eliminarEquipo`, `:186-216`: la
  regla de #104/D307 — integrantes a «Sin equipo», entregas con `titularNombre`, ajustes borrados,
  claims y logo después — sale entera de `eliminarEquipoEnTransaccion`; una transacción **por
  equipo**, no una para todos). Con `borrarEnLote` (`lib/lote.ts:32`), `exigirSesion("profesor")`,
  un `refresh()` al final y una validación nueva `zIdsLote` (ids de documento sin repetir,
  1..`TOPE_LOTE`; con `zIdDocumento`/`zIdTareaProfe` según el caso; `zCedulasLote` es solo de
  cédulas). Lo que ya no existe cuenta como borrado (idempotente, como `eliminarAlumnos`). El error
  `sesiones` de un equipo es un fallo de ese ítem con su texto (`errorGestionEquipoTexto`).
- **Qué se pierde, en el diálogo** (`descripcion`/`detalle`): Tareas — suma de lo que hoy dice el
  diálogo de una (`eliminarTareaDescripcion`, `lib/tareas-profe.ts`; las pérdidas ya vienen por
  tarea en `TareaProfe.perdida`, así que se suma en el cliente, sin ir al servidor). Equipos — suma
  de `consecuenciasEliminar` (`lib/equipos-gestion.ts:77`, texto `:141`) de cada equipo marcado,
  también en el cliente con lo que ya tiene el tablero. Función pura de suma + texto, con tests.
- **Tareas:** página `app/(profesor)/profe/tareas/page.tsx`; lista
  `components/sections/tareas-profe/teacher-task-list.tsx` (filtro por estado `TaskStatusFilter`,
  borrar uno con FLIP y foco, D243) y tarjeta `teacher-task-card.tsx`. La vista Lista comparte el
  filtro de estado (vale para las dos vistas) y la tabla muestra lo de la tarjeta en columnas:
  título (enlace a `/profe/tareas/[id]`), tipo, secciones, estado, fecha/plazo y avance
  («n de N evaluadas»); cada fila conserva «Eliminar» de una (el mismo diálogo de D243).
- **Equipos:** `app/(profesor)/profe/equipos/_equipos.tsx` y
  `components/sections/equipos-profe/teams-board.tsx` (tarjetas en `<ul>` `:238`, vacío `:229`,
  estado `EstadoEquipos`). La vista Lista: nombre (con logo/tema), integrantes (n), capitán, y
  puntos o posición solo si ya están en los datos del tablero; acciones de fila (editar,
  eliminar, con los diálogos existentes de `team-dialogs.tsx`). Mover integrantes y cambiar
  capitán siguen solo en Tarjetas. «Sin equipo» (`unassigned-card.tsx`) no es fila seleccionable.
- **Interruptor:** `ToggleGroup` de `components/ui/toggle-group.tsx` (radiogroup; mira cómo lo usa
  `components/sections/alumnos/student-filters.tsx`), ícono + texto «Tarjetas» / «Lista», en la
  cabecera de cada pantalla (`tasks-header.tsx`, `teams-header.tsx`). Recordar en `localStorage`
  como `components/sections/ranking/ranking-how-to.tsx:16-48`: helper puro que valida el valor
  (`vistaDe(valor): "tarjetas" | "lista"`, inválido o null → `"tarjetas"`), leído en un efecto tras
  montar (el server pinta Tarjetas; sin hidratación rota), `try/catch` en lectura y escritura.
  Claves: `krea.vista.tareas` y `krea.vista.equipos`.
- **Arreglo heredado de X1 — «3 de 2 evaluadas»:** `totalTitulares` (`lib/tareas-profe-datos.ts:301`)
  suma `conteos().equipos` (`lib/datos/profesor.ts:96`), que solo cuenta equipos vivos; tras
  eliminar un equipo con entregas, sus entregas siguen contando en `hechas`. El total pasa a ser
  **titulares con entrega existente (no borrador) + titulares vivos sin entrega** en las secciones
  de la tarea. Para la grupal hace falta saber qué `titularId` siguen vivos: la página ya trae
  `entregasTodas()`; añade `equiposTodos()` (o amplía `Conteos` con los ids de equipo por
  sección) y que `resumenEntregas` devuelva también los titulares con entrega. La individual con
  la misma fórmula. Invariante con test: `hechas <= total` siempre. Tests en
  `tests/unit/tareas-profe-datos.test.ts` (`:412-482`): equipo eliminado con 1 entrega evaluada +
  2 equipos vivos sin entrega → «1 de 3», no «1 de 2».

**Trampas:**
- `EliminarEnLote` ya resuelve trozos, reintentos y foco: no reimplementes nada de eso.
- La selección se poda tras `refresh()` (`podar(existentes)`); al cambiar de vista o de filtro, lo
  oculto sale de la selección (lo visible manda, como en Alumnos).
- Tareas: el borrado en lote no necesita el FLIP de una; con `refresh()` las filas desaparecen.
  Foco al terminar si no queda nada: el interruptor o el `<h1>` (`focoAlTerminar`).
- Equipos: el tablero tiene estado optimista propio; tras borrar en lote manda el `inicial` del
  servidor (ya lo hace, `teams-board.tsx:~95`). No borres en el cliente antes de la respuesta.
- Vista previa / galería sin acciones (`TeacherTaskList` sin `eliminar`, `TeamsBoard` sin
  `acciones`): la Lista se ve sin casillas ni barra.
- 320 px sin scroll horizontal de página: haz lo que ya hace Profesores/Alumnos con su tabla.
- Tokens: nada de valores sueltos; el estado activo del interruptor no solo por color.

**Copy provisional** (filas 164–165): 164 = textos del interruptor y su `aria-label` («Vista»),
165 = textos del diálogo de lote de Tareas y Equipos (título, descripción, pérdidas). Descríbelos
en el informe; no edites el checklist.

**Decisiones** (D313–D316, propuesta): D313 interruptor Tarjetas/Lista con memoria en
`localStorage`; D314 eliminar tareas en lote; D315 eliminar equipos en lote (regla de D307 por
equipo); D316 total de titulares con entregas de equipos eliminados. Usa menos si sobran.

**Verificar:** tests puros (`vistaDe`, suma de pérdidas y su texto, `Sustantivo` con género,
`zIdsLote`, `totalTitulares`/`tareaProfeDe` con equipo eliminado); las acciones en lote como estén
probadas las de alumnos (`grep -rn "eliminarAlumnos\|borrarEnLote" tests`); `bun run test:rules`
solo si tocas reglas o la transacción. typecheck, lint, suite entera, `a11y` por código
(interruptor con teclado y nombre, tabla con nombre, casillas etiquetadas, 320 px, 4 acentos ×
claro/oscuro). Sin servidor ni capturas. «Cómo probar» del PR: rol profesor, ambas pantallas,
ambas vistas, borrar 2 en lote, recargar y ver que recuerda la vista, y el avance de una grupal
tras eliminar un equipo con entrega.

---

## X5a — Catálogo de años y secciones + gestión (`feat/secciones-datos`)

**Modelo:** opus · high · **Decisiones:** D317–D321 · **Checklist:** fila 166 · sin changeset ·
**Docker:** no (emuladores con Java para `test:rules`).

**Qué pidió César (pedido 58):** «Crear, editar y eliminar años y sus secciones». Decidido con
él (ronda única, `batch-2026-11-07.md`): modelo **Año › secciones** (1.º–5.º… y dentro A, B, C;
el código «5A» = año + letra). Un año o una sección **solo se elimina vacío** (sin alumnos,
equipos ni tareas). Se hace ya, en Firebase.

**Alcance de esta unidad:** las **formas compartidas** de X5 (brief, «Ola 3 — Formas compartidas
de X5»: créalas exactamente así), el CRUD del catálogo y la pantalla para gestionarlo. **No**
cambias las pantallas que hoy listan 5A/5C (segmentados, filtros, tareas, ranking, panel,
puntos, alumnos, `conteos()`, `rankingsTodos()`): eso es X5b, después de ti. Tras tu PR la app
se comporta igual que hoy para 5A/5C; solo se suma la pantalla nueva.

**Dónde está el código:**
- `lib/modelo.ts:55-57` `SECCIONES`/`SeccionId`/`zSeccion` (enum fijo); `:117` `zUsuario.seccion`,
  `:157` equipo, `:219-220` `zDecisionesPremio` con claves `"5A"`/`"5C"` → pásalo a
  `z.record(zSeccion, zDecisionPremio)` (compatible con los datos guardados). `:238`, `:287`
  `secciones` de tarea y borrador; `:346`, `:387` entrega y ajuste; `:437` `Claims`. `COL` en `:15`.
- `lib/sesion.ts:97` acepta solo `"5A" | "5C"` del claim → `esCodigoSeccion`. Tests en
  `tests/unit/sesion.test.ts`.
- Tipos con alias propios que hoy son `"5A" | "5C"` (`lib/alumnos.ts:8`, `lib/equipos-profe.ts:8`,
  `lib/panel.ts:6`, `lib/puntos.ts:10`, `lib/ranking-vista.ts:9`, `lib/tareas-profe.ts:200`): **no
  los toques** (X5b); compila igual porque `SeccionId` se ensancha.
- Seed: `lib/seed-firestore.ts:85, :138, :187` y `scripts/seed-emulator.ts:108` → el seed escribe
  también `config/secciones` con `CATALOGO_INICIAL`.
- Reglas: `firebase/firestore.rules` (funciones `:14-27`; `ranking/{seccion}` `:80`) → añade
  `config/{doc}` (solo lectura profe). Test en `tests/rules/` (mira `tests/rules/firestore.test.ts`).
- Pantalla admin de referencia (estructura, diálogos, `exigirAdmin`): `app/(profesor)/profe/profesores/page.tsx`,
  `components/sections/profesores/profesores-directory.tsx`, `profesor-dialogs.tsx`,
  `lib/acciones/profesores.ts` (`exigirAdmin`, `lib/dal.ts:57`). Nav: `lib/nav.ts:166-173`
  (ítem `profesores`, `soloAdmin`) e íconos en `components/layout/nav-icon.tsx`.
- Loaders existentes para contar uso: `lib/datos/profesor.ts` (`usuariosTodos`, `equiposTodos`,
  `tareasProfe` —borradores incluidos—, `entregasTodas`, `ajustesTodos`).

**Enfoque decidido:**
- **Pantalla `/profe/secciones` «Años y secciones»**, ítem de nav `secciones` junto a Profesores,
  **solo admin** (`soloAdmin`, acciones con `exigirAdmin`): es estructura de toda la escuela.
  Lista de años (tarjeta por año, `nombreAnio`), dentro sus secciones (letra + uso: n alumnos,
  n equipos, n tareas). Acciones: «Nuevo año» (número 1–9 sin usar + letras iniciales, puede ser
  ninguna), por año «Agregar sección» (letra sin usar), «Editar año» (cambiar el número) y
  «Eliminar año»; por sección «Editar» (cambiar la letra) y «Eliminar».
- **Editar = renombrar el código, y solo vacío.** Cambiar el número de un año o la letra de una
  sección cambia el código («5A» → «4A»), que está guardado en usuarios, claims, equipos, tareas,
  entregas, ajustes, `ranking/{seccion}` y `decisionesPremio`. Para no reescribir todo eso, se
  permite **solo si la sección (o todas las del año) está vacía**, la misma regla que eliminar.
  Con datos, el botón sigue visible pero el diálogo explica por qué no (`usoTexto`), no solo un
  `disabled` mudo. Alternativa descartada (en la decisión): renombrar en cascada con datos.
- **Vacío** = `seccionVacia(uso)`: 0 usuarios con esa `seccion` (alumnos **y** profes asignados,
  ver `seccionesDelProfe` en `lib/datos/profesor.ts:201`), 0 equipos, 0 tareas o borradores con
  esa sección en `secciones`, 0 entregas, 0 ajustes. La pantalla lo calcula con los loaders ya
  cacheados y una función pura `usoPorSeccion(...)`; la **acción lo vuelve a comprobar** dentro de
  una transacción (consultas `count()` o `limit(1)` por colección + lee `config/secciones`) y,
  al eliminar, borra también `ranking/{codigo}` si existe. Año: vacío si todas sus secciones lo están.
- **Acciones** en `lib/acciones/secciones.ts`: `crearAnio`, `editarAnio`, `eliminarAnio`,
  `crearSeccion`, `editarSeccion`, `eliminarSeccion`; entrada zod (`zNumeroAnio`, `zLetra`,
  `zSeccion`), transacción sobre `config/secciones` (documento ausente → parte de
  `CATALOGO_INICIAL`), `refresh()` al terminar (guardián `tests/unit/cache-rutas.test.ts`),
  idempotentes (crear lo que ya existe = error claro «Ya existe 5A», no duplica), resultado
  `{ ok: true } | { ok: false; error: <código> }` con texto puro al estilo de
  `errorGestionEquipoTexto`. La lógica de transformar el catálogo (agregar, renombrar, quitar,
  ordenar, validar duplicados) es **pura** en `lib/secciones.ts`, con tests.
- **Sin acceso a la base real.** Nada de script de migración: el documento ausente ya vale
  `CATALOGO_INICIAL`.

**Trampas:**
- `zSeccion` deja de ser enum: busca `zSeccion.options`, `z.enum(SECCIONES` y `as SeccionId` que
  dependan de la unión (`grep -rn "zSeccion\.\|SECCIONES" app lib components scripts tests`) y
  haz que compilen; `Record<SeccionId, …>` con literales `{ "5A": …, "5C": … }` sigue compilando
  con `string`, no los reescribas.
- `tests/unit/modelo.test.ts` probablemente prueba que «5B» es inválida: ahora es válida
  (formato); inválidas son «5», «AA», «0A», «5a».
- `decisionesPremio` como `z.record`: revisa quién lo lee (`grep -rn "decisionesPremio" lib components app`)
  y que acceder a una clave ausente siga dando `undefined`.
- Next 16 con `cacheComponents`: la página nueva sigue el patrón de `profesores/page.tsx` (loader
  bajo `Suspense`/`loading.tsx`). Lee `node_modules/next/dist/docs/` si usas algo nuevo.
- 320 px sin scroll horizontal; confirmación antes de eliminar; foco al diálogo y de vuelta;
  submit `disabled` mientras vuela; el estado «no se puede eliminar» con texto, no solo color.

**Copy provisional** (fila 166): título y eyebrow de la pantalla, textos de los diálogos (nuevo
año, agregar sección, editar, eliminar, «no se puede porque…»), errores y vacío («Todavía no hay
años»). Descríbelo en el informe; no edites el checklist.

**Decisiones** (D317–D321, propuesta): D317 catálogo `config/secciones` (documento único, ausente
= inicial, código año+letra); D318 eliminar y renombrar solo vacío (qué cuenta como uso; cascada
descartada); D319 pantalla Años y secciones solo admin; D320 `decisionesPremio` por registro.
Usa menos si sobran.

**Verificar:** tests puros de `lib/secciones.ts` (códigos, slugs, `listaSecciones`, transformar
catálogo con duplicados y límites, `seccionVacia`, `usoTexto`, `usoPorSeccion`), `modelo.test.ts`
y `sesion.test.ts` al día, `bun run test:rules` (el profe lee `config/secciones`, el estudiante
no, nadie escribe). typecheck, lint, suite entera, `a11y` por código. Sin servidor ni capturas.
«Cómo probar» del PR: rol profesor admin; crear 4.º año con A y B, renombrar 4B → 4D, eliminar
4D; intentar eliminar 5A (tiene alumnos) y ver el motivo; un profe no admin no ve la pantalla.

---

## X5b — Secciones dinámicas en toda la app (`feat/secciones-dinamicas`)

**Modelo:** opus · high · **Decisiones:** D322–D326 · **Checklist:** filas 168–170 · sin
changeset · **Docker:** no. **Se lanza con X5a ya en `main`**: antes de empezar, confirma que
existen `lib/secciones.ts`, `lib/datos/secciones.ts` y `config/secciones` en las reglas; si X5a
cambió alguna forma del brief, manda lo que está en `main` (léelo en su D317).

**Lo que dejó X5a (#106, léelo en `context/decisions/D317`–`D321` y en `lib/secciones.ts`):**
- Formas del brief creadas, más `DOC_SECCIONES` y `CatalogoSeccionesDoc` en `lib/modelo.ts`, y
  helpers extra en `lib/secciones.ts` (`seccionesDelAnio`, `filasSecciones`, `resumenCatalogo`, …):
  úsalos antes de escribir otros.
- **Estrechamientos transitorios (D321) que tienes que quitar:** 11 `as <Tipo>["seccion"]` con el
  comentario «La vista aún lista 5A/5C (… X5b, D317)» en `app/(estudiante)/ranking/_ranking.tsx`,
  `lib/ajustes-datos.ts` (×3), `lib/alumnos-datos.ts`, `lib/equipos-datos.ts`, `lib/panel-datos.ts`
  (×4, incluido el tipo de `avance`) y `lib/tareas-profe-datos.ts` (`seccionTareaDe`).
  `git grep -n "X5b, D317"` los encuentra todos; al terminar no queda ninguno.
- **Choque de nombres:** `lib/tareas-profe-datos.ts` exporta su propio `seccionesDe(SeccionTarea)`;
  el de `lib/secciones.ts` es `seccionesDe(catalogo)`. Borra o renombra el de tareas.
- **Riesgo real:** `candidatosDe` (`lib/ajustes-datos.ts`) y `datosPanel` (`lib/panel-datos.ts`)
  indexan registros literales `{ "5A": …, "5C": … }`: un alumno de 4B da `undefined.push`. Constrúyelos
  desde el catálogo (o con `??=`), con test de una sección nueva.
- **Hueco de validación:** `zSeccion` valida la forma (`/^[1-9][A-Z]$/`), no que exista. Las acciones
  que reciben una sección (alta y edición de alumno, crear equipo, crear/editar tarea, ajuste de
  puntos) comprueban además que esté en `catalogoSecciones()`; si no, error claro. Con test.

**Qué pidió César (pedido 58):** «Crear, editar y eliminar años y sus secciones». X5a creó el
catálogo y su pantalla; tu unidad hace que **todo lo que hoy lista 5A/5C use el catálogo**, para
que una sección nueva (p. ej. 4B) funcione entera: alumnos, equipos, tareas, evaluar, puntos,
ranking, panel y premios.

**Dónde está el código** (fijo hoy en 5A/5C; `grep -rnE "\"5[AC]\"|'5[AC]'|SECCIONES|/5c|5A y 5C" app lib components scripts`
fuera de `lib/demo/`, `app/secciones/`, `app/componentes/`, `app/estados/`, que son galería con
datos de muestra y se quedan):
- **Loaders:** `lib/datos/profesor.ts:96-122` `conteos()` (`contar("5A")`, `contar("5C")`),
  `:168-184` `rankingsTodos()` y `:201` `seccionesDelProfe` → recorren `seccionesDe(await catalogoSecciones())`.
  `Conteos` (`lib/tareas-profe-datos.ts:318-321`) pasa a `Record<string, …>` con todas las secciones.
- **Rutas del ranking del profe:** `app/(profesor)/profe/ranking/page.tsx`, `equipos/page.tsx`,
  `5c/page.tsx`, `5c/equipos/page.tsx` (+ `loading.tsx`) y `_ranking.tsx:18-19, :46` (`href` y
  enlaces `"5A"`/`"5C"`). Pasan a `/profe/ranking/[seccion]` y `/profe/ranking/[seccion]/equipos`
  (slug `slugSeccion`, `seccionDeSlug` → `notFound()` si no existe); `/profe/ranking` y
  `/profe/ranking/equipos` muestran la **primera** sección del catálogo. `/profe/ranking/5c`
  sigue funcionando (es un slug). La carpeta `5c/` sobra (la cubre `[seccion]`): bórrala.
- **Equipos:** `app/(profesor)/profe/equipos/[seccion]/page.tsx:8-26` (mapa fijo y
  `generateStaticParams`), `equipos/page.tsx:10` (`seccion="5A"`), `_equipos.tsx:25`,
  `components/sections/equipos-profe/teams-header.tsx:8, :39`.
- **Selectores y filtros:** `components/sections/ranking/ranking-header.tsx:48-49`,
  `components/sections/alumnos/student-filters.tsx:16, :58`, `students-directory.tsx:66, :194-195`,
  `add-student-dialog.tsx:273`, `components/sections/puntos/adjustment-form.tsx:48, :94, :203`,
  `adjustment-history.tsx:46-50, :123`, `components/sections/profe-panel/panel-view.tsx:52`,
  `lib/panel.ts:6-18` (filtro `"ambas"`), `lib/alumnos.ts:8, :194-210` (`otraSeccion`,
  `busquedaVacia`), `:262` (filtro de URL), `app/(profesor)/profe/alumnos/page.tsx:66`.
- **Tareas:** `lib/tareas-profe.ts:200-205` (`SeccionTarea` = «5A» | «5C» | «5A y 5C»), `:595`,
  `lib/tareas-profe-datos.ts:49, :69, :97, :108-115` (`seccionesDe`/`seccionTareaDe`), `:394-404`,
  `:443-451`, `components/sections/tareas-profe/task-builder.tsx:82, :656`, `tasks-header.tsx:16`.
- **Otros datos:** `lib/ajustes-datos.ts:213-260` (candidatos `{ "5A": [], "5C": [] }`),
  `lib/panel-datos.ts:132-141` (avance por sección), `lib/premios.ts:34-37`,
  `components/sections/premios/prizes-board.tsx`, `lib/ranking-vista.ts:9`.
- **Alias de tipo a borrar** (todos = `SeccionId`): `SeccionAlumnos`, `SeccionEquipos`,
  `SeccionPanel`, `SeccionPuntos`, `SeccionRanking`, `SeccionTarea`. Y `SECCIONES` de
  `lib/modelo.ts` (X5a lo dejó `@deprecated`): al final no queda ningún uso fuera de la galería
  y el seed (que usan `CATALOGO_INICIAL`).
- **Copy fija con «5.º año»:** `components/sections/auth/auth-layout.tsx:48` («5.º año, secciones
  A y C»), `components/sections/auth/login-form.tsx:53`, `components/sections/profe-panel/panel-header.tsx:25`.

**Enfoque decidido:**
- Cada página del profe lee `catalogoSecciones()` en el servidor y pasa `secciones: string[]`
  (o el catálogo, si agrupa por año) a sus componentes cliente. Nada en el cliente lee Firestore
  para esto.
- **Un selector de sección compartido** (`components/sections/shared/selector-seccion.tsx`): con
  **≤ 4 secciones**, el segmentado actual (enlaces o `ToggleGroup`, como hoy); con **más**, un
  `Select` agrupado por año (`SelectGroup` + `SelectLabel` «5.º año», como la galería
  `app/componentes/_familias/formularios.tsx:61`). Con `flex-wrap`, sin scroll horizontal a 320 px.
  Úsalo en ranking, equipos, alumnos, puntos y panel. Es decisión visual nueva tomada de forma
  conservadora: explícala en el PR con su alternativa (siempre `Select`, o pestañas con scroll).
- **Panel:** el filtro «Ambas» pasa a «Todas» + cada sección.
- **Tareas:** «5A | 5C | 5A y 5C» → casillas por sección agrupadas por año (`fieldset` + `legend`
  por año), al menos una; el texto de resumen usa `listaSecciones` («4B, 5A y 5C»). `SeccionTarea`
  desaparece; `seccionesDe`/`seccionTareaDe` se borran o pasan a `string[]`. Si una tarea tiene una
  sección que el catálogo ya no tiene (no debería: solo se elimina vacía), muéstrala con su código.
- **Alumnos:** `busquedaVacia` sugiere la sección con más coincidencias (o ninguna), no «la otra».
- **Sin secciones** (catálogo vacío): Alumnos, Equipos, Tareas (crear), Puntos y Ranking muestran
  un `EmptyState` «Todavía no hay secciones» con enlace a `/profe/secciones` si el profe es admin;
  si no, «Pídele al administrador que cree una» (fila 169).
- **Copy de «5.º año»** en login/auth y panel: quita el año fijo («Escuela Creativa del liceo»);
  fila 170. En login no hay sesión: no leas el catálogo allí.
- **`seccionesDelProfe`**: un profe con `seccion` asignada sigue viendo solo la suya.

**Trampas:**
- Next 16 + `cacheComponents`: `generateStaticParams` en `[seccion]` ya no puede salir de un mapa
  fijo. Lee en `node_modules/next/dist/docs/` qué pide `cacheComponents` a una ruta dinámica
  (Suspense alrededor de lo que lee `params`; si `generateStaticParams` debe devolver al menos un
  valor, usa `CATALOGO_INICIAL`). Conserva el `loading.tsx` de cada ruta.
- `/profe/ranking/equipos` (estático) gana a `[seccion]`: no hay choque (un código es número +
  letra, nunca «equipos»).
- `scripts/qa/paginas.mjs` y `scripts/qa/segmentado.mjs` listan rutas `5c`: siguen valiendo,
  revisa que no se rompan.
- Los textos de accesibilidad que dicen «5A y 5C» (`aria-label`, `eyebrow`,
  `eliminarTareaDescripcion` con `secciones`, `lib/tareas-profe.ts:595`) pasan por `listaSecciones`.
- Arregla la clase entera en la primera pasada: al terminar, el `grep` de arriba no da nada fuera
  de galería/demo/seed/tests.

**Copy provisional** (filas 168–170): 168 = selector de sección y casillas de Tareas (`aria-label`,
`legend`, «Todas»); 169 = vacíos sin secciones; 170 = login/auth/panel sin «5.º año». En el
informe; no edites el checklist.

**Decisiones** (D322–D326, propuesta): D322 selector de sección (segmentado ≤ 4, `Select` por año);
D323 rutas `/profe/ranking/[seccion]`; D324 tareas con casillas por sección; D325 vacíos sin
secciones; D326 copy sin año fijo. Usa menos si sobran.

**Verificar:** tests puros de lo que cambie (`conteos` por catálogo vía funciones puras,
`busquedaVacia`, filtros de URL con «4B», `totalTitulares` con 3 secciones, panel «Todas»,
resumen de tareas con `listaSecciones`); el `grep` de la clase vacío; typecheck, lint, suite
entera; `bun run test:rules` si tocas reglas. `a11y` por código (selector con teclado y nombre,
casillas con `legend`, 320 px, 4 acentos × claro/oscuro). Sin servidor ni capturas. «Cómo probar»
del PR: rol profesor; con 4B creada en `/profe/secciones`, alta de un alumno en 4B, equipo en 4B,
tarea para 4B y 5A, evaluarla, ajuste de puntos en 4B, ranking `/profe/ranking/4b`, panel «Todas»;
el estudiante de 4B entra y ve su ranking.
