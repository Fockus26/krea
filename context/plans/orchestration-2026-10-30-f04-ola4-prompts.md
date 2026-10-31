# Prompts por unidad — orquestación 2026-10-30 (fase 04, ola 4, main @ 6b53b74)

Brief: `context/plans/orchestration-2026-10-30-f04-ola4.md` (+ las "Reglas de la tanda" de `orchestration-2026-10-29-f03.md`
y los «Cambios a las reglas» de `orchestration-2026-10-30-f04-ola3.md` que cita).

**Común a las cuatro** (además del brief):
- Decisiones de base de la fase (léelas en tu slot, `cat context/decisions/D0NN-*.md`): D066 (secciones por props y
  vista), D067 (`ActionBar`), D069 (datos de ejemplo), D072 (estados por ruta con `generateStaticParams`), D082 (formulario
  cliente + diálogo), D095 (segmentado que navega = enlaces), D099 (filtro local), D100 (tarjetas enlace), D105 (Toaster
  local). Patrón de vista con estados: `app/secciones/equipo/[estado]/page.tsx`; de vista simple: `app/secciones/alumnos/page.tsx`;
  índice: `app/secciones/page.tsx` (`PANTALLAS`, una entrada en tu ancla del brief). Pantalla del profesor ya hecha que
  sirve de modelo: `components/sections/alumnos/` (filtros + diálogo) y `components/sections/profe-panel/`.
- Pantallas del profesor: `Vista rol="profesor"` (contenedor `container-teacher`). Encabezados con `PageHeader`
  (`components/sections/shared/page-header.tsx`: `eyebrow`, `title`, `description`, `adornment`, `actions`). Segmentados con
  `ToggleGroup` (`components/ui/toggle-group.tsx`, D038/D039) o `SegmentedLinks` si navegan.
- Convenciones del handoff (`design/HANDOFF.md:156-159`): foco `outline 2px --accent-ink offset 2`, táctil 44, íconos
  lucide trazo 2 / 20 px (16 en chips y textos pequeños). Cifras con `nums`; notas y puntos con `formatNota`/
  `formatDecimal` (coma es-VE), nunca `toFixed`. Signo menos tipográfico «−». Fechas con `lib/fecha.ts`.
- Grilla (`design/HANDOFF.md:365-381`): una columna por debajo de 1024 en el orden del DOM; `g3` = 1 / 2 / 3 columnas;
  sin scroll horizontal de página a 320 (segmentados largos con scroll propio).
- Medidas exactas: `design/canvas/krea.css` y el lienzo de tu pantalla (`design/canvas/<X>.dc.html` + `<X>-movil.dc.html`).
  Si un valor no está ni en el handoff ni en el lienzo, no lo estimes: déjalo marcado y dilo en el PR.
- Copy: el del lienzo; lo que sea placeholder según `design/HANDOFF.md` §8 va marcado en `lib/demo/` y con tu fila
  reservada del checklist. Vacíos: `design/canvas/Vacios.dc.html`.
- Sin entorno DOM: pruebas solo de lógica pura en `tests/unit/<pantalla>.test.ts`.
- Al terminar, `grep -rnE '\[[0-9]+px\]|\[#[0-9a-fA-F]{3,8}\]'` sobre tus archivos de `components/`, `lib/` y `app/` limpio.
- **Gate `a11y`** (skill) por código antes del PR: un `<h1>`, jerarquía de títulos, listas reales, nombres accesibles,
  estados no solo por color, regiones vivas únicas, foco tras cerrar menús y diálogos.
- Verificación sin servidor: `bun run build` y buscar en `.next/server/app/secciones/<pantalla>…html` un solo `<h1>`, un
  `<main>` y los textos esperados.

---

## W1 — `feat/sec-equipos-profe`

Eres el worker **W1**. Rama: `feat/sec-equipos-profe`. Slot y puerto: los del mensaje que te lanza.
Decisiones: rango **D110–D113**. Filas de CONTENT_CHECKLIST: **86–88**.
Modelo · esfuerzo: **sonnet · medium**. Docker: **no**.

Decisiones previas además de las comunes: D012 (solo el capitán envía la grupal), D075 (Capitán/Capitana por prop), D041
(Badge), D042 (Card, `CardList`), D046–D047 (`UserAvatar`, `TeamLogo`), D048–D049 (identidad/logo), D011 (ranking por sección).

### Qué pide César
> "/orchestrate ola 4 de la fase 04" — plan: "`feat/sec-equipos-profe` · Equipos del profesor (tarjetas, capitán, mover,
> Sin equipo, subir logo)".

### Dónde está
- `design/HANDOFF.md:345-348` — §3 Equipos: encabezado + segmentado sección; `g3` de tarjetas; tarjeta = `TeamLogo` 72 con
  botón «Subir logo»/«Cambiar» (ghost 32 alto) debajo · nombre h3 · tema y número · chip «#1 · 19 pts» · Select «Capitán» con
  ayuda «Solo el capitán envía las tareas grupales.» (oculto si hay 1 integrante: capitán automático) · lista de integrantes
  (avatar 32, nombre, chip Capitán, botón Move «Mover a {nombre} a otro equipo» → menú §2.13). **Sin equipo:** card con borde
  interior 2 px `--warning`, h2 con TriangleAlert «Sin equipo · 5», nota «No suman notas grupales hasta tener equipo», filas con
  «Asignar…» secondary sm (mismo menú). Subir logo: JPG/PNG/WebP hasta 5 MB, recorte cuadrado centrado en el cliente a 512 × 512.
  §2.13 menú (`grep -n "2.13" design/HANDOFF.md`). §9 #11 logos.
- Lienzos: `design/canvas/Equipos.dc.html`, `Equipos-movil.dc.html`. Eyebrow «5A · 6 equipos · 30 de 35 con equipo» (de los
  datos); chip con empate «#3 · 17 pts · empate»; menú Mover: los otros equipos de la sección + «Quitar del equipo».
- Componentes que **usas sin editar**: `components/krea/{team-logo,user-avatar,image-upload}.tsx`,
  `components/ui/{card,badge,button,select,dropdown-menu,toggle-group,label}.tsx`, `SegmentedLinks`
  (`components/sections/ranking/segmented-links.tsx`). `lib/image.ts` (`validateImage`, `compressImage`) **no se edita**: acepta
  solo JPG/PNG y 1600 px; lo del logo va en tu `lib/equipos-profe.ts`.
- Datos: `lib/demo/seed.ts` — `EQUIPOS`, `equipoDe`, `integrantes` (capitán primero), `esCapitan`, `alumnosDeSeccion`,
  `rankingEquipos(sec)` (puesto, puntos, empate), `CEDULA_SIN_EQUIPO`. `lib/ranking-vista.ts` ya hace el subtítulo
  «n integrantes · capitán {nombre}»: reutiliza lo que sirva. `lib/sections.ts` (`integrantesTexto`).

### Enfoque decidido
1. `lib/equipos-profe.ts` (+ `tests/unit/equipos-profe.test.ts`): eyebrow («5A · 6 equipos · 30 de 35 con equipo»), chip de
   puesto («#1 · 19 pts», «· empate» si comparte puesto), «Sin equipo · n», opciones del menú Mover (otros equipos de la
   sección + «Quitar del equipo» solo si tiene equipo), `moverAlumno(estado, cedula, destino)` y `cambiarCapitan(estado, equipo,
   cedula)` puros e inmutables (al sacar al capitán, el siguiente pasa a capitán; un equipo de 1 = capitán automático; un
   equipo que queda vacío se muestra con su vacío del lienzo o se dice en el PR), y la validación/recorte del logo:
   `validarLogo(file)` (JPG/PNG/WebP, ≤ 5 MB; mensajes en español) y `recorteCuadrado(ancho, alto)` → rectángulo centrado
   (puro, probado); el dibujo en `canvas` a 512 × 512 es una función cliente fina sobre ese cálculo.
2. `components/sections/equipos-profe/`: `TeamsHeader` (PageHeader + segmentado 5A/5C por ruta con `SegmentedLinks`),
   `TeamCard` (logo 72 + «Subir logo»/«Cambiar» con `<input type="file">` oculto y etiquetado, vista previa local por
   `URL.createObjectURL` liberada al cambiar/desmontar; nombre h3; tema y número; chip; `Select` Capitán con `Label` y ayuda por
   `aria-describedby`; `<ul>` de integrantes con chip Capitán/Capitana (D075) y botón de menú Move), `UnassignedCard` (Sin
   equipo), `TeamsBoard` (cliente: estado local de equipos, toasts o `role="status"` «Yeilin Duarte pasó a 5A-G1 Barbería»).
3. Vista `/secciones/equipos-profe/[estado]` con `5a` y `5c`; `Vista rol="profesor" ruta="/profe/equipos"`.

### Trampas conocidas
- El Select de capitán y el menú Mover viven en portales: tras elegir, el foco vuelve a un sitio con sentido (el botón de la
  fila ya no existe si el alumno se fue: lleva el foco a la tarjeta destino o al título de la tarjeta de origen; decide y documenta).
- Un alumno movido cambia el recuento del eyebrow, del Sin equipo y de «n integrantes»: todo sale del mismo estado.
- Botón «Subir logo» con nombre que incluye el equipo («Subir logo de 5A-G2 Repostería»). Errores del archivo en texto
  asociado, no solo color.
- Nombres largos («Valentina Consolación Gámez Rodríguez») envuelven a 320, sin elipsis.
- Género del capitán: hoy D075 (prop, «Capitán» por defecto, pendiente de César): no lo infieras del nombre.

### Cómo verificar
- typecheck, lint, test, build; `/secciones/equipos-profe/*` estáticas. En el HTML: un `<h1>`, seis tarjetas con h3 en 5A,
  la card Sin equipo con su h2, botones de menú con nombre completo.
- Pruebas puras: eyebrow y recuentos, chip con empate, opciones del menú, mover (a otro equipo, quitar, asignar desde Sin
  equipo, sacar al capitán), cambiar capitán, validación del logo (tipo, tamaño) y recorte centrado (apaisado, vertical, cuadrado).

### Cierre
Changeset: ninguno. En el PR, "Decisión tomada / alternativa" para: segmentado por ruta, foco tras mover, equipo que queda
vacío, recorte del logo en cliente. Reporte final como dice el brief (fila de SECTION_INVENTORY para `components/sections/equipos-profe/`).

---

## W2 — `feat/sec-tareas-profe`

Eres el worker **W2**. Rama: `feat/sec-tareas-profe`. Slot y puerto: los del mensaje que te lanza.
Decisiones: rango **D114–D117**. Filas de CONTENT_CHECKLIST: **89–91**.
Modelo · esfuerzo: **opus · medium** (formulario grande con estado, añadir/quitar con deshacer, medidor y validación). Docker: **no**.

Decisiones previas además de las comunes: D004 (tareas suman exactamente 20, pasos de 0,5), D012, D030–D032 (`Input`,
`Field`, `NumberStepper`), D056 (`SumMeter`), D071 (errores al enviar, foco al primer inválido), D090 (`ToggleGroup` como
radiogroup; `seg-block`), D103 (`NumberStepper` `value: number | null`, `aria-labelledby`), D104–D105 (toast con Deshacer).

### Qué pide César
> "/orchestrate ola 4 de la fase 04" — plan: "`feat/sec-tareas-profe` · Lista de tareas y constructor (Datos, Preguntas,
> suma = 20, publicar)".

### Dónde está
- `design/HANDOFF.md:350-353` — §3 Tareas del profesor y constructor (lista: encabezado + «Nueva tarea» primary; segmentado de
  estado con scroll propio; tarjetas fila: chips estado/tipo/premio, h3, meta, barra de evaluadas máx. 320, acciones «Evaluar n»
  / editar ghost icon / «Seguir editando» / «Ver notas»; borrador con suma ≠ 20 → chip warn «Suma 14 / 20». Constructor: topbar
  móvil volver + «Nueva tarea» + «Guardar borrador»; `g-side`: Datos (Título; Tipo segmentado block Individual/Grupal; Fecha
  dd/mm/aaaa con Calendar; Sección select «5A · 5C · 5A y 5C»; Premio con Gift solo si Grupal) y Preguntas (cards: número +
  «Pregunta n» + eliminar ghost `--error`; textarea enunciado; Formato Texto/Imagen; Valor stepper 0,5–20 paso 0,5) + «Agregar
  pregunta» (zona punteada `--accent-ink`, 1 a 20 preguntas); derecha sticky: «Suma de valores» + «Publicar tarea» primary lg
  block (deshabilitado si suma ≠ 20) + «Guardar borrador» + nota; móvil: medidor sticky arriba + barra de acción inferior.
  Eliminar pregunta: sin diálogo; toast «Pregunta eliminada» + «Deshacer»). §2.11 `SumMeter` (`:237`). §8: constructor sin barra
  inferior en móvil y «no unificar» `SumMeter` con `LiveTotal` (`grep -n "no muestra la barra inferior\|No convertir" design/HANDOFF.md`).
  §8 segmentado de ancho completo < 400 px sin íconos (`:520`).
- Lienzos: `design/canvas/TareasProfe.dc.html`, `TareasProfe-movil.dc.html`, `Constructor.dc.html`, `Constructor-movil.dc.html`
  (eyebrow «4 tareas · 5A y 5C»; segmentado Todas · Borradores · Abiertas · Evaluadas; «Premio (solo grupal, opcional) Lo gana
  el equipo con mejor nota.»; «Al publicar, las secciones elegidas la ven en «Por entregar».»; las 4 preguntas de ejemplo del
  borrador «Plan de redes sociales»). `Extremos.dc.html` para 20 preguntas.
- Componentes que **usas sin editar**: `components/krea/{sum-meter,number-stepper,meter-bar,status-badge}.tsx` (+ `lib/meters.ts`,
  `lib/stepper.ts`), `components/ui/{card,badge,button,input,textarea,field,select,toggle-group,sonner}.tsx`,
  `components/sections/shared/{action-bar,page-header,back-link}.tsx`, `SegmentedLinks` si el segmentado de estado navega.
- Datos: `lib/demo/tareas.ts` (`TAREAS`, `AVANCE_DEMO`; **no lo edites**), `lib/demo/seed.ts` (`TAREA_IDENTIDAD`, `ALUMNOS`,
  `EQUIPOS` para «12 de 69 evaluadas» / «3 de 12 equipos»), `lib/demo/evaluar.ts` (`COLA`: cuántas faltan por tarea → «Evaluar n»).
- Brief «Formas compartidas»: borrador `"plan-redes"` igual que W4 (Premios).

### Enfoque decidido
1. `lib/tareas-profe.ts` (+ `tests/unit/tareas-profe.test.ts`): estado de la lista (`borrador | abierta | evaluada`) y filtro,
  textos (eyebrow, meta «8 preguntas · vence 30/10/2026 · 12 de 69 evaluadas», chip «Suma 14 / 20», «Evaluar 3»), y el modelo del
  constructor como **reducer puro**: añadir (máx. 20) / eliminar (mín. 1) / restaurar pregunta (deshacer en su posición),
  editar campos, cambiar tipo (al pasar a Individual el premio se oculta **y no se pierde** hasta guardar — decide y documenta),
  suma (de `lib/meters.ts` si ya existe el cálculo del `SumMeter`), `puedePublicar` (suma = 20 exacta, título, fecha, ≥ 1 pregunta,
  enunciados no vacíos) y `validarTarea` → errores por campo con mensajes en español. Fecha dd/mm/aaaa: reutiliza lo que haya
  en `lib/mask.ts`/`lib/fecha.ts`; si no hay máscara de fecha, `Input` con `inputMode="numeric"` y validación pura, sin
  calendario emergente (el ícono Calendar es decorativo; dilo).
2. `components/sections/tareas-profe/`: `TasksHeader`, `TaskStatusFilter` (filtro local `ToggleGroup` + `<output>`, D099, con
  scroll propio), `TeacherTaskCard` (chips con texto, h3, meta, `MeterBar` de evaluadas máx. 320 con nombre, acciones con nombre
  accesible que incluye la tarea), `TaskBuilder` (cliente: Datos + Preguntas + aside sticky con `SumMeter` + acciones; móvil:
  medidor sticky arriba + `ActionBar`), `QuestionEditor` (card por pregunta, `<ol>`; título «Pregunta n» como `h3`; eliminar con
  nombre «Eliminar la pregunta 3»; tras eliminar, foco a la pregunta siguiente o al botón «Agregar pregunta»; al agregar, foco al
  enunciado nuevo). Publicar en la vista previa: toast «Tarea publicada» y vuelve a la lista (o estado local); «Guardar borrador»:
  toast. Toaster local en `app/secciones/tareas-profe/layout.tsx` (D105).
3. Vistas: `/secciones/tareas-profe` (lista, `ruta="/profe/tareas"`) y `/secciones/tareas-profe/[estado]` con `nueva` (vacía,
  1 pregunta) y `borrador` («Plan de redes sociales», 10 preguntas, suma 14, `ruta="/profe/tareas/[id]"`, `title`/`volverHref`
  para la topbar móvil). Las dos entradas de `PANTALLAS` juntas en tu ancla.

### Trampas conocidas
- `SumMeter` ya trae `role="status" aria-live="polite"`: no añadas otra región viva que repita la suma.
- «Publicar tarea» deshabilitado: el motivo («La suma tiene que ser 20: faltan 6») asociado por `aria-describedby`; si eliges
  botón habilitado que valida al pulsar (D071), dilo — pero no ambos.
- Stepper de valor: `value: number` 0,5–20 paso 0,5; si una pregunta nueva empieza sin valor usa `null` (D103) y cuenta 0 en la suma.
- Deshacer de un toast restaura la pregunta en su posición con su contenido; el número «Pregunta n» se recalcula siempre.
- Premio solo visible si Grupal; Sección select con «5A y 5C» como valor.
- Sin interruptor de entrega tardía (brief, decisiones del orquestador).
- El borrador de 10 preguntas y 20 preguntas a 320: nada desborda; el aside sticky no tapa el foco (`scroll-margin`, D020).

### Cómo verificar
- typecheck, lint, test, build; `/secciones/tareas-profe*` estáticas. En el HTML: lista con un `<h1>`, 5 tarjetas con h3 (4 de
  `TAREAS` + borrador), chip «Suma 14 / 20»; constructor con su `<h1>`, `<ol>` de preguntas y el medidor.
- Pruebas puras: reducer (añadir hasta 20, no bajar de 1, eliminar + restaurar en posición, cambiar tipo y premio), suma con
  medios puntos y `null`, `puedePublicar`/`validarTarea`, textos de la lista y del filtro.

### Cierre
Changeset: ninguno. En el PR, "Decisión tomada / alternativa" para: botón deshabilitado vs validar al pulsar, fecha sin
calendario, premio al pasar a Individual, foco al añadir/eliminar, barra inferior en móvil (si `Vista` no la quita). Reporte
final como dice el brief (fila de SECTION_INVENTORY para `components/sections/tareas-profe/`).

---

## W3 — `feat/sec-puntos`

Eres el worker **W3**. Rama: `feat/sec-puntos`. Slot y puerto: los del mensaje que te lanza.
Decisiones: rango **D118–D121**. Filas de CONTENT_CHECKLIST: **92–94**.
Modelo · esfuerzo: **opus · medium** (combobox accesible nuevo + formulario con vista previa del ranking). Docker: **no**.

Decisiones previas además de las comunes: **D007** (los ajustes mueven puntos, nunca la nota; todo ajuste lleva motivo),
D011 (ranking por sección), D030–D032 (`Field`, `NumberStepper`), D041 (Badge `ok`/`err`), D071, D098–D101 (Panel: `chipAjuste`,
`fechaAjusteTexto`, `ajusteMetaTexto` en `lib/panel.ts`; **`DemoAjuste` y `AJUSTES` en `lib/demo/ajustes.ts`: los reutilizas**).

### Qué pide César
> "/orchestrate ola 4 de la fase 04" — plan: "`feat/sec-puntos` · Ajustes de puntos (formulario con motivos fijos, vista
> previa, historial con anular)". Del plan, «Para la ola 4»: "«Nuevo ajuste» del Panel enlaza a `/profe/puntos`; motivos fijos
> y vista previa «Eso no cambia tu nota» (D007)".

### Dónde está
- `design/HANDOFF.md:355-358` — §3 Ajustes de puntos: `g-home`; Formulario (card gap 24): «Ajustar a» Alumno/Equipo + «Sección»
  5A/5C (segmentados, envuelven) · «¿A quién?» combobox con avatar y puntos actuales · Motivo fieldset, grilla 2 col (1 col < 768)
  de 8 opciones radio 52 px (borde 1 px `--input`, radio 12; elegida: fondo `--accent-soft`, borde+anillo `--accent`, Check) con
  valor en chip ok/err («+2», «−3»; «Otro» con «± escribe») · Puntos stepper con signo (color `--success`/`--error` + signo
  explícito) «Propuesto por el motivo. Pasos de 0,5.» · Detalle (obligatorio en Otro) · vista previa alert-ok/err con TrendingUp:
  «**Jorge Quintero** pasa de 17 a **19 pts** y sube del puesto 16 al 11. Su nota no cambia.» · «Aplicar ajuste» primary lg.
  **Historial** (card): filas con chip ±, a quién (h4), motivo (+ detalle entre comillas en Otro), fecha + profe; «Filtrar» ghost sm
  (por sección, alumno/equipo, motivo). Cada ajuste se puede **anular** (no borrar) desde un menú de la fila: crea el ajuste
  inverso con motivo «Anulación». Motivos fijos: Participación destacada +2 · Ayudó a un compañero +1 · Trabajo extra +2 · No
  estuvo en clase −2 · No prestó atención −1 · Uso del celular −1 · Falta de respeto −3 · Otro (valor libre ±, detalle obligatorio).
- Lienzos: `design/canvas/Puntos.dc.html`, `Puntos-movil.dc.html` (eyebrow «Puntos del ranking · no cambian la nota»; card
  «Nuevo ajuste»; historial: Jorge Quintero +2 · Klenyerber Corredor −1 · Equipo 5A-G3 Ropa +1 · Gabriel Gil −2 «No estuvo en
  clase» 23/10/2026 7:30 a. m. · Equipo 5C-G1 Otro: «Entregaron la m…»; «· [Nombre del profe]» tras la fecha).
- Componentes que **usas sin editar**: `components/krea/{number-stepper,user-avatar,team-logo}.tsx`,
  `components/ui/{card,badge,button,alert,field,label,textarea,toggle-group,dropdown-menu,sonner}.tsx` (+ `lib/alert.ts`),
  `components/sections/inicio/home-grid.tsx` (`g-home`) si encaja sin editarlo, `components/sections/profe-panel/recent-adjustments.tsx`
  como referencia de fila (no la edites; si la fila del historial es la misma, extrae nada: escribe la tuya con las funciones de `lib/panel.ts`).
- **Nuevo y tuyo:** `components/ui/popover.tsx` (estilo shadcn sobre `Popover` de `radix-ui`, ya instalado: comprueba en
  `node_modules/radix-ui` que lo exporta) para el combobox. Sin `cmdk` ni dependencias nuevas (brief).
- Datos: `lib/demo/ajustes.ts` (`DemoAjuste`, `AJUSTES`: añade las filas del lienzo que faltan — Gabriel Gil, el detalle de
  5C-G1 — y campos **opcionales** `detalle?`, `profe?`, `anulaA?`; no cambies los 4 primeros ni rompas `lib/panel.ts`),
  `lib/demo/seed.ts` (`rankingAlumnos`, `rankingEquipos`, `puntosAlumno`, `puntosDeEquipo`, `alumnoPorCedula`, `equipoPorId`),
  `lib/ranking.ts` (`rankCompetition`), `lib/demo/usuarios.ts` (`USUARIO_PROFESOR` para «· profe»).

### Enfoque decidido
1. `lib/puntos.ts` (+ `tests/unit/puntos.test.ts`): `MOTIVOS` fijos (etiqueta, valor | null para Otro), `valorPropuesto(motivo)`,
  `filtrarCandidatos(lista, consulta)` (sin tildes: reutiliza `normalizar` de `lib/alumnos.ts`), `vistaPrevia({ destino, valor,
  ranking })` → puntos antes/después y puesto antes/después recalculado con `rankCompetition` (sube/baja/se mantiene) y la frase
  completa («… pasa de 17 a 19 pts y sube del puesto 16 al 11. Su nota no cambia.» / «baja del puesto…» / «se mantiene en el
  puesto…»; equipo: «El equipo 5A-G3 Ropa pasa…»), `validarAjuste` (destino, motivo, valor ≠ 0 en pasos de 0,5, detalle
  obligatorio en Otro), `anular(ajuste)` → ajuste inverso con motivo «Anulación» (y que un anulado no se anula dos veces),
  filtro del historial (sección, tipo, motivo) y texto del filtro activo.
2. `components/ui/popover.tsx` + `components/sections/puntos/recipient-combobox.tsx`: patrón ARIA 1.2 combobox con listbox
  (`role="combobox"` en el input, `aria-expanded`, `aria-controls`, `aria-activedescendant`; flechas, Enter, Escape, Home/End);
  opciones con avatar o logo, nombre y «17 pts»; vacío «Sin resultados para «x»». Verifica en `node_modules` qué hace
  `Popover` con el foco (no debe robarlo del input: `onOpenAutoFocus` prevenido).
3. `components/sections/puntos/`: `AdjustmentForm` (cliente; segmentados Alumno/Equipo y 5A/5C como radiogroup `ToggleGroup`;
  al cambiarlos se limpia el destino; `fieldset` + `legend` «Motivo» con 8 radios reales estilizados — no `ToggleGroup` — chip de
  valor con signo; `NumberStepper` con el signo en el texto y en `aria-valuetext` («más 2 puntos»), color solo como refuerzo;
  Detalle `Textarea`; vista previa `Alert` ok/err en `role="status"` con frase estable; «Aplicar ajuste» valida (D071) y añade al
  historial local con toast), `AdjustmentHistory` (`<ul>`, filas con chip ±, h4, motivo + detalle, fecha + profe; «Filtrar» =
  `DropdownMenu` con `CheckboxItem`/`RadioItem`; menú de fila «Opciones del ajuste de {nombre}» con «Anular ajuste»), `PuntosView`.
  Toaster local en `app/secciones/puntos/layout.tsx` (D105).
4. Vista `/secciones/puntos` (o `[estado]` con `alumno` / `equipo` si quieres mostrar las dos vistas previas; decide) con
  `Vista rol="profesor" ruta="/profe/puntos"`; ejemplo inicial = Jorge Quintero + Participación destacada (como el lienzo).

### Trampas conocidas
- **Nota ≠ puntos (D007):** ningún texto dice «nota» salvo «Su nota no cambia.»; los valores son «pts».
- El signo nunca solo por color: «+2»/«−3» con el signo visible, Plus/Minus o TrendingUp/TrendingDown, y texto accesible.
- El combobox: el valor visible del input = nombre elegido; `aria-activedescendant` apunta a ids únicos; el popover no atrapa el
  foco; Escape cierra sin borrar; en móvil (320) la lista cabe sin scroll horizontal.
- Una sola región viva por cambio: vista previa en `role="status"`; el toast de «Aplicar» no repite la misma frase.
- La anulación no borra la fila original: la marca («Anulado») y crea la inversa; los puntos del ranking de la vista previa
  usan el estado local actualizado.
- «Otro»: valor libre ± (stepper sin valor propuesto; `null` hasta que el profe lo ponga, D103) y detalle obligatorio con su error.

### Cómo verificar
- typecheck, lint, test, build; la vista estática. En el HTML: un `<h1>`, el `fieldset` con 8 radios y su `legend`, el combobox
  con su `label`, la lista del historial.
- Pruebas puras: motivos y valores, vista previa (sube / baja / igual, empates con `rankCompetition`, equipo), validación (Otro sin
  detalle, valor 0, paso), anular (inverso, doble anulación), filtro del historial, búsqueda sin tildes.

### Cierre
Changeset: ninguno. En el PR, "Decisión tomada / alternativa" para: combobox propio sobre `Popover` (alternativa: `Select` o
`cmdk`), radios reales del motivo, vista previa y su región viva, anulación. Si añades campos a `DemoAjuste`, di que son
opcionales y que el Panel sigue igual. Reporte final como dice el brief (fila de SECTION_INVENTORY para
`components/sections/puntos/` y de COMPONENTS_INVENTORY para `components/ui/popover.tsx`).

---

## W4 — `feat/sec-premios`

Eres el worker **W4**. Rama: `feat/sec-premios`. Slot y puerto: los del mensaje que te lanza.
Decisiones: rango **D122–D125**. Filas de CONTENT_CHECKLIST: **95–97**.
Modelo · esfuerzo: **sonnet · medium**. Docker: **no**.

Decisiones previas además de las comunes: **D086** (premio solo con ganador único; con empate hoy no se muestra ganador al
estudiante — pendiente de César), D041 (Badge `cap`/`ok`), D042 (Card), D047 (`TeamLogo`), D100 (tarjetas enlace).

### Qué pide César
> "/orchestrate ola 4 de la fase 04" — plan: "`feat/sec-premios` · Premios (ganado / en juego / por definir, empate)".

### Dónde está
- `design/HANDOFF.md:360-361` — §3 Premios: `g3` de tarjetas: cuadro 56 (ganado: `--secondary` + Trophy; en juego: secondary
  30 % + Gift; por definir: `--surface-2`) · h3 premio · «{tarea} · {sección}» · estado: chip-cap «Ganó {equipo}» + «nota 19 ·
  fecha» / chip-ok «En juego» + avance / tarjeta punteada «Premio por definir» + «Agregar premio» (va al constructor). Empate en
  la mejor nota: chip «Empate: G2 y G5» y el profe decide desde el menú de la tarjeta (§9 #3, `design/HANDOFF.md:533`).
- Lienzos: `design/canvas/Premios.dc.html`, `Premios-movil.dc.html` (eyebrow «Se asignan al equipo con mejor nota de cada tarea
  grupal»; «3 de 12 equipos entregaron · vence 30/10/2026»; «Plan de redes sociales · borrador»).
- Lo que ya existe y **reutilizas sin editar**: `lib/equipo.ts` (`ganadorPremio` — con empate devuelve sin ganador —,
  `premioGanadoTexto`, `enJuegoTexto`), `lib/demo/equipo.ts` (cómo Mi equipo calcula premios ganados), `components/sections/equipo/team-prizes.tsx`
  y `components/sections/tareas/prize-card.tsx` (referencia visual del cuadro 56 con Trophy/Gift; si su marcado sirve tal cual,
  impórtalo; si no, el tuyo), `components/ui/{card,badge,button,dropdown-menu,sonner}.tsx`, `components/krea/team-logo.tsx`.
- Datos: `lib/demo/tareas.ts` (`TAREAS` con `premio`, `AVANCE_DEMO`; **no lo edites**), `lib/demo/seed.ts` (`EQUIPOS`, notas
  grupales). Brief «Formas compartidas»: el borrador `"plan-redes"` («Plan de redes sociales», sin premio) en tu
  `lib/demo/premios.ts`; «Agregar premio» enlaza a `/profe/tareas/plan-redes`.

### Enfoque decidido
1. `lib/premios.ts` (+ `tests/unit/premios.test.ts`): `estadoPremio(tarea, notasGrupales)` → `ganado` (con equipo, nota, fecha)
  / `empate` (equipos empatados en la mejor nota) / `en-juego` (abierta, con avance) / `por-definir` (grupal sin premio), usando
  `ganadorPremio` de `lib/equipo.ts` (no dupliques la regla); textos («{tarea} · {sección}», «nota 19 · 24/10/2026», «3 de 12
  equipos entregaron · vence 30/10/2026», «Empate: G2 y G5» con nombres cortos de equipo, «Ganó 5A-G2 Repostería»), y
  `resolverEmpate(estado, decision)` puro (dar a un equipo / compartir) → tarjeta «Ganó …» o «Compartido: G2 y G5».
2. `lib/demo/premios.ts`: las tarjetas de ejemplo a partir de `TAREAS` + el borrador + **un empate de ejemplo** (placeholder,
  tu fila del checklist: el seed no trae ninguno); que haya al menos una de cada estado.
3. `components/sections/premios/`: `PrizesHeader` (PageHeader con el eyebrow del lienzo), `PrizeCardTeacher` (cuadro 56 con el
  ícono decorativo, h3 premio, línea tarea · sección, estado con chip de texto — no solo color —; por definir: tarjeta punteada
  con «Agregar premio» como enlace con nombre «Agregar premio a Plan de redes sociales»; empate: chip + botón de menú «Opciones
  del premio {premio}» con «Dar el premio a 5A-G2 Repostería», «Dar el premio a 5A-G5 Celulares», «Compartir el premio»),
  `PrizesBoard` (cliente: estado local de las decisiones de empate + toast o `role="status"` «Premio para 5A-G2 Repostería»).
  Toaster local en `app/secciones/premios/layout.tsx` si usas toast (D105).
4. Vista `/secciones/premios` con `Vista rol="profesor" ruta="/profe/premios"`; `<ul>` de tarjetas en `g3`.

### Trampas conocidas
- Premios es del **equipo**: la nota que se muestra es la grupal sin base (D014).
- Con empate el estudiante hoy no ve ganador (D086): no cambies `lib/equipo.ts` ni Mi equipo; tu vista es solo la del profe.
- Chips de premio con texto largo: `h-auto min-h-7 py-1 whitespace-normal` para que envuelvan a 320 (nota de la ola 1).
- Tarjeta punteada: el borde punteado no es la única señal del estado (texto «Premio por definir»).
- Tras elegir en el menú, el botón del menú deja de existir: lleva el foco al h3 de la tarjeta (con `tabIndex={-1}`) o dilo.

### Cómo verificar
- typecheck, lint, test, build; vista estática. En el HTML: un `<h1>`, un `<ul>` de tarjetas con h3, los cuatro estados.
- Pruebas puras: estado del premio (ganado, empate, en juego, por definir), textos, `resolverEmpate` (dar / compartir).

### Cierre
Changeset: ninguno. En el PR, "Decisión tomada / alternativa" para: opciones del menú de empate (§9 #3), «Compartido» como
estado, empate de ejemplo, foco tras decidir. Reporte final como dice el brief (fila de SECTION_INVENTORY para
`components/sections/premios/`).
