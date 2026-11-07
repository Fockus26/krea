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
