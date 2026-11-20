# Tanda 2026-11-20 — prompts de la ola 1 (Q1–Q5)

Antes que nada lee el brief: `C:\Users\Cesar\Documents\Work\krea\context\plans\orchestration-2026-11-20.md`.
Las rutas `path:línea` son de main @ 08b709a (mapeadas por el orquestador; las líneas pueden
correrse un poco, el contenido no).

---

## Q1 — `fix/carga-estable`

Worker **Q1** · D436–D438 · filas 241–242 · opus · medium · Docker: no · Build local: no.

### Lo que pide César
> «Frecuentemente me aparece el mensaje de que no carga la página y recargar, mi internet está
> bien, creo que es algo de código.»

### Causa principal (ya verificada en los errores de Vercel, últimos 7 días)
- 16 veces en `/profe/evaluar/[entrega]`: `permission denied for table analisis_ia`.
- 8 veces en `/tareas/[tarea]`: `permission denied for table partes`.

Las migraciones 0004–0006 se aplicaron con `psql` como `postgres`, así que esas tablas tienen dueño
`postgres` y el rol de la app no las puede leer. La página lanza en el servidor y sale la pantalla
de error.

El orquestador ya dejó el arreglo de datos en la carpeta principal, **sin commitear**:
`C:\Users\Cesar\Documents\Work\krea\scripts\sql\2026-11-20-duenos-tablas.sql`. Cópialo tal cual a
tu slot y commitéalo (lo corre César). Revísalo y corrígelo si ves un error.

### Lo que haces
1. **El SQL de dueños** (ya escrito; arriba).
2. **Que no vuelva a pasar.**
   - En las instrucciones de migración, `context/decisions/` y el PR: aplicar con el rol de la app,
     o correr el script de dueños justo después.
   - Una prueba en `tests/unit/` que lea cada `drizzle/*.sql` y falle si alguno trae
     `OWNER TO postgres` o un `SET ROLE postgres`. Es barata. Si no te convence, otra guardia
     equivalente, explicada.
3. **Una lectura opcional que falla no debe tumbar la página.** El % de IA de Evaluar
   (`lib/data/analisis-ia.ts`, leído desde `app/(profesor)/profe/evaluar/[entrega]/page.tsx:121-133`)
   y el reparto de partes del alumno (`partesDelEquipo`, que se lee en
   `app/(estudiante)/tareas/[tarea]/page.tsx:93`) son complementos.
   - Si su consulta falla: registra el error con `console.error` y sigue sin ellos (IA: sin bloque;
     partes: sin panel de reparto, y el formulario normal sigue).
   - Es un try/catch en la función de datos (`lib/data/…`), **no en las páginas**: Q2 y Q3 tocan la
     página de Evaluar. La entrega ideal (`lib/data/ideales.ts`) igual.
4. **Ranking que dice «revisa tu conexión» por un solo fallo**
   (`components/sections/ranking/ranking-en-vivo.tsx:96-141`): marca `cortado` solo tras **3
   fallos seguidos** (≈ 15 s); un éxito vuelve el contador a 0.
   - `app/api/ranking/[seccion]/route.ts:12-36` no tiene try/catch alrededor de `leerRanking`.
     Agrégalo: 503 con `no-store` y `console.error`.
5. **`useSondeo`** (`lib/sondeo.ts:10-40`): al volver la pestaña a la vista (`visibilitychange`,
   `:34-37`) espera ~1 s antes del tic. En un móvil que despierta, la red no está lista y ese primer
   fetch falla. **Misma firma**: Q2 lo usa.
6. **Pool** (`lib/db/index.ts:33`): `connectionTimeoutMillis` e `idleTimeoutMillis` razonables para
   serverless frente a un pooler en el VPS, y un `statement_timeout`. Ojo, el pooler es de
   transacciones: sin estado de sesión. Si no puedes fijar el timeout por conexión, pásalo en la
   cadena (`options=-c statement_timeout=…`) o déjalo explicado. `pool.on('error')` ya existe
   (`:35`).
7. **Tras un deploy** (`public/sw.js`, `app/error.tsx`, `app/global-error.tsx`).
   - Una página vieja servida por el SW (`navegar`, `public/sw.js:180-221`, cae a la copia tras
     `ESPERA_RED_MS = 6000`) o un chunk viejo dan `ChunkLoadError` o «Failed to find Server Action».
   - Para esos dos casos, `error.tsx` y `global-error.tsx` hacen **una** recarga completa
     automática. Guárdala en `sessionStorage` con marca de tiempo para no entrar en bucle; si falla
     otra vez en < 30 s, la pantalla normal.
   - Detecta por `error.name` o `error.message`: lee la guía de errores en
     `node_modules/next/dist/docs/` y no inventes nombres.
   - El SW: no cambies su estrategia salvo un error claro; si lo cambias, `tests/unit/offline-sw.test.ts`
     te vigila.
8. **Skew Protection de Vercel**: es configuración del proyecto, acción de César. Escribe los pasos
   en el PR y en la decisión. Si Next necesita algo en `next.config.ts` (`deploymentId`), léelo en
   la guía y hazlo solo si es inocuo sin la opción activada.

### Decisiones que te limitan
D161, D171, D213 (pantallas de error), D291 (SW), D327 (sondeo, Postgres del VPS), D250 (`staleTimes`).

### Cómo verificar
- Pruebas puras nuevas:
  - el contador de fallos del ranking (saca la regla a una función pura en `lib/ranking-en-vivo.ts`);
  - la decisión «¿recargar?» de `error.tsx` (función pura con nombre/mensaje, último intento y ahora);
  - la guardia de las migraciones.
- `tests/db/analisis-ia.test.ts` y `tests/db/partes.test.ts` siguen verdes.

### Cierre
PR «fix: la página deja de caerse por permisos y fallos de red pasajeros».

Acciones manuales en el PR, en PowerShell, primero `krea_preview` y luego `krea` (el método de
#149, que César ya usa):

```powershell
Get-Content -Raw scripts\sql\2026-11-20-duenos-tablas.sql | ssh kit-vps "su postgres -s /bin/sh -c 'psql -X -v ON_ERROR_STOP=1 -d krea_preview'"
```

Más: activar Skew Protection en Vercel. Avísale que **esto arregla producción ya**, sin esperar al
merge.

---

## Q2 — `feat/evaluar-cola-en-vivo`

Worker **Q2** · D439–D444 · filas 243–248 · opus · medium · Docker: no · Build local: no.

### Lo que pide César
> «La lista de los evaluados no se actualiza en ajax, es decir en vivo, porque ahorita tengo que
> recargarlo; también al momento de evaluar, si ya se evaluó tengo que recargar por si otro
> profesor vuelve a entrar le aparece como no evaluado.»
> «El número de evaluaciones en el sidebar que quedan por evaluar no se actualiza en vivo.»
> «Siento que la UX para poder ver las tareas entregadas no es la óptima, ya que confunde ir a
> tareas y luego evaluaciones, y que en las evaluaciones no pueda ver las evaluaciones entregadas
> y poder editarlo directamente allí.»
> «El botón Cambiar en sí, ¿en qué ayuda? porque solo me regresa a la lista de evaluados.» →
> decidido: **abre los filtros ahí mismo; al aplicar, salta a la primera entrega de la cola nueva**.
> «Acomodar el selector tipo/sección en la página Evaluar, ya que en algunas pantallas el de tipo
> se pegan las palabras y el de sección no reparte todo su contenido en los tabs.»

### Dónde está
**Página de la cola y datos**
- `app/(profesor)/profe/evaluar/page.tsx:35-118`: server component. Pasos:
  - `filtrosDeParams` (:38);
  - `colaEvaluar()`, `mapasProfe()`, `catalogoSecciones()` (:39-43);
  - `filtrarCola` (:44), `opcionesFiltros` (:47);
  - conteo «N entregas por evaluar» (:29-30), «Evaluar la primera» (:59-66);
  - vacíos (:69-77, :89-101) y filas `PorEvaluarFila` (:104-110).
- `lib/datos/profesor.ts:140-147` `colaEvaluar` (`estado = "entregada"` → `colaPorEvaluar`,
  `lib/evaluar-datos.ts:374-385`); `entregasTodas()` en `:97`.
- Filtros en `lib/evaluar-datos.ts`: `FiltrosEvaluar` :44-52, `filtrosDeParams` :61-78,
  `hayFiltros` :80, `queryFiltros` :85-94, `rutaCola` :96, `rutaEntrega` :101, `filtrarCola`
  :388-407, `colaFiltradaCon` :409-416, `opcionesFiltros` :469-500, `resumenFiltros` :509-523.
- UI de filtros: `components/sections/evaluar/cola-filtros.tsx`.
  - Rejilla `grid gap-4 sm:grid-cols-2 lg:grid-cols-4` (:72-76).
  - Tipo = `ToggleGroup … block` (:77-95). Sección = `SelectorSeccion className="sm:w-full"` (:97-109).
  - Tarea y Alumno = `FiltroSelect` (:154-182). `router.replace(rutaCola(sig))` (:59).

**Fila y página de la entrega**
- Fila: `components/sections/profe-panel/pending-reviews.tsx:90-123` `PorEvaluarFila` («Evaluar»
  fijo en :113-119); meta de `filaEvaluar` (`lib/panel-datos.ts:33+`, sin nota). El Panel también
  la usa: no lo rompas.
- Entrega: `app/(profesor)/profe/evaluar/[entrega]/page.tsx`.
  - Carga :78-103; `vistaEvaluar({cola: colaFiltradaCon(cola, filtros, id)})`.
  - Sin `?ver` = corregir; con `?ver` = solo ver (D204, D401).
  - `vistaEvaluar` (`lib/evaluar-datos.ts:658-786`): fuera de la cola usa `EYEBROW_REEVALUAR`
    (:535), y Saltar/Guardar van a la primera de la cola (:783-785).
- «Cambiar»: `components/sections/evaluar/review-header.tsx:98-108`, enlace a `colaHref` =
  `rutaCola(filtros)` (`lib/evaluar-datos.ts:782`).

**Menú, caché y vigilancia**
- Contador del menú: `app/(profesor)/profe/_shell.tsx:12-43` (`porEvaluar: cola.length` :24 →
  `RouteSideNav evaluarCount`). Se pinta en `components/layout/side-nav.tsx:28,45-52` y
  `counterLabel` en `lib/nav.ts:248-251`. Montado en `app/(profesor)/profe/layout.tsx:161-167` con
  `<Suspense>`. El layout **no** se re-renderiza al navegar.
- Por qué nada se actualiza:
  - `next.config.ts:38` `staleTimes: { dynamic: 180 }` (D250);
  - `refresh()` en `lib/acciones/evaluar.ts:40,65` solo vacía la caché del profe que guardó;
  - las páginas vistas se quedan montadas en `<Activity>` (`components/layout/transicion-pagina.tsx`).
- `SelectorSeccion`: `components/sections/shared/selector-seccion.tsx:87-102`. Con ≤ 4 secciones
  pinta un `ToggleGroup` **sin `block`** (raíz `inline-flex w-fit`, ítems sin `flex-1`); por eso no
  reparte. Con más de 4, `Select`.
- `ToggleGroup`: `components/ui/toggle-group.tsx`.
  - Raíz :92-99. Ítem :132-147: `whitespace-nowrap`; con `block`, `min-w-0 flex-1 px-2`.
  - Bajo `--container-seg: 25rem` (`app/globals.css:628`) oculta íconos (:145).
  - Tipo pega las palabras en la celda de ¼ de ancho (lg).
- Sondeo reutilizable: `lib/sondeo.ts` `useSondeo(pedir, cadaMs, activo)`. Q1 lo ajusta por dentro;
  tú **no lo edites**. Modelo de endpoint: `app/api/ranking/[seccion]/route.ts` (204 si no cambió,
  `no-store`, 401 sin sesión).

### Enfoque decidido
1. **Estado en la cola** (#15): filtro nuevo `estado` en la URL: `por-evaluar` (por defecto; los
   enlaces de hoy siguen igual), `evaluadas`, `todas`.
   - Con su segmentado en `ColaFiltros`.
   - `filtrosDeParams` (zod), `queryFiltros`, `hayFiltros` y `resumenFiltros` lo incluyen.
   - Fuente de evaluadas: consulta nueva cacheada por request en `lib/datos/profesor.ts`
     (`estado = "evaluada"`, más reciente primero por `evaluacion.evaluadaEn`).
   - `filtrarCola` es genérico y sirve igual. Opciones de filtro, conteo y vacíos salen de la
     lista elegida, con su copy.
   - `PorEvaluarFila` recibe la acción: «Evaluar», o «Corregir» + «Ver» (`?ver`, D401) con la nota
     (`GradePill`) en la meta. El Panel sigue igual.
   - En la entrega, con `estado=evaluadas`, Anterior/Saltar/Guardar/«i de n» siguen la lista de
     evaluadas, no la de espera (D385). El eyebrow lo dice.
2. **En vivo** (#7, #12): `GET /api/evaluar/version`, solo profesor (mismo control que
   `/api/presencia`, `lib/acceso.ts`).
   - Devuelve `{ version, porEvaluar }`. `version` = huella barata de la cola (cantidad + máximo de
     `enviadaEn` y de `evaluadaEn` de las no borrador). 204 si `?desde=` coincide. `no-store`.
   - Un componente cliente con `useSondeo` (cada `SONDEO_MS`):
     - **en la página de la cola**: si la versión cambió, `router.refresh()`;
     - **en el menú**: el contador lo pinta un hijo cliente que arranca con el valor del servidor
       y se actualiza con `porEvaluar`. No hace falta refrescar el layout;
     - **en la entrega abierta**: **no** refresques solo (el profe perdería lo que escribe).
       Si la entrega que tiene abierta pasó a evaluada por otro, o la tomó otro, avisa con un toast
       (`toast` de `@/components/ui/sonner`) y un botón «Ver la evaluación» que hace
       `router.refresh()`. Para saber de **esta** entrega, el endpoint acepta `?entrega=<id>` y
       devuelve además su `evaluadaEn` y quién (nombre corto, nunca la cédula).
   - El conflicto al guardar ya existe (`cambio`, D224): no lo cambies.
3. **«Cambiar»** (#4): abre un `Sheet` (`components/ui/sheet.tsx`) o `Dialog` con los mismos
   filtros (reusa `ColaFiltros` en un modo «aplicar» que no navegue en cada cambio).
   - «Aplicar» lleva a la primera entrega de la cola filtrada; si queda vacía, a la cola con esos
     filtros y su vacío.
   - Foco: entra al primer control y vuelve a «Cambiar» al cerrar.
4. **Filtros que no se pegan** (#6):
   - `SelectorSeccion` gana la prop `block` (la pasa a su `ToggleGroup`) y `cola-filtros.tsx` la usa.
   - Rejilla con más aire: Tipo y Sección más anchos (p. ej. `md:grid-cols-2 xl:grid-cols-4`, o
     Tipo/Sección arriba y Tarea/Alumno abajo).
   - Verifica que ningún ítem del segmentado baje de su texto: con `block`, `min-w-0` + `nowrap`
     recorta. Si en 320 px no cabe, que la fila envuelva (ver «D-A1» en `toggle-group.tsx`).
   - Busca otros usos de `SelectorSeccion` y de `ToggleGroup block` en celdas estrechas (regla 11).

### Trampas
- `PorEvaluarFila` la usa el Panel (`components/sections/profe-panel/pending-reviews.tsx`): la
  acción nueva es opcional, por defecto «Evaluar».
- El `_shell` usa `cache()` de React; el contador cliente va en `side-nav` o en un hijo nuevo, no
  conviertas el layout en cliente.
- `tests/unit/cache-rutas.test.ts` (ver brief).
- Q3 toca el formulario, `zGuardarEvaluacion` y `armarEvaluacion` en `lib/evaluar-datos.ts`, y el
  bloque `soloVer` de la página de la entrega. **No los toques.**

### Decisiones que te limitan
D148, D204, D224, D250, D384–D387, D398, D401, D408–D410 (presencia; el endpoint nuevo copia su
acceso), D327.

### Cómo verificar
- `tests/unit/evaluar-filtros.test.ts` con `estado` (params inválidos se ignoran; por defecto
  `por-evaluar`).
- `evaluar-datos.test.ts` con la navegación por evaluadas.
- La huella de versión (pura) con pruebas, y `tests/db/` para la consulta nueva y la de versión.
- A mano: 320 px de la cola y del panel «Cambiar»; nombres accesibles de «Corregir»/«Ver» con el
  nombre del alumno.
- En «Cómo probar» del PR: dos profes en dos navegadores (uno evalúa y la cola y el contador del
  otro cambian en ≤ 5 s; el toast en la entrega abierta).

### Cierre
PR «feat(evaluar): cola en vivo con Evaluadas y filtros que se cambian en la entrega».

---

## Q3 — `feat/evaluar-comentarios`

Worker **Q3** · D445–D450 · filas 249–254 · opus · medium · Docker: no · Build local: no.

### Lo que pide César
> 1. «Textarea debe ser autoresize al momento de escribir más líneas.»
> 2. «Me gustaría poder colocar emojis en los comentarios opcionales.»
> 3. «Agregar un comentario general del estudiante en la evaluación además de los que tiene por
>    pregunta.»
> 4. «Aumentar a 300 los caracteres de los comentarios opcionales.»
> 5. «Las opciones para puntuar y el campo para anotar el puntaje no tienen un gap.»
> 6. «Cuando un profesor entra a la evaluación de otro profesor, en lugar de aparecer un aviso
>    arriba me gustaría que apareciera un snackbar para que ambos lo vean.»
> 7. «Cuando [el estudiante] revisa la tarea evaluada no puede ver qué profe la evaluó.»

### Dónde está
1. **Textarea:** `components/ui/textarea.tsx` ya tiene `autoGrow` (:19-23, :50-58, :99; D262). El
   comentario: `components/krea/question-card-review.tsx:112-128`, `<Textarea compact counter
   maxLength={COMMENT_MAX_LENGTH}>` sin `autoGrow`. Busca otros `Textarea` de texto largo sin
   `autoGrow` (regla 11) y dilo si los cambias.
2. **Emojis:** nada los bloquea (solo `.trim().max()`). Falta poder **ponerlos** desde una laptop.
   - Decidido: botón pequeño «Emoji» junto al campo que abre un `Popover`
     (`components/ui/popover.tsx`) con una rejilla corta de emojis comunes de aula (≈ 24, lista fija
     en `lib/`, sin dependencia nueva).
   - Inserta en la posición del cursor y devuelve el foco al campo.
   - Cada emoji es un botón con `aria-label` en español (nombre del emoji).
   - Respeta el máximo: si no cabe, no inserta.
   - El contador cuenta unidades UTF-16 igual que `maxLength` y el servidor (`String.length`), así
     que un emoji cuenta 2. Déjalo así (coherente) y dilo en el PR. Alternativa: graphemes con
     `Intl.Segmenter` como `lib/auth.ts:46`.
3. **Comentario general:** hoy no existe.
   - Estructura: `zEvaluacion` (`lib/modelo.ts:404-425`, jsonb `entregas.evaluacion`,
     `lib/db/schema.ts:218`). Campo opcional nuevo `comentarioGeneral?: string` (vacío = ausente),
     sin migración, como `noParticiparon` y `bases`.
   - Guardar: `zGuardarEvaluacion` (`lib/evaluar-datos.ts:114-146`, opcional: un formulario viejo
     sigue guardando), `armarEvaluacion` (:204-260; guarda solo si tiene texto), `inicial` de
     `vistaEvaluar` (cerca de :767).
   - Deshacer (`evaluacionAnterior`, D205) lo restaura solo porque va dentro del jsonb.
   - UI: un `Textarea autoGrow counter` «Comentario general (opcional)», con emojis, tras la lista
     de preguntas en `components/sections/evaluar/review-form.tsx` (cerca de :380).
   - Grupal: uno para el equipo.
   - Lo ven:
     - el alumno en `/notas/[tarea]` (`app/(estudiante)/notas/[tarea]/page.tsx:86`,
       `components/sections/notas/question-list.tsx`; datos en `detalleNota`,
       `lib/vistas-estudiante.ts:460-512`), en un bloque «Comentario de tu profe» arriba de las
       preguntas;
     - el profe en «Solo ver» (`[entrega]/page.tsx:182-216`).
   - Texto con `whitespace-pre-wrap`; `question-card-detail.tsx:86-97` hoy no lo tiene, arréglalo
     también.
4. **300:** `lib/question.ts:13` `COMMENT_MAX_LENGTH = 280` → 300 (y el comentario de :11). El
   servidor: `lib/evaluar-datos.ts:119` `.max(1000)` → `.max(COMMENT_MAX_LENGTH)` para el
   comentario por pregunta y el general. `lib/modelo.ts:407` se queda en 1000: lee datos guardados.
   La galería `app/componentes/_familias/formularios.tsx:233,241,247` también.
5. **Gap:** `components/krea/score-picker.tsx:93`, raíz del modo stepper `flex min-w-0 flex-col
   gap-1` → un gap de token mayor (p. ej. `gap-3`) entre `NumberStepper` y los atajos (:97-127).
   Mira también el modo botones (:132-172) y el contenedor «Puntaje» de `review-form.tsx:357-376`.
6. **Snackbar de presencia:** `components/sections/evaluar/presencia-evaluar.tsx:1-43`.
   - Hoy pinta una franja visible (`<p aria-hidden>`, `bg-accent-soft-2`) más un `<output
     aria-live>` `sr-only`. Hook: `usePresenciaEntrega` en `components/sections/alumnos/use-presencia.ts`
     (:143-197).
   - Decidido: se quita la franja. Cuando **aparece** un profe nuevo en la entrega, un `toast`
     (`@/components/ui/sonner`, Toaster ya montado en `app/(profesor)/profe/layout.tsx:67`) con el
     mismo texto (`avisoPresenciaEntrega`, `lib/presencia.ts`).
   - Ambos lo ven: el que llega ve al que estaba en su primer sondeo; el que estaba ve al que llega
     en el siguiente sondeo.
   - Un toast por llegada, no en cada sondeo. Duración más larga que la normal si `sonner.tsx` lo
     permite. Si se van todos, sin toast.
   - El `<output aria-live>` puede quedarse o no: el Toaster ya anuncia (D131), pero que no se
     anuncie dos veces.
   - Actualiza `tests/unit/presencia-evaluar.test.ts`.
7. **Quién evaluó:** se guarda en `evaluacion.evaluadaPor` (cédula, `lib/modelo.ts:410`; escrito en
   `lib/evaluar-datos.ts:258` y `lib/data/puntaje-final.ts:63`; `null` en Excel/seed).
   - En el servidor, `detalleNota` resuelve el nombre corto del profe (consulta a `usuarios` en la
     capa de datos del alumno) y el eyebrow dice «… · evaluada el dd/mm/aaaa por {nombre}» (hoy en
     `lib/vistas-estudiante.ts:479`, pintado por `components/sections/notas/grade-summary.tsx:25`).
   - Sin evaluador conocido, como hoy. **Nunca la cédula al cliente.**

### Trampas
- Q2 toca filtros, cola y navegación en `lib/evaluar-datos.ts` y la carga de listas de
  `[entrega]/page.tsx`, y Q4 toca `lib/vistas-estudiante.ts` fuera de `detalleNota`. Quédate en tus
  zonas (brief › Formas compartidas). **No toques `app/(estudiante)/tareas/[tarea]/**`** (Q4 y Q5).
- «Copiar comentarios» (`review-form.tsx:435-446`): decide si incluye el general y dilo.
- `ReviewForm` arma el envío en :218-233: el general viaja ahí.

### Decisiones que te limitan
D205 (deshacer), D224, D262 (autoGrow), D054–D055, D103 (puntaje), D131 (toasts), D364, D403
(campos opcionales en el jsonb), D380, D388 (cédula de profes), D408–D410 (presencia).

### Cómo verificar
- `tests/unit/evaluar-datos.test.ts`:
  - `comentarioGeneral` recortado, vacío = ausente;
  - > 300 = `invalida`;
  - un formulario sin el campo sigue guardando.
- `tests/db/evaluar.test.ts`: guardar, deshacer y corregir conservan el general.
- `tests/unit/vistas-estudiante.test.ts`: el general y el nombre del evaluador en `detalleNota`, y
  sin evaluador.
- Pura: insertar un emoji en una posición respetando el máximo.
- A mano: teclado en el popover de emojis (Esc cierra, el foco vuelve) y 320 px.

### Cierre
PR «feat(evaluar): comentario general, emojis, 300 caracteres y aviso de otro profe como
snackbar».

---

## Q4 — `feat/tareas-vencidas`

Worker **Q4** · D451–D458 · filas 255–262 · opus · **high** · Docker: no · Build local: no.

### Lo que pide César
> «Las tareas ya vencidas siguen como abiertas.»
> Decisión (2026-11-20): «Se cierra sola, pero permite que se pueda volver a abrir, ya sea para
> alumnos seleccionados o para todos.»
> «En la sección de profes › tareas, clic en Evaluadas no aparecen las tareas evaluadas y eso que
> ya se evaluaron anteriormente.» → decidido: filtro **Abiertas · Cerradas · Evaluadas**.
> Cerradas = vencida o cerrada a mano; Evaluadas = todas sus entregas ya tienen nota, esté
> abierta o cerrada.

Esto revierte en parte D196 y D357 («vencer no la cierra»): tus decisiones las marcan como
«Superseded in part by D45x».

### Dónde está
**Estados y la regla de vencida**
- Estados: `lib/modelo.ts:206` `ESTADOS_TAREA = ["borrador","abierta","evaluada"]`;
  `lib/db/schema.ts:177-196`. «evaluada» = cerrada a mano con «Cerrar tarea»:
  `cerrarTareaEnTransaccion` (`lib/data/tareas.ts:186-202`), acción `cerrarTarea`
  (`lib/acciones/tareas.ts:103-118`), botón y diálogo en
  `components/sections/tareas-profe/task-builder.tsx:395-407, 452-502` (montado en :787 y :824),
  `puedeCerrar` (`lib/tareas-profe-datos.ts:339-341`).
- Regla de vencida (única): `lib/fecha.ts:89-95` `vencida(fecha, hora, ahora)`. No hay cron ni
  `estadoEfectivo`.

**Filtro de Profe › Tareas**
- `lib/tareas-profe.ts:74-79` `FILTROS_ESTADO` (Todas · Borradores · Abiertas · Evaluadas) y
  `filtrarTareas` :85-92 (`t.estado === filtro`, en el cliente, D099).
- `tareaProfeDe` `lib/tareas-profe-datos.ts:437-467`: `avance` :446-451, `estado` :456.
- Vacío :117-118; `ORDEN_ESTADO` :122-126; `metaTarea` :184; `barraEvaluadas` :216.
- Tarjeta: `components/sections/tareas-profe/teacher-task-card.tsx:86,117,127`.

**Todos los lectores del estado** (cámbialos al estado efectivo donde corresponda)
- Envío y subida:
  - `permisoEntrega` (`lib/entregas.ts:69-114`, `:82`);
  - `permisoSubida` (`lib/data/entregas.ts:97-121`);
  - `enviarEnTransaccion` (`lib/data/entregas.ts:165+`; ya recibe `ahora`,
    `lib/acciones/entregas.ts:164`);
  - partes: `permisoParte` (`lib/partes.ts:78-100`) y `permisoSubidaParte`
    (`lib/data/entregas.ts:124-160`).
- Alumno:
  - `lib/vistas-estudiante.ts:613` (`tareasAbiertas`), `:902`, `:1035-1061` (estado `cerrada` del
    detalle);
  - `lib/entregas.ts:122-136`;
  - «Ver la entrega ideal», `app/(estudiante)/tareas/[tarea]/page.tsx:110`.
- Devolver: `lib/devolver-entrega.ts:71-93` (`puedeDevolver`, `comprobarDevolver`),
  `lib/data/devolver-entrega.ts:80`.
- Ideal: `lib/ideal.ts:185-191` (`alumnoPuedeVer`), `lib/data/ideales.ts:104-112`.
- Premios:
  - `lib/premios.ts:101`;
  - `lib/tareas-profe-datos.ts:635, 674, 710-711`;
  - `decidirPremioEnTransaccion` exige `evaluada` (`lib/data/tareas.ts:222`).
- Constructor: `lib/tareas-profe-datos.ts:281, 286, 573` (`modoConstructor`).
- Cola sin conexión: `lib/offline/cola.ts:259,274,328` (`cerrada`, rechazo definitivo; ya existe).
- Push: `lib/push.ts:88` (solo al pasar a abierta; sin cambios).

### Enfoque decidido
1. **Dato** (migración `drizzle/0007_tarea_prorrogas.sql` con `bun run db:generate`, aditiva):
   - `tareas.prorrogas jsonb null` = `Record<titularId, { fecha: string; hora: string | null }>`.
     Titular = cédula en individual, `equipoId` en grupal; es el mismo id que arma la entrega
     `tareaId__titularId`, verifícalo.
   - zod en `lib/modelo.ts` junto a la tarea: fecha y hora con las mismas reglas que
     `fechaEntrega`/`horaEntrega`.
   - **No la apliques** (la aplica César).
2. **Estado efectivo** (puro, junto a `vencida` o en un archivo nuevo de `lib/`):
   - `estadoEfectivo(tarea, ahora, titularId?)`:
     - borrador → borrador;
     - `evaluada` (cerrada a mano) → cerrada para todos;
     - abierta sin fecha → abierta;
     - abierta y no vencida → abierta;
     - abierta y vencida → cerrada, **salvo** que `titularId` tenga prórroga no vencida → abierta
       para él.
   - `cerradaParaTodos(tarea, ahora)`: cerrada y sin ninguna prórroga vigente. La usan la ideal
     visible al alumno, decidir premio y la tarjeta/filtro del profe («Cerrada» con «Prórrogas
     abiertas: N» si quedan).
   - Envío, subida, partes, devolver y editar entrega usan el estado del **titular**. Lista y
     detalle del alumno, también (con prórroga ve su fecha nueva).
   - **Cerrar a mano** sigue igual: `evaluada` y cierra para todos.
3. **Reabrir** (constructor de la tarea, solo con la tarea cerrada efectiva, y en la lista de
   entregas si queda simple): botón «Reabrir tarea» → diálogo con dos opciones:
   - **«Para todos»**: fecha y hora nuevas (obligatorias y futuras); `estado = abierta`, se borran
     las prórrogas.
   - **«Para algunos»**: lista con casillas de alumnos (individual) o equipos (grupal) de las
     secciones de la tarea, más fecha y hora nuevas; se guardan en `prorrogas`. Quitar una prórroga
     se puede desde el mismo diálogo.
   - Server Action con transacción y fila bloqueada como `cerrarTarea`, `refresh()` y conflictos
     como el resto (`actualizadoEn`).
   - Copy PROVISIONAL.
4. **Filtro de Profe › Tareas:** `Todas · Borradores · Abiertas · Cerradas · Evaluadas`.
   - Cerradas = cerrada efectiva (también las cerradas a mano).
   - Evaluadas = derivado: hay al menos una entrega enviada y todas tienen nota
     (`avance.hechas === avance.total`, revisa qué cuenta `total`). Puede estar abierta o cerrada;
     una tarea puede salir en dos filtros.
   - El filtro corre en el cliente (D099): el estado efectivo se calcula en el servidor con `ahora`
     y viaja en `TareaProfe`.
   - La tarjeta muestra «Cerrada» (palabra + ícono, nunca solo color), y la meta y las acciones
     dejan de tratarla como abierta.
5. **Consecuencias que ya aceptó César al pedir el cierre solo** (en las decisiones):
   - sin entregas tarde salvo prórroga;
   - «Devolver» solo mientras esté abierta para ese titular;
   - la ideal se ve al cerrar para todos;
   - el premio se decide al cerrar para todos;
   - el constructor pasa a solo lectura al cerrar (reabrir es la salida).

### Trampas
- **`cacheComponents`:** nada de `Date.now()` en código cacheado; pasa `ahora` desde la página o la
  acción, como ya se hace.
- La consulta de la cola de Evaluar filtra **entregas**, no tareas: no la toques (es de Q2).
- `lib/vistas-estudiante.ts`: tu zona es `:613`, `:902` y `:1035-1061`. `detalleNota` (`:460-512`)
  es de Q3. `app/(estudiante)/tareas/[tarea]/page.tsx`: Q5 cambia la línea `:163`; no la toques.
- No toques `app/(profesor)/profe/evaluar/**`. Si `puedeDevolver` cambia de firma, que el cambio
  quede en `lib/`, con un valor por defecto que no rompa a sus llamadores de esa carpeta
  (`[entrega]/page.tsx:159-160`): dilo en el informe.
- Las pruebas existentes que asumen «vencida sigue abierta» (D357) cambian: actualízalas, no las
  borres.
- Push (`lib/push.ts`) sin cambios.

### Decisiones que te limitan
D196, D202, D352–D357, D099, D123, D124, D263 (premios), D411 (devolver), D419 (partes congeladas),
D433, D434 (ideal), D200 (editar tarea publicada).

### Cómo verificar
- Unitarias de `estadoEfectivo` y `cerradaParaTodos`: sin fecha; antes y después de la hora (zona
  Caracas); cerrada a mano; prórroga vigente y vencida; titular sin prórroga.
- `tests/unit/tareas-profe.test.ts`: los 5 filtros y una tarea en dos.
- `tests/db/`:
  - enviar después de vencer → `cerrada`;
  - con prórroga → acepta;
  - reabrir para todos y para algunos;
  - decidir premio al cerrar para todos;
  - devolver tras vencer → `tarea-cerrada`.
- A mano: el diálogo de reabrir con teclado, a 320 px y con lector (casillas con nombre).

### Cierre
PR «feat(tareas): la tarea se cierra al vencer y se puede reabrir para todos o para algunos».

Acción manual: aplicar `drizzle/0007_tarea_prorrogas.sql` en `krea_preview` y en `krea` **antes
del deploy**, con el mismo comando de #149, y **después correr
`scripts/sql/2026-11-20-duenos-tablas.sql`** (de Q1). En el PR, los dos comandos en PowerShell.

---

## Q5 — `fix/alumno-detalles`

Worker **Q5** · D459–D460 · filas 263–264 · sonnet · medium · Docker: no · Build local: no.

### Lo que pide César
> «En Por entregar las cards al hacer hover muestran un bg, pero se muestra que el card no tiene
> padding y que el texto está pegado al borde; de seguro esto se repite en otras partes.»
> «Al entregar una tarea dice Volver al inicio, pero lo ideal sería volver a las tareas.»
> «El estudiante no puede visualizar a los profesores.»

### Dónde está y qué hacer
1. **Hover sin padding.** Causa: el primitivo `components/ui/card.tsx:96-121` `CardListItem`.
   - `:114` `px-1 py-3`; con `asChild` (`:116`) añade `rounded-nav … hover:bg-surface-2`. El fondo
     llega al borde del texto con 4 px.
   - Arreglo en el primitivo, solo con `asChild`: más padding horizontal más un margen negativo
     igual, así el texto queda alineado con el resto de la tarjeta y el fondo del hover respira
     (p. ej. `px-3 -mx-2`, con tokens).
   - Instancias, todas con `CardListItem asChild`:
     - `components/sections/inicio/pending-tasks.tsx:66`
     - `components/sections/tareas/delivered-tasks.tsx:41`
     - `components/sections/shared/grade-row.tsx:45`, que usan `recent-grades.tsx:55`,
       `notas/grades-list.tsx:75` y `equipo/team-grades.tsx:28`
     - `app/secciones/page.tsx:114`
     - `app/componentes/_familias/contenedores.tsx:94`
   - Las que no son `asChild` (`pending-reviews.tsx:98`, `recent-adjustments.tsx:62`,
     `adjustment-history.tsx:229`) no deben cambiar.
   - Comprueba que el margen negativo no cause scroll horizontal a 320 px (la tarjeta tiene padding
     propio; mídelo leyendo las clases de `Card`).
   - Busca el mismo defecto fuera de `CardListItem`: cualquier fila con `hover:bg-*` y sin
     `px-*`/`p-*` (regla 11).
2. **«Volver a tareas».** `components/sections/tareas/task-delivered.tsx:73-75` («Volver al inicio»,
   prop `inicioHref`, :9, :11, :32).
   - La prop pasa a `volverHref` y el texto a «Volver a tareas».
   - Llamadores: `app/(estudiante)/tareas/[tarea]/page.tsx:163` (`"/"` → `"/tareas"`) y
     `app/secciones/tareas/[estado]/page.tsx:73` (`/secciones/tareas`).
   - D140 ya decía que tras entregar se vuelve a `/tareas`. En `tareas/[tarea]/page.tsx` toca
     **solo** esa línea (Q4 toca ese archivo).
3. **«Tus profesores» con todos.**
   - `lib/data/contacto.ts:60-80` `contactosDeProfes` filtra por `telefono` o `email_contacto` no
     nulos (`:78`). `lib/contacto.ts:182` descarta al profe sin datos válidos.
     `components/sections/perfil/tus-profesores.tsx:19` oculta la tarjeta si la lista está vacía.
   - Decidido: salen **todos** los profes de la sección del alumno (o de todas, `seccion` null,
     D323), con avatar y nombre.
   - Los que no cargaron contacto llevan una línea «Sin datos de contacto» (PROVISIONAL) y sin
     botones. Ordena primero los que tienen contacto y después por nombre.
   - Revisa la ayuda del profe en su Perfil (`Opcional. Tus alumnos lo verán en su Perfil.`): sigue
     siendo verdad.
   - D380 cambia («no sale si ninguno lo cargó»): tu decisión la marca «Superseded in part».
   - **Nunca la cédula al cliente** (D380, D388, D389).

### Cómo verificar
- `tests/unit/contacto.test.ts` y `tests/db/contacto.test.ts`: profe sin contacto incluido, orden y
  sin cédula.
- `bun test` de los archivos que toques.
- A mano: 320 px de Inicio y `/tareas`, foco visible en las filas, contraste del hover (token ya
  medido).

### Cierre
PR «fix(alumno): filas con aire al pasar el mouse, volver a tareas y todos los profes en el
Perfil».
