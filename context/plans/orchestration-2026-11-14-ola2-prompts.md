# Tanda 2026-11-14 — brief y prompts de la ola 2 (W1, W2)

Brief común: main @ 899a420. Modo `pr` (push a tu rama, PR a main, nunca merge ni auto-merge). Sin
versionado (no changesets). Sin dev server ni QA (memoria de César: QA al final): verifica por código
+ pruebas. **La máquina se satura con dos workers a la vez**: corre solo `bun run test:related` y,
una vez, `bun run typecheck` y `bun run lint` (en segundo plano si pasan de 2 min); la suite entera
la corre el **CI de GitHub**: tras abrir el PR mira `gh pr checks <n> --watch` (en segundo plano) y
arregla lo que falle hasta dejarlo verde. No corras `bun run build`. No hay entorno DOM de pruebas
(sin happy-dom/jsdom): prueba la lógica pura y la capa de datos sobre PGlite (como `tests/db/*`).
Carpeta principal (para leer `context/` local): `C:\Users\Cesar\Documents\Work\krea`. No edites
`CURRENT_PHASE.md` ni `CONTENT_CHECKLIST.md`: deja tus filas y tu PHASE_LOG en el informe. Copy en
español (es-VE, decimales con coma), todo PROVISIONAL con su fila. Reglas de CLAUDE.md (tokens, WCAG
AA, 320 px sin scroll, estado nunca solo por color). Skill `a11y` antes del PR. Decisión visual
nueva: elige la conservadora y explica la alternativa en el PR. Commits y PR en español. Cada
decisión = un archivo en `context/decisions/` (van en git), solo dentro de tu rango de D. Si te falta
un token, usa el más cercano y lístalo en «Tokens que faltan». AGENTS.md: este Next tiene cambios que
rompen; lee la guía en `node_modules/next/dist/docs/` antes de usar una API de Next que no esté ya en
el archivo que tocas. Migraciones y SQL de datos: se escriben, **no se aplican** (las aplica César en
`krea_preview` y `krea` por `ssh kit-vps`). Docker: no. Servicios en puertos fijos: no.

Windows: busca con ruta acotada o `git grep` (un `grep -r` sin ruta recorre `node_modules` y tarda
minutos); edita con Edit/Write (nada que deje CRLF: biome lo marca). Los archivos **nuevos** dentro
de tu zona son tuyos sin pedir permiso, igual que sus pruebas en `tests/`.

**Informe final** (lo primero: el enlace del PR y el estado del CI): decisiones tomadas con su
alternativa, filas del checklist (texto completo de cada fila), PHASE_LOG, acciones manuales para
César, «Tokens que faltan», «Kit feedback».

**Formas compartidas (fijas, no las cambies):**
- `zEvaluacion.bases?: Record<cédula, base>` (`lib/modelo.ts`): solo la escribe y la lee **W1**.
- Clave de presencia de una entrega: `claveEntrega(id) = "entrega:" + id`, guardada en la columna
  `presencia.alumno_id` (sin migración). Solo **W2**. Una cédula es `^\d{7,9}$`, así que nunca choca.
- El error `cambio` de Guardar («Otra persona cambió esta nota…», D224, `lib/evaluar-datos.ts:165`)
  ya existe y no cambia: es el «te avisaremos» del aviso de W2.

**Dueños de archivos (no toques los de la otra unidad):**
- **W1:** `lib/modelo.ts` (solo `zEvaluacion`), `lib/grades.ts`, `lib/ranking-datos.ts`,
  `lib/evaluar-datos.ts`, `lib/evaluar.ts`, `lib/data/evaluar.ts`, `lib/data/puntaje-final.ts`,
  `lib/puntaje-final.ts`, `lib/vistas-estudiante.ts`, `lib/equipo.ts`, `lib/panel-datos.ts`,
  `lib/alumnos-datos.ts`, `lib/tareas-profe-entregas.ts`, `components/sections/evaluar/review-form.tsx`,
  `review-members.tsx`, `review-header.tsx`, `components/krea/live-total.tsx`,
  `components/sections/alumnos/edit-student-dialog.tsx` (solo el copy de la base),
  `components/sections/tareas-profe/task-submissions.tsx`, vistas de nota del alumno
  (`app/(estudiante)/**`, `components/sections/notas/*`), `lib/demo/*`, `app/secciones/**`,
  `scripts/sql/`.
- **W2:** `app/api/presencia/route.ts`, `lib/presencia.ts`, `lib/data/presencia.ts`, `lib/acceso.ts`,
  `components/sections/alumnos/use-presencia.ts` (sin moverlo ni cambiar lo que exporta hoy: lo
  importan `students-directory.tsx`, `students-table.tsx` y `edit-student-dialog.tsx`, que no editas),
  y un componente **nuevo** `components/sections/evaluar/presencia-evaluar.tsx`.
- **Compartido, por zonas:** `app/(profesor)/profe/evaluar/[entrega]/page.tsx` — W1 solo las props
  de `<ReviewForm …>` (líneas 152–167) y el bloque `soloVer` (127–150); W2 solo un `import`, sumar
  `profesorActual()` al `Promise.all` (68–72) y **una** línea JSX justo después de `<ReviewHeader … />`
  (línea 114). Nada más de ese archivo, para que los dos PR se mezclen sin conflicto.

---

## W1 — Base por alumno en cada tarea (pedido 11)

Rama `feat/base-por-tarea` · D403–D407 · filas 212–216 · `opus` · high · Docker no · puertos fijos no.

César: «11. La nota base no sea general sino por tarea.» Decidió (2026-11-14): **por alumno en cada
tarea** — al evaluar una entrega se elige la base de ese alumno para ESA tarea (por defecto su base
actual); las entregas ya evaluadas conservan la suya; en grupales, una base por integrante.

Decisiones que te condicionan (`cat context/decisions/D0NN-*.md`): D006 (base 10–20, pasos 0,5), D013
(la nota no se guarda, se deriva), D176 (base por alumno con historial: **la sustituyes en parte**),
D177 (base por integrante en grupales; el equipo suma el puntaje sin base), D364–D366 («No participó»
= nota 1 fija, sin base), D205 («Deshacer» devuelve `evaluacionAnterior`), D224 (`version`), D007
(nota ≠ puntos).

Estado verificado:
- `usuarios.base` (`lib/db/schema.ts:123`, `zUsuario.base` en `lib/modelo.ts:156`) es hoy la única
  base; `historial_base` guarda cada cambio (D176).
- La nota de un integrante sale de **una** función: `notaDeIntegrante(entrega, base, cedula)`
  (`lib/ranking-datos.ts:34-42`), que todos llaman con la base vigente del alumno:
  `ranking-datos.ts:54`, `alumnos-datos.ts:243,266,281,314`, `panel-datos.ts:158`,
  `tareas-profe-entregas.ts:70,102`, `vistas-estudiante.ts:167,282`. Fuera de ella:
  `lib/equipo.ts:98` (`notaFinal(puntaje, a.base)`).
- Quién **muestra** la base como dato: `vistas-estudiante.ts:238,295,559,695`,
  `tareas-profe-entregas.ts:69,98,167`, `evaluar-datos.ts:645-651` (chip y `base` de la vista),
  `task-submissions.tsx:158-218`.
- `zEvaluacion` (`lib/modelo.ts:404-418`) vive en el jsonb `entregas.evaluacion`; `noParticiparon`
  es el precedente de campo opcional sin migración (D364).
- Guardar: `zGuardarEvaluacion` (`lib/evaluar-datos.ts:112-135`) → `armarEvaluacion` (191-247) →
  `evaluarEnTransaccion` (`lib/data/evaluar.ts:24-89`), que ya tiene `datos = leerSeccion(tx, …)` con
  los usuarios de la sección.
- Formulario: `review-form.tsx` recibe `base` (una, :115) para `LiveTotal` y el toast (:203); en
  grupales `baseEfectiva` da 20 (`lib/evaluar.ts:87`). `review-members.tsx` lista los integrantes con
  la casilla «No participó».
- `lib/data/puntaje-final.ts:59-86` arma una evaluación desde «Editar alumno» (tarea 1).
- «Editar alumno» dice en la ayuda de la base (`edit-student-dialog.tsx:350`): «Cambia todas sus
  notas; los puntos de sus notas se recalculan.» Deja de ser verdad.

Enfoque decidido (no lo re-decidas):
1. **Sin migración de esquema.** `zEvaluacion` gana `bases: z.record(zCedula, zBase).optional()`: la
   base con la que se evaluó a cada integrante en ESTA entrega. Desde la app se escribe **siempre**
   (una clave por integrante; en individual, una).
2. **Lectura:** helper puro `baseDeIntegrante(entrega, cedula, baseVigente)` =
   `entrega.evaluacion?.bases?.[cedula] ?? baseVigente` en `lib/ranking-datos.ts`;
   `notaDeIntegrante` lo usa por dentro (su parámetro `base` pasa a ser «la vigente, de respaldo»), así
   ningún llamador cambia de firma. Arregla `lib/equipo.ts:98` y todos los sitios que **muestran** la
   base de una entrega evaluada para que usen el helper. Una entrega sin evaluar muestra la vigente
   (como hoy). «No participó» sigue en 1 sin base.
3. **Escritura:** `zGuardarEvaluacion.bases?: Record<cédula, base>` (opcional: un formulario viejo
   sigue guardando). `armarEvaluacion` recibe además las bases vigentes de los integrantes y resuelve
   por integrante: la que mandó el profe → si no, la de la evaluación vigente de esa entrega → si no,
   la vigente del alumno → si no existe el usuario, 20. Una cédula que no es integrante = `invalida`.
4. **Elegir la base no cambia `usuarios.base`.** La base de «Editar alumno» queda como **base por
   defecto de las próximas evaluaciones**; cambia su ayuda y lo que diga que recalcula las notas. El
   historial (D176) sigue igual.
5. **Las ya evaluadas conservan la suya:** escribe `scripts/sql/2026-11-14-bases-por-entrega.sql`
   (idempotente, no lo apliques): a cada entrega `evaluada` sin `bases` le pone la base vigente de
   cada integrante, y lo mismo a `evaluacion_anterior` si existe (mira el nombre real de las columnas
   en `lib/db/schema.ts` y el patrón de `scripts/sql/2026-11-14-semillas-avatar.sql`). Hasta que
   César lo aplique, una evaluación sin `bases` sigue la base vigente (el respaldo del punto 2):
   dilo en el PR como acción manual.
6. **UI de Evaluar.** Individual: un control «Base de esta tarea» (el `NumberStepper` del proyecto,
   10–20, paso 0,5, como en `edit-student-dialog.tsx:348-368`) con valor inicial = la de la
   evaluación vigente o la vigente del alumno; `LiveTotal`, el chip de la cabecera y el toast usan la
   elegida, en vivo. Grupal: en `review-members.tsx`, cada integrante con su propio control de base
   (deshabilitado y sin efecto si está marcado «No participó»); `LiveTotal` sigue mostrando la nota
   del equipo sobre 20. Conservador: el control va en una tarjeta propia junto a las preguntas (móvil)
   y no dentro de la barra sticky. Nombre accesible por integrante («Base de <nombre>»), táctil ≥ 44
   px, sin scroll a 320 px. El estado `deshechas` (Deshacer) guarda también las bases.
7. `lib/data/puntaje-final.ts`: al poner el puntaje final de la tarea 1, conserva la base que ya
   tuviera esa entrega; si no tenía, guarda la vigente del alumno.
8. Vistas del alumno y del profe: junto a cada nota evaluada, la base de **esa** entrega. El chip de
   base del Perfil del alumno (`vistas-estudiante.ts:695`) queda como está (su base actual): déjalo
   anotado en el PR como decisión abierta para César, no lo quites.
9. Decisiones: una que sustituye en parte a D176 (cambia solo la línea de título de D176 a
   «Superseded in part by D403»), y las demás del rango para forma del dato, UI y SQL.
10. Galería/demo (`lib/demo/*`, `app/secciones/**`): que compilen y muestren el control nuevo.

Trampas:
- `tests/unit/tokens.test.ts` prohíbe hex en `app/` (también en comentarios).
- `zEntrega` tiene `superRefine` (`lib/modelo.ts:449`): no añadas reglas que invaliden filas viejas
  sin `bases` (una fila que no valida se ignora y el alumno pierde la nota).
- `notaFinal` lanza `RangeError` con una base fuera de 10–20 o que no sea múltiplo de 0,5: valida con
  `zBase` antes.
- El equipo suma el puntaje sin base (`puntosDeEquipoDatos`): no lo toques.
- `page.tsx` de Evaluar: solo tus zonas (ver «Compartido»). W2 añade una línea tras `<ReviewHeader>`.
- No edites `use-presencia.ts`, `lib/presencia.ts` ni `app/api/presencia/*` (W2).

Verificación: pruebas puras de `baseDeIntegrante`/`notaDeIntegrante` (con `bases`, sin `bases`, «No
participó», integrante sin clave), de `armarEvaluacion` (las cuatro fuentes de la base, cédula ajena,
base inválida, corregir conserva lo no enviado), de `puntosDeAlumno`/`calcularRanking` (cambiar
`usuarios.base` no mueve una entrega con `bases`), de `deshacerEvaluacion` (vuelven las bases
anteriores) y de `vistaEvaluar`; en `tests/db/evaluar.test.ts`, guardar con bases y que el ranking de
la sección salga con ellas. El SQL: prueba su equivalente sobre PGlite si el arnés de `tests/db`
deja ejecutar SQL crudo; si no, dilo en el informe.

Cierre: sin changeset. En el PR, «Decisión tomada / alternativa» para: jsonb vs. columna o tabla
(migración), dónde va el control de base, el chip del Perfil, y si elegir la base debería actualizar
también la base por defecto del alumno. Acción manual: el SQL en `krea_preview` y `krea`.

---

## W2 — Aviso «otro profesor está evaluando esta entrega» (pedido 8)

Rama `feat/presencia-evaluar` · D408–D410 · filas 217–219 · `opus` · medium · Docker no · puertos fijos no.

César: «8. Que avise cuando otro profesor esté evaluando la misma entrega» (reutilizando la presencia
de «Editar alumno»).

Decisiones que te condicionan: D275 (presencia efímera, latido 20 s, vigencia 45 s), D276 (conflicto
al guardar: no se pisa), D277 (chip y aviso, nunca solo color), D327 (Postgres: el navegador habla
solo con `/api/presencia`), D224 (`cambio` al guardar una evaluación que otro cambió).

Estado verificado:
- Tabla `presencia` (`lib/db/schema.ts:263-274`): `alumno_id` **text sin FK**, clave primaria
  (`alumno_id`, `profe_id`), `nombre`, `desde`, `latido`.
- `app/api/presencia/route.ts`: GET devuelve **todas** las entradas vigentes; POST `{ accion:
  "marcar" | "quitar", cedula }` con `zCedula` (17-20). Solo profesores (`accesoPresencia`,
  `lib/acceso.ts:21`).
- `lib/data/presencia.ts`: `leerPresencia`, `marcarPresencia`, `quitarPresencia`,
  `borrarPresenciaAlumno`.
- `lib/presencia.ts`: puro — `editoresVigentes`, `presenciaTexto` («… está editando»),
  `avisoPresencia` («… a este alumno. Si guarda antes que tú, te avisaremos.»), `nombrePresencia`.
- `components/sections/alumnos/use-presencia.ts`: `usePresenciaAlumnos(yo)` (sondeo cada `SONDEO_MS`
  = 5 s, reloj del servidor) y `useMarcarPresencia(presencia, cedula)` (marca, latido, `pagehide`
  con `sendBeacon`).
- El aviso de «Editar alumno» (`edit-student-dialog.tsx:290-305`): `<output class="sr-only"
  aria-live="polite">` que anuncia una vez + un párrafo visible con ícono. Es tu patrón de a11y.
- Evaluar: `app/(profesor)/profe/evaluar/[entrega]/page.tsx` (Server Component). El profe que mira
  sale de `profesorActual()` (`lib/datos/profesor.ts:43-49`), como en
  `app/(profesor)/profe/alumnos/page.tsx:108-113` (`{ uid: profe.sesion.uid, nombre:
  nombrePresencia(profe.usuario) }`). `?ver` abre la entrega solo para ver (`soloVer`, :65).
- Al guardar, si otro profe evaluó antes, el servidor ya responde `cambio` y no pisa (D224).

Enfoque decidido (no lo re-decidas):
1. **Sin migración:** la presencia de una entrega usa la misma tabla con la clave
   `claveEntrega(id) = "entrega:" + id` en `alumno_id` (helper puro en `lib/presencia.ts`, con su
   inverso/`esClaveEntrega`). Decisión propia que lo explique (alternativa: columna `ambito` con
   migración).
2. **Ruta:** POST acepta `{ accion, cedula }` (como hoy) **o** `{ accion, entrega }` (id validado
   con el mismo patrón que `zIdDocumento` de `lib/evaluar-datos.ts:106` — cópialo o impórtalo, sin
   editar ese archivo). GET sin parámetros devuelve solo las de alumnos (filtra las claves de
   entrega: la lista de Alumnos no las necesita); `GET ?entrega=<id>` devuelve solo las de esa
   entrega. Mismo control de acceso.
3. **Hooks:** generaliza dentro de `use-presencia.ts` sin cambiar lo que exporta hoy (añade, por
   ejemplo, `usePresenciaEntrega(yo, entregaId)` que sondea `?entrega=` y marca con latido y
   `pagehide`). Reutiliza `editoresVigentes`, `LATIDO_MS`, `VIGENCIA_MS`.
4. **Texto:** funciones puras nuevas en `lib/presencia.ts` (no cambies las de alumnos): «Ana Pérez
   está evaluando esta entrega. Si guarda antes que tú, te avisaremos.» / «Ana Pérez y Luis Díaz
   están evaluando…» / «Ana Pérez y 2 más están evaluando…». PROVISIONAL, con su fila.
5. **Componente** `components/sections/evaluar/presencia-evaluar.tsx` (cliente): recibe `entregaId`
   y `yo`; marca la presencia propia mientras está montado y pinta el aviso con el patrón de
   `edit-student-dialog.tsx:290-305` (anuncio `polite` una vez por cambio de quién evalúa, ícono +
   texto, tokens existentes). No bloquea nada: avisa. Sin otros profes, no pinta nada (ni reserva
   espacio). En `page.tsx` va justo después de `<ReviewHeader … />`, solo si **no** es `soloVer` y
   hay preguntas que evaluar (quien solo mira no «está evaluando»).
6. Otra pestaña del mismo profe no cuenta como «otro» (ya lo hace `editoresVigentes`).
7. `borrarPresenciaAlumno` no cambia. Si quieres limpiar la presencia de una entrega al guardarla,
   no hace falta: el desmontaje la quita y vence sola a los 45 s.

Trampas:
- `tests/db/presencia.test.ts`, `tests/unit/presencia.test.ts` y `tests/unit/acceso.test.ts` vigilan
  esto: córrelos; el GET sin parámetros debe seguir devolviendo lo mismo para Alumnos.
- `tests/unit/tokens.test.ts` prohíbe hex en `app/`.
- `page.tsx` de Evaluar: solo tu `import`, `profesorActual()` en el `Promise.all` y tu línea JSX.
  W1 edita las props de `<ReviewForm>` y el bloque `soloVer` en el mismo archivo.
- No edites `review-form.tsx`, `review-members.tsx`, `review-header.tsx`, `lib/evaluar-datos.ts`,
  `edit-student-dialog.tsx`, `students-*.tsx` (W1 o código cerrado).
- `sendBeacon` manda un `Blob` JSON: la ruta ya lo lee con `req.json()`.

Verificación: pruebas puras de las claves y los textos (1, 2, 3+ profes, vacío); `tests/db`: marcar
y leer por entrega, que la presencia de una entrega no salga en la de alumnos ni al revés, vigencia,
quitar; el esquema del POST (cédula, entrega, ambos, ninguno). a11y por código: el aviso se anuncia
una vez, se ve con ícono + texto, contraste con tokens ya usados en el aviso de alumnos.

Cierre: sin changeset. En el PR, «Decisión tomada / alternativa» para: clave con prefijo vs. columna
nueva, y avisar vs. bloquear. Acciones manuales: ninguna esperada.
