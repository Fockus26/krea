# Prompts por unidad — orquestación 2026-10-30 (fase 03, ola 3, main @ 5a3a1b2)

Brief: `context/plans/orchestration-2026-10-30-f03-ola3.md` (+ las reglas de `orchestration-2026-10-29-f03.md` que cita).

**Común a las cuatro** (además del brief):
- Decisiones de base: D025 (sin alias shadcn, `cn` extendido), D026 (`dark:`), D027 (utilidades de movimiento), D028
  (Button), D029 (carpetas y `/componentes` con `Familia`/`Muestra`/`Escenario`). Patrón de familia completa:
  `app/componentes/_familias/chips.tsx` o `identidad.tsx`; patrón de componente propio: `components/krea/grade-pill.tsx`
  + `lib/grade-pill.ts` (mapa de clases puro y probado).
- Convenciones de §2 (`design/HANDOFF.md:156-159`): foco `outline 2px --accent-ink offset 2`, táctil 44, íconos lucide
  trazo 2 / 20 px (16 en chips y textos pequeños, 24 en barras superior/inferior).
- Referencia exacta de medidas: `design/canvas/krea.css` (las líneas que cita tu prompt). Si un valor no está ni en el
  handoff ni en el lienzo, no lo estimes: déjalo marcado y dilo en el PR.
- Cifras con `nums` (tabulares); notas y puntos con `formatNota`/`formatDecimal` (coma es-VE), nunca `toFixed`.
- Tu página: **solo** `app/componentes/_familias/<tu-familia>.tsx` (hoy un stub `Pendiente`): cada componente × variante ×
  estado, con datos de ejemplo realistas en español (nombres del estilo del seed: "Juana Montero", "Mateo Paredes"; los
  textos de ejemplo son provisionales → tus filas del checklist). Se ve en 4 acentos × claro/oscuro por el `Escenario`.
- Si tu familia necesita interacción, que el componente cliente sea solo esa sección, no la página.
- Sin entorno DOM: pruebas solo de lógica pura en `tests/unit/` (mapas de clases, textos accesibles, cálculos).
- Al terminar, el `grep -rnE '\[[0-9]+px\]|\[#[0-9a-fA-F]{3,8}\]'` sobre tus archivos de `components/` y `lib/` limpio.

---

## W7 — `feat/ui-ranking`

Eres el worker **W7**. Rama: `feat/ui-ranking`. Slot y puerto: los del mensaje que te lanza.
Decisiones: rango **D050–D053**. Filas de CONTENT_CHECKLIST: **41–43**.
Modelo · esfuerzo: **sonnet · medium**. Docker: **no**.

Decisiones previas además de las comunes: D040 (`GradePill`), D041 (Badge: variantes `neutral`/`tu`… y `StatusBadge`),
D046–D049 (Avatar `size`/`ring`, `UserAvatar`, `TeamLogo` por hash, utilidades de identidad) —
`cat context/decisions/D0NN-*.md` en tu slot.

### Qué pide César
> "/orchestrate ola 3 de la fase 03" — plan: "`feat/ui-ranking` · `RankRow` (top 10, propia, 11–30, zona de riesgo,
> delta, empate), `Podium` (estudiantes y equipos) (§2.9–2.10)". Del plan, "Para la ola 2": "`k-glow` y FLIP quedan para
> `feat/ui-ranking`".

### Dónde está
- `design/HANDOFF.md:218-233` — §2.9 fila y §2.10 podio. `design/HANDOFF.md:463-470` — §6 filas "Subir de puesto",
  "Entrar al podio", "Caer a zona de riesgo", "Fuera del top 10" y los anuncios de texto (`:472-474`).
  `design/HANDOFF.md` §8 (`grep -n "Empates\|Zona de riesgo =" design/HANDOFF.md`): empates 1-2-2-4, chip "Empate" solo
  en el top 10, zona de riesgo = 5 últimos **incluyendo empatados en el borde**, opacidad solo en el avatar.
- `design/canvas/krea.css:326-357` (`.podium`, `.pod*`, `.rk*`, `.delta*`, `.risk-sep`) y `:391-405` (`k-glow`, `k-shake`,
  `k-pop` y su bloque reduced motion). Pantallas: `design/canvas/Ranking.dc.html`, `Ranking-movil.dc.html`, `Momentos.dc.html`.
- `lib/ranking.ts` — `rankCompetition` (devuelve `puesto`, `empate`, `enRiesgo`), `mostrarChipEmpate`, `ZONA_RIESGO`,
  `TOP_CHIP_EMPATE`. Reúsalo; puedes **añadir** funciones puras ahí (texto accesible, tipo de fila), no cambies las existentes.
- `components/krea/user-avatar.tsx`, `components/krea/team-logo.tsx`, `components/ui/badge.tsx` — se usan, no se editan.
- `app/globals.css:893-1110` — bloque de movimiento D027 (ya hay `animate-shake`, `animate-pop`, `--d-rank`, `--d-celebrate`,
  `--z-rank-moving`). Eres la **única** unidad que puede editar `globals.css`: bloque nuevo propio tras ese.
- `app/componentes/_familias/ranking.tsx` — stub a reemplazar.

### Enfoque decidido
1. **`components/krea/rank-delta.tsx`** — chip 22 px: sube (`--success` sobre success 10 % + ChevronUp), baja (`--error`
   sobre error 12 % + ChevronDown), igual ("=" `--text-2`). Texto visible = número; texto accesible "subió 2 puestos" /
   "bajó 1 puesto" / "sin cambios" (singular/plural; función pura en `lib/`, probada). `color-mix` de tokens, sin hex.
2. **`components/krea/rank-row.tsx`** — grid `36px 40px 1fr auto auto` (columnas con la escala de Tailwind / tokens, no
   `[36px]`), estados por prop derivados de `RankingPuesto`: `top` (≤ 10: superficie + `shadow-1`, puesto en círculo 32
   `--accent-soft-2`), `me` (fondo `--accent-soft` + borde interior 2 px `--accent` + chip "tú" de Badge), normal (11–30, sin
   fondo), `risk` (fondo `--surface-2`, `grayscale` + opacidad .75 **solo en la imagen del avatar**, puesto y puntos `--text-2`).
   `me` se combina con cualquiera de los otros. Chip "Empate" (Badge neutral) solo cuando `mostrarChipEmpate`. Funciona para
   estudiante (`UserAvatar`, subtítulo = equipo) y equipo (`TeamLogo`, subtítulo "n integrantes · capitán {nombre}"): un prop
   `media: ReactNode` o dos variantes — tú eliges y lo documentas. Nombre accesible del `<li>` "Puesto 4, Juana Montero, 30,5
   puntos, subió 2" (función pura probada; mira que el lector no lo lea dos veces: el contenido visual va `aria-hidden` o el
   nombre sale del contenido, decide y documenta).
3. **Lista y separador:** `RankList` (`<ol>`) que pinta las filas y, antes de la primera fila `enRiesgo`, el separador "Zona
   de riesgo · 5 últimos" (12 px 700 mayúsculas `--error` + TriangleAlert 16 + línea punteada 2 px). El separador **no** puede
   romper la semántica de la lista (un `<li>` extra cambia el recuento): elige cómo (p. ej. dos `<ol>` con `start`, o el
   separador como encabezado fuera de la lista) y documenta la opción en una decisión.
4. **`components/krea/podium.tsx`** — `<ol>` grid 3 columnas, orden visual 2-1-3 pero orden del DOM 1-2-3 (con `order-*`),
   gap 8 (16 desde md), padding superior 32. Columna: avatar 64 (80 el 1.º con `ring`) · nombre 14/18 700 una línea · puntos
   Poppins 700 15 · escalón (radio 16 16 8 8; 1.º `--accent` + `--on-accent` 36/40, alto 120/144; 2.º `--accent-soft-2` +
   `--accent-ink` 28/32, 88/104; 3.º `--accent-soft`, 64/76). Corona Crown 32 sobre el 1.º: `--warning` claro / `--secondary`
   oscuro (variante `dark:` de D026). Variante equipos con `TeamLogo`. Empates en el podio: muestra el puesto que dé
   `rankCompetition` (dos 2.º si los hay); si con menos de 3 entradas no hay diseño, la opción conservadora + decisión.
5. **Movimiento** (bloque propio en `globals.css`): `k-glow` como en `krea.css:393` (`--d-celebrate`, una vez),
   `animate-glow`, y la fila "moviéndose" (`scale(1.03)` + `shadow-3` + `z-rank-moving`) como estado por atributo
   (`data-moving`), más `animate-shake` ya existente para "caer a riesgo". Con reduced motion: sin escala, glow ni temblor;
   en su lugar borde 2 px `--accent` 3 s (§6). **El FLIP** (medir, invertir, reproducir al reordenar) va en un hook cliente
   `components/krea/use-flip.ts` que anima solo `transform` con `--d-rank`/`--ease` y no hace nada con reduced motion; su
   cálculo de desplazamientos es puro y probado en `lib/`. El conteo de puntos y el confeti **no** son de esta unidad (llegan
   con el ranking en vivo): dilo en la decisión.
6. **Familia** `ranking.tsx`: lista de ~12 filas con top 3, empate en el top 10, fila propia dentro y fuera del top 10, 11–30,
   zona de riesgo con empate en el borde (6 filas); deltas sube/baja/igual; podio estudiantes y equipos; un botón "Simular
   cambio de puesto" que reordena dos filas para ver el FLIP y el glow (cliente, solo esa muestra).

### Trampas conocidas
- La opacidad de riesgo va **solo** en el `<img>`/medio del avatar, nunca en la fila ni en el texto (§8).
- `filter: grayscale` no es `transform`/`opacity` pero es estático (no se anima): está bien; lo que se anima solo `transform`/`opacity`
  (el glow es `box-shadow` en el lienzo: anímalo en un pseudo-elemento con `opacity`/`transform`, o justifica en la decisión).
- El nombre debe hacer elipsis en 1 línea a 320 px: `min-w-0` en la celda del grid.
- Las cifras del podio en `--accent-ink` sobre `--accent-soft-2` son texto grande (≥ 3:1): no las bajes de 28 px.
- Región viva de anuncios: **única por página** (§6). No la metas dentro de cada fila; si la expones, como componente aparte
  (`RankAnnouncer`) con la agrupación "3 cambios en el ranking: …" como función pura probada.

### Cómo verificar
- typecheck, lint, test, build (`/componentes` sigue estática).
- Pruebas puras: texto accesible de la fila y del delta, tipo de fila desde `RankingPuesto`, desplazamientos FLIP, agrupación
  de anuncios.
- Revisión por código: `<ol>` y recuento correctos, estados no solo por color (chip "tú", ícono en el separador, flechas en el
  delta), reduced motion cubre glow, escala, temblor y FLIP.

### Cierre
Changeset: ninguno. En el PR, "Decisión tomada / alternativa" para: separador de riesgo y semántica de la lista, nombre
accesible de la fila, API estudiante/equipo, FLIP y glow con reduced motion. Acciones manuales: ninguna. Reporte final como
dice el brief (inventario: RankRow, RankDelta, RankList, Podium, useFlip, RankAnnouncer si lo haces).

---

## W8 — `feat/ui-evaluacion`

Eres el worker **W8**. Rama: `feat/ui-evaluacion`. Slot y puerto: los del mensaje que te lanza.
Decisiones: rango **D054–D057**. Filas de CONTENT_CHECKLIST: **44–46**.
Modelo · esfuerzo: **opus · medium** (widget de teclado compuesto: riesgo de a11y). Docker: **no**.

Decisiones previas además de las comunes: D004 (pasos de 0,5; tareas suman 20), D006 (base 10–20), D032 (**API de
`NumberStepper`**), D038 (ToggleGroup single = radiogroup de Radix, sin deseleccionar, flechas que seleccionan), D039
(indicador con opacidad), D040 (`GradePill`).

### Qué pide César
> "/orchestrate ola 3 de la fase 03" — plan: "`feat/ui-evaluacion` · `ScorePicker` (≤6 botones / >6 stepper + atajos),
> `SumMeter`, total en vivo, barra por pregunta (§2.11–2.12)". La **barra por pregunta pasa a W9** (brief).

### Dónde está
- `design/HANDOFF.md:235-245` — §2.11 medidores y §2.12 `ScorePicker`. Pantallas: §3 "Evaluar entrega"
  (`grep -n "Evaluar entrega" design/HANDOFF.md`, medidor fijo y atajos `0–9`, `,`) y "Constructor" (tarjeta "Suma de valores").
  Lienzos: `design/canvas/Evaluar.dc.html`, `Evaluar-movil.dc.html`, `Constructor.dc.html`, `Extremos.dc.html` (valores > 6).
- `design/canvas/krea.css:300-318` (`.bar`, `.meter*`, `.state-*`, `.score*`).
- `components/ui/toggle-group.tsx` (D038) y `tests/unit/toggle-group.test.ts`; `components/krea/number-stepper.tsx` +
  `lib/stepper.ts` (`snapToStep`, `parseDecimal`, `formatDecimal`, `stepValue`); `components/krea/grade-pill.tsx`;
  `lib/grades.ts` (`gradeColor`, `notaFinal`, `formatNota`). Se usan, no se editan.
- `app/componentes/_familias/evaluacion.tsx` — stub a reemplazar.

### Enfoque decidido
1. **`lib/score.ts`** (puro, probado): opciones para un valor (0 · 0,5 · … · valor), umbral ≤ 6 → botones / > 6 → stepper,
   atajos 0 · ¼ · ½ · ¾ · valor **ajustados al paso de 0,5** con `snapToStep` (p. ej. ¼ de 7 = 1,75 → decide hacia dónde y
   documéntalo), y el **búfer de teclado**: teclas `0`–`9` y `,` escriben el valor de la pregunta con foco ("1" → 1, "1" "7"
   → 17 si cabe, "3" "," "5" → 3,5; lo que supere el valor o no caiga en el paso se rechaza o se ajusta — decide, documenta y
   prueba los casos), con caducidad del búfer (~1 s) como parámetro.
2. **`components/krea/score-picker.tsx`** — props: `value: number | null`, `onChange`, `max` (valor de la pregunta),
   `labelledBy` (id del título de la pregunta), `disabled`. ≤ 6: `ToggleGroup type="single"` (radiogroup) con un ítem por paso:
   min 44 × 44, padding 0 8, radio 12, borde 1 px `--input`, Poppins 700 15 tabular, gap 6, envuelven; hover `--surface-2`;
   elegido `--accent` + `--on-accent` + anillo `0 0 0 2px surface, 0 0 0 4px accent` (sombra de tokens, sin hex); el botón del
   valor máximo con borde 1,5 px (`.max`). `null` = ninguno elegido (Pendiente, D003). > 6: `NumberStepper` (`min 0`, `max`,
   `step 0.5`) + 5 atajos `Button ghost sm` que fijan el valor. Las teclas `0`–`9`/`,` funcionan en ambos modos dentro del
   widget con foco, y **no** se interceptan si el foco está en el input del stepper (ahí ya se escribe).
3. **`components/krea/sum-meter.tsx`** + estado puro en `lib/` — fila gap 16, padding 12 16, radio 16, `--surface` +
   `shadow-2`; ícono de estado 20 · "14 / 20" (Poppins 600 16) · barra alto 10 pista `--surface-3` · mensaje 13 700. Estados:
   faltan (warning + TriangleAlert, "Faltan 6", barra = suma/20), se pasó (error + X, "Te pasaste por 2", barra 100 %), exacta
   (success + Check, "Suma exacta", 100 %). Contenedor `role="status" aria-live="polite"`; que no anuncie en cada render
   (solo el mensaje cambia), y el estado no depende solo del color (ícono + texto).
4. **`components/krea/live-total.tsx`** — "Total en vivo de evaluación": mismo esqueleto + `GradePill` con
   `notaFinal(total, base)` (D006; `gradeColor` lo pone la píldora) + "x de n puntuadas". Dos presentaciones del handoff:
   barra compacta (móvil, sticky la pone la página) y tarjeta del aside (eyebrow "Total en vivo", píldora lg, "9 / 20" h2,
   "Nota resultante con Base 20", barra de preguntas puntuadas, aviso "Faltan 3 preguntas por puntuar"). Prop `variant`.
   **No** comparte componente con `SumMeter` (§8: "se parecen pero tienen datos y reglas distintas"): pueden compartir solo
   una barra interna o clases puras.
5. **Familia** `evaluacion.tsx`: ScorePicker de valor 2, 4 y 6 (vacío, con valor, deshabilitado) y de valor 8 y 20 (stepper
   + atajos); SumMeter en faltan/se pasó/exacta; LiveTotal en ambas variantes con base 20 y base 15, con preguntas pendientes
   y completas. Interactivos (cliente, solo esa sección).

### Trampas conocidas
- Radix ToggleGroup single en el proyecto ya tiene `role="radiogroup"` y no deselecciona (D038, con bandera + `click()` en
  `onFocus`): lee el componente antes de envolverlo; no dupliques el rol ni el manejo de flechas.
- `aria-labelledby` del grupo al título de la pregunta (el título lo pinta `QuestionCard` de W9, no tú): el id llega por prop.
- Las teclas `0`–`9` no deben chocar con la navegación del ToggleGroup ni con `Ctrl+Enter` (guardar, lo maneja la página).
- `notaFinal` redondea según §9: no recalcules la nota a mano.
- Cada botón de puntaje con nombre accesible legible ("3,5" se lee bien; "0,5 puntos" si el contexto no lo da): decide y prueba.

### Cómo verificar
- typecheck, lint, test, build.
- Pruebas puras: opciones por valor (0,5 → 2 botones; 6 → 13; 6,5 → stepper), atajos ajustados al paso, búfer de teclado
  (casos válidos, fuera de rango, coma doble, caducidad), estado y mensaje del SumMeter (singular/plural, decimales con coma).
- Revisión por código: patrón WAI-ARIA radiogroup, foco visible, `aria-live` sin duplicar anuncios, nada solo por color.

### Cierre
Changeset: ninguno. En el PR, "Decisión tomada / alternativa" para: búfer de teclado, redondeo de atajos, API de ScorePicker
y LiveTotal, y por qué SumMeter y LiveTotal no se unifican. Acciones manuales: ninguna. Reporte final como dice el brief
(inventario: ScorePicker, SumMeter, LiveTotal).

---

## W9 — `feat/ui-preguntas`

Eres el worker **W9**. Rama: `feat/ui-preguntas`. Slot y puerto: los del mensaje que te lanza.
Decisiones: rango **D058–D061**. Filas de CONTENT_CHECKLIST: **47–49**.
Modelo · esfuerzo: **sonnet · medium**. Docker: **no**.

Decisiones previas además de las comunes: D003 (`null` = Pendiente), D030–D031 (Input/Field, Textarea con contador),
D034 (`PortalScope`: overlays con tema/acento del escenario), D037 (overlay del diálogo), D041 (Badge), D043 (Alert).

### Qué pide César
> "/orchestrate ola 3 de la fase 03" — plan: "`feat/ui-preguntas` · cabecera compartida + `QuestionCard`
> detalle/responder/evaluar **sin unificar cuerpos** (§2.16, §8), `ImageUpload` con compresión en cliente (§2.17); el
> puntaje de 'evaluar' entra como slot (no importa `ScorePicker`)". Además recibe la **barra por pregunta** (§2.11) que el
> plan ponía en W8 (brief).

### Dónde está
- `design/HANDOFF.md:239` (barra por pregunta), `:264-275` (§2.16 y §2.17); §3 "Detalle de nota", "Tareas y entrega"
  (aviso de capitán: "Solo {Nombre} puede responder." con candado) y "Evaluar entrega" (`grep -n` por esos títulos);
  §8 "No convertir en componente compartido".
- `design/canvas/krea.css:302-304` (`.bar`, `.bar-g`), `:377-379` (`.answer`, `.comment`), `:439-442` (`.q*`), `:466+`
  (`.drop` y vecinos). Lienzos: `DetalleNota.dc.html`, `Tarea.dc.html`, `Tarea-movil.dc.html`, `Evaluar.dc.html`.
- `components/ui/{textarea,field,badge,alert,button,dialog,card}.tsx`, `components/ui/portal-scope.tsx`; `lib/grades.ts`
  (`gradeColor`, `formatNota`). Se usan, no se editan.
- `app/componentes/_familias/preguntas.tsx` — stub a reemplazar.

### Enfoque decidido
1. **`components/krea/question-header.tsx`** — compartida por las tres: número en cuadro 32 radio 10 `--accent-soft-2`
   (Poppins 700 15 `--text`) · enunciado h4 (nivel configurable, envuelve sin límite; recibe `id` para que el ScorePicker lo
   use como `aria-labelledby`) · valor a la derecha (Poppins 700 14 `--text-2`): "3,5 / 4" detalle, "vale 4" evaluar, "4 pts"
   responder (texto por variante, función pura probada). Gap 12.
2. **`components/krea/question-bar.tsx`** — alto 8, radio 999, pista `--surface-3`, relleno `gradeColor(obtenido / valor × 20)`
   (color dinámico por `style`, ancho por `transform: scaleX` o `width` — decide; si es `width`, no se anima), siempre con
   "3,5 / 4" en texto al lado; la barra `aria-hidden`. `obtenido` `null` → sin relleno y "Pendiente" (D003), nunca 0.
3. **Tres tarjetas, tres archivos, sin cuerpo común** (§8): `question-card-detail.tsx` (barra · eyebrow "Tu respuesta" +
   bloque `--surface-2` 12 14 radio 12 15/22 · comentario del profe opcional con fondo `--accent-soft`, Sparkles `--accent-ink`,
   "Comentario de tu profe" 13 700; respuesta de imagen como miniatura), `question-card-answer.tsx` (chip de formato
   Texto/Imagen · `Textarea` con contador "/ 600" o `ImageUpload` · estado bloqueado "Solo {Nombre} puede responder." con
   candado y sin campos, D012), `question-card-review.tsx` (respuesta texto o imagen 280 px con botón "Ampliar" que abre el visor
   · slot `score: ReactNode` · comentario opcional del profe con `Textarea` compacta 72 y contador "/ 280"). Solo comparten
   `QuestionHeader` y, si hace falta, clases puras.
4. **Visor "Ampliar"** — `components/krea/image-viewer.tsx` sobre `Dialog` (pantalla completa, título `sr-only` con el
   enunciado, cerrar con Esc y botón, foco de vuelta al botón "Ampliar"; dentro de `PortalScope` como D034).
5. **`components/krea/image-upload.tsx`** + **`lib/image.ts`** — estados: vacía (zona 2 px punteada `--input`, radio 16,
   padding 16, ícono Image + "Toca para subir una imagen · JPG o PNG, hasta 5 MB"; es un `<label>`/botón que abre un
   `<input type="file" accept="image/jpeg,image/png">` real y accesible por teclado), subiendo (nombre + % + barra + "Subiendo…
   no cierres la app" en región `aria-live`), lista (miniatura 220 px 4:3 radio 12 + chip nombre/peso + "Cambiar imagen"
   secondary sm + "Quitar" ghost sm `--error`), error (borde `--error` + `Alert` err con el motivo). El componente es
   **controlado**: recibe `status`/`progress`/`error` y emite `onSelect(blob)` / `onRemove`; **no** sube a Storage (fase 07).
   `lib/image.ts`: validación de tipo y peso (mensajes en español, probados), tamaño destino a 1600 px lado mayor sin
   agrandar (puro, probado), formato de peso "1,2 MB" (puro, probado) y `compressImage(file)` con `createImageBitmap` + canvas
   → JPEG 0,8 (no probable sin DOM: aislado y documentado). La URL de vista previa con `URL.createObjectURL` y su
   `revokeObjectURL` al cambiar o desmontar.
6. **Familia** `preguntas.tsx`: detalle con nota completa, parcial, pendiente y con/sin comentario; responder texto, imagen
   (vacía, subiendo al 45 %, lista, error) y bloqueada por capitán; evaluar texto e imagen con un **marcador de puntaje**
   (no importes `ScorePicker`: aún no está en `main`; un placeholder visible "Puntaje (ScorePicker, W8)" basta).

### Trampas conocidas
- El color de la nota nunca es color de texto (§8): la barra y la píldora sí, "3,5 / 4" en `--text`/`--text-2`.
- `next/image` no: D046 usa `<img>` (blobs locales y remotos); da `alt` real ("Respuesta de Juana a la pregunta 3"), y el
  `alt` del visor igual.
- El `<input type="file">` oculto debe seguir siendo alcanzable y nombrado (no `display:none` sin un control enfocable que lo abra).
- `aria-live` del progreso: no anuncies cada 1 %; el texto vivo cambia por tramos o solo al empezar/terminar (decide, documenta).
- Imágenes de 280 / 220 px a 320 px de pantalla: `max-w-full`, sin scroll horizontal.

### Cómo verificar
- typecheck, lint, test, build.
- Pruebas puras: texto de valor por variante, color/ancho/texto de la barra (incluido `null`), validación de tipo y peso,
  tamaño destino (vertical, horizontal, más pequeña que 1600), formato de peso.
- Revisión por código: tres cuerpos separados, visor con patrón dialog y retorno de foco, input de archivo accesible, reduced
  motion en lo que se mueva.

### Cierre
Changeset: ninguno. En el PR, "Decisión tomada / alternativa" para: cabecera compartida y por qué no hay cuerpo común,
API controlada de ImageUpload y compresión, visor, anuncio del progreso. Acciones manuales: ninguna. Reporte final como dice
el brief (inventario: QuestionHeader, QuestionBar, QuestionCardDetail, QuestionCardAnswer, QuestionCardReview, ImageViewer,
ImageUpload).

---

## W10 — `feat/ui-navegacion`

Eres el worker **W10**. Rama: `feat/ui-navegacion`. Slot y puerto: los del mensaje que te lanza.
Decisiones: rango **D062–D065**. Filas de CONTENT_CHECKLIST: **50–52**.
Modelo · esfuerzo: **sonnet · medium**. Docker: **no**.

Decisiones previas además de las comunes: D021 (AppShell estructural, slots), D034 (`PortalScope`), D036 (Sheet solo
`bottom`), D041 (Badge `acc`), D046–D048 (`UserAvatar`, `Logo`). `grep -rhi "^# D.*nav\|^# D.*AppShell" context/decisions/`
por si hay más.

### Qué pide César
> "/orchestrate ola 3 de la fase 03" — plan: "`feat/ui-navegacion` · contenido de la navegación §2.7: ítems por rol (lucide),
> lateral con tarjeta de usuario, topbar, barra inferior, hoja Menú del profe; se enchufa en los slots de `AppShell`".

### Dónde está
- `design/HANDOFF.md:205-211` — §2.7 completo (medidas, ítems por rol en lateral e inferior, qué va en el Menú del profe).
  `:250` — §2.13 hoja inferior (ítems 48 px, activo como nav lateral, "Cerrar sesión" `--error` tras divisor). §6 fila
  "Indicador de nav activo" (opacidad 150 ms, no se desliza). §8: tarjeta de usuario idéntica en ambos roles.
- `design/canvas/krea.css:139-184` (`.side`, `.topbar`, `.bnav`, `.pill-ic`, `[aria-current]`). Lienzos: `Inicio.dc.html`,
  `Inicio-movil.dc.html`, `Panel.dc.html`, `Panel-movil.dc.html`, `DetalleNota-movil.dc.html` (topbar con volver).
- `components/layout/AppShell.tsx` — ya pinta los landmarks: `<nav aria-label="Principal">` lateral y `<nav>` inferior,
  `<header>` de la topbar; tú das el **contenido** de cada slot. Tócalo solo si hace falta (p. ej. el inferior y el lateral
  tienen el mismo `aria-label`: si lo cambias, documéntalo).
- `components/ui/{sheet,badge,button,separator}.tsx`, `components/krea/{user-avatar,logo}.tsx`, `lib/layout.ts` (`Rol`).
  Se usan, no se editan.
- `app/componentes/_familias/navegacion.tsx` — stub a reemplazar.

### Enfoque decidido
1. **`lib/nav.ts`** (puro, probado; constantes aquí y no en un archivo cliente — trampa de Next 16): ítems por rol con
   etiqueta, `href` y ícono (nombre o componente lucide), qué ítems van en lateral, inferior y Menú; `isActive(href, pathname)`
   (ruta exacta para Inicio/Panel, prefijo para el resto: `/notas/x` activa Notas). Rutas según §3 (`/`, `/notas`, `/tareas`,
   `/ranking`, `/equipo`, `/perfil`; `/profe`, `/profe/evaluar`, `/profe/tareas`, `/profe/alumnos`, `/profe/equipos`,
   `/profe/puntos`, `/ranking`, `/profe/premios` — verifica cada una con `grep -n "(/" design/HANDOFF.md`; si alguna no está,
   la conservadora + decisión). Íconos lucide: elige y deja la tabla en la decisión.
2. **`side-nav.tsx`** (≥ lg): logo 132 px con padding 0 12 24, lista de ítems 44 px, padding 0 12, radio 12, gap 12, 15/20 600
   `--text-2`; hover `--surface-2` + `--text`; activo `aria-current="page"`, fondo `--accent-soft-2`, texto `--text` 700, ícono
   `--accent-ink`; contador opcional (Evaluar) Badge `acc` 22 px a la derecha con texto accesible ("3 por evaluar"). Pie:
   **`user-card.tsx`** (avatar 40, nombre 13 700, rol 13 `--text-2`, padding 12, radio 16, `--surface-2`) que enlaza a Perfil.
3. **`top-bar.tsx`** (< lg): izquierda logo 88 px **o** botón volver 44 (`aria-label` "Volver") + título h4; derecha avatar 36
   (estudiante, enlaza a Perfil) o botón "Menú" (profesor) que abre la hoja.
4. **`bottom-nav.tsx`** (< lg): 5 columnas; ítem = píldora de ícono 56 × 32 radio 999 + etiqueta 12/16 600; activo píldora
   `--accent-soft-2`, ícono y etiqueta `--accent-ink` 700. Ícono 24. Toque mínimo 44.
5. **`menu-sheet.tsx`** (profesor < lg): `Sheet` inferior con Tareas, Equipos y Premios (ítems 48 px, radio 12, gap 12, 600;
   activo como la lateral), divisor y "Cerrar sesión" en `--error` (prop `onSignOut`; la sesión real es de la fase 07).
6. **Ruta activa:** los componentes reciben `pathname` por prop **y** tienen un envoltorio cliente que lo lee con
   `usePathname()` (lee la guía de `next/navigation` en `node_modules/next/dist/docs/` antes): así la familia puede mostrar
   cada ítem activo sin navegar. Enlaces con `next/link`. Las rutas aún no existen: no pasa nada (el build no las valida).
7. **Familia** `navegacion.tsx`: lateral estudiante y profesor (con contador), topbar en sus 3 formas (logo + avatar, logo +
   Menú, volver + título), barra inferior de ambos roles con distintos activos, y el botón que abre el Menú. Dentro de marcos
   de ancho fijo para verlas fuera de su breakpoint (la familia no usa `AppShell`, o si lo usa, que no pinte un segundo `<main>`:
   la página ya tiene uno).

### Trampas conocidas
- El indicador activo cambia con **opacidad 150 ms** (§6, D039), no se desliza; con reduced motion, inmediato.
- `aria-current="page"` solo en el ítem activo; el estado activo no es solo color (peso 700 + fondo de la píldora).
- El Menú abierto dentro de la hoja: si metes un `DropdownMenu` dentro, `--z-popover` (40) < `--z-overlay` (50) lo deja detrás:
  toma nota en el reporte, no lo arregles aquí.
- Hoja y topbar dentro de un `Escenario`: usa `PortalScope` (D034) para que la hoja salga con el tema/acento del escenario.
- Barra inferior: respeta `env(safe-area-inset-bottom)` (ya lo hace `h-bnav` del AppShell: no lo dupliques).
- En el lateral, el `<nav>` ya lo pone `AppShell`: tu `SideNav` no anida otro `<nav>`; usa `<ul>` de enlaces.

### Cómo verificar
- typecheck, lint, test, build.
- Pruebas puras: ítems por rol y por superficie (lateral 6/8, inferior 5/5, Menú 3), `isActive` (exacta, prefijo, raíz),
  texto accesible del contador.
- Revisión por código: landmarks sin duplicar, `aria-current`, foco visible, hoja con patrón dialog y retorno de foco al botón Menú.

### Cierre
Changeset: ninguno. En el PR, "Decisión tomada / alternativa" para: `lib/nav.ts` e íconos, ruta activa por prop + envoltorio,
cambios a `AppShell` si los hubo, Menú del profe. Acciones manuales: ninguna. Reporte final como dice el brief (inventario:
SideNav, UserCard, TopBar, BottomNav, MenuSheet, `lib/nav.ts`).

---

## C3 — `chore/cierre-fase-03` (cierre de la fase 03, main @ 422ce11)

Eres el worker **C3**. Rama: `chore/cierre-fase-03`. Slot y puerto: los del mensaje que te lanza.
Decisiones: rango **D066–D069**. Filas de CONTENT_CHECKLIST: **53–54** (solo si hay copy nuevo).
Modelo · esfuerzo: **opus · medium** (transversal: tokens + a11y en muchos archivos). Docker: **no**.
Lee el brief de la ola 3 (`orchestration-2026-10-30-f03-ola3.md`) y sus reglas, **con un cambio**: en esta unidad
puedes editar `app/globals.css`, `lib/utils.ts` y cualquier componente de `components/` (es el barrido de cierre); sigue
sin tocar `package.json`/`bun.lock`. Decisiones a leer: D017 (roles tipográficos), D025 (`cn`), D030–D032, D034, D037,
D040, D049, D050–D065 solo la que toque el archivo que editas.

### Qué pide César
> "Continúa" (tras mergear #15–#18) — el plan de la fase, sección "Cierre de la fase (después de la ola 3, lo hace el
> orquestador)" de `context/plans/phase-03-componentes.md` (carpeta principal): léela entera, es tu lista.

### Qué hacer (en este orden, un commit por bloque)
1. **Tokens que faltan** en `app/globals.css` (con su comentario de origen, en el bloque que corresponda, claro y oscuro si
   cambia con el tema) y **sustituir** el valor suelto en cada uso:
   - rol tipográfico 15/22 (`text-[0.9375rem] leading-[1.375rem]` en `components/ui/alert.tsx:19`,
     `components/krea/question-card-detail.tsx:54,67`, `question-card-review.tsx:63`);
   - rol 15/20 600 de ítem de nav (`components/layout/nav-item-link.tsx:46`) y de toast (`components/ui/sonner.tsx:31`,
     `text-[0.9375rem]/5`) — decide si es un solo rol; 12/16 600 de la etiqueta de la barra inferior (`bottom-nav.tsx`);
   - número de la cabecera de pregunta Poppins 700 15 (`question-header.tsx:40`) y `text-score` Poppins 700 15/20 tabular
     (`score-picker.tsx`, hoy `text-button font-heading nums`) — ¿el mismo rol? decide;
   - `--r-grade-xl` 28 px (`lib/grade-pill.ts:23,31`, `rounded-[1.75rem]`);
   - `--scrim` rgb(20 18 26/.55) + `bg-scrim` (D037: overlay de `dialog.tsx` y `sheet.tsx`, visor `image-viewer.tsx`;
     cambia D037 a Implemented) y `--on-scrim` (#FFF) para el chip de la miniatura de `image-upload.tsx` (hoy `text-white`
     sobre `bg-grade-ink/70`; lienzo rgb(17 17 17/.7)): mide el contraste y dilo;
   - `--w-score-max` 1,5 px si no basta `--w-btn-border` (hoy lo reutiliza: si son el mismo valor por la misma razón,
     déjalo y documenta);
   - **Cada rol nuevo y los que añadió W7** (`text-rank-delta`, `text-pod-*`) entran en `TEXT_ROLES` de `lib/utils.ts`
     para que `cn` los fusione; quita el `text-xs!` del chip "Empate" de `rank-row.tsx` si ya no hace falta. Prueba en
     `tests/unit/utils.test.ts`.
2. **`GradePill`**: tamaño para la tarjeta "Total en vivo" 88 × 64, número 32 (`design/canvas/Evaluar.dc.html:118`,
   HANDOFF §3 "Evaluar entrega") y prop para no pintar el chip Raspado (el contexto ya lo dice); úsalo en
   `components/krea/live-total.tsx` (hoy `size="lg"` + `table`). Actualiza D040 o crea la tuya.
3. **`NumberStepper`**: admitir `value: number | null` (vacío = sin valor, no 0; D003) y `aria-labelledby`; quita el rodeo
   de `score-picker.tsx` (0 + "Sin puntuar" + `fieldset`) si ya no hace falta. Pruebas en `tests/unit/stepper.test.ts`.
4. **Portales y z-index**: `SelectContent` (`components/ui/select.tsx`) por `usePortalContainer` como `dropdown-menu.tsx`
   (D034); y un Select/menú abierto dentro de un Dialog o Sheet no debe quedar detrás (`--z-popover` 40 < `--z-overlay` 50).
   Elige la solución (p. ej. el contenido flotante sube de capa cuando su portal está dentro de un overlay) sin cambiar el
   orden del handoff para el caso general; decisión propia.
5. **`/componentes` completo**: en `_familias/preguntas.tsx`, sustituye el marcador "Puntaje (ScorePicker, W8)" por el
   `ScorePicker` real enlazado con `titleId`. Revisa que las 10 familias estén y sin stubs `Pendiente`.
6. **Listas y VoiceOver** (backlog, Medio): el reset de Tailwind quita `list-style` y Safari/VoiceOver puede dejar de anunciar
   `ol/ul` como listas; Biome prohíbe `role="list"`. Investiga en `node_modules` la regla de Biome y decide (p. ej. regla base
   `list-style: ""`/`list-style-type` en `globals.css`, o desactivar la regla en esas líneas con justificación). Decisión propia.
7. **Barrido final**: `grep -rnE '\[[0-9.]+(px|rem)\]|\[#[0-9a-fA-F]{3,8}\]' components/ lib/` limpio (los `@max-[25rem]`
   de contenedor de `tabs.tsx:88`/`toggle-group.tsx:120` son consultas de contenedor: si no hay token de ancho, déjalos y dilo);
   `app/tokens/page.tsx`: `title: "Tokens"` (la plantilla añade " · KREA"; backlog Low).
8. **Revisión a11y por código** de los widgets compuestos (ToggleGroup/ScorePicker radiogroup, Tabs, Dialog, Sheet,
   DropdownMenu, Select, RankList, ImageUpload) y de las transiciones con reduced motion: tabla en el PR (widget · patrón
   WAI-ARIA · ok / arreglado / pendiente de teclado real). Lo que necesite teclado o lector reales queda para el QA final.

### Lo que NO haces
- `components/ui/toggle.tsx` sin uso: se señala, no se borra.
- El `<Toaster />` global (fase 05), el perfil del profesor (pregunta de la fase 05), el ranking en vivo.

### Cómo verificar
typecheck, lint, test (suite sola), build. `tests/unit/tokens.test.ts` en verde (si cambias su alcance, dilo). Sin servidor ni
capturas (decisión de César).

### Cierre
Changeset: ninguno. PR en español "chore: cierre de la fase 03 — tokens pendientes, portales y a11y" con una tabla de cada
punto de la lista del plan (hecho / no aplica / queda para fase N). Reporte final como dice el brief (PHASE_LOG, filas de
checklist si hubo copy, filas de inventario que cambien, tokens creados).
