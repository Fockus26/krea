# Prompts — orquestación 2026-11-06 (ola 1: W1–W8 · ola 2: W9–W13 + W17)

> Brief compartido: `C:\Users\Cesar\Documents\Work\krea\context\plans\orchestration-2026-11-06.md` (léelo primero).
> Decisiones: léelas **en tu slot** (`context/decisions/`), que está sobre `origin/main`.
> Los prompts de la ola 3 (W14–W16) los escribe la sesión de esa ola.

---

## W1 — `feat/profes-admin`

Worker **W1**. Rama `feat/profes-admin`. Decisiones **D231–D235**. Checklist **137–138**.
Modelo · esfuerzo: **opus · high** (auth, roles, cuentas). Docker: **no** (emuladores con Java sí).

Decisiones que te restringen: D008 (cédula → email interno), D174 (modelo Firestore, uid = cédula),
D175 (escrituras solo en el servidor), D180 (cookie de sesión), D192 (cambiar contraseña),
D158 (perfil del profe), D090 / D191 (perfil y avatar), D132 (nav del profe).

### Lo que pide César
> 1. «Agregar el profesor con cédula 32888687.»
> 2. «Un profesor admin (cédula 30262232) que puede crear, editar y eliminar a los otros profesores.»
> 4. «Los profesores no pueden cambiar los datos de otro profesor (avatar, cédula, nombres); los suyos propios sí.»

Decisión de César: cuentas nuevas con **contraseña temporal generada, mostrada una sola vez**
a quien crea la cuenta; al primer ingreso se **obliga a cambiarla**.

### Dónde está
- `lib/modelo.ts:44` `ROLES`; `:96-110` `zUsuario`; `:375-387` `Claims` y `claimsDe`.
- `lib/dal.ts:18-30` `verificarSesion` / `exigirSesion(rol)`.
- `lib/acciones/sesion.ts:31` `iniciarSesion` (pone claims y cookie); `lib/acciones/perfil.ts:23,66,98`
  (`guardarAvatar`, `guardarApariencia`, `cambiarPassword`).
- `lib/acciones/alumnos.ts:13` `editarAlumno`: patrón de una acción de profe con zod + Admin SDK.
- `app/(profesor)/profe/perfil/page.tsx` y `components/sections/perfil/*`: perfil del profe
  (`profile-data.tsx:9,28`: nombres solo lectura).
- `firebase/firestore.rules:17` `esProfesor()`; `:29` lectura de perfiles.
- `scripts/seed-emulator.ts:53-60` profesor de prueba del emulador; `scripts/qa-roles.ts`.
- Navegación del profe: `lib/nav.ts`, `components/layout/menu-sheet.tsx`, `side-nav.tsx`.

### Enfoque decidido
- Formas compartidas del brief: `usuarios.admin`, `usuarios.debeCambiarPassword`, `lib/cuentas.ts`
  (`crearCuenta`, `eliminarCuenta`). W12 (ola 2) reutiliza `crearCuenta` para alumnos: hazla
  genérica por rol (estudiante necesita `seccion`, `equipoId: null`, `base: 20`; profesor
  `seccion: null`).
- **Pantalla Profesores** (`/profe/profesores`), visible y accesible **solo para el admin**
  (`exigirAdmin()` nuevo en `lib/dal.ts`; un profe no admin que entra → `/profe`). Lista de
  profes; crear (cédula, nombres, apellidos, email opcional), editar (nombres, apellidos, email;
  la cédula no se cambia: es el uid, D174 — dilo en la UI) y eliminar (confirmación; el admin no
  puede eliminarse a sí mismo ni quitarse el admin). Al crear: diálogo que muestra la contraseña
  temporal **una vez**, con botón copiar y el aviso de que no se vuelve a ver. Entrada en el nav
  del profe solo si es admin (sigue D132 para el lugar).
- **Profe no edita a otro profe:** todas las acciones que editan un perfil (`perfil.ts`) usan la
  cédula de la sesión, nunca la del body; las de la pantalla Profesores exigen admin. Repasa que
  ninguna acción de profe acepte la cédula de otro profesor (p. ej. `editarAlumno` debe rechazar
  un destino con `rol: "profesor"`). El profe edita sus propios nombres/apellidos en su Perfil
  (hoy son solo lectura en `profile-data.tsx`: para el profe pasan a editables; para el alumno
  siguen solo lectura, regla de CLAUDE.md).
- **Cambio obligatorio:** si `debeCambiarPassword`, tras ingresar se redirige a una pantalla
  «Crea tu contraseña» (reutiliza el formulario de `new-password-form` / `cambiarPassword`) y
  ninguna otra ruta de su rol carga hasta cambiarla (en `exigirSesion`). Aplica a ambos roles.
- **Admin inicial y profe 32888687:** no los creas en producción. Deja `scripts/admin-profesor.ts`
  (bun, Admin SDK con las credenciales del `.env`, idempotente): `--hacer-admin <cédula>` marca
  `admin: true` y refresca claims; `--crear-profesor <cédula> --nombres … --apellidos …` usa
  `crearCuenta` e imprime la contraseña temporal. Acción manual para César: correr
  `--hacer-admin 30262232` (si 30262232 no existe aún, crearla primero con `--crear-profesor`) y
  luego crear 32888687 desde la pantalla Profesores (o el script). Los nombres no los inventes.
- Reglas: el cliente sigue sin escribir; si una lectura nueva lo requiere (lista de profes), el
  admin lee por servidor.

### Trampas conocidas
- Los claims se leen del token: tras cambiar `admin` o `debeCambiarPassword`, revoca/refresca el
  token o la cookie de sesión (mira cómo lo hace `cambiarCapitanDeEquipo` / `iniciarSesion`).
- Eliminar un profe: sus tareas, ajustes y evaluaciones guardan `autorId`/`evaluadaPor`; se
  quedan (no borres datos de alumnos). Borra Auth + `usuarios` + `privados`.
- `crearCuenta` con cédula que ya existe → error claro «Ya existe una cuenta con esa cédula»,
  sin pisar nada (usa `create`, no `set`).
- Doble envío: botón `disabled` mientras vuela y la acción idempotente.

### Cómo verificar
- Tests puros en `tests/unit/` (generador de contraseña: longitud, alfabeto; validación zod).
- `bun run test:rules` y, si añades pruebas de `crearCuenta`/`eliminarCuenta` contra los emuladores
  (`tests/rules/` o un archivo propio con `firebase emulators:exec`), mejor.
- Repaso de cada Server Action nueva: `exigirSesion("profesor")` + `exigirAdmin()` donde toca.

### Cierre
PR «feat: profesor admin gestiona profesores y cuentas con contraseña temporal». En «Cómo probar»:
flujo admin crea/edita/elimina profe, primer ingreso con temporal, profe no admin no ve la pantalla.
Acciones manuales: el script para 30262232 y 32888687.

---

## W2 — `fix/contraste-y-foco`

Worker **W2**. Rama `fix/contraste-y-foco`. Decisiones **D236–D238**. Checklist: ninguna.
Modelo · esfuerzo: **sonnet · medium**. Docker: **no**.

Decisiones: D001 (acento elegible, 4 × claro/oscuro), D004 (escala de color), D040 (GradePill y
token del número), D102, D034.

### Lo que pide César
> 21. «El color de selección de texto sigue el acento elegido.»
> 22. «El texto de la píldora de nota siempre es oscuro y en algunas notas no se lee: debe ser claro donde haga falta (mantener 4.5:1).»
> 23. «El outline de foco de los inputs no cubre todo el input» (captura: en la contraseña, el anillo rodea solo el campo de texto y deja fuera el botón del ojo).
> 29. «Acento rojo en modo oscuro: hay textos difíciles de leer, por ejemplo el botón "Guardar cambios".»

### Dónde está
- `app/globals.css:69-70, 135-136, 190-191` `--sel-bg`/`--sel-text` fijos (lila); `:1329` `::selection`.
- `app/globals.css:68` `--grade-ink: #111111`; `:526` `--color-grade-ink`; `lib/grades.ts:37` `gradeColor`;
  `components/krea/grade-pill.tsx:72-74` (fondo `gradeColor`, texto `text-grade-ink`).
- `app/globals.css:1334` `:focus-visible { outline… }` **sin capa**; `components/ui/input.tsx:50-90`:
  el contenedor `data-slot="input-group"` y el `<input>` con `outline-none`; `components/ui/control.ts`
  (`controlClasses(state, "within")`: el foco debería pintarse en el contenedor con
  `:focus-within`). Sospecha: la regla global sin `@layer` le gana a la utilidad `outline-none`
  (en capa), y el anillo sale en el `<input>` interno. Confírmalo leyendo el CSS y corrígelo
  para **todos** los controles con esa anatomía (Input con leading/trailing, Textarea, SelectTrigger,
  `cedula-input`, `password-input`, buscador de Alumnos).
- Acento rojo oscuro: `app/globals.css:162-163, 216-217` (`--accent: #ff6b5e`, `--on-accent`
  heredado). Botón «Guardar cambios»: `grep -rn "Guardar cambios" components app`.

### Enfoque decidido
- 21: `--sel-bg`/`--sel-text` derivados del acento por tema (p. ej. una mezcla del acento con
  `--bg` vía `color-mix`, o tokens por acento). El texto seleccionado ≥ 4.5:1 sobre `--sel-bg`
  en los 4 acentos × claro/oscuro. Decisión nueva (reemplaza la del lila fijo si existe).
- 22: tinta de la píldora calculada por color: función pura `gradeInk(n)` en `lib/grades.ts`
  que devuelve el token oscuro o claro según el contraste WCAG contra `gradeColor(n)` (elige el
  que pase 4.5:1; si ambos, el mayor). Tokens `--grade-ink` (oscuro) y `--grade-ink-on-dark`
  (claro). Test que recorra 1–20 en pasos de 0,5 y verifique ≥ 4.5:1 para el número (y ≥ 3:1 si
  algún tamaño es texto grande). Aplica a todos los usos del número sobre `gradeColor`
  (`grep -rn "gradeColor\|grade-ink" components app lib`).
- 23: el foco rodea **el control entero** (contenedor), una sola vez, sin doble anillo en el
  `<input>`; el botón del ojo conserva su propio foco visible cuando se tabula a él.
- 29: mide con un script de contraste todos los pares que usan el acento en rojo oscuro
  (texto sobre `--accent`, `--accent-ink` sobre `--bg`/`--surface`/`--accent-soft`…) y corrige
  los tokens que no lleguen a 4.5:1 (o 3:1 para texto grande/íconos), sin cambiar el tono de marca
  más de lo necesario. Haz el mismo barrido para los otros 3 acentos en ambos temas: arregla todo
  lo que falle (es la misma clase).

### Trampas conocidas
- D001: todo color de acento es variable; no metas hex sueltos en componentes.
- `forced-colors` (#63 lo trabajó): no rompas el foco en alto contraste.
- Deja el script de contraste versionado (`scripts/qa/contraste.mjs` o test en `tests/unit/`).

### Cómo verificar
- Tests de `gradeInk` y de contraste de tokens (lee los valores de `globals.css` o duplícalos en
  una tabla de test con un comentario que lo diga).
- a11y por código: foco visible en todos los controles, 4.5:1.

### Cierre
PR «fix: selección con el acento, nota legible, foco del control completo y contraste del rojo oscuro».
«Decisión tomada / alternativa» para la tinta de la píldora y los tokens que cambies.

---

## W3 — `fix/textos-y-layout`

Worker **W3**. Rama `fix/textos-y-layout`. Decisiones **D239–D241**. Checklist **139**.
Modelo · esfuerzo: **sonnet · low**. Docker: **no**.

Decisiones: D070 (layout de auth), D098 / D100 (panel), D062 / D065 (nav), D160 (estados de sesión).

### Lo que pide César
> 24. «Quitar "¿Eres profe?…" del login.»
> 26. «Panel: las cards "Por evaluar" y "Últimos ajustes" con la misma altura cuando están en fila.»
> 34. «La bottom navigation bar debe quedar al final de la página cuando el contenido es corto» (captura: Evaluar vacío; la barra queda a media pantalla con fondo vacío debajo).
> 35. «Cambiar "Cerrando sesión" por algo del tema escolar, tipo "¡Hasta luego!".»
> 38. «Quitar "Se guarda al tocarlo. Avatares de DiceBear".»

### Dónde está
- `components/sections/auth/login-form.tsx:109` el párrafo «¿Eres profe?…».
- `components/sections/profe-panel/panel-view.tsx` (grid de las cards), `pending-reviews.tsx`,
  `recent-adjustments.tsx`.
- `components/layout/AppShell.tsx:33,44` (`min-h-dvh lg:flex` / columna `flex-1 flex-col`),
  `components/layout/bottom-nav.tsx`. Captura de César: la barra no es fija ni queda al fondo.
- `app/(auth)/salir/page.tsx:5` (title), `components/sections/auth/cerrar-sesion.tsx:34-35`.
- `components/sections/perfil/avatar-picker.tsx:119`.

### Enfoque decidido
- 24: quitarlo (y su `aria-describedby` si lo hay).
- 26: misma altura en fila (`items-stretch` + las cards a `h-full`); apiladas en móvil, altura natural.
- 34: la barra inferior queda pegada al fondo del viewport cuando el contenido es corto (el
  `main` crece con `flex-1`), y sigue al final del contenido cuando es largo. Revisa si el diseño
  la quiere **fija** (HANDOFF: `grep -n "bottom" design/HANDOFF.md`); si el handoff dice fija,
  hazla fija con el `padding-bottom` del contenido; si no, sticky al fondo. Que no tape el último
  elemento ni el toast (D035) ni la `ActionBar`. Ambos roles.
- 35: título «¡Hasta luego!» y un texto corto del tema escolar (p. ej. «Guardando tu mochila…»);
  provisional fila 139. El `Spinner label` también.
- 38: quitar la línea.

### Cómo verificar
- Por clases: 320 px, 200 % de texto, ambos roles, con y sin `ActionBar`.
- `grep` que no quede el texto viejo en `app/secciones`/galerías (actualízalas si lo muestran).

### Cierre
PR «fix: textos del login, salir y avatar; cards del Panel y barra inferior al fondo».

---

## W4 — `feat/tareas-eliminar`

Worker **W4**. Rama `feat/tareas-eliminar`. Decisiones **D242–D245**. Checklist: ninguna.
Modelo · esfuerzo: **opus · medium** (borra datos guardados y recalcula el ranking). Docker: **no**.

Decisiones: D175, D206 (ranking en la transacción), D199 / D200 / D202 (guardar, editar
publicadas, cerrar), D115 / D116 / D117 (lista, constructor, preguntas), D201 (premios por
sección), D007.

### Lo que pide César
> 6. «Las tareas se pueden eliminar; si ya tienen notas, se les quitan a los estudiantes.»
> 30. «Tareas › Editar: falta separación entre el aviso de que ya hay entregas y el formulario.»
> 32. «Tareas: los botones Editar / Ver notas / Seguir editando alineados con la primera fila (la de los chips) y al final, como ahora.»
> 33. «Tareas: "Pregunta X" y el ícono de eliminar con alineación vertical arriba en lugar de centrada.»
> 44 (parte). «Animaciones, por ejemplo cuando se elimina una tarea y el resto se reacomoda.»

### Dónde está
- `lib/acciones/tareas.ts:29,53,74` (`guardarTarea`, `cerrarTarea`, `decidirPremio`): patrón y
  recálculo del ranking (`calcularRanking`, D206).
- `components/sections/tareas-profe/teacher-task-card.tsx:95-115` (botones), `teacher-task-list.tsx`.
- `components/sections/tareas-profe/question-editor.tsx:37-90` (cabecera «Pregunta n» + eliminar).
- `components/sections/tareas-profe/task-builder.tsx:103` (con entregas solo cambian título,
  fecha y premio) y el aviso de entregas (busca el `Alert`).
- `components/krea/use-flip.ts`, `lib/flip.ts`: FLIP ya existente para reacomodar listas.

### Enfoque decidido
- Acción `eliminarTarea(id)` (profe): en una transacción borra la tarea, **todas sus entregas**
  (y con ellas sus notas) y recalcula `ranking/{seccion}` de cada sección de la tarea. Las
  imágenes de respuesta en B2 (`lib/almacen/`): bórralas después de la transacción, sin fallar
  la acción si B2 falla (registra el error; D229).
- UI: «Eliminar» en el menú/acciones de la card (todas las tareas: borrador, abierta, evaluada)
  y en el constructor. Confirmación (`Dialog`) que dice cuántas entregas y notas se pierden
  («Se borrarán 23 notas de 5A y 5C. Los puntos del ranking se recalculan.»). Variante destructiva.
  Foco tras borrar: a la siguiente card (o al título si no queda ninguna). Toast con el resultado.
- 44 (tareas): al borrar, la card sale con opacidad/escala y las demás se reacomodan con el FLIP
  existente; con `prefers-reduced-motion`, sin animación.
- 32: los botones de la card se alinean con la fila de chips (arriba) y a la derecha (al final);
  en móvil siguen debajo si no caben (`flex-wrap`).
- 33: `items-start` en la cabecera de la pregunta; el botón eliminar alineado con la primera línea.
- 30: separación vertical con el token de espacio de la pila del formulario entre el aviso y el form.

### Trampas conocidas
- Una transacción de Firestore tiene límite de 500 escrituras: si una tarea puede tener más
  entregas (69 alumnos × 2 secciones < 500, pero mídelo), usa lotes y recalcula al final.
- Los ajustes de puntos no se tocan (nota ≠ puntos, D007): solo las notas desaparecen.
- `decisionesPremio` vive en la tarea: se va con ella.

### Cómo verificar
- Tests puros del cálculo («cuántas notas se pierden», ranking sin esa tarea) y, si puedes, de la
  acción contra los emuladores.
- a11y: diálogo con foco atrapado y devuelto, botón con nombre «Eliminar <título>».

### Cierre
PR «feat: eliminar tareas (con sus notas) y ajustes de la lista y el constructor».
«Cómo probar»: profe elimina una tarea evaluada y el ranking baja.

---

## W5 — `feat/imagen-pegar-arrastrar`

Worker **W5**. Rama `feat/imagen-pegar-arrastrar`. Decisiones **D246–D247**. Checklist: ninguna.
Modelo · esfuerzo: **sonnet · medium**. Docker: **no**.

Decisiones: D061 (anuncio del progreso de subida), D195 (imágenes de respuesta), D229.

### Lo que pide César
> 28. «Inputs de imagen: pegar con Ctrl+V, arrastrar y soltar, y buscar en el explorador.»

### Dónde está
- `components/krea/image-upload.tsx` (todas las subidas: respuesta de tarea, logo de equipo);
  `lib/image.ts`, `lib/almacen/imagen.ts` (compresión ≤ 2,5 MB).
- Usos: `grep -rn "ImageUpload" components app`.

### Enfoque decidido
- La zona acepta: clic/Enter/Espacio → explorador (ya existe, revisa); arrastrar y soltar (estado
  visual «Suelta la imagen aquí» con borde y texto, no solo color); pegar con Ctrl/Cmd+V cuando
  la zona tiene el foco (y en la página de la tarea mientras haya una sola zona vacía visible:
  conservador, solo con foco si hay varias). Mismas validaciones (tipo, tamaño) para las tres vías,
  con el mismo mensaje de error. Texto de ayuda: «Arrastra, pega o busca una imagen» (provisional).
- Lo que entra (archivo de cualquiera de las 3 vías) pasa por la misma función.
- W11 (ola 2) lo usará para fotos de premios, con **varias** imágenes: deja el componente listo
  para `multiple` opcional sin implementarlo si no lo necesitas (no inventes la UI).

### Cómo verificar
- Lógica pura (extraer el archivo de `DataTransfer`/`ClipboardEvent`, validar) en `lib/` con tests.
- a11y: el estado de arrastre se anuncia; la zona sigue siendo un botón con nombre.

### Cierre
PR «feat: subir imagen pegando, arrastrando o desde el explorador».

---

## W6 — `feat/grupal-integrantes`

Worker **W6**. Rama `feat/grupal-integrantes`. Decisiones **D248–D249**. Checklist **141**.
Modelo · esfuerzo: **sonnet · high** (permisos de lectura por rol). Docker: **no**.

Decisiones: D012 (solo el capitán envía), D075 (género del capitán), D082 (entrega), D196 (envío),
D080 / D193 (detalle de nota), D221 (capitán movido tras una entrega; ver `CURRENT_PHASE` › Blocked).

### Lo que pide César
> 9. «Los demás integrantes del grupo pueden ver las preguntas y las notas de la tarea grupal, pero no responderla ni enviarla (sigue D012: solo el capitán envía).»

### Dónde está
- `app/(estudiante)/tareas/[tarea]/page.tsx:72-73` (estado `lector` + `CaptainNotice`), `:151`.
- `components/sections/tareas/captain-notice.tsx`; `lib/tareas.ts`, `lib/entregas.ts`,
  `lib/datos/estudiante.ts` (qué datos se leen y para quién).
- Notas: `app/(estudiante)/notas/[tarea]/page.tsx`, `components/sections/notas/*`.
- Reglas: `firebase/firestore.rules` (lectura de `entregas` por integrante).

### Enfoque decidido
- El no capitán ve en `/tareas/<id>` las **preguntas** (enunciado, formato, valor) y, si el capitán
  ya guardó o envió, sus respuestas en solo lectura; nunca campos editables ni botón de enviar.
  Mantén el aviso del capitán arriba.
- Evaluada: ve la nota y el desglose por pregunta de la entrega del equipo (la entrega lista a los
  `integrantes`; si el alumno no está en `integrantes` porque entró después, ve lo mismo que hoy).
- Servidor: lecturas por `exigirSesion("estudiante")` y comprobación de pertenencia; reglas solo
  si el cliente lee directo.

### Cómo verificar
- Tests puros del estado de la vista (capitán / integrante / ajeno; abierta / entregada / evaluada).
- `bun run test:rules` si cambias reglas.

### Cierre
PR «feat: los integrantes ven las preguntas y la nota de la tarea grupal».

---

## W7 — `perf/cache-rutas`

Worker **W7**. Rama `perf/cache-rutas`. Decisiones **D250–D251**. Checklist: ninguna.
Modelo · esfuerzo: **opus · medium** (caché con datos en vivo: riesgo de datos viejos). Docker: **no**.

Decisiones: D190 (ranking en vivo con `onSnapshot`), D160 (estados de sesión por ruta), D180.

### Lo que pide César
> 14. «Caché entre rutas: al volver a una ruta sin cambios no debe recargar.»

### Dónde está
- `next.config.ts:5-12` (`cacheComponents: true`, `experimental`).
- Cada ruta tiene `loading.tsx` (esqueletos) y carga datos de sesión dentro de `<Suspense>`.
- Docs: `node_modules/next/dist/docs/` — busca `staleTimes`, «client router cache»,
  `cacheComponents`, `<Activity>` / preservación de estado entre navegaciones en Next 16.

### Enfoque decidido
- Lee las docs de Next 16.4 y elige el mecanismo que la versión recomienda para que volver a una
  ruta ya visitada muestre lo que había sin esqueleto (router cache con `staleTimes.dynamic`, o
  lo que Next 16 traiga con `cacheComponents`). Documenta la elección en una decisión.
- **Que no se vean datos viejos tras un cambio propio:** cada Server Action que escribe ya debe
  invalidar (`revalidatePath`/`refresh`/`updateTag` según la versión): repásalas todas
  (`lib/acciones/*.ts`) y añade la invalidación donde falte. Los datos en vivo (`onSnapshot`)
  siguen actualizando solos.
- Tiempo de caché conservador (minutos, no horas).

### Trampas conocidas
- Una sesión cerrada no puede dejar páginas de otro rol en caché (`/salir` debe limpiar el router).

### Cómo verificar
- Por código y docs (sin servidor). Lista en el PR qué acciones invalidan qué rutas.

### Cierre
PR «perf: volver a una ruta ya vista no la recarga».

---

## W8 — `feat/alumnos-filtros`

Worker **W8**. Rama `feat/alumnos-filtros`. Decisiones **D252–D254**. Checklist **140**.
Modelo · esfuerzo: **sonnet · medium**. Docker: **no**.

Decisiones: D100 (métricas del Panel con enlace), D106 / D107 / D109 (filtros, tabla, vista de
Alumnos), D115 («Ver notas» lleva a Alumnos), D170 (búsqueda vacía), D003.

### Lo que pide César
> 12. «Panel › Raspados y Panel › Evaluados llevan a Alumnos sin filtrar: deben llegar filtrados.»
> 13. «Tareas › Ver notas lleva a la lista general de alumnos: debe mostrar la nota de cada alumno en esa tarea.»

### Dónde está
- `components/sections/profe-panel/panel-metrics.tsx:50,62,78` (enlaces), `panel-view.tsx:23,65-68`
  (la tarea que miden Evaluados/Raspados).
- `lib/tareas-profe.ts:19` `RUTA_VER_NOTAS = "/profe/alumnos"`; `teacher-task-card.tsx:109-111`.
- `app/(profesor)/profe/alumnos/page.tsx:24`; `components/sections/alumnos/student-filters.tsx`,
  `students-directory.tsx`, `students-table.tsx`; `lib/alumnos.ts`, `lib/alumnos-datos.ts`.

### Enfoque decidido
- La forma compartida «URL de Alumnos» del brief: `seccion`, `estado` (`evaluados` | `raspados` |
  `pendientes`), `tarea`, `alumno`. `rutaAlumnos(filtros)` puro en `lib/alumnos.ts` con tests.
  Los filtros de la pantalla se inicializan desde la URL y la URL se actualiza al cambiarlos
  (`router.replace`, sin recargar). Con `cacheComponents`, `searchParams` dentro de `<Suspense>`.
- Con `tarea`: la tabla muestra una columna/píldora con la nota de cada alumno **en esa tarea**
  (`GradePill`, `null` = Pendiente, D003), un chip con el título de la tarea y «Quitar filtro».
  `estado` filtra sobre esa tarea (raspado = nota < 10).
- Panel: «Evaluados · <tarea>» → `?tarea=<id>&estado=evaluados`; «Raspados» → `?tarea=<id>&estado=raspados`;
  respeta la sección elegida en el Panel (D099). «Ver notas» → `?tarea=<id>`.
- `alumno=<cédula>`: abre la ficha (el diálogo de editar de `edit-student-dialog.tsx` o lo que la
  vista tenga como detalle) de ese alumno y lo hace visible en la lista. W9/W10 enlazarán aquí.

### Cómo verificar
- Tests de `rutaAlumnos` y del parseo de la URL (valores inválidos → sin filtro, nunca error).
- a11y: el resultado del filtro se anuncia (D099/D170), foco correcto al abrir la ficha.

### Cierre
PR «feat: Alumnos filtrable por URL; el Panel y Ver notas llegan filtrados».

---

# Ola 2 (W9–W13 + W17)

> main de partida: `67783e4` (ola 1 mergeada, #78–#85). Decisiones visuales de César (2026-11-06, ola 2):
> zona de riesgo = **cinta de precaución** con duelo «VS» en empates; top 3 = **podio que brilla + confeti
> al entrar**; Puntos = **una columna**; píldora (22) = **oscurecer los extremos** para que ahí el número sea blanco.

---

## W9 — `feat/ranking-celebracion`

Worker **W9**. Rama `feat/ranking-celebracion`. Decisiones **D255–D259**. Checklist **142–144**.
Modelo · esfuerzo: **sonnet · medium**. Docker: **no**.

Decisiones que te restringen: D011 (ranking en vivo y animaciones), D051 (lista con separador de
riesgo), D052 (`rankCompetition`, el podio no recalcula), D128 (topbar móvil y chip «En vivo»),
D190 (ranking en vivo), D252–D254 (URL de Alumnos y ficha por URL), D001 (acento variable).

### Lo que pide César
> 10. «Desde el Ranking, al tocar un alumno se ve su perfil.»
> 15. «El texto "Menor de 10 suma 0" centrado con el chip.»
> 16. «La zona de riesgo animada y divertida.»
> 17. «"Zona de riesgo" sin "· 5 últimos"; VS en los empates.»
> 18. «En Equipos, en riesgo solo el último.»
> 19. «Un top 3 de celebración.»
> 20. «Quitar "En vivo".»

Decisiones de César: clic en un alumno → el **profe** va a `rutaAlumnos({ alumno: <cédula>, seccion })`
(`lib/alumnos.ts:238`, abre la ficha, D254); el **estudiante** ve una **tarjeta de solo lectura** del
compañero (avatar, nombre, equipo, puesto, puntos; **nunca notas**). Visual elegido: **cinta de
precaución** (rayas diagonales de peligro que se deslizan despacio + ícono de alerta que tiembla; los
empates dentro de la zona salen como duelo, avatares enfrentados con un «VS» que late) y **podio que
brilla + confeti al entrar** (destello que recorre las medallas, corona que se balancea en el 1.º,
rebote corto de los avatares al cargar, y una lluvia corta de confeti en colores del acento sobre el
podio **una vez por sesión** — `sessionStorage` con try/catch).

### Dónde está
- `lib/ranking.ts:5-6` `ZONA_RIESGO = 5`; `:37-61` cálculo de `enRiesgo` (borde con empates).
- `lib/rank-row.ts:6` `RIESGO_SEPARADOR = "Zona de riesgo · 5 últimos"`; `:16-19` tipo de fila; `:84-89` `splitRiesgo`; `:96-106` anuncios (podio / riesgo).
- `components/krea/rank-list.tsx` (separador y dos `<ol>`), `components/krea/rank-row.tsx` (fila), el podio: `grep -rn "function Podium" components`.
- `components/sections/ranking/ranking-board.tsx:52-73` (podio + lista), `ranking-en-vivo.tsx`, `ranking-header.tsx:13-45` (chip «En vivo» ≥ 1024), `components/layout/top-bar.tsx:18,46` (`enVivo` en móvil) y `app/(estudiante)/ranking/_ranking.tsx:18`, `app/(profesor)/profe/ranking/_ranking.tsx:26` (quién pasa `enVivo`).
- `components/sections/ranking/ranking-rules.tsx:16,35` + `lib/ranking-vista.ts:207` («Una nota menor de 10 suma 0.» junto a su chip de ejemplo).
- `app/globals.css:310` `--d-live`, `:1222` onda del punto (lo que sobre al quitar «En vivo»).
- Vista Equipos: `lib/ranking-vista.ts` (`Vista`) y donde se arma `enRiesgo` para equipos (`grep -rn "enRiesgo" lib components`).
- Galería: `app/componentes/_familias/ranking.tsx`, `ranking-datos.tsx` (actualiza los ejemplos).

### Enfoque decidido
- **18:** el tamaño de la zona depende de la vista: estudiantes 5, equipos **1** (el último puesto, con
  sus empatados). Parámetro en la función pura de `lib/ranking.ts`, no un `if` en el componente. Tests.
- **17:** el separador dice solo «Zona de riesgo» (las dos vistas). **VS:** dentro de la zona, las filas
  consecutivas con el mismo puesto se pintan como duelo: cada fila sigue siendo un `<li>` con su nombre
  accesible (que ya dice «Empate»), y entre ellas un conector «VS» decorativo (`aria-hidden`). Fuera de
  la zona los empates siguen como hoy.
- **16:** cinta de rayas en el separador: una capa con `repeating-linear-gradient` de tokens (`--error` /
  `--warning` o los que haya; sin hex) **movida con `transform: translateX`** en un pseudo-elemento con
  `overflow: hidden` — nunca animes `background-position` (CLAUDE.md: solo `transform`/`opacity`). Ícono
  de alerta con un temblor corto (`rotate`). `prefers-reduced-motion: reduce` → todo quieto (rayas
  fijas, «VS» fijo). Duraciones con tokens `--d-*` existentes o nuevos en `globals.css` registrados en
  una decisión.
- **19:** sobre el `Podium` existente: destello (`opacity`/`translate` de un brillo dentro de la medalla),
  corona en el 1.º (ícono `Crown` de lucide, balanceo `rotate`), rebote de avatares al montar, y confeti:
  componente cliente propio (sin librería nueva) de ~30 piezas con `transform`/`opacity`, colores
  `--accent` y derivados, ~2 s, `pointer-events: none`, `aria-hidden`, una vez por sesión y por vista;
  con reduced motion no se monta. Sin saltos de layout (el confeti es `absolute`/`fixed`).
- **20:** quitar el chip «En vivo» de `ranking-header` y de la topbar móvil (y la prop `enVivo` si queda
  sin uso; el punto/onda en CSS si queda huérfano). El ranking **sigue** en vivo (D190): solo se quita el
  rótulo. Repasa el anunciador (`rank-announcer.tsx`) por si citaba «en vivo».
- **15:** el texto de la regla y su chip de ejemplo alineados al centro vertical (`items-center`) en
  `ranking-rules.tsx` y en `ranking-how-to.tsx` si tiene la misma anatomía (regla 16).
- **10:** filas de **estudiantes** (lista y podio) se vuelven interactivas: profe → `<Link>` a
  `rutaAlumnos({ alumno, seccion })`; estudiante → botón que abre un `Dialog` (shadcn del proyecto) con
  la tarjeta de solo lectura: avatar, nombre, equipo, puesto, puntos. Los datos salen de lo que ya trae
  el ranking (si falta el nombre del equipo, de los equipos que la página ya lee); **ninguna lectura de
  notas** nueva y nada de reglas nuevas. La fila propia del alumno también abre la tarjeta. Vista
  Equipos: sin cambio. Foco visible en la fila, `Enter`/`Space`, el diálogo devuelve el foco. Sin
  interactivos anidados, y las actualizaciones en vivo no cierran el diálogo abierto.

### Trampas conocidas
- El podio y la lista se re-renderizan con `onSnapshot`: el confeti y el rebote van **al montar**, no en
  cada actualización (una `ref`/`sessionStorage`), y la tarjeta abierta se mantiene si la fila se mueve.
- 320 px: la cinta y el duelo VS no causan scroll horizontal (`overflow-hidden`, `min-w-0`).
- No dependas del color: la zona tiene el texto «Zona de riesgo»; el VS es texto.
- 4 acentos × claro/oscuro: el confeti usa el acento; la cinta usa tokens de estado con contraste ≥ 3:1
  contra el fondo como elemento gráfico.

### Cómo verificar
- Tests puros: zona por vista (5 / 1 con empates en el borde), agrupado de empates para el VS, texto del
  separador, «una vez por sesión» si lo sacas a una función pura.
- a11y por código: rol y nombre de las filas interactivas, diálogo con título, reduced motion.

### Cierre
PR «feat: ranking con zona de riesgo animada, duelo VS, podio que celebra y perfil del alumno».
Copy nuevo (títulos de la tarjeta, aria) marcado `PROVISIONAL (filas 142–144)`.

---

## W10 — `feat/puntos-formulario`

Worker **W10**. Rama `feat/puntos-formulario`. Decisiones **D260–D262**. Checklist **145**.
Modelo · esfuerzo: **sonnet · medium**. Docker: **no**.

Decisiones: D007 (nota ≠ puntos, todo ajuste lleva motivo), D252–D254 (URL de Alumnos), las de Puntos
(`grep -rhi "^# D.*puntos\|^# D.*ajuste\|^# D.*historial" context/decisions/`).

### Lo que pide César
> 11. «En el Historial de Puntos, al tocar el alumno se va a su perfil; quitar "Ajuste del Excel".»
> 27. «En Puntos, el Detalle es un textarea que crece con el texto, y arreglar la disposición.»

Visual elegido por César (27): **una columna** — Motivo → Puntos → Detalle a todo el ancho, uno
debajo del otro; luego vista previa y «Aplicar ajuste».

### Dónde está
- `components/sections/puntos/adjustment-form.tsx:295-403`: hoy Puntos y Detalle comparten una fila
  `flex-wrap` (`:295`); el `Textarea` `rows={2} compact` (`:395-401`).
- `components/ui/textarea.tsx` (¿ya soporta crecer? `field-sizing: content` o autoajuste).
- `components/sections/puntos/adjustment-history.tsx:211` nombre del destino en la fila; `lib/puntos.ts`
  (`FilaHistorial`, `filtrarHistorial`, `motivoTexto:323`, `MOTIVOS_FILTRO:479`).
- Ajustes del Excel: `lib/seed-firestore.ts:227-233` (`motivoId: "importado"`, motivo «Ajuste del
  Excel»); dónde se arman las filas del historial: `grep -rn "FilaHistorial" lib`.
- `rutaAlumnos` en `lib/alumnos.ts:238`.

### Enfoque decidido
- **27:** una columna en todos los anchos (`flex-col gap-6`, como el resto del form). El Textarea del
  Detalle crece con el contenido: `field-sizing: content` con `min-height` de 2 líneas y un `max-height`
  con scroll (tokens); si el navegador no lo soporta, fallback por JS mínimo en el componente
  `Textarea` (prop `autoGrow`), reutilizable. Repasa los otros textarea (regla 16): si alguno es un
  campo de texto libre parecido, dilo en el informe; no los cambies salvo el de Puntos.
- **11a:** el nombre del destino en cada fila del Historial es un enlace a
  `rutaAlumnos({ alumno: <cédula>, seccion })` cuando el destino es un alumno; si es un equipo, a
  `/profe/equipos/<seccion>` si existe esa ruta, si no, sin enlace. El menú de la fila no cambia.
- **11b:** las filas con `motivoId: "importado"` («Ajuste del Excel») **no se muestran** en el Historial
  ni cuentan en sus filtros; **siguen contando** en los puntos (no se borra nada). Alternativa en el PR:
  borrarlas (cambiaría puntos — no lo hagas).

### Trampas conocidas
- No toques `lib/firebase/ajustes.ts` (anulación) más que para leer.
- El enlace dentro de una fila con menú: dos destinos de foco distintos, sin anidar interactivos.

### Cómo verificar
- Tests puros del filtro (importado fuera, el resto igual) y del destino del enlace.
- a11y: el textarea a 200 % y 320 px, label asociado, error anunciado como antes.

### Cierre
PR «feat: Puntos en una columna con Detalle que crece y el Historial lleva al alumno».

---

## W11 — `feat/premios`

Worker **W11**. Rama `feat/premios`. Decisiones **D263–D266**. Checklist **146–147**.
Modelo · esfuerzo: **opus · medium** (cambia la forma guardada de la tarea y sube archivos). Docker: **no**.

Decisiones: D012, D086, D123, D124 (empates de premio), D201 (premio por sección), D174 (modelo),
D175 (escrituras en el servidor), D194 (imágenes en B2), D212 (logos firmados), D246–D247 (pegar /
arrastrar imagen), D242–D245 (constructor tras W4).

### Lo que pide César
> 7. «Poder crear premios; que también haya premio en tareas individuales.»
> 8. «Fotos del premio.»

Decisión de César: premio en tarea individual **opcional**; lo gana **la mejor nota de cada sección**;
empate → el profe da a uno o comparte (igual que la grupal).

### Dónde está
- `lib/modelo.ts:169-213`: `zDecisionPremio` (`dar` con `equipoId` / `compartir`), `zDecisionesPremio`,
  `premioSoloGrupal` (hoy prohíbe premio en individual), `zTarea.premio`; `:245-251` la otra forma
  que usa `premioSoloGrupal`.
- `lib/premios.ts` (tarjetas, `estadoPremio:64`, `resolverEmpate:113`, textos); `lib/equipo.ts:26`
  `ganadorPremio`; `lib/tareas-profe-datos.ts:478` `tarjetasPremios`.
- `app/(profesor)/profe/premios/page.tsx`, `components/sections/premios/prizes-board.tsx`,
  `prize-card-teacher.tsx`; `lib/acciones/tareas.ts` (`decidirPremio`).
- Constructor: `components/sections/tareas-profe/task-builder.tsx:601-604` (campo premio).
- Estudiante: `app/(estudiante)/equipo/page.tsx`, `app/(estudiante)/tareas/[tarea]/page.tsx`,
  `lib/vistas-estudiante.ts`, `lib/datos/estudiante.ts` (dónde ve el premio).
- Subida: patrón del logo de equipo — `lib/acciones/equipos.ts:79` `subirLogoEquipo`,
  `lib/almacen/imagen.ts:36-71` (`validarLogoSubido`, `claveLogo`), `lib/almacen/s3.ts` (URL firmada),
  `components/krea/image-upload.tsx` + `lib/image-entrada.ts` (pegar / arrastrar / explorar, W5).

### Formas (fíjalas así)
- `zTarea.premio` sigue `texto(200).nullable()`; se quita la restricción `premioSoloGrupal` (individual
  puede llevar premio). Nuevo `premioFoto: z.string().nullable().optional()` = clave B2 (ausente/null =
  sin foto), validada con `esClaveValida`.
- `zDecisionPremio` gana la variante `{ tipo: "darAlumno", alumnoId: zCedula }` (la de equipo no
  cambia: los datos guardados siguen válidos). Todos los `switch` sobre `tipo` la cubren.

### Enfoque decidido
- **Individual:** ganador = mejor nota de la sección entre los alumnos evaluados (función pura junto a
  `ganadorPremio`, mismos estados: por definir / ganado / empate / compartido). En Premios la tarjeta
  muestra al alumno ganador; el empate se decide con `decidirPremio` extendido (`darAlumno`).
- **Crear premios:** en Premios, botón «Crear premio» → diálogo: elegir una tarea (grupal o individual,
  sin premio, no cerrada) + texto del premio + foto opcional; guarda con una Server Action nueva
  (`exigirSesion("profesor")`, zod, `refresh()`). En el constructor el campo premio aparece también en
  individuales. Editar/quitar el premio desde la tarjeta (menú existente) si cabe sin rediseñar; si no,
  «Editar» lleva al constructor como hoy.
- **Foto:** subida con `image-upload` (pegar/arrastrar/explorar), validación como el logo (tipo y peso;
  `validarLogoSubido` o una variante `validarFotoPremio`), clave `premios/<tareaId>/<uuid>.<ext>`;
  se muestra **firmada** (URL de `s3.ts`, como los logos, D212) en la tarjeta del profe y donde el
  estudiante ve el premio; `alt` = el texto del premio. Reemplazar la foto borra la vieja (best effort).
- Sin B2 configurado (`almacenB2()` null): la foto no se ofrece y se dice por qué; el resto funciona.

### Trampas conocidas
- `firebase/firestore.rules`: si el estudiante lee `premioFoto` de la tarea por cliente, no hace falta
  regla nueva (es un campo más); la URL firmada la da el servidor. Si tocas reglas, `bun run test:rules`.
- Tareas importadas del Excel y cerradas: siguen sin tarjeta (`tarjetasPremios:478`).
- Doble envío del diálogo: `disabled` mientras vuela; la acción no duplica (es un `update` del doc).
- W12 (en paralelo) borra alumnos: si un `darAlumno` apunta a un alumno que ya no existe, la tarjeta
  vuelve a «por definir» (no rompe). Pruébalo puro.

### Cómo verificar
- Tests puros: ganador individual (único, empate, sin evaluadas), `zTarea` con premio individual y
  `premioFoto`, `zDecisionPremio` con `darAlumno`, datos viejos aún válidos.
- Validación de la foto y la clave. a11y del diálogo y la imagen.

### Cierre
PR «feat: premios en tareas individuales, crear premios y foto del premio». Acción manual si la hay
(CORS del bucket, permisos de la clave B2 para `premios/`).

---

## W12 — `feat/alumnos-crud`

Worker **W12**. Rama `feat/alumnos-crud`. Decisiones **D267–D271**. Checklist **148–149**.
Modelo · esfuerzo: **opus · high** (cuentas, borrado con datos, ranking recalculado en transacción).
Docker: **no** (emuladores con Java sí).

Decisiones: D008, D174, D175, D180, D209 (editar alumno), D210 (mover de equipo revoca sesión), D012
(capitán), D231–D235 (cuentas y contraseña temporal, W1), D252–D254 (URL de Alumnos).

### Lo que pide César
> 3. «Que los profesores puedan crear, editar y eliminar alumnos, grupos (equipos) y capitanes.»

Decisiones de César: cuenta nueva con **contraseña temporal mostrada una sola vez** (como W1);
**eliminar alumno con datos: se borra todo** (cuenta, notas individuales, ajustes), **ranking
recalculado**; en grupales entregadas el equipo **conserva** su nota. La confirmación dice **cuántas
notas** se pierden.

### Dónde está
- `lib/cuentas.ts:25` `crearCuenta(entrada)` y `:35` `eliminarCuenta(cedula)` (W1; genérica por rol:
  estudiante con `seccion`, `equipoId: null`, `base: 20`). Patrón de UI: la pantalla Profesores de W1
  (`app/(profesor)/profe/profesores/`, `components/sections/profesores/`, `lib/acciones/profesores.ts:22-66`),
  diálogo de la contraseña temporal incluido: **reutilízalo** (sácalo a un componente compartido si hoy
  vive dentro de profesores).
- Alumnos: `app/(profesor)/profe/alumnos/page.tsx`, `components/sections/alumnos/students-directory.tsx`,
  `students-table.tsx`, `edit-student-dialog.tsx` (W14 en la ola 3 va sobre este diálogo: déjalo limpio),
  `lib/acciones/alumnos.ts:13` `editarAlumno`.
- Equipos: `app/(profesor)/profe/equipos/[seccion]`, `components/sections/equipos-profe/*`
  (`teams-board.tsx:188` `TeamsHeader`, `member-menu.tsx`, `unassigned-card.tsx`), `lib/acciones/equipos.ts:33,58`
  (`moverAlumnoDeEquipo`, `cambiarCapitanDeEquipo`), `lib/equipos-datos.ts:165` (cambios + ranking en la
  misma transacción), `lib/firebase/ranking.ts:91` `escribirRankingEnTx`.
- `rutaAlumnos` `lib/alumnos.ts:238` (tras crear, abrir la ficha con `?alumno=`).

### Enfoque decidido
- **Alumnos:** «Agregar alumno» en Alumnos (cédula, nombres, apellidos, sección, email opcional,
  equipo opcional) → `crearCuenta` + diálogo de contraseña temporal; luego la ficha abierta. Editar ya
  existe (D209). **Eliminar** desde la ficha: confirmación que dice «Se borrarán N notas individuales y
  M ajustes» (contados en el servidor antes de confirmar, acción de solo lectura) → acción que en
  **una transacción** borra entregas/notas individuales del alumno y sus ajustes, lo saca de su equipo
  (si era capitán, el equipo queda sin capitán y la UI lo marca), y reescribe el ranking de la sección
  (`escribirRankingEnTx`); después `eliminarCuenta` (Auth + `usuarios` + `privados`). Las entregas
  grupales no se tocan. Idempotente: un segundo intento sobre un alumno ya borrado responde «ya no existe».
- **Equipos:** crear (nombre, tema si el modelo lo pide; sección de la página), renombrar y eliminar
  (solo si está vacío **y** sin entregas grupales; si no, el botón dice por qué). Capitanes: ya existe
  `cambiarCapitanDeEquipo`; añade «quitar capitán» si el modelo lo admite (D012: el capitán es quien
  envía; sin capitán nadie envía — dilo en la UI).
- Todas las acciones: `exigirSesion("profesor")`, zod con `.trim().min(1)`, nunca un uid del body para
  la sesión, `refresh()` al terminar, `disabled` mientras vuela, rechazan destinos con `rol: "profesor"`.

### Trampas conocidas
- Firestore: una transacción ≤ 500 escrituras; un alumno tiene pocas, pero cuenta y falla claro si pasa.
  Lee todo antes de escribir (reglas de transacción).
- Mover/quitar de equipo revoca la sesión del alumno (D210): mismo trato al borrarlo.
- W11 (en paralelo) añade premios individuales con `darAlumno`: no toques `zDecisionPremio`; un premio
  ganado por el alumno borrado no se reescribe (W11 lo cubre).
- La cédula es el uid (D174): no se edita; crear con una que existe → «Ya existe una cuenta con esa cédula».

### Cómo verificar
- Tests puros (conteo de lo que se borra, validaciones) y **emuladores**: crear alumno, borrarlo con
  notas y ajustes, ranking recalculado, grupal intacta (`tests/rules/` o archivo propio con
  `firebase emulators:exec`). `bun run test:rules` si tocas reglas.

### Cierre
PR «feat: profes crean, editan y eliminan alumnos, equipos y capitanes». «Cómo probar»: profe crea
alumno (temporal), primer ingreso, eliminar con notas (conteo), crear/eliminar equipo, capitán.

---

## W13 — `feat/mensaje-diario`

Worker **W13**. Rama `feat/mensaje-diario`. Decisiones **D272–D274**. Checklist **150–153**.
Modelo · esfuerzo: **sonnet · medium**. Docker: **no**.

Decisiones: D133 (saludo por la hora del profe), D098 (el prerender no lee el reloj), D004 (escala de
color), D003 (Pendiente), las de Inicio (`grep -rhi "^# D.*inicio\|^# D.*saludo" context/decisions/`).

### Lo que pide César
> 25. «En la bienvenida, "profe César".»
> 36. «En la leyenda de colores, que se vea dónde está el alumno.»
> 37. «Un mensaje diario según la nota.»

### Dónde está
- `lib/panel.ts:22` `NOMBRE_SALUDO_PROFE = "profe"`, `:38-43` `saludoTexto(hora, nombre)`;
  `components/sections/profe-panel/panel-con-hora.tsx:25`, `panel-header.tsx`; `app/(profesor)/profe/page.tsx`.
- Inicio del estudiante: `lib/vistas-estudiante.ts:474-480` (`saludo`: eyebrow, título, línea),
  `lib/inicio.ts:10` `lineaPendientes`, `components/sections/inicio/*`, `lib/demo/inicio.ts:99`.
- Leyenda: `components/sections/notas/grade-legend.tsx` (barra con `escalaDegradado()`, marcas 1/10/20,
  `MARCA_10_PCT` en `lib/notas.ts`); la usan `app/(estudiante)/notas/page.tsx:20` y `app/secciones/notas/page.tsx:24`.

### Enfoque decidido
- **25:** el saludo del Panel usa el nombre del profe con sesión: «Buenos días, profe César» = `profe` +
  primer nombre de `usuarios/{cedula}.nombres`. Sin nombre → «profe» como hoy. Función pura en `lib/panel.ts`.
- **36:** en la leyenda, un marcador sobre la barra en la posición del **promedio** del alumno (la misma
  cuenta que ya muestre Mis notas; sin notas evaluadas → sin marcador y nada roto), con texto visible
  «Tú: 15,5» (coma decimal) y el valor en el `aria-label` de la barra. Posición con la misma fórmula que
  `MARCA_10_PCT` (función pura `posicionEnEscala(n)`). La leyenda recibe el dato por props; la galería
  `/secciones` pasa uno de ejemplo.
- **37:** en Inicio del estudiante, una línea/card «Mensaje del día» elegida por la banda de su promedio
  (raspado < 10, 10–13,5, 14–16,5, 17–20, sin notas) y por el **día** (índice = día del año módulo la
  cantidad de mensajes de la banda), así cambia cada día y no cada recarga. El día sale del servidor en
  la zona `America/Caracas` en tiempo de petición (no en prerender: D098 — mira cómo `panel-con-hora`
  evita leer el reloj en el prerender y haz lo equivalente). Mensajes en `lib/mensaje-diario.ts`, cálidos y
  justos (tono del proyecto), 3–5 por banda, **todos `PROVISIONAL (filas 150–153)`**; nunca culpan al
  alumno raspado. Sin animaciones nuevas (W15 las hace).

### Trampas conocidas
- `cacheComponents: true`: leer la fecha o la sesión dentro de una página cacheada rompe el prerender;
  lee `node_modules/next/dist/docs/` sobre `connection()` / Suspense antes.
- El promedio ya existe en algún lado (`grep -rn "promedio" lib`): no lo dupliques.
- W17 (en paralelo) cambia `gradeColor` en `lib/grades.ts`: no toques esa función; la leyenda la sigue usando.

### Cómo verificar
- Tests puros: `saludoTexto` con nombre, `posicionEnEscala` (1 → 0 %, 10 → `MARCA_10_PCT`, 20 → 100 %),
  banda y mensaje del día (determinista por fecha).
- a11y: el marcador no depende del color, texto a 200 %.

### Cierre
PR «feat: saludo con el nombre del profe, tu lugar en la leyenda y mensaje del día».

---

## W17 — `fix/pildora-extremos`

Worker **W17** (ronda 2 del pedido 22, que W2 dejó a decisión de César). Rama `fix/pildora-extremos`.
Decisiones **D286–D287**. Checklist: ninguna. Modelo · esfuerzo: **sonnet · medium**. Docker: **no**.

Decisiones: D004 (escala de color), D040, **D236** (tinta por contraste: `gradeInk`), D238 (test de contraste).

### Lo que pide César
> 22. «El texto de la píldora de nota siempre es oscuro y en algunas notas no se lee: debe ser claro donde haga falta (mantener 4.5:1).»

Decisión de César (ola 2): **oscurecer los extremos** de la escala — el rojo de las notas bajas y el
verde de las altas — hasta que **ahí** el número blanco pase 4,5:1; el resto de la escala igual; la
tinta la sigue eligiendo `gradeInk`.

### Dónde está
- `lib/grades.ts:37-45` `gradeColor` (HSL continuo: 1–10 de 0° a 52°, 10–20 de 52° a 140°);
  `:47-80` `contraste`, `GRADE_INK_*`, `gradeInk`. Medido hoy: oscura 4,77:1 en la nota 1 (#FF0A0A) y
  4,76:1 en la 20 (#1A9342); blanco 3,96–3,97:1 en esas dos y peor en el resto.
- `lib/notas.ts` `escalaDegradado()` (la leyenda usa `gradeColor`), `app/globals.css:68-69`, tests de
  `gradeInk` y `tests/unit/contraste-tokens.test.ts`; `design/HANDOFF.md` §1.3 (tabla de la escala:
  anota el cambio en la decisión, no edites el handoff).

### Enfoque decidido
- Bajar la luminosidad solo en los tramos extremos (p. ej. notas ≤ ~3 y ≥ ~17) con una curva continua
  (sin escalones visibles), lo justo para que el blanco llegue a ≥ 4,5:1 en esos tramos; en el tramo
  medio la oscura sigue ≥ 4,5:1. Ninguna nota queda por debajo de 4,5:1 con la tinta que elige
  `gradeInk`. Elige los límites de tramo midiendo; dilos en la decisión.
- Test que recorre 1–20 en pasos de 0,5: contraste ≥ 4,5:1 con la tinta elegida, y que en los extremos
  la elegida sea la clara. La leyenda y toda píldora salen solas de `gradeColor`.
- Repasa usos de `gradeColor` fuera de la píldora (`grep -rn "gradeColor" components app lib`): si algún
  texto oscuro fijo va sobre ese color (barra, chips), usa `gradeInk` también (regla 16).
- W13 (en paralelo) toca `grade-legend.tsx` y `lib/notas.ts`: tú no los tocas.

### Cierre
PR «fix: extremos de la escala de notas más oscuros para que el número blanco se lea».

---

# Ola 3 (2026-11-07) — main @ 9a630c3

**Avisos para todos los workers de la ola 3** (además del brief):
- El `.qa/pr-body.md` del slot puede traer el cuerpo de un PR anterior: escribe `.qa/pr-body-<unidad>.md`
  con **Write** y ábrelo con Read antes de `gh pr create --body-file` para comprobar que es el tuyo.
- `bunx biome check --write` solo al cierre de cada etapa (nunca `npx biome`); en medio, `bunx biome check <archivos>`.
- La carpeta principal está en `main` con un `.gitignore` sin guardar que es de César: **no la toques**
  salvo `context/PHASE_LOG/<tu-rama>.md` (regla 3).
- Sin dev server, sin navegador, sin QA, sin build local (verificas con tests, typecheck, lint y a11y por código).

---

## W14 — `feat/presencia-alumno`

Worker **W14**. Rama `feat/presencia-alumno`. Decisiones **D275–D277**. Checklist **154**.
Modelo · esfuerzo: **opus · medium** (concurrencia entre profes, reglas de Firestore). Docker: **no** (emuladores con Java sí).

Decisiones: D174, D175 (escrituras solo con Admin), D190 (`onSnapshot` en el navegador), D209 (editar alumno),
D267–D271 (W12: crear/eliminar alumno, diálogos de Alumnos).

### Lo que pide César
> 5. «Presencia en vivo al editar un alumno» — si un profe está editando a un alumno, los demás profes lo ven
> (y no se pisan los cambios). Pendiente relacionado en `CURRENT_PHASE.md` › Next: «Editar alumno "el último gana"».

### Dónde está
- Diálogo: `components/sections/alumnos/edit-student-dialog.tsx` (W12 lo dejó limpio; `add-student-dialog.tsx`
  al lado), directorio `students-directory.tsx`, `students-table.tsx`.
- Acción: `lib/acciones/alumnos.ts:41` `editarAlumno` → `lib/firebase/alumnos.ts:16` `editarAlumnoEnTransaccion`.
- Lecturas en vivo con el SDK del navegador: `components/sections/ranking/ranking-en-vivo.tsx:29-140` (patrón de
  `onSnapshot` + `tokenEnVivo` cuando el navegador no tiene la sesión de Firebase), `lib/firebase/cliente.ts`.
- Reglas: `firebase/firestore.rules` (hoy **ninguna** escritura desde el cliente, `:1-10`); tests en `tests/rules/`.

### Enfoque decidido
- **Presencia** en `presencia/{cedulaAlumno}/editores/{cedulaProfe}` = `{ nombre, desde, latido }` (timestamps del
  servidor). La escribe el **navegador** del profe: es efímera, no es dato de notas, y una Server Action cada
  20 s llamaría `refresh()` (regla 10) y vaciaría la caché del router. Es la única excepción a D175: escríbela
  como decisión nueva («Reemplaza en parte a D175: solo `presencia/`»). Reglas: leer `esProfe()`; crear/actualizar/
  borrar solo si `esProfe() && request.auth.uid == cedulaProfe`, con claves exactas (`hasOnly`) y tipos validados;
  nada más del cliente.
- Al abrir el diálogo de editar: escribe su entrada y un latido cada ~20 s; al cerrar (y en `pagehide`) la borra.
  Una entrada con latido > 45 s se ignora (pestaña muerta). Constantes nombradas en `lib/`, lógica de vigencia pura y testeada.
- Los demás profes ven, en el diálogo abierto y en la fila/ficha del alumno, «<Nombre> está editando» (avatar o
  punto + texto; nunca solo color; `aria-live="polite"` en el diálogo, una sola vez por cambio). No bloquea: avisa.
- **«El último gana»:** al abrir el diálogo se guarda una versión del alumno (p. ej. `actualizadoEn` o los campos
  editables); `editarAlumno` recibe esa versión y en la transacción, si el doc cambió desde entonces, responde un
  error nuevo de `errorAlumnoTexto` («Otro profe guardó cambios de este alumno mientras editabas. Revisa y vuelve a
  guardar.», `PROVISIONAL (fila 154)`) y el diálogo muestra los valores nuevos sin perder lo escrito.
- Si el navegador no tiene sesión de Firebase, la presencia se apaga en silencio (el guardado sigue funcionando).

### Trampas conocidas
- `cacheComponents: true`: la suscripción vive en un componente cliente; nada de leer Firestore en el render del servidor para esto.
- No dejes listeners ni intervalos vivos al cerrar el diálogo o desmontar (StrictMode monta dos veces).
- Eliminar alumno (W12) también debe borrar `presencia/{cedula}` (Admin, en su flujo) — o documenta que queda huérfana e inofensiva.

### Cómo verificar
- `tests/rules/`: un profe escribe solo su entrada; no la de otro profe; un estudiante ni lee ni escribe; claves extra → denegado.
- Puro: vigencia del latido, detección de conflicto. Emuladores: dos versiones → el segundo guardado recibe el conflicto.
- `bun run test:rules` obligatorio.

### Cierre
PR «feat: los profes ven quién está editando a un alumno y no se pisan los cambios». «Cómo probar»: dos profes
(dos navegadores) abren el mismo alumno; uno guarda, el otro intenta guardar.

---

## W15 — `feat/animaciones`

Worker **W15**. Rama `feat/animaciones`. Decisiones **D278–D282**. Checklist: ninguna.
Modelo · esfuerzo: **opus · medium** (transversal; la transición entre páginas hay que diseñarla con View Transitions en Next 16). Docker: **no**.

Decisiones: las de movimiento (`grep -rhi "^# D.*anima\|^# D.*movimiento\|^# D.*reduced\|^# D.*flip" context/decisions/`),
D095 (segmentado de enlaces), D250 (caché del router), D256–D258 (W9: VS, cinta, podio), D242–D245 (W4: tarea eliminada).
CLAUDE.md: animaciones **solo `transform`/`opacity`**; reduced motion → sin movimiento (texto/cambio directo).

### Lo que pide César
> 39. Animar los cambios de layout. 40. Transición entre páginas. 41. Animar el buscador. 42. Que el selector 5A ↔ 5C
> se desplace. 43. Que el indicador de las tabs se desplace. 44. Más animaciones (lo de tareas ya lo hizo W4).

Decisión de César (ola 3) para **40**: **deslizar según la pestaña** — al ir a una pestaña que está a la derecha en la
barra (inferior o lateral), la página nueva entra desde la derecha; a la izquierda, desde la izquierda. Barra inferior,
lateral y encabezado quietos. Para los enlaces que no son pestañas (abrir una tarea, volver) decide tú la regla más
sobria (p. ej. entrar a un detalle = desde la derecha, volver = desde la izquierda; o un fundido) y explícala en la decisión.

### Dónde está
- Guía: `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md` (sección de navegación direccional) y
  `.../03-api-reference/02-components/link.md` (`transitionTypes`); `next.config.ts` (flag si la guía lo pide). Léelas antes.
- Navegación: `lib/nav.ts:46` (ESTUDIANTE) y `:97` (PROFESOR) — el orden de la barra da la dirección; `components/layout/
  bottom-nav.tsx`, `side-nav.tsx`, `nav-item-link.tsx`, `AppShell.tsx:51-55` (`<main id="contenido">`).
- Tabs: `components/ui/tabs.tsx:78-88` (indicador `after:` con solo opacidad hoy, variantes `line` y `segmented`).
- 5A ↔ 5C: `components/sections/ranking/segmented-links.tsx` (enlaces, D095) y `components/ui/toggle-group.tsx`.
- Buscador: `components/sections/alumnos/student-filters.tsx:60-70`.
- Layout: `components/krea/use-flip.ts` (FLIP ya usado en `rank-list` y `teacher-task-list`), `app/globals.css:1260-1340`
  (utilidades `animate-*`), tokens `--d-*` en `:298-316` y su versión reducida `:399-405`.

### Enfoque decidido
- **40:** View Transitions de React/Next con tipos de transición (p. ej. `desliz-izq`/`desliz-der`) calculados por el índice
  de la pestaña de origen y destino (función pura en `lib/`, testeada). Solo el `<main>` anima; las barras se excluyen
  (`view-transition-name` propio). Duración y desplazamiento con tokens nuevos (`--d-pagina`, `--desliz-pagina`, en la decisión).
  Con `prefers-reduced-motion: reduce`, ninguna animación. Navegador sin View Transitions → cambio directo (no rompe).
- **43 y 42:** un indicador que se **traslada** (transform `translateX` + `scaleX`, o un elemento medido) en `tabs.tsx`
  (`line` y `segmented`) y en `SegmentedLinks`/`ToggleGroup`. En `SegmentedLinks` cambia la ruta: el indicador puede
  animar con la view transition (nombre compartido) en vez de estado. Un componente/hook compartido, no tres copias.
- **41:** el buscador: ícono/botón de limpiar que aparece con opacidad+escala, resultados que entran con `animate-fade-in`;
  sin animar ancho/alto (solo transform/opacity).
- **39:** reordenar/filtrar listas con `useFlip` donde hoy saltan (lista de alumnos al filtrar, equipos, ajustes);
  elige 2–4 lugares de más impacto y nómbralos en el PR. Los acordeones ya animan.
- **44:** repasa altas y bajas visibles (alumno creado/eliminado, ajuste agregado, toast) y añade entrada/salida
  sobria con las utilidades existentes. Nada nuevo en ranking.

### Trampas conocidas
- **No toques** `components/krea/rank-list.tsx`, `rank-row.tsx`, `podium.tsx`, `lib/rank-row.ts` ni la utilidad
  `cinta-riesgo` de `globals.css` (los cambia W19 en paralelo). El podio y el confeti ya animan: no los dupliques.
- `globals.css` lo toca también W19 (solo `cinta-riesgo`, ~1290–1312, y quizá un token junto a `--error`): añade lo tuyo
  en bloques **separados** de esas zonas para que el merge no choque.
- W16 (en paralelo) toca `task-builder.tsx` y crea `components/krea/date-picker.tsx`; W14 toca
  `components/sections/alumnos/edit-student-dialog.tsx`: no los toques.
- Animar `width`/`left`/`height` está prohibido (CLAUDE.md): el indicador se mueve con transform.
- `cacheComponents` + `staleTimes`: la transición debe correr también al volver a una ruta cacheada (por código: el tipo
  se pone en el `Link`/`router.push`, no depende del fetch).

### Cómo verificar
- Puro: dirección de la transición por pestañas (estudiante y profe, admin incluido) y la regla de enlaces no-pestaña.
- Por código: cada animación nueva tiene su rama reduced motion; solo `transform`/`opacity` (`grep` de `transition-\[width`, `left`).

### Cierre
PR «feat: animaciones de navegación, pestañas, selector de sección, buscador y listas».

---

## W16 — `feat/calendario`

Worker **W16**. Rama `feat/calendario`. Decisiones **D283–D284**. Checklist: ninguna (días y meses no son placeholder).
Modelo · esfuerzo: **sonnet · medium**. Docker: **no**.

Decisiones: **D116** (fecha con máscara sin calendario: la nueva dice «Reemplaza en parte a D116»), D114, D200
(fecha ya guardada que pasó), D071 (foco al inválido).

### Lo que pide César
> 31. «Un calendario propio en el campo de la fecha.»

Decisión de César (ola 3): **popover bajo el campo en laptop y hoja inferior en móvil**, con el campo dd/mm/aaaa que se
puede seguir escribiendo (máscara `mascaraFecha` como hoy).

### Dónde está
- `components/sections/tareas-profe/task-builder.tsx:543-561` (Field «Fecha de entrega», `Input` con `Calendar`
  decorativo y el comentario «Sin calendario emergente (D116)»); `hoy` y `fechaGuardada` en las props `:123-141`;
  validación `validarTarea`, `mascaraFecha`, `fechaIso` (`grep -rn "mascaraFecha\|fechaIso" lib`).
- Primitivas: `components/ui/popover.tsx` (Radix no modal), `components/ui/sheet.tsx`, `components/ui/button.tsx`.
  No hay librería de fechas ni de calendario: **no añadas dependencias**.
- Corte móvil/laptop: el que ya use el proyecto (`grep -rn "useMediaQuery\|matchMedia" components lib`).

### Enfoque decidido
- Componente `components/krea/date-picker.tsx` + lógica pura `lib/calendario.ts` (semanas del mes lun–dom, día civil ISO,
  sin `Date` con zona: el día civil es el de `America/Caracas`, como `hoy`).
- El ícono pasa a ser un **botón** «Elegir fecha» (nombre accesible) que abre el popover (≥ corte) o la hoja (< corte);
  el `Input` sigue escribible. Patrón ARIA de cuadrícula de fecha: `role="grid"`, flechas (día/semana), Inicio/Fin
  (semana), RePág/AvPág (mes), Enter/Espacio elige, Esc cierra y el foco vuelve al botón. Encabezado «noviembre de 2026»
  con flechas de mes; hoy marcado (no solo color: aro + «hoy» en el nombre accesible), el elegido con el acento, días
  anteriores a `hoy` deshabilitados salvo `fechaGuardada` (D200). Elegir escribe `dd/mm/aaaa` en el campo y cierra.
- Tokens existentes para todo (celdas ≥ 44 px en la hoja; en el popover el objetivo táctil mínimo del proyecto); un
  tamaño sin token → el token existente más cercano.
- Tarea cerrada (`readOnly`): el botón no abre.

### Trampas conocidas
- W15 (en paralelo) anima tabs/segmentados y transiciones de página: no toques `tabs.tsx`, `toggle-group.tsx` ni
  `globals.css` (si necesitas una utilidad, un bloque propio al final del archivo).
- Popover/hoja dentro de otro contenedor con portal: revisa `components/ui/portal-scope.tsx`.
- Mes con 6 semanas; febrero bisiesto; cambio de año en las flechas.

### Cómo verificar
- Puro: semanas de nov 2026 y feb 2028, «siguiente foco» por tecla, deshabilitados, ida y vuelta dd/mm/aaaa ↔ ISO.
- a11y por código: teclado completo, foco visible en celdas, contraste del elegido/hoy en 4 acentos × claro/oscuro, 320 px.

### Cierre
PR «feat: calendario propio para la fecha de entrega (popover en laptop, hoja en móvil)».

---

## W19 — `fix/ranking-vs-cinta`

Worker **W19** (correcciones de César a #89). Rama `fix/ranking-vs-cinta`. Decisiones **D288–D290**. Checklist: ninguna.
Modelo · esfuerzo: **sonnet · medium**. Docker: **no**.

Decisiones: **D256** (VS solo en la zona: se reemplaza), **D257** (cinta: se reemplaza su color), D258 (podio), D051, D001.

### Lo que pide César
> 46. «El VS tiene que salir en todos los empates del ranking, no solo en la zona de riesgo — tengo un ranking donde 3
> estudiantes tienen la misma nota.»
> 47. «La cinta de la zona de riesgo no combina con ese amarillo y en modo oscuro se ve mal.»

Decisión de César (ola 3) para **47**: rayas del **rojo de error** alternadas con un **tinte del mismo rojo** (sin `--warning`).

### Dónde está
- `components/krea/rank-list.tsx:39-50` — `pintar(lista, duelos)` solo llama `conectoresVs` con `duelos` (la zona).
- `lib/rank-row.ts:98` `conectoresVs` (ya da `true` entre cada par de empatados seguidos, sirve para N).
- `components/krea/rank-row.tsx` (`vsDespues` y el conector; con 3 empatados deben salir 2 «VS» y el lector no repetir
  de más), `animate-vs` en `app/globals.css` (~1320).
- Podio: `components/krea/podium.tsx` (escalones por puesto de competencia: dos 2.º → dos escalones iguales).
- Cinta: `app/globals.css:1290-1312` utilidad `cinta-riesgo` (`var(--error)` / `var(--warning)`); `--error` claro `:64`
  (#c80300) y oscuro `:135`, `:191` (#ff6b5e); tintes existentes `--tint-err` (`:257-273`).
- Galería: `app/componentes/_familias/ranking.tsx` (casos de empate).

### Enfoque decidido
- **46:** `conectoresVs` en **las dos** listas (principal y riesgo); actualiza comentarios y reemplaza D256 con una decisión
  nueva. En el **podio**, si dos o tres comparten puesto, un «VS» entre esas columnas (mismo `animate-vs`, `aria-hidden`; el
  empate ya dicho en el nombre accesible). Sin empate, nada cambia.
- **47:** `cinta-riesgo` con `var(--error)` y un tinte del mismo rojo (`color-mix(in oklab, var(--error) X%, <superficie>)`
  o un token nuevo `--cinta-tinte` por tema, en la decisión). Raya fuerte contra el fondo ≥ 3:1 (gráfico) en 4 acentos ×
  claro/oscuro, calculado y anotado en la decisión; añade el par a `tests/unit/contraste-tokens.test.ts` si cabe.
  Animación y reduced motion, igual.

### Trampas conocidas
- W15 (en paralelo) toca `globals.css` en otras zonas y **no** toca `rank-list`/`rank-row`/`podium`/`lib/rank-row.ts`/
  `cinta-riesgo`: limita tu diff de `globals.css` a `cinta-riesgo` (y el token nuevo, si lo hay, junto a los de error).
- `splitRiesgo` deja al último de la principal y al primero de la zona en listas distintas: si empatan en el corte, no hay
  VS entre listas (dilo en la decisión; no muevas el separador).

### Cómo verificar
- Puro: `conectoresVs` con 3 empatados en la principal (2 conectores), empates en el podio (función pura si la añades).
- Contraste de la cinta calculado (test). a11y por código.

### Cierre
PR «fix: VS en todos los empates del ranking y cinta de riesgo en rojo».
