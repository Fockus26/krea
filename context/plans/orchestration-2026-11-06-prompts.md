# Prompts — orquestación 2026-11-06 (ola 1: W1–W8)

> Brief compartido: `C:\Users\Cesar\Documents\Work\krea\context\plans\orchestration-2026-11-06.md` (léelo primero).
> Decisiones: léelas **en tu slot** (`context/decisions/`), que está sobre `origin/main`.
> Los prompts de la ola 2 (W9–W13) y 3 (W14–W16) los escribe la sesión de esa ola.

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
