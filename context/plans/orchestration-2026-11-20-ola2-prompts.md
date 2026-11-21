# Tanda 2026-11-20 — prompts de la ola 2 (Q6, Q7)

Antes que nada lee el brief: `C:\Users\Cesar\Documents\Work\krea\context\plans\orchestration-2026-11-20-ola2.md`
(y las reglas de la ola 1 que cita). Las rutas `path:línea` son de main @ 4de1237 (mapeadas por el
orquestador; las líneas pueden correrse un poco, el contenido no).

---

## Q6 — `feat/partes-capitan`

Worker **Q6** · D461–D467 · filas 265–270 · opus · high · Docker: no · Build local: no.

### Lo que pide César (pedidos 17 y 18 de la tanda)
- **17:** el botón «Actualizar» del panel Reparto: no se entiende para qué es; lo nuevo tiene que
  llegar solo.
- **18:** el capitán ve **en solo lectura** las preguntas asignadas a otros (con lo que le
  entregaron) y **envía toda la tarea**. Decisión de César (2026-11-20): con una parte **no
  entregada**, el capitán puede **«La respondo yo»**; el integrante queda premarcado «No participó».

### Dónde está (verificado)
- Panel: `components/sections/tareas/reparto-panel.tsx` — «Actualizar» `:88-104`
  (`router.refresh()`), ayuda `REPARTO_ACTUALIZAR_AYUDA` (`lib/partes.ts`, fila 224), fila por
  pregunta `FilaParte` `:121-256` (Select, estado, «Aceptar»/«Devolver»).
- Página: `app/(estudiante)/tareas/[tarea]/page.tsx:240-276` (integrante → `PartesIntegrante`;
  capitán → `RepartoPanel` + `TaskAnswerForm` con `key=reparto.version`, `inicial`, `prioridad`,
  `avisoEnvio`). `ahora` ya existe (`:82`).
- Vista: `lib/vistas-estudiante.ts:86-247` (`RepartoVista`, `rutasReparto`, `repartoVista`): hoy
  el capitán recibe `inicial` = solo lo **aceptado**, editable (`prioridad` gana sobre su borrador).
- Lógica pura: `lib/partes.ts` — `AccionParte` `:44-48`, `ENTREGO`/`sinParteDe` `:121-138`,
  `aplicarParte` `:158-244`, `repartoCapitan` `:270-288`, `partesDeIntegrante` `:303-325`,
  `aceptadas` `:331-347`, copy `:358-450` (filas 223–231).
- Datos: `lib/data/partes.ts` (`accionParteEnTransaccion`, bloquea la tarea `FOR UPDATE`),
  acciones `lib/acciones/partes.ts` (cada una con `refresh()`, lo exige
  `tests/unit/cache-rutas.test.ts`).
- Envío: `lib/data/entregas.ts:167-270` `enviarEnTransaccion` — hoy acepta las respuestas que
  manda el cliente; para grupal `nueva` lee el reparto solo para `sinParte`.
- Formulario: `components/sections/tareas/task-answer-form.tsx` — props `:155-185`, borrador y
  `prioridad` `:284-324`, render por pregunta `:620-700`, `completa` `:350-370`, barra de envío
  `:706-` (`avisoEnvio` `:801`). La tarjeta `components/krea/question-card-answer.tsx` ya tiene
  `bloqueo?: string` (`:27-28`, candado `:83-86`) y `children` (`:30`).
- Integrante: `components/sections/tareas/partes-integrante.tsx`.
- Modelo: `ESTADOS_PARTE` en `lib/modelo.ts:523-531`; la columna `partes.estado` es `text` con
  `enum` solo de TypeScript (`lib/db/schema.ts:251`): **no hay CHECK en la base**
  (`drizzle/0004_grupal_por_partes.sql`), así que un estado nuevo no necesita migración.
- Patrón de sondeo: `lib/sondeo.ts` (`useSondeo`, `SONDEO_MS`), y uno con versión + 204:
  `components/sections/evaluar/use-version-evaluar.ts` con su ruta en `app/api/evaluar/`.

### Decisiones que te limitan
`D416`–`D424` (lee D417, D418, D420, D422, D424 enteras), `D012`, `D221`, `D451`–`D453`.
Esta unidad **supersede en parte D418** (lo aceptado deja de ser editable por el capitán) y
**D424** («sin tiempo real»): dilo en tus decisiones con `Supersedes`.

### Enfoque decidido
1. **«La respondo yo» = estado nuevo `"tomada"`** en `ESTADOS_PARTE`, la fila se queda con su
   `asignado` (así `sinParteDe` lo sigue contando: no entregó → premarcado, D420). Sin migración:
   confirma con `bunx drizzle-kit generate` que no sale SQL (si sale, no lo commitees y dilo).
   - Acción `{ tipo: "tomar" }` en `AccionParte`/`aplicarParte`: solo el capitán, solo desde
     `asignada` o `devuelta` (no entregada); desde `entregada`/`aceptada` → `estado`.
   - Entregar sobre una `tomada` → `no-asignada` (el copy actual ya sirve). Asignar de nuevo una
     `tomada` (a alguien o «Nadie») funciona como hoy.
   - `sinParteDe`: `tomada` no está en `ENTREGO` → el integrante queda premarcado si no entregó
     ninguna otra. Si entregó otra, no (participó): déjalo así y dilo en la decisión.
   - Integrante: una `tomada` deja de ser suya (`mia: false`, la responde el capitán) con un aviso
     corto «{Capitán} respondió esta pregunta» (PROVISIONAL). Si todas las suyas están tomadas, ve
     la tarea como lector, con ese aviso.
   - Acción de servidor `tomarParte` en `lib/acciones/partes.ts` (con `refresh()`).
2. **Capitán en solo lectura** sobre lo asignado a otros (vigente y no `tomada`):
   - En `TaskAnswerForm`, prop nueva por pregunta (p. ej. `bloqueos?: Record<string, { texto:
     string; respuesta: QuestionAnswer | null }>`): la tarjeta muestra el candado con el texto
     según el estado («Asignada a Adela: aún no te la entrega» · «Adela te la entregó: acéptala o
     devuélvela en Reparto» · «Aceptada: es la respuesta de Adela») y, si hay respuesta, la pinta en
     solo lectura (`RespuestaParteVista` de `estado-parte.tsx`, vía `children`). Sin campo, sin
     borrador para esas preguntas.
   - Lo aceptado entra al envío desde el servidor (ver 3), no desde el campo: ya no hace falta
     `prioridad` para esas preguntas; las `tomada` (y las sin asignar) son campos normales del
     capitán. Al tomar una `devuelta`, precarga lo último que entregó el integrante como valor
     inicial (su borrador gana), y dilo.
   - «Enviar» solo se habilita con todo listo: las suyas completas y cada asignada `aceptada`. Si
     falta alguna, la barra dice cuáles («Falta aceptar la pregunta 2 (Adela)» o similar,
     PROVISIONAL) y el botón queda deshabilitado con el motivo visible (no solo color).
   - «La respondo yo» va en la fila del panel Reparto (junto a Aceptar/Devolver, solo en
     `asignada`/`devuelta`) **y** en la tarjeta bloqueada del formulario; mismo handler. Con
     confirmación breve si quieres (el integrante quedará «No participó»), reutilizando el
     `AlertDialog`/`Dialog` que ya use el proyecto.
3. **Servidor** (`enviarEnTransaccion`, solo grupal `nueva`): con el reparto ya leído (añade
   `preguntaId` y `respuesta` al `select`), para cada parte vigente no `tomada`:
   `aceptada` → la respuesta del envío **es** `partes.respuesta` (la del cliente se ignora);
   `asignada`/`entregada`/`devuelta` → error nuevo `partes-pendientes` en `ErrorEntrega`
   (`lib/entregas.ts:40-56`), con su copy en `mensajeErrorEntrega` y en cualquier `switch`
   exhaustivo que lo pida. Ojo: las imágenes de una parte aceptada ya están en B2 en la carpeta de
   la entrega (míralo en `respuestasValidas`/`armarEntrega`): que pasen la comprobación de B2.
   Reenvío y completar no cambian (reparto congelado, D419).
4. **«Actualizar» fuera (#17):** el panel y la vista del integrante se refrescan solos. Ruta
   ligera `GET /api/partes/version?tarea=<id>&desde=<v>` (sesión obligatoria; solo integrantes
   del equipo actual; responde la versión = max(`actualizado_en`) + número de filas de las partes
   de su entrega, 204 si no cambió, sin caché) y un hook `useVersionPartes` sobre `useSondeo`
   (como `use-version-evaluar.ts`) que llama `router.refresh()` al cambiar. Quita el botón y
   `REPARTO_ACTUALIZAR_AYUDA`; en su lugar, si hace falta, «Se actualiza solo» (PROVISIONAL).
   Comprueba que un refresh no pierde lo que el capitán está escribiendo (el borrador se guarda en
   el dispositivo y gana sobre lo inicial, `:284-324`; el `key` solo cambia con lo aceptado).

### Trampas
- `tests/unit/cache-rutas.test.ts`: `refresh()` en **cada** `export async function` de
  `lib/acciones/`.
- La ruta nueva: sin `Date.now()` en código cacheado; mira cómo está hecha la de `app/api/evaluar/`
  y cópiala (sesión, `no-store`). No mandes cédulas de profes.
- Q7 corre a la vez y toca `lib/modelo.ts` (otra zona), `lib/partes.ts` (`respuestaParte`),
  `task-answer-form.tsx` (rama url) y `partes-integrante.tsx` (campo url): no toques esas zonas.
  Si Q7 se mergea antes que tú, `git merge origin/main` y pasa tu bloqueo también a la rama url.
- Concurrencia: integrante entrega mientras el capitán toma → la transacción con la tarea
  bloqueada decide; prueba los dos órdenes en `tests/db`.

### Cómo verificar
- `tests/unit` de `lib/partes.ts`: `tomar` desde cada estado, `sinParteDe` con `tomada`,
  `partesDeIntegrante` con `tomada`, la vista del capitán (bloqueos por estado, «listo para
  enviar»).
- `tests/db` (PGlite): `tomarParte`; enviar con una parte asignada sin aceptar → `partes-pendientes`;
  enviar con una aceptada y una respuesta distinta del cliente → se guarda la de la parte; enviar
  con una tomada → la del capitán y `sinParte` con el integrante; la ruta de versión (204 /
  cambio / alguien de otro equipo).
- A11y a mano: el candado con texto, el botón deshabilitado con su motivo legible, foco tras
  «La respondo yo» (a la tarjeta que se abre), 320 px.

### Cierre
PR «feat(partes): el capitán ve en solo lectura lo repartido, envía la tarea entera y puede
responder una parte él» con «Cómo probar» para el QA final (capitán + 2 integrantes: uno
entrega, el otro no; tomar; enviar; premarcado en Evaluar).

---

## Q7 — `feat/respuesta-url`

Worker **Q7** · D468–D471 · filas 271–274 · opus · medium · Docker: no · Build local: no.

### Lo que pide César (pedido 16)
Un tipo de respuesta **URL**: el profe crea una pregunta cuya respuesta es un enlace (p. ej. a
un Drive, Canva o Figma) y el alumno lo pega.

### Dónde está (verificado; 22 archivos distinguen formato)
- Modelo: `zPregunta.formato` `lib/modelo.ts:221` (`z.enum(["texto","imagen"])`),
  `limiteImagenes` `:234`, `zRespuesta` `:408-415` (unión texto / imagenPath / imagenPaths),
  `zParte.respuesta` `:546`. Preguntas y respuestas van en `jsonb` (sin CHECK): **sin migración**.
- Profe: `lib/tareas-profe-datos.ts:94` (otro `z.enum` de formato), `:193-207`, `:580-590`;
  `lib/tareas-profe.ts:326` (`FormatoPregunta`), `:365`, `:379`, `:646`;
  `components/sections/tareas-profe/question-editor.tsx` (selector de formato);
  `components/sections/tareas-profe/ideal-form.tsx` (2 sitios).
- Validación del envío: `lib/entregas.ts` — `inicialEdicion` `:205-230`, `respuestasValidas`
  `:315-410` (`incompleta` si no es del formato).
- Alumno: `components/krea/question-card-answer.tsx` (formato del campo + badge `:63-80`),
  `components/sections/tareas/task-answer-form.tsx` (estado, borrador por formato `:299-309`,
  `completa` `:350-370`, render `:620-700`, armado del envío `:526`),
  `components/sections/tareas/partes-integrante.tsx` (7 sitios).
- Lectura: `components/krea/question-card-detail.tsx` (`QuestionAnswer`), `question-card-review.tsx`
  (Evaluar), `lib/vistas-estudiante.ts` (`RespuestaEnviada` `:986`, 4 sitios),
  `lib/evaluar-datos.ts` (2), `lib/partes.ts` `RespuestaParte`/`respuestaParte` `:246-260`,
  `components/sections/tareas/estado-parte.tsx` (`RespuestaParteVista`), `lib/ideal.ts` (2),
  `lib/tareas.ts` (1), `app/(profesor)/profe/evaluar/[entrega]/page.tsx` (1).
- IA: `lib/data/analisis-ia.ts:40` ya devuelve `no-texto` si no es texto: el botón de IA en
  Evaluar no debe ofrecerse en una pregunta url (mira cómo lo decide hoy para imagen).
- Demo/seed: `lib/demo/entrega.ts`, `lib/demo/evaluar.ts`, `lib/demo/seed.ts` (añade un ejemplo
  url solo si hace falta para tipos). `scripts/importar-tarea-historica.ts`: no lo toques salvo
  que no compile.

### Decisiones que te limitan
`D373` (varias imágenes: cómo se añadió un formato sin migrar), `D395`/`D396` (editar entrega),
`D418`, `D422`, `D423` (partes), `D425`–`D429` (IA solo texto), `D432` (la ideal del profe es
texto: en una pregunta url el profe escribe texto o un enlace como texto, sin cambiarlo).

### Enfoque decidido
- Formato `"url"` en ambos `z.enum` de formato, etiqueta visible **«Enlace»** (PROVISIONAL).
  Respuesta `{ url: string }` en `zRespuesta`. Validación en un solo helper puro
  (`lib/url-respuesta.ts` o dentro de `lib/entregas.ts`): `trim`, máx. 2000 caracteres,
  `new URL()` válido, protocolo **solo** `http:`/`https:` (añade `https://` si el alumno pega
  `drive.google.com/…` sin esquema, y dilo), sin credenciales (`user:pass@`). El servidor la
  aplica en `respuestasValidas` (y en la entrega de una parte); el cliente la usa para el aviso
  en línea.
- Campo: `Input` existente con `type="url"`, `inputMode="url"`, `autoComplete="url"`, nombrado
  por el enunciado, con error en línea (`aria-invalid` + `aria-describedby`, texto PROVISIONAL
  «Pega un enlace que empiece por https://»).
- Lectura (alumno, Evaluar, ideal, partes): enlace externo
  `target="_blank" rel="noopener noreferrer"`, texto = la URL (`break-all`, `min-w-0`), ícono
  `ExternalLink` con `aria-hidden` y «(se abre en otra pestaña)» en `sr-only`. **Antes de pintar
  un `href`, vuelve a validar** con el helper: si no pasa, se muestra como texto plano (nunca un
  `javascript:`).
- Borrador del dispositivo y cola offline: la respuesta url se guarda como las de texto (mira el
  mapa por formato `:299-309`); un borrador viejo de texto en una pregunta que ahora es url se
  descarta sin romper.
- Cambiar el formato de una pregunta con entregas: sigue la regla que ya exista en
  `tareas-profe-datos.ts` para texto↔imagen; si no hay, dilo y no lo permitas.
- **Costura D457 (backlog):** `app/(profesor)/profe/evaluar/[entrega]/page.tsx:198-199` llama
  `puedeDevolver(entrega, tarea)` sin `ahora` y `tareaCerrada={tarea.estado !== "abierta"}`. Con
  la tarea vencida ofrece «Devolver» y el servidor responde `tarea-cerrada`. Toma `ahora =
  Date.now()` **después de leer los datos** (patrón de
  `app/(profesor)/profe/tareas/[id]/entregas/page.tsx:76-78`), pasa `puedeDevolver(entrega,
  tarea, ahora)` y `tareaCerrada={estadoEfectivo(tarea, ahora, <titular de la entrega>) !==
  "abierta"}`. Busca de paso otros `tarea.estado !== "abierta"` / `=== "evaluada"` en `app/` y
  `components/` que deban usar `estadoEfectivo` (regla 11) y arréglalos o lístalos.

### Trampas
- Uniones exhaustivas: `QuestionAnswer`, `RespuestaEnviada`, `RespuestaParte` y los `switch` de
  formato; `bun run typecheck` te dice cuáles faltan.
- `"texto" in r` se usa para distinguir respuestas: con `{ url }` ese chequeo ya no implica
  imagen. Revisa cada `else` que asuma «si no es texto, es imagen» (`rutasImagen` incluida).
- Q6 corre a la vez: no toques `ESTADOS_PARTE`, las transiciones ni el copy de `lib/partes.ts`,
  ni el bloqueo por pregunta de `task-answer-form.tsx`. Si Q6 se mergea antes, `git merge
  origin/main` y pasa su bloqueo a tu rama url.
- `tokens.test.ts`: sin hex en `app/` ni `components/`.

### Cómo verificar
- `tests/unit`: el helper (http, https, sin esquema, `javascript:`, `data:`, credenciales, vacío,
  2001 caracteres, espacios), `respuestasValidas` con url, `inicialEdicion`, `respuestaParte`.
- `tests/db`: enviar una entrega con una pregunta url (válida / `javascript:` → `incompleta`);
  entregar una parte url.
- A11y a mano: nombre del campo, error en línea, enlace con aviso de pestaña nueva, 320 px con
  una URL larga sin scroll horizontal.

### Cierre
PR «feat(tareas): preguntas con respuesta de enlace (URL)», con la costura D457 en su propio
commit (`fix(evaluar): «Devolver» y «cerrada» miran la tarea vencida`).
