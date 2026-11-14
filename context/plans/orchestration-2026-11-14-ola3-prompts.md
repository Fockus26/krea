# Tanda 2026-11-14 — brief y prompts de la ola 3 (X1, X2)

Brief común: main @ ddb65bc. Modo `pr` (push a tu rama, PR a main, nunca merge ni auto-merge). Sin
versionado (no changesets). Sin dev server ni QA (memoria de César: QA al final): verifica por código
+ pruebas. **La máquina se satura con dos workers a la vez**: corre solo `bun run test:related` y,
una vez, `bun run typecheck` y `bun run lint` (en segundo plano si pasan de 2 min); la suite entera
la corre el **CI de GitHub**: tras abrir el PR mira `gh pr checks <n> --watch` (en segundo plano) y
arregla lo que falle hasta dejarlo verde. No corras `bun run build`. No hay entorno DOM de pruebas
(sin happy-dom/jsdom): prueba la lógica pura y la capa de datos sobre PGlite (como `tests/db/*`;
`tests/db/base.ts` aplica las migraciones de `drizzle/`).
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
minutos); edita con Edit/Write (nada que deje CRLF: biome lo marca) y lee con Read el tramo que vas
a editar. Los archivos **nuevos** dentro de tu zona son tuyos sin pedir permiso, igual que sus
pruebas nuevas en `tests/`. La zona de un archivo incluye los `import` que tu código necesite.

**Informe final** (lo primero: el enlace del PR y el estado del CI): decisiones tomadas con su
alternativa, filas del checklist (texto completo de cada fila), PHASE_LOG, acciones manuales para
César, «Tokens que faltan», «Kit feedback».

**Lo que ya existe y no cambia (ola 2):** `evaluacion.bases` (D403–D407), presencia al evaluar
(`components/sections/evaluar/presencia-evaluar.tsx`, D408–D410), editar entrega (D395–D397:
`modoEnvio`, `puedeEditar`, `imagenesSinUso` en `lib/entregas.ts`), «No participó»
(`evaluacion.noParticiparon`, D364–D365). Estados de tarea: `borrador | abierta | evaluada`
(`lib/modelo.ts:206`); «cerrada» = ya no está `abierta` (la cierra el profe; no hay reabrir).

**Formas compartidas (fijas, no las cambies):**
- `zEntrega.sinParte?: cédula[]` (`lib/modelo.ts`) + columna `entregas.sin_parte text[]` nullable:
  la crea, la escribe y la lee **solo X2**. X1 no la nombra: sus transacciones copian la entrega con
  `{ ...entrega }` y `filaDeEntrega`, así el campo viaja solo cuando X2 llegue a main.
- Tabla `partes` (solo X2). X1 no la conoce: «Eliminar entrega» borra la fila de `entregas` y nada más.
- «Devolver» (X1) deja la entrega `estado: "entregada"`, `evaluacion: null` y sin
  `evaluacionAnterior`: para X2 es una entregada cualquiera (las partes siguen congeladas).
- `VistaEvaluar.integrantes[i]` gana `sinParte?: boolean` (solo X2); `review-form.tsx` lo pasa tal
  cual a `ReviewMembers` (ya pasa el arreglo entero), no hace falta tocarlo.

**Dueños de archivos (no toques los de la otra unidad):**
- **X1:** nuevos `lib/devolver-entrega.ts`, `lib/data/devolver-entrega.ts`,
  `lib/acciones/devolver-entrega.ts`, `components/sections/evaluar/acciones-entrega.tsx` (y los que
  necesite bajo `components/sections/tareas-profe/`); `lib/data/ranking.ts` (solo añadir
  `sinEntrega`), `lib/tareas-profe-entregas.ts`, `components/sections/tareas-profe/task-submissions.tsx`,
  `app/(profesor)/profe/tareas/[id]/entregas/page.tsx`, `app/(profesor)/profe/evaluar/[entrega]/page.tsx`,
  `components/sections/evaluar/review-header.tsx`, `app/secciones/evaluar/**`,
  `app/secciones/tareas-profe/**`. **No toca** `lib/evaluar-datos.ts`, `lib/data/evaluar.ts`,
  `lib/acciones/evaluar.ts` (solo los importa), ni `lib/modelo.ts`, `lib/entregas.ts`,
  `lib/data/entregas.ts`, `lib/data/filas.ts`, `lib/db/schema.ts`, `drizzle/`.
- **X2:** `lib/modelo.ts`, `lib/db/schema.ts`, `drizzle/**`, `lib/data/filas.ts`, `lib/entregas.ts`,
  `lib/data/entregas.ts`, `lib/acciones/entregas.ts`, nuevos `lib/partes.ts`, `lib/data/partes.ts`,
  `lib/acciones/partes.ts`; `lib/datos/estudiante.ts`, `lib/vistas-estudiante.ts`, `lib/tareas.ts`,
  `app/(estudiante)/tareas/**`, `components/sections/tareas/*`, `components/krea/question-card-answer.tsx`,
  `lib/data/tareas.ts` y `lib/data/equipos.ts` (solo borrar las partes al eliminar tarea o equipo),
  `lib/evaluar-datos.ts` (**solo** `vistaEvaluar`, el tipo `VistaEvaluar` y un texto nuevo junto a
  `NO_PARTICIPO_*`), `components/sections/evaluar/review-members.tsx`, `app/secciones/tareas/**`,
  `lib/demo/entrega.ts`, `tests/unit/evaluar.test.ts` (si su `toEqual` de `integrantes` cambia).
- Nadie toca: `review-form.tsx`, `presencia-evaluar.tsx`, `lib/ranking-datos.ts`, `lib/grades.ts`.

**Orden de merge sugerido:** X1 → X2 (no dependen; si GitHub marca conflicto en X2, se resuelve con
un `git merge origin/main` en su rama).

---

## X1 — «Devolver al alumno» y «Eliminar entrega» (pedidos 9 y 10)

Rama `feat/devolver-eliminar-entrega` · D411–D415 · filas 218–222 · opus · medium.

**Qué pidió César:** desde la lista de entregas de una tarea (#143) y desde Evaluar, (9) «Devolver
al alumno»: quita la evaluación y la entrega vuelve a ser editable por el alumno o el capitán, con
el ranking recalculado; (10) «Eliminar entrega» de un alumno o equipo (para duplicados).
**Decidido por César (2026-11-14):** «Devolver» **solo en tareas abiertas**; en una tarea cerrada la
acción no está y se explica por qué (sin migración, sin columna nueva).

**Dónde está el código**
- Lista por tarea: `app/(profesor)/profe/tareas/[id]/entregas/page.tsx` (arma `filasEntregasTarea`
  con `tarea: { id, tipo, secciones }`, línea 52), `lib/tareas-profe-entregas.ts`
  (`FilaEntregaTarea` 36–60, `filasEntregasTarea` 137, `ACCION_TEXTO` 257, `accionLabel` 263),
  `components/sections/tareas-profe/task-submissions.tsx` (última columna «Acciones», 177–200: hoy
  «Ver» y «Evaluar»/«Corregir»; el comentario de la línea 58 ya anuncia estas dos acciones).
- Evaluar: `app/(profesor)/profe/evaluar/[entrega]/page.tsx` (`<ReviewHeader>` 112–123, luego
  `<PresenciaEvaluar>` 124–130; `soloVer` 73; `tarea` 82 trae `estado`).
- Transacciones modelo (cópialas, no las edites): `lib/data/evaluar.ts` —
  `deshacerEvaluacionEnTransaccion` (100–135): `leerSeccion` bloquea la sección y lee sus datos, se
  relee la entrega, se escribe y `escribirRanking(tx, seccion, conEntrega(datos, …), ahora)`.
  `evaluarEnTransaccion` (44–48) relee la entrega con `.for("update")`: haz lo mismo (el alumno
  puede estar editándola, D397). Server Actions modelo: `lib/acciones/evaluar.ts` (`exigirSesion("profesor")`,
  zod, `refresh()`).
- Ranking: `lib/data/ranking.ts` — `conEntrega` (71) reemplaza o añade; **falta** quitar una entrega:
  añade `sinEntrega(datos, id)` ahí.
- Borrar de B2 tras el commit: patrón de `lib/acciones/entregas.ts:166–185` (`borrarSinUso`, D396) y
  de eliminar tarea (`lib/acciones/tareas.ts:195`, prueba `tests/db/eliminar-tarea.test.ts`).
  Rutas de imagen de una entrega: `Object.values(entrega.respuestas).flatMap(rutasImagen)`
  (`lib/modelo.ts:397`).
- UI disponible: `components/ui/dropdown-menu.tsx`, `components/ui/dialog.tsx` (mira el diálogo de
  confirmación de `task-answer-form.tsx` o el de eliminar tarea como modelo), `toast` de
  `components/ui/sonner`.

**Enfoque decidido**
1. Puro, en `lib/devolver-entrega.ts`: `zDevolverEntrega { entregaId, evaluadaEn }` y
   `zEliminarEntrega { entregaId, enviadaEn: number | null, evaluadaEn: number | null }` (lo que el
   profe veía: si cambió, error `cambio` y no se toca — mismo criterio que D224); errores propios
   (`no-existe`, `invalida`, `cambio`, `no-evaluada`, `tarea-cerrada`, `red`) con su copy;
   `devolverEntrega(entrega)` → `{ ...resto, estado: "entregada", evaluacion: null }` sin
   `evaluacionAnterior` (un «Deshacer» posterior no debe resucitar la nota); `puedeDevolver(entrega,
   tarea)` = evaluada **y** tarea `abierta`.
2. Datos, en `lib/data/devolver-entrega.ts` (sin `server-only`, para PGlite): dos transacciones.
   Devolver: sección bloqueada → entrega `FOR UPDATE` → tarea (estado) → comprobar versión →
   escribir → `escribirRanking(conEntrega(...))`. Eliminar: igual, `delete` de la fila y
   `escribirRanking(sinEntrega(...))`; devuelve las rutas de imagen. Eliminar vale en cualquier
   estado de la tarea y de la entrega (`entregada` o `evaluada`).
3. Acciones, en `lib/acciones/devolver-entrega.ts`: el autor sale de la sesión; eliminar borra las
   imágenes de B2 **después** del commit (fallo → solo `console.error`, la acción sigue `ok`).
4. Lista por tarea: la fila con entrega gana un menú «Más acciones» (botón ícono con nombre
   accesible «Más acciones de {nombre}») con «Devolver al alumno» (solo si `puedeDevolver`) y
   «Eliminar entrega». `FilaEntregaTarea` suma lo necesario (`puedeDevolver`, `enviadaEn`,
   `evaluadaEn`); la página pasa `estado` de la tarea. Con la tarea cerrada, una línea de ayuda bajo
   el conteo explica que «Devolver» solo está en tareas abiertas (no un ítem deshabilitado mudo).
5. Evaluar: componente nuevo `acciones-entrega.tsx` (cliente) con las mismas dos acciones, puesto
   en la página justo después de `<ReviewHeader … />` y antes de `PresenciaEvaluar`; también en
   `soloVer`. Tras devolver o eliminar navega a la cola (`v.colaHref`) con un toast.
6. Las dos piden confirmación en un `Dialog` que dice **qué se pierde**: Devolver — «Se borra la
   nota de {nombre} en esta tarea y su puntaje sale del ranking; podrá editar y volver a entregar»;
   Eliminar — «Se borran las respuestas, las imágenes y la nota de {nombre}. No se puede deshacer»,
   con botón destructivo. En grupal, nombra al equipo y dice que afecta a todos sus integrantes.
   Ninguna guarda un motivo (no hay dónde; si crees que hace falta, déjalo como alternativa en el PR).

**Trampas**
- Nota ≠ puntos (D007): no toques ajustes; el ranking sale de `calcularRanking` sobre los datos.
- Las props nuevas de `TaskSubmissions`/`ReviewHeader` deben ser opcionales o actualiza la galería
  (`app/secciones/tareas-profe/**`, `app/secciones/evaluar/**`): compila sin acciones reales.
- `review-form.tsx` no se toca: guarda con `version`; tras devolver, quien la tenga abierta recibe
  `no-entregada`/`cambio` al guardar — está bien, compruébalo en una prueba de datos.
- Una entrega evaluada sin respuestas (tarea histórica, `faltanRespuestas`) también se puede
  devolver: queda `entregada` con respuestas vacías y el alumno la completa (D395 `reenvio`).
- El menú en la tabla a 320 px: sin scroll horizontal nuevo; área táctil ≥ 44 px en móvil.

**Verificar:** `tests/db/devolver-eliminar.test.ts` (PGlite): devolver saca los puntos del ranking
del alumno y del equipo; tras devolver, `enviarEnTransaccion` del alumno entra como reenvío;
devolver con tarea cerrada → `tarea-cerrada`; versión cambiada → `cambio`; eliminar quita la fila,
recalcula y devuelve las rutas; eliminar una grupal. Unitarias de lo puro. `test:related`,
typecheck, lint, CI verde.

**Cierre:** PR «feat(entregas): devolver al alumno y eliminar entrega» con cómo probar; informe.

---

## X2 — Grupal por partes (pedido 2)

Rama `feat/grupal-por-partes` · D416–D424 · filas 223–231 · opus · high.

**Qué pidió César:** «cada pregunta es una parte; el capitán reparte preguntas, cada integrante
responde las suyas y se las entrega al capitán; quien no entregó ninguna queda en 01». El capitán
acepta, revierte o reasigna; solo él envía (D012).
**Decidido por César (2026-11-14):**
- Repartir es **opcional**: el capitán puede seguir respondiendo todo como hoy; sin reparto nadie
  queda marcado.
- El 01 llega **premarcado** en Evaluar («No participó», D364–D365) y el profe puede desmarcarlo.
- Solo se premarca a quien **tenía al menos una pregunta asignada** y no entregó ninguna; a quien no
  le tocó pregunta no se le marca.

**Modelo (fijo)**
- Tabla `partes` (`lib/db/schema.ts` + migración `drizzle/0004_*.sql`, journal y snapshot; genera
  con `bun run db:generate` — no necesita base — y revisa que el SQL solo cree esta tabla y la
  columna de abajo): `entrega_id text` (= `idEntrega(tareaId, equipoId)`, exista o no la entrega),
  `pregunta_id text`, PK (`entrega_id`, `pregunta_id`); `tarea_id text`, `equipo_id text`,
  `asignado text` (cédula), `estado` enum `asignada | entregada | aceptada | devuelta`,
  `respuesta jsonb` nullable (`zRespuesta`), `entregada_en` y `actualizado_en` (tipo `ms` del
  esquema); índice por `tarea_id`. Solo hay fila para una pregunta **asignada**; sin fila = del capitán.
- `entregas.sin_parte text[]` nullable + `zEntrega.sinParte?: cédula[]` (solo grupal; se escribe
  solo si no está vacío) + `filaDeEntrega`/`entregaDeFila` (`lib/data/filas.ts:100–130`).
- `zParte` y la lógica pura en `lib/partes.ts`.

**Reglas**
- Capitán (del equipo actual, tarea grupal `abierta`, sin entrega enviada todavía): asigna una
  pregunta a un integrante, quita la asignación, **reasigna** (otro integrante: la respuesta
  anterior se descarta), **acepta** una parte `entregada`, la **revierte** (`devuelta`: el
  integrante la rehace y la vuelve a entregar).
- Integrante asignado: responde su pregunta (texto o imagen, mismas validaciones que
  `respuestasValidas`, `lib/entregas.ts:305`) y «Entregar al capitán» (`entregada`); puede volver a
  entregarla mientras no esté `aceptada`. Sube imágenes a la carpeta de la entrega del equipo:
  amplía `permisoSubida` (`lib/data/entregas.ts:95`) para el asignado de esa pregunta.
- Envío (solo el capitán, `enviarEnTransaccion`, `lib/data/entregas.ts:126`): no cambia lo que se
  envía — las respuestas del formulario del capitán. En modo `nueva` y grupal, dentro de la misma
  transacción lee las partes y calcula `sinParte` = integrantes de la entrega (≠ quien envía) con
  ≥ 1 parte asignada y **ninguna** en `entregada` o `aceptada` (literal de César: «quien no
  *entregó* ninguna»; una entregada que el capitán no llegó a aceptar cuenta como entregada).
  En `reenvio` y `completar` se conserva el `sinParte` de la entrega (como `integrantes`, D396).
- Con la entrega enviada las partes quedan congeladas (todas las acciones → error); el capitán
  edita como hoy (D395). Si el profe elimina la entrega (X1), vuelven a estar activas tal cual.
- Formulario del capitán: es `TaskAnswerForm` de siempre, precargado (`inicial`) con las partes
  **aceptadas**; puede editar cualquier respuesta antes de enviar (él responde por el equipo,
  D012); el crédito de participación sale de las partes, no de quién tecleó. **Mecanismo fijo:** el
  servidor es la fuente: aceptar/revertir/reasignar son Server Actions con `refresh()`; la página
  pasa `inicial` y un `key` con la versión de las partes aceptadas (p. ej. el mayor
  `actualizadoEn`) para remontar el formulario. Ojo: hoy el borrador local **gana** sobre `inicial`
  (`task-answer-form.tsx:275–311`): para una pregunta con parte aceptada debe ganar la aceptada.
- El diálogo de confirmación de «Entregar» del capitán lista a quién se premarcará («Ana y Luis
  quedarán como “No participó”: tenían preguntas y no entregaron ninguna»), si hay alguno.
- Evaluar: `vistaEvaluar` (`lib/evaluar-datos.ts:755–759`): sin evaluación vigente,
  `inicial.noParticiparon = entrega.sinParte ?? []`; con evaluación, lo que ya hace. Cada
  integrante lleva `sinParte?: boolean` y `ReviewMembers` muestra junto al nombre el motivo («No
  entregó ninguna parte») en texto, no solo por la casilla marcada.
- Limpieza: al eliminar una tarea o un equipo se borran sus partes; al leer, una parte cuyo
  `asignado` ya no está en el equipo cuenta como sin asignar. Imágenes de una parte descartada
  (reasignada, quitada, re-entregada con otra imagen): se borran de B2 tras el commit (D396).

**Dónde está el código**
- `/tareas/[tarea]`: `app/(estudiante)/tareas/[tarea]/page.tsx` — `entregaVista`
  (`lib/vistas-estudiante.ts:778–830`) da `responder` (capitán) o `lector` (integrante:
  `CaptainNotice` + formulario bloqueado, líneas 83–85 y 179–192). El integrante con preguntas
  asignadas pasa a ver esas preguntas respondibles, cada una con su estado (ícono + palabra:
  Asignada · Entregada al capitán · Aceptada · Devuelta) y el resto bloqueadas como hoy. El capitán
  ve encima del formulario el panel «Reparto»: por pregunta, a quién está asignada (select con los
  integrantes, `integrantesDe`), su estado y, si está entregada, la respuesta con «Aceptar» y
  «Devolver». Componentes nuevos en `components/sections/tareas/`.
- Lecturas: `lib/datos/estudiante.ts` (`datosAlumno` 97, `integrantesDe` 84); acciones modelo:
  `lib/acciones/entregas.ts` (cédula SIEMPRE de `exigirSesion("estudiante")`, nunca del body).
- Permisos: `permisoEntrega` (`lib/entregas.ts:67`) no cambia para enviar; las partes usan el suyo.

**Trampas**
- La respuesta de una parte la ven solo su autor y el capitán hasta el envío.
- Cola sin conexión (D292–D295): las acciones de partes son solo en línea (error `red` con su
  copy); el envío del capitán por la cola sigue funcionando y calcula `sinParte` en el servidor.
- Capitán cambiado o alumno movido de equipo (D221): manda el equipo **actual**; no rompas
  `enOtraEntrega`.
- `zEntrega` tiene `superRefine`: `sinParte` solo en grupales y ⊆ `integrantes` (valídalo sin
  romper las filas existentes: opcional).
- `tests/db/base.ts` aplica `drizzle/` por el journal: si el journal o el snapshot quedan mal,
  falla toda la suite de `tests/db`.
- A 320 px el panel «Reparto» no puede ser una tabla ancha: lista de tarjetas.
- No hay tiempo real: el capitán ve lo entregado al recargar (dilo en el copy o con un botón
  «Actualizar»; nada de sondeo nuevo). Avisos push: fuera de alcance (anótalo como pendiente).

**Verificar:** `tests/db/partes.test.ts` (PGlite): asignar/reasignar/quitar solo el capitán;
entregar solo el asignado; aceptar/revertir; todo bloqueado con entrega enviada o tarea cerrada;
envío calcula `sinParte` (con parte entregada sin aceptar → no marcado; sin pregunta asignada → no
marcado; sin reparto → ausente); reenvío lo conserva; eliminar tarea borra partes. Unitarias de
`lib/partes.ts` y de `vistaEvaluar` (premarcado sin evaluación; evaluada manda la evaluación).
`test:related`, typecheck, lint, CI verde.

**Cierre:** PR «feat(tareas): grupal por partes» con cómo probar y la **acción manual** de la
migración como comando PowerShell por SSH:
`Get-Content -Raw drizzle\0004_<nombre>.sql | ssh kit-vps "su postgres -s /bin/sh -c 'psql -X -v ON_ERROR_STOP=1 -d krea_preview'"`
(y lo mismo con `-d krea`), **antes** del deploy; nunca `psql "<url>"`. Informe.
