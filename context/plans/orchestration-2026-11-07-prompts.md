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
