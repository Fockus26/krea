# Tanda 2026-11-14 — prompts de la ola 1 (V1–V6)

Brief común: main @ 56c3105. Modo `pr` (push a tu rama, PR a main, nunca merge). Sin versionado (no
changesets). Sin dev server ni QA (memoria de César: QA al final): verifica por código + `bun run
test:related` + `bun run typecheck` + `bun run lint` + `bun run test`. No corras `bun run build`
(lo corren CI y Vercel). No hay entorno DOM de pruebas (sin happy-dom/jsdom): prueba la lógica pura
(y la capa de datos sobre PGlite, como `tests/` ya hace con `lib/data/*`).
Carpeta principal (para leer `context/` local): `C:\Users\Cesar\Documents\Work\krea`. No edites
`CURRENT_PHASE.md` ni `CONTENT_CHECKLIST.md`: deja tus filas y tu PHASE_LOG en el informe. Copy en
español (es-VE, decimales con coma). Reglas de CLAUDE.md (tokens, WCAG AA, 320 px sin scroll,
acento × claro/oscuro con pares de contraste calculados en el informe si añades color). Skill
`a11y` antes del PR. Decisión visual nueva: elige la conservadora y explica la alternativa en el PR.
Commits y PR en español. Cada decisión = un archivo en `context/decisions/` (van en git), solo dentro
de tu rango de D. Si te falta un token, usa el más cercano y lístalo en «Tokens que faltan».
AGENTS.md: este Next tiene cambios que rompen; lee la guía en `node_modules/next/dist/docs/` antes
de usar una API de Next que no esté ya en el archivo que tocas.
Migraciones y SQL de datos: se escriben, **no se aplican** (las aplica César en krea_preview y krea).

**Formas compartidas (fijas, no las cambies):**
- Filtros de la cola de Evaluar por `searchParams`: `tipo=individual|grupal`, `seccion=<código, p. ej.
  5A>`, `tarea=<id de tarea>`, `alumno=<cédula>`. Los lee V1 en `/profe/evaluar` y
  `/profe/evaluar/[entrega]`; V6 solo **escribe** el enlace `/profe/evaluar?tarea=<id>`.
- Corregir una evaluación ya hecha = abrir `rutaEntrega(id)` **sin** `?ver` (ya existe:
  `EYEBROW_REEVALUAR`, `lib/evaluar-datos.ts:317`). `?ver` = solo lectura.

**Dueños de archivos (no toques los de otra unidad):**
- V1: `app/(profesor)/profe/evaluar/**`, `components/sections/evaluar/review-header.tsx`,
  `review-index.tsx`, `lib/evaluar-datos.ts` (solo cola y `vistaEvaluar`, líneas 240–316 y 395–509),
  `lib/datos/profesor.ts`, `lib/topbar.ts`, `components/sections/profe-panel/*`, `lib/panel*.ts`.
- V2: `lib/cuentas-datos.ts`, `lib/perfil.ts`, `lib/contacto.ts`, `lib/data/contacto.ts`,
  `components/sections/perfil/tus-profesores.tsx`, `contacto-profe.tsx`, `scripts/seed-db.ts`.
- V3: `app/icon.svg`, `app/favicon.ico`, `app/apple-icon.png`, `public/icons/*`,
  `scripts/generar-iconos.mjs`, `design/iconos/**`.
- V4: `lib/instalar-pwa.ts`, `lib/use-instalar-pwa.ts`, `components/sections/perfil/aviso-tareas.tsx`,
  `app/layout.tsx` (solo metadatos), `app/manifest.ts`.
- V5: `lib/entregas.ts`, `lib/data/entregas.ts`, `lib/acciones/entregas.ts`, `lib/datos/estudiante.ts`,
  `app/(estudiante)/tareas/**`, `components/sections/tareas/*`; y de Evaluar **solo**
  `zGuardarEvaluacion` (`lib/evaluar-datos.ts:54-73`), `lib/data/evaluar.ts` y el payload de
  `components/sections/evaluar/review-form.tsx`.
- V6: `components/sections/alumnos/*`, `lib/alumnos*.ts`, `app/(profesor)/profe/alumnos/**`,
  `app/(profesor)/profe/tareas/**`, `components/sections/tareas-profe/*`, `lib/tareas-profe*.ts`.

---

## V1 — Evaluar: filtros de la cola y Anterior/Saltar en móvil (pedidos 5, 6, 7)

Rama `feat/evaluar-filtros` · D384–D387 · filas 197–199 · `sonnet` · medium · Docker no · puertos fijos no.

César: «5. Cuando le doy a evaluar las tareas grupales no me hace el filtro de las tareas grupales
sino que me muestra todas las tareas… me está llevando como a evaluar todas las que hay en el
momento. 6. Cuando me meto a evaluar me gustaría que yo pudiera filtrar qué tipo de tarea quiero
evaluar, si individual o grupal, si evaluar un alumno en específico, una sección y así para hacerlo
más organizado. 7. Cuando me meto a evaluar pueda saltar e ir atrás en la laptop, pero en
dispositivos pequeños no y esto es importante de tenerlo también.»

Estado verificado:
- La cola es una sola y global: `colaEvaluar()` (`lib/datos/profesor.ts:140-147`) trae todas las
  `entregada` y `colaPorEvaluar` (`lib/evaluar-datos.ts:246-257`) las ordena por `enviadaEn`.
- `/profe/evaluar` (`app/(profesor)/profe/evaluar/page.tsx:17-19`) redirige a la primera de esa cola.
- `vistaEvaluar` (`lib/evaluar-datos.ts:400-509`) saca `anteriorHref`, `saltarHref`, `guardarHref`,
  `siguiente`, `eyebrow` («entrega 1 de 7») de esa misma cola global.
- Anterior/Saltar existen solo ≥ lg: `review-header.tsx:56-90` (`max-lg:hidden`). En móvil la topbar
  es la variante `evaluar` (`lib/topbar.ts:87-92`) y dice la posición, sin navegar.
- El botón «Evaluar N» de la tarjeta de tarea (`teacher-task-card.tsx:118-126`) enlaza a la cola
  global: **es el pedido 5**. Lo corrige V6 (dueño de ese archivo) con `/profe/evaluar?tarea=<id>`;
  tú haces que ese parámetro funcione.
- El Panel enlaza a la cola: `pending-reviews.tsx:38,60,81,108`, `panel-metrics.tsx:52`.
- `ReviewForm` recibe `guardarHref` y `actualHref` (`[entrega]/page.tsx:139-154`): no hace falta
  editar `review-form.tsx` (es de V5); pásale hrefs que ya lleven los filtros.

Enfoque decidido:
- Función pura `filtrarCola(cola, filtros, mapas)` + `zFiltrosEvaluar` (los cuatro parámetros de
  «Formas compartidas»; valores inválidos se ignoran, no dan error). `alumno` casa con
  `integrantes.includes(cédula)` (así un alumno trae también las grupales de su equipo). Helper
  `rutaEntrega(id, filtros)` / `rutaCola(filtros)` que conserva la query.
- `/profe/evaluar` deja de redirigir a ciegas: muestra **la cola filtrable** — barra de filtros
  (Tipo: Todas/Individual/Grupal · Sección · Tarea · Alumno) y la lista de entregas por evaluar que
  cumplen (misma fila que «Por evaluar» del Panel: avatar/logo, nombre, meta, «Evaluar»), con un
  botón primario «Evaluar la primera» y el conteo. Sin resultados: `EmptyState` «No hay entregas con
  esos filtros» + «Quitar filtros». Sin ninguna entrega: el vacío actual. Reutiliza los primitivos
  del proyecto (`Select`, `ToggleGroup`, `recipient-combobox` de Puntos como patrón para Alumno si
  sirve sin editarlo; `selector-seccion.tsx`). Los filtros viven en la URL (enlaces o `router.replace`).
- `/profe/evaluar/[entrega]?…filtros`: Anterior/Saltar/Guardar/«Sigue: …»/«entrega i de n» salen de
  la cola **filtrada**; todos los hrefs conservan la query. Sin query = como hoy. Muestra un chip o
  línea «Filtro: Grupales · 5A» con enlace «Cambiar» a la cola.
- Móvil (< lg): Anterior y Saltar visibles y alcanzables con el pulgar. Conservador: quita
  `max-lg:hidden` y deja la `nav` bajo el eyebrow a ancho completo (dos botones `ghost sm`, área
  táctil ≥ 44 px, sin scroll a 320 px). Alternativa (explícala en el PR, no la hagas): en la barra de
  acción fija junto a Guardar.
- El Panel no cambia de comportamiento («Ver las N» lleva a la cola filtrable).
- Demo/galería: si `app/secciones/evaluar/*` o `lib/demo/evaluar.ts` usan `vistaEvaluar`/la cabecera,
  mantenlos compilando.

Verificación: pruebas puras de `filtrarCola` (cada filtro, combinados, alumno en grupal, inválidos),
de `vistaEvaluar` con cola filtrada (hrefs con query, posición) y de las rutas. Informe: D384–D387,
filas, PHASE_LOG.

---

## V2 — Avatar sin cédula y avatar del profe visible al alumno; quitar texto del celular (13, 15)

Rama `feat/avatar-sin-cedula` · D388–D390 · filas 200–201 · `opus` · medium (dato personal + datos guardados) · Docker no · puertos fijos no.

César: «13. Me gustaría que los estudiantes vieran el avatar del profesor, pero el problema es la
cédula… cualquiera puede acceder a la cédula desde el avatar; hay que solucionar esto para poder
mostrar el avatar sin la cédula. 15. Quitar el texto del número venezolano en el apartado de agregar
número de teléfono ya que está de más.» Decidió: **semilla nueva al azar** (a quien tiene el avatar
por defecto le cambia el dibujo una vez); el SQL lo aplica él.

Estado verificado:
- La semilla por defecto es la cédula: `lib/cuentas-datos.ts:83-96` (`usuarioNuevo`), y
  `scripts/seed-db.ts:74`. La URL de DiceBear lleva `?seed=<semilla>` (`lib/dicebear.ts:23-33`).
- El selector deriva opciones de la semilla actual: `semillasAvatar(base, tanda)` → `base`,
  `${base}-${tanda}-${i}` (`lib/perfil.ts:52-56`): quien eligió otra opción sigue con la cédula
  como prefijo.
- La semilla se copia al ranking: `lib/acciones/perfil.ts:41-57` (jsonb `ranking.alumnos[uid].semilla`).
- «Tus profesores» evita el avatar por esto: `lib/contacto.ts:124-133` (`FilaContactoProfe` sin
  avatar), `lib/data/contacto.ts:3`, `components/sections/perfil/tus-profesores.tsx:15,32-34`.
- Texto a quitar: `components/sections/perfil/contacto-profe.tsx:24` (`AYUDA_TELEFONO`), fila 195 del
  checklist. El error de validación (`lib/contacto.ts:29`) se queda.

Enfoque decidido:
- Semilla opaca: nueva cuenta → semilla aleatoria (`crypto.randomUUID()` o similar, generada por
  quien llama a `usuarioNuevo`, que sigue pura). Nunca derivada de la cédula (un hash de la cédula
  se revierte probando 10⁸ valores: no vale).
- `zAvatar`/la acción de Perfil: rechaza una semilla que contenga la cédula del usuario (defensa).
  `semillasAvatar` no cambia (parte de una semilla ya opaca).
- **SQL de datos** (no lo apliques) en `scripts/sql/2026-11-14-semillas-avatar.sql`, idempotente: a
  todo usuario cuya `avatar->>'semilla'` contenga su cédula le pone una semilla nueva
  (`gen_random_uuid()`), conservando el estilo, y actualiza la misma semilla en el jsonb de
  `ranking` (mira `lib/db/schema.ts` y `lib/acciones/perfil.ts:57` para la forma exacta). Prueba el
  SQL sobre PGlite si `gen_random_uuid` está; si no, pruébalo con la función equivalente y dilo.
  En el PR, sección «Acción manual» con el comando y el orden (krea_preview, luego krea).
- «Tus profesores»: añade `avatar {estilo, semilla}` a la lectura del alumno y pinta `UserAvatar`
  40; **si la semilla todavía contiene la cédula del profe (SQL sin aplicar), cae a iniciales** —
  esa comprobación se hace en el servidor (`lib/data/contacto.ts`), la cédula no viaja al cliente.
- Quita `AYUDA_TELEFONO` y su uso (`aria-describedby` incluido); el placeholder «Ej. 0412-1234567» queda.
- Informe aparte (no lo arregles): qué otras respuestas que ve un **alumno** llevan cédulas ajenas
  (p. ej. claves del jsonb de `/api/ranking/[seccion]`, props de `UserAvatar`), con path:line.

Verificación: pruebas de `usuarioNuevo` (semilla ≠ cédula, no la contiene), del rechazo en Perfil, de
la tarjeta (iniciales si la semilla contiene la cédula) y del SQL. Informe: D388–D390, filas, PHASE_LOG.

---

## V3 — Ícono: dos propuestas (solo «K» y palabra «krea») (pedido 1)

Rama `feat/icono-k` · D391–D392 · sin filas · `sonnet` · medium · Docker no · puertos fijos no.

César: «Modificar el ícono pequeño que se muestra en el favicon, touch icon…; en lugar de mostrar
solo la a quiero dos propuestas visuales, solo con la K y la palabra completa Krea.»

Estado verificado:
- D346 (`context/decisions/D346-*.md`): `app/icon.svg` recorta la «a» del logo (viewBox interno
  `1200 130 600 660`, `clipPath` con un polígono y una elipse), blanca sobre `#295AC3`, `rx=22`.
  PNG (`public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` con el glifo en el 60 %
  central, `app/apple-icon.png` a sangre) y `app/favicon.ico` (16 y 32) salen de
  `node scripts/generar-iconos.mjs`. D346 descartó la palabra entera por ilegible a 16 px.
- Logo fuente: `public/brand/krea-logo.svg` (viewBox `0 0 1779 981`, trazos `krea-logo__ink` y gotas
  `krea-logo__splash`). **Abre el SVG renderizado (PNG) antes de recortar**: comprueba cómo es la
  «k» real del logo (minúscula) y dónde empieza y acaba cada letra; no lo supongas.
- Los hex del ícono viven en el SVG (archivo estático, no en `app/*.tsx`): `tokens.test.ts` vigila
  hex en código; no añadas hex en `.ts/.tsx`.

Enfoque decidido:
- Propuesta A «K»: la «k» del logo recortada (mismo método de D346), blanca sobre `#295AC3`,
  centrada ópticamente, legible a 16 px. Propuesta B «krea»: la palabra completa; a 16/32 px
  compénsalo (palabra a todo el ancho, sin gotas) y di con honestidad en el PR cómo se lee a 16 px.
- Generalizar `scripts/generar-iconos.mjs` para generar un juego completo desde un SVG fuente dado
  (argumento), y dejar los dos juegos en `design/iconos/propuesta-k/` y `design/iconos/propuesta-krea/`
  (svg + 16, 32, 180, 192, 512, maskable).
- Hoja de comparación `design/iconos/comparacion.png`: cada propuesta (y la «a» actual) a 16, 32, 64,
  180 y maskable con máscara circular, sobre barra de pestaña clara y oscura. Mírala tú mismo (Read
  del PNG) y corrige recortes antes del PR. Súbela con `bun run shots:publish` (o el mecanismo de
  `.pr-shots/` del repo) e insértala en el cuerpo del PR: es lo que César va a mirar para elegir.
- **Aplicada en la app: la A («K»)** (`app/icon.svg`, `favicon.ico`, `apple-icon.png`,
  `public/icons/*`). El PR dice cómo pasar a la B con un comando. No toques `app/manifest.ts` ni
  `app/layout.tsx` (V4).
- D391 sustituye a D346 (márcala `Superseded by D391`).

Verificación: el script corre en limpio y los PNG tienen el tamaño exacto; la comparación revisada a
ojo. Informe: D391–D392, PHASE_LOG.

---

## V4 — «Instalar KREA» en iPhone/iPad: que se entienda cómo (pedido 14)

Rama `fix/instalar-ios` · D393–D394 · filas 202–204 · `sonnet` · medium · Docker no · puertos fijos no.

César: «Tengo problemas para instalar el pwa en safari ios.» Precisó: **«No encuentro cómo
instalar»** (solo hay un texto con pasos y no es claro, o la opción no aparece en Safari).

Estado verificado:
- En iOS no existe `beforeinstallprompt`: `estadoInstalacion` devuelve `"ios"`
  (`lib/instalar-pwa.ts:17-37`) y Perfil › Avisos pinta solo un párrafo
  (`components/sections/perfil/aviso-tareas.tsx:32-33,65-66`: «Para instalar KREA en tu iPhone o
  iPad: toca Compartir y luego Agregar a inicio. Ábrela desde ahí.»). D368–D371.
- `esDispositivoIOS` (`lib/instalar-pwa.ts:40-47`) no distingue Safari de Chrome/Firefox de iOS ni
  de los navegadores dentro de apps (Instagram, WhatsApp), donde «Agregar a inicio» no está o está
  en otro menú.
- `app/layout.tsx` no declara `appleWebApp` (grep sin resultados); el `viewport` está en `:52-58`.
  `app/manifest.ts`: `display: "standalone"`, íconos 192/512/maskable. `app/apple-icon.png` existe.
  `proxy.ts:22` deja pasar sin sesión los estáticos con extensión (manifest e íconos).
- No puedes probar en un iPhone real ni levantar servidor: todo por código y pruebas puras.

Enfoque decidido:
- En estado `ios`, Perfil › Avisos muestra un **botón «Instalar KREA»** (igual que en Android) que
  abre un `Dialog`/`Sheet` del proyecto con los pasos numerados e ícono + palabra en cada uno
  (lucide `Share`, `SquarePlus`): 1) toca Compartir en la barra de Safari, 2) desliza y elige
  «Agregar a inicio» (iOS en español lo llama «Agregar a inicio» / «Añadir a pantalla de inicio»:
  nombra las dos), 3) toca «Agregar» y abre KREA desde el ícono. Copy provisional → filas 202–204.
- Distingue por user agent (función pura, probada): Safari de iOS → pasos de arriba; Chrome/Edge/
  Firefox de iOS (`CriOS`, `EdgiOS`, `FxiOS`) → mismos pasos diciendo que Compartir está en la barra
  de direcciones, o «ábrela en Safari» si es más seguro; navegador dentro de una app (`FBAN`, `FBAV`,
  `Instagram`, `WhatsApp`, `Line`…) → «Abre KREA en Safari para instalarla» con botón «Copiar
  enlace». Nuevo estado en `EstadoInstalacion` en vez de booleanos sueltos.
- Metadatos Apple en `app/layout.tsx` (lee la guía de metadata en `node_modules/next/dist/docs/`):
  `appleWebApp` (`capable`, `title` = nombre del sitio, `statusBarStyle`) y lo que haga falta para
  que al agregarla abra a pantalla completa con su nombre. No toques los archivos de ícono (V3).
- Visibilidad (conservador): el botón sigue en Perfil › Avisos. Alternativa a describir en el PR (no
  la hagas): tarjeta descartable «Instala KREA» en Inicio la primera vez en iOS.
- a11y: diálogo con título, foco gestionado, pasos en `<ol>`, nada solo por color o ícono.

Verificación: pruebas puras del detector (UA reales de Safari iOS, CriOS, FxiOS, Instagram, iPad
«MacIntel» táctil, Android) y de `estadoInstalacion`. Informe: D393–D394, filas, PHASE_LOG, y una
lista «Probar en un iPhone» de 4–5 pasos para César.

---

## V5 — El alumno edita su entrega mientras no esté evaluada (pedido 4)

Rama `feat/editar-entrega` · D395–D397 · filas 205–207 · `opus` · medium (dato guardado + carrera con Evaluar) · Docker no · puertos fijos no.

César: «El estudiante debe poder editar su tarea si no ha sido evaluada.»

Estado verificado:
- Una entrega enviada cierra el paso: `yaEnviada` (`lib/entregas.ts:112-114`), usada en
  `permisoSubida` (`lib/data/entregas.ts:87-118`, `:107-108`) y en `enviarEnTransaccion`
  (`:120-210`, `:144-147`). Única excepción hoy: `faltanRespuestas` (`lib/entregas.ts:121-133`,
  evaluada sin respuestas: se completan y la nota se queda) — **no la rompas**.
- Quién puede: `permisoEntrega` (`lib/entregas.ts:65-109`): individual = el alumno; grupal = solo el
  capitán del equipo actual (D012); solo con la tarea `abierta` (D196).
- Página del alumno: `app/(estudiante)/tareas/[tarea]/page.tsx` — estado `entregada` pinta
  `TaskDelivered` (`:81-132`), `responder` pinta `TaskAnswerForm` (`:154+`). Estados en
  `lib/datos/estudiante.ts` / `lib/tareas.ts`. Borrador local del formulario: D082, D249.
- Imágenes: claves por entrega (`lib/entregas.ts:141-190`, `comprobarImagenes` `:320`), subida en
  `lib/acciones/entregas.ts:52-123`; cola offline `enviarEntregaPendiente` (`:137+`).
- Evaluar relee la entrega dentro de la transacción (`lib/data/evaluar.ts:24-77`) pero no sabe si las
  respuestas cambiaron mientras el profe puntuaba. `ReviewForm` manda `version` (evaluadaEn) para
  correcciones.
- Cola de Evaluar ordenada por `enviadaEn` (`lib/evaluar-datos.ts:246-257`).

Enfoque decidido:
- Regla pura `puedeEditar(entrega, tarea)`: estado `entregada` (sin evaluación) **y** tarea `abierta`
  **y** `permisoEntrega` ok (en grupal, el capitán). Evaluada → no (mensaje «Ya fue evaluada»; el
  profe podrá devolverla en una ola posterior, no es tu unidad). Tarea cerrada → no.
- UI: en `TaskDelivered`, botón secundario «Editar entrega» (solo si `puedeEditar`) que abre el mismo
  `TaskAnswerForm` precargado con las respuestas enviadas (texto e imágenes ya subidas, que se pueden
  quitar o reemplazar); «Guardar cambios» con la misma confirmación de envío; «Cancelar» vuelve a la
  vista entregada sin cambios. Los no capitanes siguen en modo lector (D248).
- Servidor: `enviarEnTransaccion` acepta reenviar sobre una `entregada`; dentro de la transacción,
  si ya está `evaluada` (y no es el caso `faltanRespuestas`) → error nuevo `"ya-evaluada"` con su
  texto en `mensajeErrorEntrega`. `enviadaEn` y `enviadaPor` pasan a ser los del último envío (sin
  migración; dilo en la decisión). `permisoSubida` permite subir imágenes en ese mismo caso.
- Imágenes que dejan de usarse: bórralas de B2 **después** del commit (patrón del logo de equipo,
  D212); si el borrado falla, no falla el envío.
- Carrera con el profe: el envío de la evaluación lleva el `enviadaEn` que el profe vio
  (`zGuardarEvaluacion`); si la entrega cambió, `evaluarEnTransaccion` devuelve un error nuevo
  («El alumno editó la entrega. Recarga para ver la versión nueva.») y no guarda. Toca solo eso en
  `review-form.tsx` (payload + toast) y `[entrega]/page.tsx` no lo toques: si necesitas una prop
  nueva, pásala dentro de `inicial`/`version` existentes o dilo en el informe para el orquestador.
  (Si resulta imposible sin tocar la página, añade **una** prop a `ReviewForm` y su línea en la
  página, nada más: V1 edita esa página.)
- Cola offline: un reenvío en cola no debe pisar una entrega ya evaluada (misma regla del servidor).

Verificación: pruebas puras (`puedeEditar`, armar el reenvío) y PGlite de `enviarEnTransaccion`
(reenviar entregada ok; evaluada → `ya-evaluada`; `faltanRespuestas` sigue igual; no capitán → no) y
de la carrera en `evaluarEnTransaccion`. Informe: D395–D397, filas, PHASE_LOG.

---

## V6 — Notas grupales en Alumnos y lista de entregas por tarea con «Corregir» (pedidos 3, 12)

Rama `feat/notas-por-tarea` · D398–D401 · filas 208–211 · `sonnet` · medium · Docker no · puertos fijos no.

César: «3. Actualmente al ver los alumnos solo podemos ver las notas individuales, pero no podemos
ver las notas que tiene ese alumno grupales. 12. Me gustaría poder ver las notas de cada tarea de x
estudiante o equipo con el fin de poder editar su evaluación y revisar su puntaje.»

Estado verificado:
- Tabla de Alumnos: la columna de nota es «Nota individual» o, con una tarea elegida en el filtro,
  «Nota en la tarea» (`components/sections/alumnos/students-table.tsx:57-60,86,138,204`;
  `FilaAlumno.nota`/`notas` en `lib/alumnos.ts:39-42`, `notaParaFiltro` `:319+`, D252).
- La ficha (diálogo Editar alumno) ya lista «Tareas entregadas» con individuales **y** grupales
  (`lib/alumnos-datos.ts:276-294`, por `integrantes.includes`), cada una con enlace
  `rutaEntrega(id)?ver` = solo lectura (`edit-student-dialog.tsx:415,521-555`). No hay camino a
  corregir la evaluación desde ahí, ni se ve el puntaje sobre 20 ni la base.
- Nota de un integrante en una grupal: `notaDeIntegrante(e, base, cédula)` (`lib/ranking-datos.ts`),
  con «No participó» → NOTA_MIN (D365).
- Tareas del profe: `/profe/tareas/[id]` es el constructor (`app/(profesor)/profe/tareas/[id]/page.tsx`),
  ya lee `entregasDeTarea(id)` (`:64-66`). La tarjeta (`teacher-task-card.tsx:108-126`) tiene el
  botón «Evaluar N» que enlaza a la cola global (`RUTA_EVALUAR`).
- Equipos del profe: `components/sections/equipos-profe/*` (no es tuyo: enlaza desde tu lista, no lo edites).

Enfoque decidido:
- **Pedido 5 (tu parte):** el enlace «Evaluar N» pasa a `/profe/evaluar?tarea=<id>` (forma
  compartida; V1 implementa la lectura).
- **Lista de entregas por tarea** — ruta nueva `/profe/tareas/[id]/entregas` (con `loading.tsx` y
  regla en la topbar si `lib/topbar.ts` la exige: ese archivo es de V1 → si hace falta una regla,
  ponla en el informe y deja que la ruta herede la de `/profe/tareas/[id]` o dilo): título de la
  tarea, selector de sección, y una fila por titular (alumno en individuales, equipo en grupales;
  en grupales, los integrantes desplegados con su nota propia): estado (Sin entregar / Por evaluar /
  Evaluada — ícono + palabra), puntaje sobre 20, base, **nota como `GradePill`** (`gradeColor`, D004;
  `null` = Pendiente, D003), y acciones «Ver» (`?ver`) y «Evaluar»/«Corregir» (`rutaEntrega(id)` sin
  `?ver`). Tabla con el `Table` del proyecto (sin scroll horizontal de página a 320 px: usa el patrón
  de `students-table`/`teacher-task-table`). Enlace a esta lista desde la tarjeta de la tarea
  («Ver notas», ghost sm) y desde el constructor.
- **Ficha del alumno:** «Tareas entregadas» separa Individuales y Grupales (subtítulos), muestra en
  cada una puntaje/20 y nota (pill), y añade «Corregir» junto a «Ver» en las evaluadas («Evaluar» en
  las pendientes).
- **Tabla de Alumnos:** además de «Nota individual», columna «Nota grupal» = la de su grupal evaluada
  más reciente (`notaDeIntegrante`), `null` → Pendiente/—; con una tarea elegida sigue siendo una
  sola columna «Nota en la tarea» (comprueba que funcione también si la tarea elegida es grupal y
  arréglalo si no). Revisa el ancho en < lg con el patrón existente de la tabla.
- Lógica en funciones puras (`lib/tareas-profe-datos.ts` / `lib/alumnos-datos.ts`), con pruebas.
- No implementes devolver ni eliminar entregas (ola 3); deja la columna de acciones lista para
  recibirlas.

Verificación: pruebas puras de las filas (individual, grupal con «No participó», sin entregar,
pendiente, alumno movido de equipo: la nota grupal se queda con el equipo con el que entregó, D221).
Informe: D398–D401, filas, PHASE_LOG.
