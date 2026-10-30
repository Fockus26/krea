# Prompts por unidad — orquestación 2026-10-30 (fase 04, ola 3, main @ 0265599)

Brief: `context/plans/orchestration-2026-10-30-f04-ola3.md` (+ las "Reglas de la tanda" de `orchestration-2026-10-29-f03.md` que cita).

**Común a las cuatro** (además del brief):
- Decisiones de base de la fase (léelas en tu slot, `cat context/decisions/D0NN-*.md`): D066 (secciones por props y
  vista), D067 (`ActionBar`), D069 (datos de ejemplo), D072 (estados por ruta), D078 (`lectura`), D082 (formulario cliente
  + diálogo), D086 (cabecera hero con `<dl>`), D090 (`ToggleGroup` como radiogroup). Patrón de vista con estados:
  `app/secciones/equipo/[estado]/page.tsx`; de vista simple: `app/secciones/perfil/page.tsx`; índice:
  `app/secciones/page.tsx` (`PANTALLAS`, una línea en tu ancla del brief).
- Pantallas del profesor: `Vista rol="profesor"` (contenedor `container-teacher` = `wrap-wide` 1280/1440; nav con
  contador Evaluar 7). Encabezados con `PageHeader` (`components/sections/shared/page-header.tsx`: `eyebrow`, `title`,
  `description`, `adornment`, `actions`). Segmentados con `ToggleGroup` (`components/ui/toggle-group.tsx`, D038/D039).
- Convenciones del handoff (`design/HANDOFF.md:156-159`): foco `outline 2px --accent-ink offset 2`, táctil 44, íconos
  lucide trazo 2 / 20 px (16 en chips y textos pequeños). Cifras con `nums`; notas y puntos con `formatNota`/
  `formatDecimal` (coma es-VE), nunca `toFixed`. Fechas con `lib/fecha.ts`.
- Grilla (`design/HANDOFF.md:365-381`): una columna por debajo de 1024 en el orden del DOM; sin scroll horizontal de
  página a 320 (tablas y segmentados largos con scroll propio).
- Medidas exactas: `design/canvas/krea.css` y el lienzo de tu pantalla (`design/canvas/<X>.dc.html` + `<X>-movil.dc.html`).
  Si un valor no está ni en el handoff ni en el lienzo, no lo estimes: déjalo marcado y dilo en el PR.
- Copy: el del lienzo; lo que sea placeholder según `design/HANDOFF.md` §8 ("Contenido placeholder") va marcado en
  `lib/demo/` y con tu fila reservada del checklist.
- Sin entorno DOM: pruebas solo de lógica pura en `tests/unit/<pantalla>.test.ts`.
- Al terminar, `grep -rnE '\[[0-9]+px\]|\[#[0-9a-fA-F]{3,8}\]'` sobre tus archivos de `components/`, `lib/` y `app/` limpio.
- **Gate `a11y`** (skill) por código antes del PR: un `<h1>`, jerarquía de títulos, listas reales, nombres accesibles,
  estados no solo por color, regiones vivas únicas.

---

## W1 — `feat/sec-ranking`

Eres el worker **W1**. Rama: `feat/sec-ranking`. Slot y puerto: los del mensaje que te lanza.
Decisiones: rango **D094–D097**. Filas de CONTENT_CHECKLIST: **74–76**.
Modelo · esfuerzo: **sonnet · medium**. Docker: **no**.

Decisiones previas además de las comunes: D011 (ranking por sección: top 10, top 3, peores 5), D041 (Badge/StatusBadge),
D050 (`RankRow`/`RankDelta`), D051 (`RankList` con dos `<ol>` y separador), D052 (`Podium`), D053 (FLIP, brillo,
reduced motion), D007 (ajustes mueven puntos, no la nota).

### Qué pide César
> "/orchestrate ola 3 de la fase 04" — plan: "`feat/sec-ranking` · Ranking estudiantes/equipos (encabezado, podio, lista,
> zona de riesgo, aside «Cómo se calculan» + «Últimos movimientos»)".

### Dónde está
- `design/HANDOFF.md:319-325` — §3 Ranking (encabezado, podio en card hero sin padding inferior, lista 4–N en `<ol>` sin
  tarjeta gap 4, zona de riesgo, `g-side` en escritorio con aside 360, feed oculto en móvil, equipos). §8 empates y zona
  de riesgo (`grep -n "Empates\|Zona de riesgo =\|(tú)" design/HANDOFF.md`). §6 anuncios (`design/HANDOFF.md:463-474`).
- Lienzos: `design/canvas/Ranking.dc.html`, `Ranking-movil.dc.html`, `Acentos-Ranking.dc.html`. Textos del aside:
  «Cómo se calculan» = 3 reglas con ejemplo (píldora 15 "Cada nota de 10 o más suma esos mismos puntos." · píldora 8
  "Una nota menor de 10 suma 0." · chip +2 "Tus profes suman o restan por conducta, siempre con un motivo. Eso no cambia
  tu nota."); «Últimos movimientos» ("María Méndez subió al puesto 4 · hace 2 min"…, máx. 6).
- Componentes que **usas sin editar**: `components/krea/{podium,rank-list,rank-row,rank-delta,rank-announcer,use-flip}.tsx`,
  `user-avatar.tsx`, `team-logo.tsx`, `grade-pill.tsx`, `components/ui/{badge,card,toggle-group}.tsx`.
- Datos: `lib/demo/seed.ts` — `rankingAlumnos(sec)`, `rankingEquipos(sec)` (ya con `RankingPuesto` y `puntos`),
  `alumnosDeSeccion`, `equipoDe`, `integrantes`, `CEDULA_DEMO` (Yeilin Duarte = "tú"). `lib/ranking.ts`
  (`rankCompetition`, `mostrarChipEmpate`, `ZONA_RIESGO`), `lib/rank-row.ts`, `lib/sections.ts` (`integrantesTexto`).
- `app/globals.css:945-992` (medidas del ranking) y `:1207-1264` (movimiento): ya existen; tu bloque nuevo, si hace falta,
  en tu ancla del brief.

### Enfoque decidido
1. `components/sections/ranking/`: `RankingHeader` (eyebrow "Sección 5A · 35 estudiantes" — el recuento sale de los datos;
   h1 "Ranking" + chip "En vivo" visible ≥ 1024; segmentado Estudiantes (Users)/Equipos (Shield o el ícono del lienzo) a
   la derecha que envuelve; con `rol="profesor"`, además un segmentado 5A/5C antes de las pestañas), `RankingBoard`
   (podio en card hero sin padding inferior + `RankList` 4–N con el separador de riesgo que ya pinta `RankList`),
   `RankingRules` (aside «Cómo se calculan»), `RankingFeed` (aside «Últimos movimientos», `aria-live="polite"`, máx. 6,
   tiempo relativo "hace 2 min" por función pura en `lib/ranking-vista.ts` que recibe `ahora` — nada de `Date.now()` en
   servidor), `RankingHowTo` (móvil < 1024: `<details>` "¿Cómo se calculan los puntos?" abierto la primera vez y cerrado
   después vía `localStorage` `krea-ranking-ayuda`; componente cliente mínimo, lectura en `useEffect`, envuelto en
   try/catch).
2. Lógica pura en `lib/ranking-vista.ts` (+ `tests/unit/ranking-vista.test.ts`): de `FilaRankingAlumno[]`/`FilaRankingEquipo[]`
   a entradas de `Podium` (top 3) y filas de `RankList` (4–N, `esTu`, subtítulo equipo / "n integrantes · capitán
   {nombre}" con D075 para capitán/capitana), eyebrow, tiempo relativo, texto de movimiento ("subió al puesto 4").
   Cuidado: si hay empate en el 3.º, el podio muestra lo que dé `rankCompetition` (D052) y la lista empieza tras ellos.
3. Deltas y movimientos son **placeholders** (§8 "deltas del ranking"): en `lib/demo/ranking.ts`, marcados, fila del checklist.
4. Interacción de las pestañas Estudiantes/Equipos y 5A/5C en la vista: **estados por ruta** (D072), no estado cliente:
   `/secciones/ranking/[estado]` con `estudiantes`, `equipos`, `profesor` (5A, estudiantes) y `profesor-5c`; los
   segmentados son enlaces a la otra ruta o un `ToggleGroup` que navega — tú eliges el que sea accesible (un segmentado que
   cambia de página no es un radiogroup: si son enlaces, `aria-current`) y lo documentas en la decisión.
5. Vista: `Vista rol="estudiante" ruta="/ranking"` (o `rol="profesor" ruta="/ranking"` en sus estados); escritorio `g-side`
   (izquierda podio + lista; derecha 360 reglas + feed), < 1024 una columna sin feed y con `<details>`. Los cambios en vivo
   (FLIP, glow, conteo, toast) **no** son de esta unidad: llegan con `onSnapshot` en la fase 07; `RankAnnouncer` se monta una
   vez si lo usas.

### Trampas conocidas
- Zona de riesgo = 5 últimos **incluyendo empatados en el borde** (puede tener más de 5 filas); ya lo calcula
  `rankCompetition` (`enRiesgo`): no lo recalcules.
- El nombre accesible de la fila propia lleva "tú" ("Yeilin Duarte, tú") — ya lo hace `RankRow` con `esTu`; no lo dupliques.
- Elipsis del nombre solo en filas y podio, en una línea a 320.
- Una sola región viva por página: el feed (`aria-live`) **o** `RankAnnouncer`, no los dos anunciando lo mismo.
- El chip "En vivo" no puede depender solo del color (texto visible + punto decorativo `aria-hidden`).
- `localStorage` puede lanzar (modo privado): try/catch y abierto por defecto.

### Cómo verificar
- typecheck, lint, test, build; `/secciones/ranking/*` estáticas. En el HTML generado: un `<h1>`, dos `<ol>` de la lista,
  podio, separador de riesgo, aside con sus dos `h2`.
- Pruebas puras: mapeo a podio/lista con empates (también en el 3.º), subtítulo de equipo, tiempo relativo, texto de movimiento.

### Cierre
Changeset: ninguno. En el PR, "Decisión tomada / alternativa" para: pestañas por ruta y su semántica, `<details>` con
memoria, feed vs `RankAnnouncer`, variante profesor. Acciones manuales: ninguna. Reporte final como dice el brief
(inventario: fila de SECTION_INVENTORY para `components/sections/ranking/`).

---

## W2 — `feat/sec-profe-panel`

Eres el worker **W2**. Rama: `feat/sec-profe-panel`. Slot y puerto: los del mensaje que te lanza.
Decisiones: rango **D098–D101**. Filas de CONTENT_CHECKLIST: **77–79**.
Modelo · esfuerzo: **sonnet · medium**. Docker: **no**.

Decisiones previas además de las comunes: D007 (ajustes ± con motivo, nunca la nota), D041 (Badge `ok`/`err`/`acc`),
D042 (Card y `CardList`/`CardListItem`), D046–D047 (`UserAvatar`, `TeamLogo`), D076 (`HomeGrid` con slots `g-home`).

### Qué pide César
> "/orchestrate ola 3 de la fase 04" — plan: "`feat/sec-profe-panel` · Panel del profesor (saludo por hora, métricas `g3`,
> Por evaluar, Últimos ajustes)".

### Dónde está
- `design/HANDOFF.md:330-331` — §3 Panel del profesor. §9 #6 (saludo "Buenos días, {nombre}"; hoy el nombre es el
  placeholder `[Nombre del profe]`, fila 53) y #7 (el panel sí agrega ambas secciones).
- Lienzos: `design/canvas/Panel.dc.html`, `Panel-movil.dc.html`. Métricas del lienzo: "Por evaluar 7 · 4 individuales · 3
  grupales" · "Evaluados · Identidad de marca 12 / 69" · "Raspados 1 · María de los Ángeles Méndez · 8" (título `--error`
  + TriangleAlert). Filas Por evaluar: "{tarea} · {tipo} · entregó {nombre} el {fecha}" + "Evaluar" secondary sm;
  encabezado "Evaluar la primera →" primary sm; pie "Ver las 7".
- Reutiliza: `components/sections/inicio/home-grid.tsx` (`g-home` 7/5) si encaja sin editarlo; si no, `g-home` directo.
  `components/sections/shared/page-header.tsx`, `components/ui/{card,badge,button,toggle-group}.tsx`,
  `components/krea/{user-avatar,team-logo}.tsx`. Utilidad `g3` en `app/globals.css` (Layout, `:816-944`): comprueba que
  ya hace 1 / 2 (la 3.ª abajo) / 3 columnas; si la "3.ª abajo a todo el ancho" no está, resuélvelo en tu sección.
- Datos: `lib/demo/seed.ts` (alumnos, equipos, `TAREA_IDENTIDAD` para Evaluados y Raspados reales), `lib/demo/tareas.ts`
  (`TAREAS`), `lib/demo/usuarios.ts` (`USUARIO_PROFESOR`).

### Enfoque decidido
1. `lib/panel.ts` (+ prueba): `saludoPorHora(hora: number)` → "Buenos días" (5–11) / "Buenas tardes" (12–18) / "Buenas
   noches" (resto; fija los cortes y documéntalos); texto de métricas (singular/plural), texto de la fila ("Logo y paleta ·
   Grupal · entregó Yeilin el 25/10/2026"), texto del ajuste (+2/−1 con signo tipográfico "−", motivo · fecha y hora es-VE),
   filtro por sección 5A/5C/Ambas. **La hora no se lee en el servidor** (`cacheComponents`): la vista pasa una fija por
   estado; la fase 05 decide el reloj del cliente.
2. `lib/demo/ajustes.ts` con la forma **exacta** del brief ("Formas compartidas") y `lib/demo/panel.ts` con las filas de Por
   evaluar (la 1.ª y la 2.ª como fija el brief; total 7, muestras 4 como el lienzo).
3. `components/sections/profe-panel/`: `PanelHeader` (h1 saludo + "profe"/nombre según §9 #6 — conservador: "{saludo}, profe"
   como el lienzo — y segmentado 5A · 5C · Ambas), `PanelMetrics` (`g3` de tarjetas **enlace**: la tarjeta entera es un
   `<a>` con nombre accesible coherente, título small 700 + ícono, display, detalle; Raspados en `--error` + TriangleAlert,
   no solo color), `PendingReviews` (lista con avatar 40 / `TeamLogo` 40, nombre h4 — usa el nivel de título correcto bajo
   el `h2` de la tarjeta —, meta, "Evaluar" secondary sm con nombre accesible "Evaluar a Jorge Quintero"), `RecentAdjustments`
   (chip ±valor `ok`/`err` con Plus/Minus + texto, nombre h4, motivo + fecha small; "Nuevo ajuste" secondary sm → `/profe/puntos`).
4. Vista `/secciones/profe/[estado]` con `manana`, `tarde`, `noche` (y si quieres `5c`), `Vista rol="profesor" ruta="/profe"`.
   El segmentado de sección: estados por ruta o `ToggleGroup` local que filtra (decide y documenta; el filtro es puro en `lib/panel.ts`).

### Trampas conocidas
- Un ajuste de conducta mueve puntos, nunca la nota: el texto del chip es "+2 pts"/"puntos", no una nota (D007).
- El signo no puede ir solo por color: Plus/Minus + el signo en el texto accesible ("más 2 puntos" / "menos 1 punto").
- Tarjeta-enlace: no anides botones dentro del `<a>`; foco visible en la tarjeta entera.
- "Evaluar la primera →": la flecha es decorativa (`aria-hidden`).
- Nombres largos ("María de los Ángeles Méndez Chacón") envuelven a 320; nada de elipsis fuera del ranking.

### Cómo verificar
- typecheck, lint, test, build; en el HTML de `/secciones/profe/manana`: un `<h1>` "Buenos días, profe", tres tarjetas
  enlace, dos listas.
- Pruebas puras: cortes del saludo (bordes 4/5, 11/12, 18/19), plurales, texto de ajuste con signo, filtro por sección.

### Cierre
Changeset: ninguno. En el PR, "Decisión tomada / alternativa" para: cortes del saludo y nombre del profe, segmentado
(ruta vs filtro local), tarjetas enlace, forma de `DemoAjuste`. Reporte final como dice el brief (fila de
SECTION_INVENTORY para `components/sections/profe-panel/`).

---

## W3 — `feat/sec-evaluar`

Eres el worker **W3**. Rama: `feat/sec-evaluar`. Slot y puerto: los del mensaje que te lanza.
Decisiones: rango **D102–D105**. Filas de CONTENT_CHECKLIST: **80–82**.
Modelo · esfuerzo: **opus · medium** (cambio de API de componentes compartidos + widget de teclado). Docker: **no**.

Decisiones previas además de las comunes: D004 (pasos de 0,5; suman 20), D006/D013/D014 (base, redondeo, grupales sin
base), D032 (API de `NumberStepper`), D035 (Toaster), D040 (`GradePill`), D054–D055 (`ScorePicker`, atajos; hoy el stepper
"sin puntuar" = 0 + "Sin puntuar"), D056–D057 (`SumMeter`, `LiveTotal`), D058 (`QuestionHeader`, cuerpos separados),
D060 (visor Ampliar), D067 (`ActionBar`), D080 (Detalle: Raspado lo pinta la píldora).

### Qué pide César
> "/orchestrate ola 3 de la fase 04" — plan: "`feat/sec-evaluar` · Evaluar entrega (cabecera, medidor fijo, preguntas con
> `ScorePicker` en `QuestionCardReview`, acción) + `GradePill` 88×64 de Total en vivo + `NumberStepper` con `value: null`".
> Del plan, "Lo que dejó la fase 03": "`GradePill` 88×64 / fuente 32 para la tarjeta Total en vivo (+ opción de no pintar el
> chip Raspado); `NumberStepper` con `value: null` y `aria-labelledby` (hoy rodeado con 0 + «Sin puntuar» y `fieldset`);
> `ScorePicker` dentro de `QuestionCardReview` vía su `titleId`."

### Dónde está
- `design/HANDOFF.md:333-338` — §3 Evaluar entrega (topbar móvil, cabecera, medidor fijo, preguntas, acción, toast
  "Nota guardada · 18,5" + "Deshacer" 5 s). `:235-246` §2.11–2.12. `:179-186` §2.3. §8: Evaluar **sí** muestra la barra
  inferior y su barra de acción va a `bottom: 72px` (`grep -n "Evaluar sí" design/HANDOFF.md`).
- Lienzos: `design/canvas/Evaluar.dc.html`, `Evaluar-movil.dc.html`, `Extremos.dc.html` ("Contenido extremo": índice de
  chips 1…n desde 6 preguntas, stepper > 6). Textos: "Por evaluar · entrega 1 de 7", "Anterior"/"Saltar", "{tarea} ·
  entregó {nombre} (capitana) el 25/10/2026, 4:12 p. m.", chips "Grupal · 4 integrantes", "Sección 5A", "Base 20 · todos",
  premio; "Total en vivo", "9 / 20", "Nota resultante con Base 20", "2 de 5 puntuadas", "Faltan 3 preguntas por puntuar";
  "Guardar nota y seguir", "Se activa al puntuar las 5. Sigue: Jorge Quintero · Identidad de marca", atajos "0 – 9 y ,
  eligen el puntaje de la pregunta con foco · Ctrl + Enter guarda."; móvil "Faltan 3 por puntuar · Sigue: Jorge Quintero"
  + "Guardar y seguir".
- Componentes: `components/krea/grade-pill.tsx` + `lib/grade-pill.ts` (tamaños sm/md/lg/xl), `number-stepper.tsx` +
  `lib/stepper.ts`, `score-picker.tsx` + `lib/score.ts`, `live-total.tsx` + `lib/meters.ts` (`liveTotalInfo`),
  `sum-meter.tsx`, `question-card-review.tsx` (`score: ReactNode`, `titleId`), `image-viewer.tsx`, `team-logo.tsx`,
  `user-avatar.tsx`; `components/sections/shared/{action-bar,page-header,back-link}.tsx`; `components/ui/sonner.tsx`.
  `app/componentes/_familias/` usa estos componentes: **si cambias una API, actualiza su familia** en `/componentes`.
- Datos: `lib/demo/tareas.ts` (`TAREAS`: "Logo y paleta del emprendimiento" y sus preguntas), `lib/demo/entrega.ts`
  (`IMAGEN_DEMO`), `lib/demo/notas.ts` (`ENUNCIADOS_LIENZO` si está exportado; si no, no lo exportes tú: copia lo que
  necesites en tu demo), `lib/demo/seed.ts`.

### Enfoque decidido
1. **`GradePill`** (retrocompatible): un tamaño nuevo para la tarjeta Total en vivo, 88 × 64 con número Poppins 700 32
   (nombre a tu elección, p. ej. `"total"`; los valores sin token → tokens nuevos en tu bloque de `globals.css` o la escala
   fraccionaria de Tailwind, nunca `[Npx]`), y una prop para **no** pintar el chip Raspado (p. ej. `raspado="ninguno"`)
   cuando el contexto ya lo dice. Pruebas en `tests/unit/grade-pill.test.ts`. Actualiza la familia `/componentes` y su fila
   de COMPONENTS_INVENTORY. Si un `rounded-*`/`shadow-*` nuevo convive con otro en un `cn`, regístralo en `lib/utils.ts`.
2. **`NumberStepper`** (retrocompatible): `value: number | null` (null = "sin puntuar": campo vacío, `aria-valuenow` ausente
   y `aria-valuetext` "Sin puntuar"; el primer +/− parte de `min`), y `aria-labelledby` como alternativa a `label`. Lógica en
   `lib/stepper.ts` con pruebas. Luego quita el rodeo de `ScorePicker` (0 + "Sin puntuar" y `fieldset`, D055) si el nuevo
   stepper lo hace innecesario — sin cambiar su API pública — y deja D055 anotada como superada por tu decisión.
   **W4 (Alumnos) usa `NumberStepper` con `value: number` en paralelo:** el tipo numérico tiene que seguir compilando igual.
3. **`components/sections/evaluar/`**: `ReviewHeader` (eyebrow + Anterior/Saltar ≥ 1024; `TeamLogo`/avatar 56 + h1 + línea
   + chips), `ReviewTotalCard` (aside escritorio sticky top 24: eyebrow, `GradePill` total + "9 / 20" h2 + "Nota resultante
   con Base 20", barra de puntuadas, aviso de faltantes; reutiliza `LiveTotal`/`liveTotalInfo` si encaja — no dupliques el
   cálculo), en móvil `LiveTotal` barra sticky a 64 px bajo la topbar; índice de chips 1…n desde 6 preguntas (enlaces a
   `#pregunta-n`); `ReviewForm` (cliente): `<ol>` gap 24 de `QuestionCardReview` con `ScorePicker` en `score` y
   `labelledBy={titleId}`, comentario opcional, estado de puntajes; botón "Guardar nota y seguir" deshabilitado con
   `aria-describedby` a "Se activa al puntuar las 5…" hasta puntuar todas; `Ctrl+Enter` guarda (solo si está completo; no
   se dispara dentro de un `textarea` sin Ctrl); al guardar, toast "Nota guardada · 18,5" con "Deshacer" (5 s) y navega a la
   siguiente entrega con el scroll arriba. Móvil: `ActionBar` (sobre la barra inferior) con "Faltan 3 por puntuar · Sigue:
   …" + "Guardar y seguir".
4. `lib/evaluar.ts` (+ prueba): textos ("entrega 1 de 7", "Faltan 3 preguntas por puntuar"/"Falta 1", "Sigue: …"), si está
   completo, nota resultante con base (usa `notaFinal` de `lib/grades.ts`, D013; grupal sin base, D014), siguiente/anterior
   de la cola. `lib/demo/evaluar.ts`: `DemoEntrega` y la cola de 7 como fija el brief ("Formas compartidas"); respuestas de
   los alumnos = placeholder (§8, tu fila del checklist).
5. Vista `/secciones/evaluar/[estado]`: al menos `grupal` (1.ª, 5 preguntas, 2 puntuadas), `individual` (2.ª), `extremo`
   (≥ 6 preguntas con una de valor > 6 → stepper e índice de chips). `Vista rol="profesor" ruta="/profe/evaluar"` con
   `title`/`volverHref` para la topbar móvil (cerrar X · "Entrega 1 de 7" — si `Vista`/`TopBar` no admiten la X, usa lo que
   admiten y dilo). Toaster local en tu página de vista (D035). "Guardar" en la vista previa navega al estado siguiente.

### Trampas conocidas
- Una nota `null` nunca es "0" ni roja (D003): sin puntuar ≠ 0 puntos, en el stepper y en el total.
- La píldora nunca cambia el color del número; Raspado nunca solo por color.
- Las teclas 0–9 y `,` ya las maneja `ScorePicker` por pregunta con foco (D054): `Ctrl+Enter` a nivel del formulario no debe
  romperlas ni dispararse con Enter solo.
- Región viva: el total en vivo anuncia frase completa (D056/D057); no añadas otra que repita lo mismo.
- Sticky: el medidor móvil a 64 px bajo la topbar y la `ActionBar` a 72 px (`bottom-action`) no pueden tapar el foco
  (`scroll-margin` en las preguntas, D020).
- Cambiar `GradePill`/`NumberStepper` puede romper Detalle (D080), Mis notas y `/componentes`: corre la suite completa y el build.

### Cómo verificar
- typecheck, lint, test (suite completa), build; `/componentes` y `/secciones/*` siguen estáticas.
- Pruebas puras: stepper con `null` (inc./dec. desde null, `valuetext`), clases del tamaño nuevo y prop de Raspado, textos
  de `lib/evaluar.ts`, completitud, nota con base, navegación de la cola.
- Revisión por código: `ScorePicker` nombrado por el título de su pregunta, botón deshabilitado con su motivo, Ctrl+Enter.

### Cierre
Changeset: ninguno. En el PR, "Decisión tomada / alternativa" para: API nueva de `GradePill` y `NumberStepper` (y qué
pasa con D055), Ctrl+Enter y deshacer, medidor móvil vs aside, Toaster local. Reporte final como dice el brief (filas de
SECTION_INVENTORY para `components/sections/evaluar/` y de COMPONENTS_INVENTORY para `GradePill` y `NumberStepper`).

---

## W4 — `feat/sec-alumnos`

Eres el worker **W4**. Rama: `feat/sec-alumnos`. Slot y puerto: los del mensaje que te lanza.
Decisiones: rango **D106–D109**. Filas de CONTENT_CHECKLIST: **83–85**.
Modelo · esfuerzo: **sonnet · medium**. Docker: **no**.

Decisiones previas además de las comunes: D006/D013 (base 10–20, redondeo), D007, D030–D032 (Input, `Field`,
`NumberStepper`), D040 (`GradePill` con `table`), D044 (Table: `<section>` desplazable con nombre, `position: relative`,
`th` sticky, pista bajo 1024), D046 (`UserAvatar`), D071 (errores al enviar y foco al primer inválido).

### Qué pide César
> "/orchestrate ola 3 de la fase 04" — plan: "`feat/sec-alumnos` · Alumnos (filtros, búsqueda sin tildes, tabla, diálogo
> Editar con base y motivo)".

### Dónde está
- `design/HANDOFF.md:340-343` — §3 Alumnos. `:260-263` §2.15 Tabla. §8: `sr-only` dentro de contenedores con scroll
  (`grep -n "sr-only" design/HANDOFF.md`) y "Nombres/apellidos del alumno: editables por el profesor" (`CLAUDE.md`).
- Lienzos: `design/canvas/Alumnos.dc.html`, `Alumnos-movil.dc.html`. Columnas: Alumno (avatar 36 + nombre completo 14 700)
  · Cédula (tabular, con puntos de miles: "34.099.118") · Equipo (o chip warn "Sin equipo") · Base (número; chip-base si ≠ 20)
  · Nota individual (`GradePill` sm `table`; Raspado = ícono) · Puntos · "Editar" (ghost sm + Pencil + nombre en `sr-only`).
  Contador "5 resultados para «mé»" en `role="status"`. Ejemplo placeholder: base 15 de Jailyn Martínez (§8).
- Componentes: `components/ui/{table,dialog,input,field,button,badge,toggle-group,separator}.tsx`,
  `components/krea/{number-stepper,grade-pill,user-avatar}.tsx`. Nota y puntos reales de "Identidad de marca":
  `lib/demo/seed.ts` (`alumnosDeSeccion`, `puntosAlumno`, `equipoDe`, `TAREA_IDENTIDAD`), `lib/grades.ts`.
  `lib/cedula.ts` / `lib/mask.ts`: busca si ya hay un formateador de cédula con puntos (Perfil muestra "C.I. 33.272.397":
  `grep -rn "33.272\|miles" lib/ components/sections/perfil/`) — reutilízalo, no lo dupliques.
- Del plan, "Lo que dejó la fase 03": `SelectContent` y portales — en `/secciones` el tema/acento ya está en el documento
  (ver brief); si usas un `Select`, compruébalo y dilo.

### Enfoque decidido
1. `lib/alumnos.ts` (+ `tests/unit/alumnos.test.ts`): `normalizar(texto)` (NFD sin diacríticos, minúsculas, espacios
   colapsados), `filtrarAlumnos(lista, consulta)` por nombre, apellido o cédula (la cédula con o sin puntos: "34.099" y
   "34099" encuentran lo mismo), `contadorTexto(n, consulta)` ("5 resultados para «mé»", "1 resultado…", "Sin resultados
   para «x»"; sin consulta, el total de la sección), `validarEdicion({ baseAnterior, baseNueva, motivo, nombres, apellidos })`
   → errores (motivo obligatorio **solo si la base cambió**: "Escribe por qué cambias la base: el alumno lo verá."; nombres y
   apellidos no vacíos; base 10–20 en pasos de 0,5).
2. `components/sections/alumnos/`: `StudentFilters` (cliente: segmentado "5A · 35 / 5C · 34" con recuentos de los datos,
   búsqueda `Input` con Search mín. 240 máx. 420 y su `label` — visible o `sr-only`, decide —, contador en `role="status"`),
   `StudentsTable` (Table §2.15, mín. 760, `label` obligatorio, `hint` bajo 1024), `EditStudentDialog` (subtítulo "nombre ·
   C.I. · sección"; grid 2×2 nombres/apellidos con `Field`; divisor; Base con `NumberStepper` 10–20 paso 0,5 + ayuda "Nota
   final = puntaje × base / 20. Cambia todas sus notas…" del lienzo; "Motivo del cambio de base *" que aparece/se exige solo si
   la base cambió; Cancelar / Guardar cambios; errores al enviar y foco al primer inválido, D071). Guardar en la vista previa
   actualiza el estado local y cierra (sin Firestore); dilo.
3. La vista `/secciones/alumnos` (o `[estado]` con `5a`, `5c`, `editar` si quieres mostrar el diálogo abierto — un diálogo
   abierto por ruta necesita `defaultOpen`; decide y documenta) con `Vista rol="profesor" ruta="/profe/alumnos"`. La búsqueda y
   la sección filtran en cliente (`useState`), con la lista completa por props.

### Trampas conocidas
- `NumberStepper` cambia en paralelo en W3 (`value: number | null`): usa `value: number` y no dependas de lo nuevo.
- `sr-only` dentro de la tabla con scroll: el contenedor necesita `position: relative` (D044 ya lo trae: compruébalo, no lo
  dupliques). Sin scroll horizontal de página a 320.
- La nota `null` del alumno que no entregó = Pendiente, nunca "0" (D003); Raspado en tabla = ícono con `aria-label`.
- El motivo es obligatorio **solo** si la base cambió; volver a la base original lo quita.
- El contador `role="status"` se anuncia en cada tecla: frase completa y estable, no un número suelto.
- Búsqueda: "maria" encuentra "María"; "MÉ" encuentra "Méndez".

### Cómo verificar
- typecheck, lint, test, build; en el HTML de la vista: un `<h1>`, la tabla con su región nombrada, el botón Editar con el
  nombre del alumno accesible.
- Pruebas puras: normalización y filtro (tildes, mayúsculas, cédula con/sin puntos), contador (0/1/n), validación (base
  igual / distinta, motivo vacío, nombres vacíos, base fuera de rango o fuera del paso).

### Cierre
Changeset: ninguno. En el PR, "Decisión tomada / alternativa" para: etiqueta de la búsqueda, motivo condicional, diálogo
por ruta o no, guardado local en la vista previa. Reporte final como dice el brief (fila de SECTION_INVENTORY para
`components/sections/alumnos/`).
