# KREA — Handoff de diseño

> Para quien implementa sin haber visto el diseño. Todo valor está aquí; si algo no está, es una
> pregunta abierta (§9), no algo que se estima del mockup.
>
> - **Lienzo de diseño:** https://claude.ai/artifact/FtZd2CDYpe3sjJhAqfwZkc (5 páginas: Sistema y marca ·
>   Estudiante · Profesor · Estados y momentos · Acentos). Cada pantalla tiene un tablero a 1440 y otro a 390.
>   Los tableros tienen *Tweaks* (acento, tema y, según la pantalla, variante) para ver cada estado.
> - **Fuente del lienzo en el repo:** `design/canvas/*.dc.html` (markup de cada tablero) y
>   `design/canvas/krea.css` (hoja única con todos los tokens y componentes; es la referencia exacta de
>   este documento — si hay duda entre texto y CSS, manda el CSS).
> - **Assets de marca listos:** `design/assets/brand/` (§5).
> - Idioma de la interfaz: español de Venezuela. Decimales con coma (`18,5`), fechas `dd/mm/aaaa`,
>   horas `4:12 p. m.`.

---

## 1. Tokens

Todos se declaran como variables CSS en `:root` (claro) y `[data-theme="dark"]` (oscuro), y el acento
en `[data-accent="…"]`. En Tailwind v4 se exponen con `@theme inline` (`--color-accent: var(--accent)` …).
El tema "Sistema" = sin `data-theme` + `@media (prefers-color-scheme: dark)` aplicando los valores oscuros.

### 1.1 Acento (elegible por el estudiante; por defecto azul)

| Token | Uso | Azul | Rojo | Verde | Morado |
|---|---|---|---|---|---|
| `--accent` claro | fondo de botón primario, tarjeta de puntos, podio 1.º, indicadores | #295AC3 | #EE0400 | #115445 | #734AD1 |
| `--on-accent` claro | texto/ícono sobre `--accent` | #FFFFFF (6,28:1) | #FFFFFF (4,51:1) | #FFFFFF (8,83:1) | #FFFFFF (5,79:1) |
| `--accent-ink` claro | texto/enlace/ícono del acento sobre fondo o superficie | #295AC3 (5,75:1 bg · 6,28:1 surface) | #C80300 (5,55:1 · 6,05:1) | #115445 (8,09:1 · 8,83:1) | #734AD1 (5,30:1 · 5,79:1) |
| `--accent` = `--accent-ink` oscuro | ídem en oscuro | #7AA2F7 (7,37:1 bg · 6,72:1 surface) | #FF6B5E (6,64:1 · 6,06:1) | #4FC4A6 (8,64:1 · 7,89:1) | #A98BF0 (6,75:1 · 6,16:1) |
| `--on-accent` oscuro | texto sobre `--accent` oscuro | #14121A (7,37:1) | #14121A (6,64:1) | #14121A (8,64:1) | #14121A (6,75:1) |
| `--splash` | gotas del logo, círculos decorativos (nunca texto ni estado) | #00E5F5 | #FFC23D | #A0F25A | #FF8AD8 |
| `--accent-soft` | `color-mix(in srgb, var(--accent) 12%, var(--surface))` claro / 16 % oscuro: fila "tú", comentario del profe, aviso info | #E5EBF8 | #FDE1E0 | #E2EAE9 | #EEE9F9 |
| `--accent-soft-2` | 22 % claro / 28 % oscuro: nav activo, chip de acento, número de pregunta, píldora de la barra inferior | #D0DBF2 | #FBC8C7 | #CBD9D6 | #E0D7F5 |
| `--accent-hover` | primario en hover: `color-mix(accent 88%, #000)` claro / `(accent 88%, #fff)` oscuro | #244FAC (blanco 7,53:1) | #D10400 (5,63:1) | #0F4A3D (10,16:1) | #6541B8 (7,00:1) |

Contrastes medidos sobre los tintes (peor caso por par):

| Par | Claro (peor acento) | Oscuro (peor acento) | Regla |
|---|---|---|---|
| `--text` sobre `--accent-soft` | 13,31:1 (rojo) | 11,24:1 (verde) | OK texto normal |
| `--accent-ink` sobre `--accent-soft` | 4,87:1 (morado) | 4,74:1 (morado) | OK texto normal |
| `--text` sobre `--accent-soft-2` | 11,10:1 (rojo) | 8,59:1 (verde) | OK |
| `--accent-ink` sobre `--accent-soft-2` | 4,09:1 (rojo) | 3,77:1 (morado) | **solo íconos y texto ≥ 19 px bold**. El texto normal sobre `soft-2` va en `--text` (por eso el nav activo y los chips de acento tienen texto `--text` e ícono `--accent-ink`) |
| Foco `--accent-ink` sobre `--bg` | 5,30:1 (morado) | 6,64:1 (rojo) | ≥ 3:1 |
| Logo `--accent` sobre `--bg` | 4,13:1 (rojo) | — | logotipo, exento |

### 1.2 Neutros y estados

| Token | Claro | Oscuro | Uso | Contraste |
|---|---|---|---|---|
| `--bg` | #F6F4FA | #14121A | fondo de la app | — |
| `--surface` | #FFFFFF | #1E1B26 | tarjetas, tablas, barra inferior, diálogos | — |
| `--surface-2` | #F0EDF6 | #26222F | respuesta del alumno, filas hover, zona de riesgo, segmentados | `--text-2` encima 5,90:1 / 6,51:1 |
| `--surface-3` | #E9E5F1 | #2E2A38 | pista de barras, skeleton, botón deshabilitado | — |
| `--text` | #221D2B | #F4F1F8 | texto principal | 15,05:1 bg · 16,42:1 surface / 16,61:1 · 15,15:1 |
| `--text-2` | #5E5869 | #ABA5B8 | metadatos, ayudas | 6,26:1 · 6,83:1 / 7,78:1 · 7,10:1 |
| `--text-dis` | #8C8697 | #6E687A | texto de control deshabilitado (exento WCAG 1.4.3) | 2,84:1 sobre surface-3 / 2,61:1 |
| `--divider` | #E6E2EE | #2E2A38 | separadores (decorativo) | — |
| `--input` | #8C8697 | #8A8496 | borde de input, de botones de puntaje | 3,52:1 surface / 4,69:1 · 3,04:1 sobre surface-2 |
| `--success` | #157A3B | #5BD68A | entregada, sube, suma exacta | 5,41:1 / 9,22:1 sobre surface |
| `--warning` | #9A5B00 | #FFC23D | por entregar, faltan | 5,43:1 / 10,51:1 |
| `--error` | #C80300 | #FF6B5E | raspado, error, se pasó, zona de riesgo | 6,05:1 / 6,06:1 |
| `--secondary` | #FFC23D | #FFC23D | chip Capitán, premios | `--on-secondary` #221D2B encima 10,20:1 |
| `--grade-ink` | #111111 | #111111 | número dentro de la píldora de nota | ver §1.3 |
| `--sel-bg` / `--sel-text` | #E4DCF7 / #221D2B | #3B3350 / #F4F1F8 | `::selection` (distinto del foco y de los enlaces) | 12,42:1 / 10,58:1 |
| `--scroll-thumb` / `--scroll-track` | #7A7486 / #ECE9F2 | #6E687A / #1E1B26 | `scrollbar-color` + `::-webkit-scrollbar` 10 px, thumb radio 999 px | 3,75:1 / 3,16:1 |

Tintes de estado (chips, avisos), medidos:

| Elemento | Claro | Oscuro |
|---|---|---|
| `chip-ok` fondo `success` 10 % | #E8F2EB, texto #157A3B 4,73:1 | 14 % #273534, texto 6,95:1 |
| `chip-warn` fondo `warning` 10 % | #F5EFE6, texto #9A5B00 4,75:1 | 14 % #3E3229, 7,70:1 |
| `chip-err` fondo `error` 12 % | #F8E1E0, texto #C80300 4,85:1 | 12 % #39252D, 5,09:1 |
| `chip-prize` fondo `secondary` 30 % / 18 % | #FFEDC5, texto `--text` 14,21:1, ícono `--warning` 4,70:1 | #46392A, texto 10,00:1, ícono #FFC23D 6,94:1 |
| `alert-err` fondo `error` 10 % + borde interior 1,5 px `--error` | #FAE6E6, texto 13,71:1 | — |
| `alert-warn` fondo `secondary` 26 % | #FFEFCD, texto 14,45:1 | — |
| `alert-ok` fondo `success` 12 % | #E3EFE7, texto 13,89:1 | — |
| Toast | fondo #221D2B, texto #F4F1F8 14,69:1 | invertido: #F4F1F8 / #221D2B |

> Las mezclas son `color-mix(in srgb, …)`; los hex de la tabla son el resultado para ese tema y sirven
> para pruebas visuales. En oscuro las mezclas usan `--surface` oscura.

### 1.3 Escala de color de notas — `gradeColor(n)`

Degradado continuo en HSL (no por rangos), igual en claro y oscuro:

- `n ≤ 10`: `t = (n − 1) / 9`; tono `0 + 52t`°, saturación 100 %, luminosidad `52 − 4t` %.
- `n > 10`: `t = (n − 10) / 10`; tono `52 + 88t`°, saturación `100 − 30t` %, luminosidad `48 − 14t` %.
- `n < 1` se trata como 1. Se calcula en el cliente (`hsl()`), no se guarda.

Valores calculados (usar para pruebas de snapshot):

| n | 1 | 5 | 8 | 10 | 12 | 15 | 18 | 20 |
|---|---|---|---|---|---|---|---|---|
| hex | #FF0A0A | #FF6301 | #F9A800 | #F5D400 | #BDE007 | #57C110 | #17A51C | #1A9342 |
| #111111 encima | 4,77:1 | 6,33:1 | 9,56:1 | 12,86:1 | 12,44:1 | 8,13:1 | 5,79:1 | **4,76:1 (peor)** |

Pasos de 0,5 usados en el lienzo: 8 #F9A800 · 9 #F7BE00 · 10,5 #EFE102 · 11 #E7EA04 · 11,5 #D1E505 ·
13 #97D50A · 14 #75CB0D · 17 #25AE14 · 18,5 #17A127 · 19 #189C31.

> Los puntos de control del brief para 5 (#F55E00) y 8 (#F5A500) no salen de su propia fórmula HSL
> (con saturación 100 % y luminosidad > 50 % el canal máximo es FF). Se usa la fórmula. §8.

### 1.4 Tipografía

Fuentes: **Poppins** 600/700 (títulos y cifras) y **Nunito Sans** 400/600/700 (cuerpo), con `next/font/google`,
`display: swap`, subconjunto `latin` + `latin-ext`. Respaldo: `system-ui, sans-serif`. Todas las cifras
(notas, puntos, puestos, cédulas, contadores) con `font-variant-numeric: tabular-nums`.

| Rol | Fuente / peso | < 768 | ≥ 768 | ≥ 1920 | Tracking |
|---|---|---|---|---|---|
| display (nota grande, puntos) | Poppins 700 | 48/56 | 56/64 | 64/72 | −0,02em |
| h1 | Poppins 700 | 26/32 | 32/40 | 38/46 | −0,01em |
| h2 | Poppins 600 | 21/28 | 24/32 | 28/36 | 0 |
| h3 | Poppins 600 | 18/24 | 19/26 | 21/28 | 0 |
| h4 (título de fila, pregunta) | Poppins 600 | 16/22 | 16/22 | 16/22 | 0 |
| body | Nunito Sans 400 | 16/24 | 16/24 | 17/26 | 0 |
| body strong / label | Nunito Sans 700 | 14/20 (label) · 16/24 | igual | igual | 0 |
| small | Nunito Sans 400 · 700 en `small-b` | 13/18 | 13/18 | 14/20 | 0 |
| eyebrow | Nunito Sans 700, MAYÚSCULAS | 12/16 | 12/16 | 12/16 | +0,08em |
| botón | Nunito Sans 700 | 15/20 (md) · 14 (sm) · 16 (lg) | | | 0 |
| píldora de nota | Poppins 700 | 16/20 md · 14 sm · 22 lg · 56/64 xl (64 desde 768) | | | 0 |
| h5–h6 | no se usan; si hace falta, h4 | | | | |

### 1.5 Espaciado, radios, sombras, z-index, movimiento

- **Espaciado:** base 4 px. Escala usada: 4 · 6 (solo gap ícono-texto en chips) · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 56 · 64 · 80. En Tailwind: `1 … 20`.
- **Radios:** 10 px (`--r-sm`: input, chip, botón de puntaje 12) · 12 px (nav, botón sm, segmentado interno, toast) · 16 px (`--r-md`: tarjeta, botón, segmentado externo, alerta) · 24 px (`--r-lg`: diálogo, tarjeta héroe de nota/puntos, hoja inferior) · 999 px (píldora, chip "tú", avatar, barras). Logo de equipo: 28 % del lado. Isotipo: 22 %.
- **Sombras:**

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--shadow-1` | `0 1px 2px rgb(34 29 43/.06), 0 2px 8px rgb(34 29 43/.05)` | `0 1px 2px rgb(0 0 0/.40)` + borde 1 px `--divider` en tarjetas | tarjeta en reposo |
| `--shadow-2` | `0 6px 20px rgb(34 29 43/.10)` | `0 6px 20px rgb(0 0 0/.40)` | medidor fijo, tarjeta de puntos, login ≥ 768 |
| `--shadow-3` | `0 18px 48px rgb(34 29 43/.18)` | `0 18px 48px rgb(0 0 0/.50)` | diálogo, menú, toast, fila del ranking en movimiento |

- **z-index:** contenido 0 · fila del ranking moviéndose 2 · encabezado de tabla sticky 1 · medidor/aside sticky 20 · topbar y barra inferior 30 · barra de acción móvil 25 · popover/menú 40 · banner sin conexión 40 · overlay + diálogo/hoja 50 · toast 60.
- **Movimiento:**

| Token | Valor | Uso |
|---|---|---|
| `--d-fast` | 150 ms | hover, foco, chips, fundido de avatares |
| `--d-normal` | 250 ms | pestañas, diálogos, hoja, menú, acordeón |
| `--d-rank` | 600 ms | cambio de puesto, conteo de puntos |
| `--d-celebrate` | 1200 ms | brillo, confeti |
| `--ease` | `cubic-bezier(.2,.8,.2,1)` | todo por defecto |
| `--bounce` | `cubic-bezier(.34,1.56,.64,1)` | pop del podio, dado, avatar elegido |

---

## 2. Componentes

Convenciones para todos: foco = `outline: 2px solid var(--accent-ink); outline-offset: 2px` (en inputs se usa
borde + halo, ver Input). Objetivo táctil mínimo 44 × 44 px (los botones `sm` de 36 px solo en filas densas
de escritorio, con 4 px de separación mínima). Íconos: `lucide-react`, trazo 2, 20 px por defecto (16 en chips
y textos pequeños, 24 en barra superior/inferior, 32 en estados vacíos).

### 2.1 Button — shadcn `Button` (variants propias)

- **Anatomía:** contenedor · ícono opcional (izquierda; derecha solo en "Ver ranking →") · etiqueta · spinner (cargando).
- **Variantes:** `primary` (fondo `--accent`, texto `--on-accent`, sombra inferior `0 2px 0 color-mix(accent 60%, #000)`), `secondary` (fondo `--surface`, texto `--accent-ink`, borde interior 1,5 px `--accent-ink`), `ghost` (transparente, texto `--accent-ink`, padding 0 12), `danger` (fondo `--error`, texto #FFF claro / #14121A oscuro 6,64:1), `icon` (cuadrado).
- **Tamaños:** sm 36 px alto · padding 0 14 · radio 12 · 14 px · lg 52 · padding 0 24 · 16 px · md 44 · padding 0 20 · radio 16 · 15 px. Gap ícono-texto 8 px; ícono 20 px. `block` = ancho 100 %.
- **Estados:** reposo · hover (primary → `--accent-hover`; secondary → fondo `--accent-soft`; ghost → fondo `--accent-soft`) · foco (anillo §2) · activo (primary `translateY(2px)` y sin sombra; secondary `translateY(1px)` + fondo `--accent-soft-2`) · cargando (`aria-busy="true"`, spinner 18 px borde 2,5 px girando 800 ms lineal, texto en gerundio "Entrando…", ancho fijo para no saltar) · deshabilitado (fondo `--surface-3`, texto `--text-dis`, sin sombra, `cursor: not-allowed`; secondary deshabilitado: borde `--divider`) · error: no existe en el botón, el error va en el formulario.
- **Responsive:** en móvil los CTA principales de formularios son `lg block`; en escritorio ancho de contenido.
- **A11y:** `<button>` real o `<a>` si navega. Ícono solo → `aria-label` ("Copiar código KR-500-7F3A9C"). Botones deshabilitados con razón: `aria-describedby` hacia el texto que explica ("Se activa al puntuar las 5").

### 2.2 Input / Textarea / Select — shadcn `Input`, `Textarea`, `Select`

- **Anatomía:** `label` (14/20 700, `--text`) · contenedor 48 px alto, padding 0 14, radio 10, borde 1 px `--input`, fondo `--surface` · ícono líder opcional 20 px `--text-2` · campo · elemento final (contador "/ 20", botón ojo `btn-ghost btn-icon sm`, chevron) · ayuda (13/18 `--text-2`, gap 6) · mensaje de error/éxito.
- **Estados:** reposo · hover (borde `--text-2`) · foco (borde `--accent-ink` + halo `0 0 0 3px color-mix(accent 28%, transparent)`, sin outline) · lleno (igual que reposo) · error (borde 2 px `--error`, padding 13 para no moverse, ícono alerta `--error` al final, mensaje 13/18 700 `--error` con ícono 16, `aria-invalid` + `aria-describedby`) · éxito (borde `--success` + mensaje con check) · deshabilitado / solo lectura (fondo `--surface-2`, borde **punteado** `--input`, texto `--text-2`, ícono candado — así no depende del color) · enviando (el campo queda `readonly`, el botón carga).
- **Textarea:** alto mínimo 112 px (72 en tarjetas de evaluación), padding 12 14, contador a la derecha bajo el campo ("128 / 600"; comentarios del profe "/ 280").
- **Cédula:** `inputmode="numeric"`, `autocomplete="username"`, `maxlength=9`, solo dígitos (se descartan puntos al pegar). Error: "La cédula lleva solo números: de 7 a 9 dígitos." / "Faltan dígitos: la cédula tiene de 7 a 9 números."
- **Contraseña:** botón ojo `aria-pressed`, `aria-label` "Mostrar contraseña"/"Ocultar contraseña".
- **Stepper numérico** (base 10–20, valor de pregunta, puntos de ajuste): botón − (secondary icon 44) · input 84–120 px centrado Poppins 700 · botón + · unidad. Paso 0,5. Atajos ↑/↓ en el input.

### 2.3 Píldora de nota — componente propio `GradePill`

- **Anatomía:** contenedor `background: gradeColor(n)`, número `#111111` Poppins 700 tabular. Nunca texto de color, nunca sin número.
- **Tamaños:** sm 26 alto · min 44 · 14 px · padding 0 8 — md 32 · min 52 · 16 px · 0 10 — lg 44 · min 72 · 22 px · 0 14 — xl 104 alto (120 desde 768) · min 148 · 56 px (64) · radio 28 · padding 0 24.
- **Raspado (< 10):** la píldora se acompaña SIEMPRE del chip `Raspado` (chip-err + ícono TriangleAlert) a 8 px, o en tablas del ícono TriangleAlert 16 px `--error` con `aria-label="Raspada"`.
- **Pendiente (`null`):** fondo transparente, borde 2 px **punteado** `--text-2`, texto "Pendiente" Nunito Sans 700 14 `--text-2` + ícono Clock 14. Nunca "0".
- **Base:** chip `Base 15` (chip-base: fondo surface, borde interior 1,5 px `--text-2`) a 8 px de la píldora cuando base ≠ 20.
- **A11y:** texto accesible "Nota 18,5 de 20" (xl) — el número ya es texto; en lg/md basta el número dentro de un contexto con título.

### 2.4 Chip / Badge — shadcn `Badge`

- 28 px alto, padding 0 10, radio 10, 13/18 700, gap 6, ícono 16. Variantes: neutro (`--surface-2`), `base`, `cap` (secondary + Crown, texto "Capitán/Capitana"), `acc` (soft-2, texto `--text`, ícono `--accent-ink`), `ok`, `warn`, `err`, `prize` (Gift), `tu` (22 px, radio 999, fondo `--accent`, texto `--on-accent` 12 px, texto "tú").
- Estados de tarea: Borrador (neutro + Pencil) · Abierta (ok + Clock) · Evaluada (acc + Check). Entrega: Entregada (ok + Check) · Por entregar (warn + Clock) · Vencida (err + X). Siempre ícono + palabra.

### 2.5 Avatar y logo de equipo — shadcn `Avatar`

- Avatar: círculo, tamaños 32 · 36 · 40 · 48 · 56 · 64 · 80 · 96. Fondo `--surface-2` mientras carga. Anillo "tú/elegido": `0 0 0 2px surface, 0 0 0 4px accent`. Pila: máx. 5 con solapamiento −8 px y anillo 2 px `--surface`, luego círculo "+n" (Poppins 700 13).
- Fuente: DiceBear 9.x, `https://api.dicebear.com/9.x/{estilo}/svg?seed={seed}` (estilos `adventurer-neutral`, `fun-emoji`, `bottts-neutral`, `notionists-neutral`). Se guarda `{estilo, seed}` en el perfil; se cachea el SVG.
- Logo de equipo (`TeamLogo`): cuadrado, radio 28 %, `object-fit: cover`, borde interior 1 px `rgb(0 0 0/.08)`. Tamaños 40 · 56 · 64 · 72 · 80 · 96 · 112. **Respaldo sin logo:** inicial del tema (o del nombre si no hay tema) en blanco, Poppins 700 al 42 % del lado, sobre uno de 6 colores fijos asignados por `hash(teamId) % 6`: #8A3B12 (7,73:1) · #1F5E8C (6,91:1) · #6A3FB0 (7,12:1) · #0E6B5C (6,41:1) · #A3361F (6,76:1) · #295AC3 (6,28:1). No dependen del acento.

### 2.6 Tabs / Segmented — shadcn `Tabs` y `ToggleGroup`

- **Segmentado:** contenedor `--surface-2`, padding 4, radio 16, gap 4. Opción 40 px alto, padding 0 16, radio 12, 15 px 700, `--text-2`. Seleccionada: fondo `--surface`, texto `--text`, `--shadow-1`. Para pestañas (Estudiantes/Equipos, filtros) `role="tablist"`; para elegir un valor (sección 5A/5C, tema, tipo de tarea) `role="radiogroup"`. `seg-block` reparte el ancho (tema en Perfil, tipo en Constructor).
- **Pestañas de línea** (estilos de avatar): 44 px alto, gap 24, 15 px 700 `--text-2`; activa `--accent-ink` + barra inferior 3 px `--accent` radio 3 3 0 0. Con scroll horizontal propio si no caben.
- **Teclado:** ←/→ mueven, Inicio/Fin, activación automática.

### 2.7 Navegación

- **Barra lateral** (≥ 1024): 248 px (264 desde 1440), fondo `--surface`, borde derecho 1 px `--divider`, padding 24 16, alto 100 vh sticky. Logo 132 px con padding 0 12 24. Ítem 44 px alto, padding 0 12, radio 12, gap 12, 15/20 600 `--text-2`; hover `--surface-2` + `--text`; activo `aria-current="page"`, fondo `--accent-soft-2`, texto `--text` 700, ícono `--accent-ink`. Contador (Evaluar) chip-acc 22 px a la derecha. Pie: tarjeta del usuario (avatar 40, nombre 13 700, rol 13 `--text-2`, padding 12, radio 16, `--surface-2`), enlaza a Perfil.
  - Estudiante: Inicio · Notas · Tareas · Ranking · Equipo · Perfil. Profesor: Panel · Evaluar · Tareas · Alumnos · Equipos · Puntos · Ranking · Premios.
- **Barra superior** (< 1024): 56 px (64 desde 768), sticky, fondo `--bg` 92 % + borde inferior. Izquierda: logo 88 px (o botón volver 44 + título h4 en pantallas de detalle). Derecha: avatar 36 (estudiante) o botón Menú (profesor).
- **Barra inferior** (< 1024): 72 px, 5 columnas, padding 0 4 8, `--surface`, borde superior + sombra `0 −4px 16px rgb(34 29 43/.06)`. Ítem: píldora de ícono 56 × 32 radio 999 + etiqueta 12/16 600. Activo: píldora `--accent-soft-2` (ícono `--accent-ink` ≥ 3:1), etiqueta `--accent-ink` 700 (sobre surface ≥ 6:1). Respeta `env(safe-area-inset-bottom)`.
  - Estudiante: Inicio · Notas · Ranking · Equipo · Perfil (Tareas se alcanza desde Inicio › Por entregar). Profesor: Panel · Evaluar · Alumnos · Puntos · Ranking; Tareas, Equipos y Premios van en el **Menú** (hoja inferior, §2.13).

### 2.8 Card

- `--surface`, radio 16, padding 16 (24 desde 768), `--shadow-1` (oscuro: sin sombra, borde 1 px `--divider`). Variante `hero` radio 24. Variante `flat` borde 1 px sin sombra. Encabezado de sección dentro de la tarjeta: fila h2/h3 + acción, gap 8 12, margen inferior 12, envuelve.
- Lista dentro de tarjeta: filas 64 px mín., padding 12 4, separador 1 px; si la fila es enlace: hover `--surface-2`, radio 12, foco con anillo.

### 2.9 Fila del ranking — `RankRow` (propio)

- Grid `36px 40px 1fr auto auto`, gap 12, alto mín. 60, padding 8 12, radio 14, separación 4.
- Partes: puesto (Poppins 700 16 tabular, `--text-2`) · avatar 40 · nombre (15/20 700, 1 línea con elipsis) + subtítulo equipo (13/18 `--text-2`) · cambio (chip delta) · puntos (Poppins 700 16, derecha, mín. 52).
- **Top 10:** fondo `--surface` + `--shadow-1`; puesto en círculo 32 `--accent-soft-2` texto `--text`.
- **Fila propia:** fondo `--accent-soft` + borde interior 2 px `--accent` + chip "tú".
- **11–30:** sin fondo.
- **Zona de riesgo (5 últimos):** separador "Zona de riesgo · 5 últimos" (12 px 700 MAYÚSCULAS `--error` + TriangleAlert 16 + línea punteada 2 px) y filas con fondo `--surface-2`, avatar en gris (`grayscale(1)` + opacidad .75 **solo en la imagen**), puesto y puntos `--text-2`.
- **Delta:** 22 px, radio 999, Poppins 700 12. Sube: `--success` sobre success 10 % + ChevronUp; baja: `--error` sobre error 12 % + ChevronDown; igual: "=" `--text-2`. Texto accesible "subió 2 puestos". Empate (top 10): chip neutro "Empate".
- **A11y:** lista ordenada `<ol>`; cada `<li>` con nombre accesible "Puesto 4, María Méndez, 30,5 puntos, subió 2".

### 2.10 Podio — `Podium` (propio)

- `<ol>` grid 3 columnas en orden visual 2-1-3, gap 8 (16 desde 768), padding superior 32. Columna: avatar (64; 80 el 1.º con anillo) · nombre 14/18 700 una línea · puntos Poppins 700 15 · escalón.
- Escalones: radio 16 16 8 8; 1.º fondo `--accent`, número `--on-accent` 36/40, alto 120 (144 desde 768); 2.º `--accent-soft-2`, número `--accent-ink` 28/32 (texto grande: ≥ 3,77:1), 88 (104); 3.º `--accent-soft`, 64 (76). Corona (Crown 32) sobre el 1.º en `--warning` claro / `--secondary` oscuro.
- Equipos: igual con `TeamLogo` en lugar de avatar.

### 2.11 Medidores

- **Suma del constructor (`SumMeter`):** fila gap 16, padding 12 16, radio 16, `--surface` + `--shadow-2`. Ícono estado 20 · "14 / 20" (Poppins 600 16) · barra (alto 10, pista `--surface-3`) · mensaje 13 700. Estados: faltan (warning + TriangleAlert, "Faltan 6", barra al 70 %) · se pasó (error + X, "Te pasaste por 2", barra al 100 % en error) · exacta (success + Check, "Suma exacta"). `role="status" aria-live="polite"`.
- **Total en vivo de evaluación:** igual + píldora con `gradeColor(total × base / 20)` y "x de n puntuadas".
- **Barra por pregunta:** alto 8, radio 999, relleno `gradeColor(obtenido / valor × 20)`, siempre acompañada de "3,5 / 4" en texto; la barra es `aria-hidden`.

### 2.12 Botones de puntaje — `ScorePicker` (propio, basado en `ToggleGroup type="single"`)

- Para valores ≤ 6: un botón por paso de 0,5 (0 · 0,5 · … · valor), min 44 × 44, padding 0 8, radio 12, borde 1 px `--input`, Poppins 700 15 tabular, gap 6, envuelven en filas. Hover `--surface-2`. Elegido: fondo `--accent`, texto `--on-accent`, anillo `0 0 0 2px surface, 0 0 0 4px accent`. Foco: anillo de foco.
- Para valores > 6 (más de 13 botones): stepper numérico (§2.2) + 5 atajos ghost sm (0 · ¼ · ½ · ¾ · valor). Tablero "Contenido extremo".
- `role="radiogroup"` con `aria-labelledby` al título de la pregunta; flechas recorren; teclas `0`–`9` y `,` escriben el valor en la pregunta con foco.

### 2.13 Diálogo, hoja inferior y menú — shadcn `Dialog`, `Sheet`, `DropdownMenu`

- **Diálogo:** máx. 520–560 px, padding 24, radio 24, `--shadow-3`; overlay `rgb(20 18 26/.55)`. Cabecera: título h3 + subtítulo small + cerrar (ghost icon sm). Pie: acciones alineadas a la derecha, gap 8 (Cancelar secondary, confirmar primary). En < 768 ocupa el ancho con margen 16 y se alinea arriba a 96 px.
- **Hoja inferior (Menú profesor):** radio 24 24 0 0, padding 8 16 24, asa 40 × 4 `--surface-3`; ítems 48 px, radio 12, gap 12, 600; activo como nav lateral; "Cerrar sesión" en `--error` tras divisor.
- **Menú contextual ("Mover a…"):** 240 px, padding 6, radio 16, borde 1 px + `--shadow-3`; título eyebrow; ítems 40 px; "Quitar del equipo" en `--error` tras divisor. `role="menu"`, flechas, Esc cierra y devuelve el foco.

### 2.14 Avisos, toast, vacío, skeleton

- **Alert** (shadcn `Alert`): padding 12 16, radio 16, gap 12, ícono 20, 15/22. Variantes info/ok/warn/err (§1.2). Errores con `role="alert"`, informativos `role="status"`.
- **Toast** (shadcn `Sonner`): mín. 52 alto, padding 12 16, radio 16, máx. 420, `--shadow-3`, 15/20 600; abajo al centro en móvil (sobre la barra inferior, 88 px del borde), abajo a la derecha en escritorio; 4 s; acción opcional "Deshacer".
- **Vacío:** centrado, padding 32 16, gap 8; burbuja 72 × 72 radio 24 `--accent-soft` con ícono 32 `--accent-ink`; título h4; texto small `--text-2`; acción opcional.
- **Skeleton** (shadcn `Skeleton`): `--surface-3`, radio 10 (o el de la pieza real), pulso de opacidad 1 → .45 → 1 en 1400 ms ease-in-out infinito. Contenedor `aria-busy="true"` + `aria-label` "Cargando notas".

### 2.15 Tabla del profesor — shadcn `Table`

- Contenedor `overflow-x: auto`, radio 16, `--surface`, `--shadow-1`, `role="region"`, `tabindex=0`, `aria-label`. Tabla mín. 760 px. Encabezado 44 px, 12/16 700 MAYÚSCULAS +.06em `--text-2`, sticky. Celdas alto 60, padding 8 12 (16 en extremos), separador 1 px. Hover de fila `--surface-2`. Columnas numéricas a la derecha/centro con tabular-nums. En < 1024 bajo la tabla: "Desliza la tabla para ver más columnas" con ícono.

### 2.16 Pregunta — `QuestionCard` (tres variantes, ver §8: no unificar)

Comparten cabecera: número en cuadro 32 radio 10 `--accent-soft-2` (Poppins 700 15 `--text`) · enunciado h4 (envuelve sin límite) · valor a la derecha (Poppins 700 14 `--text-2`, "3,5 / 4" en detalle, "vale 4" al evaluar, "4 pts" al responder). Gap 12.
- **Detalle (estudiante):** barra · "Tu respuesta" (eyebrow) + bloque `--surface-2` 12 14 radio 12 15/22 · comentario del profe (fondo `--accent-soft`, ícono Sparkles `--accent-ink`, "Comentario de tu profe" 13 700).
- **Responder:** chip de formato (Texto/Imagen) · textarea o zona de subida · contador.
- **Evaluar:** respuesta (texto o imagen 280 px con botón "Ampliar" que abre visor a pantalla completa) · ScorePicker · comentario opcional.

### 2.17 Subida de imagen

- Vacía: zona 2 px punteado `--input`, radio 16, padding 16, ícono Image + "Toca para subir una imagen · JPG o PNG, hasta 5 MB". Subiendo: nombre + % + barra + "Subiendo… no cierres la app" (`aria-live`). Lista: miniatura 220 px 4:3 radio 12 con chip de nombre/peso + "Cambiar imagen" (secondary sm) + "Quitar" (ghost sm `--error`). Error: borde `--error` + alerta con motivo. Se comprime en el cliente a 1600 px lado mayor, JPEG 0,8.

---

## 3. Secciones (orden del §6 del brief)

Contenedor por pantalla: `.wrap` (§4). Entre secciones de una pantalla: gap 24 (móvil) / 32 (≥ 768). Dentro de
tarjetas: gap 16. Columnas de dos zonas: `g-home` (7fr/5fr, gap 24, ≥ 1024) y `g-side` (1fr/360 px, gap 32, ≥ 1024);
por debajo, una columna en el orden del DOM.

### Ingresar (`/ingresar`) y recuperar (`/recuperar`, `/recuperar/enviado`, `/recuperar/nueva`)
- **Layout:** < 768 una columna, padding 32 16 48, tarjeta sin fondo, logo 140 arriba. 768–1023: tarjeta centrada máx. 440, padding 40, radio 24, `--shadow-2`. ≥ 1024: grid `1fr 600px` — izquierda el formulario centrado (máx. 440, sin tarjeta), derecha panel de marca `--accent` padding 56 con logo 260 en `--on-accent`, frase "Tus notas, tu equipo y el ranking en vivo." (Poppins 700 44/52), bajada body, 3 píldoras decorativas (18,5 · 15 · 10) y pie "Escuela Creativa del liceo · 5.º año, secciones A y C"; círculos `--splash` decorativos (`aria-hidden`).
- **Contenido:** gap 24 entre bloques; formulario gap 20. Textos reales (copy final) en el lienzo. Login: eyebrow "Escuela Creativa · 5.º año", h1 "¡Hola de nuevo!", "Entra con tu cédula y la contraseña que te dio tu profe.", Cédula, Contraseña, enlace "Olvidé mi contraseña" (alineado a la derecha bajo el campo), "Entrar" lg block, nota "¿Eres profe? Entras aquí mismo con tu cédula…". Recuperar: "Volver a entrar" (ghost con ChevronLeft), h1 "Recupera tu contraseña", Cédula, "Enviar enlace". Enviado: burbuja Mail, h1 "Revisa tu correo", correo enmascarado `y••••@gmail.com` (primera letra + 4 puntos + dominio), "Vence en 1 hora y sirve una sola vez", 2 consejos con íconos (Spam/Promociones; sin acceso al correo → pedir al profe), "Volver a entrar" primary + "Reenviar enlace en 0:45" deshabilitado con cuenta regresiva de 60 s. Nueva: 2 campos con validación en vivo ("9 caracteres · cumple el mínimo", "Las contraseñas coinciden"), "Guardar contraseña".
- **Errores de servidor:** cédula/contraseña incorrectas → alerta err sobre el botón: "La cédula o la contraseña no coinciden. Revisa y vuelve a intentar." (no decir cuál). 5 intentos → "Demasiados intentos. Espera 5 minutos." Enlace vencido en Nueva → pantalla con "Este enlace ya venció" + "Pedir otro enlace".

### Inicio del estudiante (`/`)
1. **Saludo:** eyebrow "Sección 5A · Escuela Creativa", h1 "¡Hola, {primerNombre}!", línea dinámica ("Tienes 2 tareas por entregar. La más cercana vence el 30/10/2026." / "Estás al día." ). Gap 8.
2. **Tarjeta de puntos:** card hero, fondo `--accent`, texto `--on-accent`, `--shadow-2`, 2 círculos `--splash` (160 px opacidad .28 en la esquina superior derecha, 28 px opacidad .5) `aria-hidden`. Eyebrow "Tus puntos del ranking" · display "37,5" + Trophy + "#1 de 35" (h3) "en 5A" · desglose small "18,5 de tu nota individual + 19 de la grupal. Las notas menores de 10 no suman." · fila: botón "Ver ranking →" (fondo `--surface`, texto `--accent-ink`) + chip translúcido `rgb(255 255 255/.18)` "Subiste 2 puestos esta semana" (solo si cambió).
3. **Mis notas:** card; encabezado h2 + "Ver todas" ghost sm. Filas enlace: título h4 + meta small con ícono de tipo (User individual / Users grupal) y fecha + `GradePill lg` + chip Base si aplica + ChevronRight.
4. **Por entregar:** card; encabezado h2 + chip warn "2 pendientes". Filas: título h4, meta (tipo, "vence dd/mm/aaaa"), chips (premio; "Entregas tú" chip-cap si es capitán; "Sin empezar"/"Borrador guardado" warn). Vacío: §Vacíos.
5. **Mi equipo:** card; h2 + chip acc "#1 de 6 · 19 pts". TeamLogo 64 + nombre h3 + "Tema: … · n integrantes"; pila de avatares + "Capitana: tú/{nombre}" + "Ver equipo" secondary sm (la fila envuelve a 320).
- **Breakpoints:** < 1024: 1 columna en orden 1-2-3-4-5. ≥ 1024: 1 arriba a todo el ancho; `g-home`: izquierda 2+3, derecha 4+5.

### Mis notas (`/notas`)
- `wrap-narrow` (máx. 760, alineado a la izquierda en escritorio). 1) Encabezado (eyebrow sección, h1, ayuda). 2) **Leyenda:** card; h4 "Cómo leer los colores"; barra 16 px con el degradado, marcas 1 / 10 / 20 (Poppins 700 13; el 10 al 47,4 %); fila con chip Raspado + "menos de 10: no suma puntos al ranking" y píldora Pendiente sm + "sin entregar o sin evaluar". 3) **Lista:** encabezado h2 + segmentado (Todas · Individuales · Grupales) que envuelve; card con filas iguales a Inicio. Orden: evaluadas más recientes primero, luego pendientes por fecha.

### Detalle de nota (`/notas/[tarea]`)
- `wrap-narrow`. Móvil: topbar con volver + título. Escritorio: migas "‹ Mis notas".
- **Resumen** (card hero padding 24): eyebrow tipo + fecha; h1 título; fila envolvente gap 24: `GradePill xl` con la nota final + `<dl>` (mín. 220): "Puntaje 18,5 / 20" (h3 tabular) · si base ≠ 20: chip "Base 15" + fórmula "18,5 × 15 / 20 = 13,9" · "Aporta al ranking +13,9 pts" (`--success` + ChevronUp; si la nota < 10: "Aporta 0 pts" `--text-2` + chip Raspado). Si hay base: alerta info "Por acuerdo de conducta tu nota se calcula sobre 15. Lo que lograste en cada pregunta no cambia."
- **Preguntas:** h2 "Pregunta por pregunta" + "8 preguntas · 2 con comentario"; `<ol>` de `QuestionCard` detalle, gap 16.
- Contenido real del lienzo: los puntajes de Heymi Sierra en "Identidad de marca" (seed). Las respuestas son **placeholder** (§8).

### Tareas y entrega (`/tareas`, `/tareas/[tarea]`)
- `/tareas` (no tiene tablero propio): misma plantilla que Mis notas con dos tarjetas: "Por entregar" (filas de Inicio §4) y "Entregadas" (filas con chip Entregada y fecha).
- **Encabezado:** eyebrow tipo + equipo; h1; chips (Calendar "Vence…", "20 pts · 5 preguntas", estado). Premio (solo grupal): tarjeta plana fondo `secondary` 22 % (#FFF2D4, texto 14,78:1) con cuadro 44 `--secondary` + Gift, "Premio para el equipo con mejor nota" + nombre h4.
- **Aviso de capitán** (no capitán, grupal): alerta info con avatar 32 del capitán: "**La entrega {Nombre Apellido}, capitana/capitán de tu equipo.** Puedes ver las preguntas. Las respuestas aparecen aquí cuando ella/él las envíe." Las preguntas muestran "Solo {Nombre} puede responder." con candado, sin campos.
- **Preguntas:** `QuestionCard` responder. Borrador automático en el dispositivo cada 2 s ("Borrador guardado en este teléfono · 10:42 a. m.").
- **Acción:** barra de acción (§4) en móvil pegada sobre la barra inferior; en escritorio al final. "Entregar tarea" (Send) deshabilitado hasta completar, con "Te falta 1 respuesta · 1 imagen subiendo". Al tocar: diálogo de confirmación "¿Entregar ahora? Después no se puede cambiar." (Cancelar / Entregar).
- **Entregada:** tarjeta con borde interior 2 px `--success`, cuadro 56 `--success` con Check, h2 "¡Tarea entregada!", "La envió **{Nombre}** el dd/mm/aaaa a las h:mm p. m.", "Tu profe la evaluará pronto…"; respuestas en solo lectura; "Volver al inicio" secondary.

### Mi equipo (`/equipo`)
1. **Cabecera:** card hero; círculo `--accent-soft` 240 decorativo; fila envolvente gap 24: TeamLogo 112 · eyebrow + h1 nombre + "Tema: … · n integrantes" · 2 tarjetas planas mín. 120 ("Puesto #1 de 6" con Trophy, "Puntos 19").
2. **Integrantes:** card; filas `member` 52 mín. (avatar 48, nombre completo h4 que envuelve, chip "tú", chip Capitán + "Envía las tareas grupales", puntos de ranking a la derecha). Orden: capitán, luego por puntos.
3. **Notas y premios:** card "Notas del equipo" (filas de nota grupal; pendientes con chip "En juego: {premio}") + card "Premios ganados" (cuadro 56 `--secondary` + Trophy, premio h4, "Mejor nota en {tarea} · 19").
- **Breakpoints:** < 1024 apilado 1-2-3; ≥ 1024 1 arriba, `g-home` 2 | 3. Sin equipo: vacío "Todavía no tienes equipo".

### Ranking (`/ranking`)
1. **Encabezado:** eyebrow "Sección 5A · 35 estudiantes"; h1 "Ranking" + chip "En vivo" (≥ 1024; en móvil el chip vive en la topbar); segmentado Estudiantes/Equipos (con ícono) a la derecha, envuelve. Profesor: además segmentado 5A/5C antes de las pestañas. Móvil: `details` abierto la primera vez "¿Cómo se calculan los puntos?" (luego recuerda cerrado en `localStorage`).
2. **Podio** (§2.10) en card hero sin padding inferior.
3. **Lista 4–N** (§2.9) en `<ol>` sin tarjeta, gap 4.
4. **Zona de riesgo:** separador + 5 filas finales (si hay empate en el borde, entran todos los empatados).
- **Escritorio:** `g-side`: izquierda 2-3-4; derecha (360): "Cómo se calculan" (3 reglas con píldora/chip de ejemplo) + "Últimos movimientos" (feed `aria-live="polite"`, máx. 6, "hace 2 min"). Móvil: el feed no se muestra; los cambios se anuncian con toast/región viva.
- **Equipos:** mismo layout con TeamLogo; subtítulo "n integrantes · capitán {nombre}".

### Perfil (`/perfil`)
- `wrap-narrow`, una columna en todos los anchos (orden del brief). 1) Identidad: card hero; avatar 96 con anillo; eyebrow; h2 nombre completo (envuelve); chips "C.I. 33.272.397" (con puntos de miles solo para mostrar), "Sección 5A", Capitán si aplica, Base si ≠ 20. 2) Tus datos: h3 + "Solo tu profe puede cambiarlos" con candado; grid 2 col (≥ 768) de 4 campos solo lectura. 3) Avatar: h3 + "Otros 8" (secondary sm, Dices); pestañas de línea (Aventurero · Emoji · Robot · Retrato); grilla 4 × 2 (8 × 1 desde 768) de botones radio redondos (borde-anillo 3+3 px `--accent` y check sobre círculo 24 `--accent` en el elegido); "Se guarda al tocarlo. Avatares de DiceBear." 4) Apariencia: "Color de acento" 4 círculos 48 (colores claros fijos: #295AC3 · #EE0400 · #115445 · #734AD1, check blanco + anillo `--text` en el elegido, nombre debajo); "Tema" segmentado block Claro (Sun) · Oscuro (Moon) · Sistema (Monitor). Cambia en vivo y se guarda en el perfil (y `localStorage` para evitar parpadeo). 5) Seguridad: "Cambiar contraseña" secondary (abre diálogo: actual + nueva + repetir) y "Cerrar sesión" ghost `--error` (confirmación en diálogo).

### Panel del profesor (`/profe`)
- `wrap-wide` (1280). 1) Encabezado h1 "Buenos días, profe" (según hora: días/tardes/noches) + segmentado 5A · 5C · Ambas. 2) Métricas `g3` (1 col < 768, 2 col 768–1023 con la 3.ª abajo, 3 col ≥ 1024): tarjetas enlace con título small 700 + ícono, display, detalle; "Raspados" con título `--error` + TriangleAlert. 3) `g-home`: "Por evaluar" (filas: avatar/TeamLogo 40, nombre h4, "{tarea} · {tipo} · {fecha}", botón "Evaluar" secondary sm; encabezado con "Evaluar la primera →" primary sm; pie "Ver las 7") | "Últimos ajustes" (chip ±valor ok/err con Plus/Minus, nombre h4, motivo + fecha small; "Nuevo ajuste" secondary sm).

### Evaluar entrega (`/profe/evaluar/[entrega]`)
- Topbar móvil: cerrar (X) · "Entrega 1 de 7" · Menú.
- **Cabecera:** eyebrow "Por evaluar · entrega 1 de 7" + Anterior/Saltar (≥ 1024); TeamLogo/avatar 56 + h1 alumno o equipo + línea "{tarea} · entregó {nombre} el …"; chips (tipo, sección, Base, premio).
- **Medidor fijo:** móvil — `SumMeter` con píldora, sticky a 64 px bajo la topbar; escritorio — tarjeta en el aside sticky (top 24): eyebrow "Total en vivo", píldora lg 88 × 64 + "9 / 20" h2 + "Nota resultante con Base 20", barra de preguntas puntuadas, aviso "Faltan 3 preguntas por puntuar".
- **Preguntas:** `<ol>` gap 24 de `QuestionCard` evaluar. Desde 6 preguntas, índice de chips 1…n bajo el medidor (Contenido extremo).
- **Acción:** escritorio en el aside: "Guardar nota y seguir" primary lg block + texto "Se activa al puntuar las 5. Sigue: {siguiente}" + atajos (`0–9`, `,`, `Ctrl+Enter`). Móvil: barra de acción sobre la barra inferior "Faltan 3 por puntuar · Sigue: Jorge Quintero" + "Guardar y seguir". Al guardar: toast "Nota guardada · 18,5" con "Deshacer" (5 s) y se carga la siguiente entrega con el scroll arriba.

### Alumnos (`/profe/alumnos`)
- Encabezado; filtros (segmentado "5A · 35 / 5C · 34", búsqueda mín. 240 máx. 420 con Search, contador "5 resultados para «mé»" en `role="status"`); tabla (§2.15) columnas Alumno (avatar 36 + nombre completo 14 700) · Cédula (tabular, con puntos) · Equipo (o chip warn "Sin equipo") · Base (número; chip-base si ≠ 20) · Nota individual (GradePill sm; Raspado = ícono) · Puntos · "Editar" (ghost sm con Pencil + nombre en `sr-only`).
- **Diálogo Editar:** subtítulo "nombre · C.I. · sección"; grid 2×2 nombres/apellidos; divisor; Base de evaluación (stepper 10–20 paso 0,5, ayuda "Nota final = puntaje × base / 20. Cambia todas sus notas…"); "Motivo del cambio de base *" obligatorio solo si la base cambió (error: "Escribe por qué cambias la base: el alumno lo verá."); Cancelar / Guardar cambios.
- Búsqueda: insensible a tildes y mayúsculas; por nombre, apellido o cédula.

### Equipos (`/profe/equipos`)
- Encabezado + segmentado sección. `g3` de tarjetas (1 / 2 / 3 col). Tarjeta: TeamLogo 72 con botón "Subir logo"/"Cambiar" (ghost 32 alto) debajo · nombre h3 · tema y número · chip "#1 · 19 pts" · Select "Capitán" con ayuda "Solo el capitán envía las tareas grupales." (oculto si hay 1 integrante: es capitán automático) · lista de integrantes (avatar 32, nombre, chip Capitán, botón Move "Mover a {nombre} a otro equipo" → menú §2.13).
- **Sin equipo:** card con borde interior 2 px `--warning`, h2 con TriangleAlert "Sin equipo · 5", nota "No suman notas grupales hasta tener equipo", grilla de filas con "Asignar…" secondary sm (abre el mismo menú).
- Subir logo: acepta JPG/PNG/WebP hasta 5 MB, recorte cuadrado centrado en el cliente a 512 × 512.

### Tareas del profesor (`/profe/tareas`) y constructor (`/profe/tareas/nueva`, `/profe/tareas/[id]`)
- **Lista:** encabezado + "Nueva tarea" primary; segmentado de estado (scroll horizontal propio si no cabe); tarjetas fila (envuelven): chips estado/tipo/premio, h3 título, meta (preguntas · fecha · avance), barra de evaluadas (máx. 320), acciones ("Evaluar n" secondary sm, editar ghost icon, "Seguir editando" en borradores, "Ver notas" en evaluadas). Borrador con suma ≠ 20 → chip warn "Suma 14 / 20".
- **Constructor:** topbar móvil volver + "Nueva tarea" + "Guardar borrador". `g-side`: izquierda **Datos** (Título; Tipo segmentado block Individual/Grupal; Fecha dd/mm/aaaa con Calendar; Sección select "5A · 5C · 5A y 5C"; Premio con Gift, solo visible si Grupal) y **Preguntas** (cards: número + "Pregunta n" + eliminar ghost `--error`; textarea enunciado; Formato segmentado Texto/Imagen; Valor stepper 0,5–20 paso 0,5) + botón "Agregar pregunta" (zona punteada `--accent-ink`, 1 a 20 preguntas). Derecha sticky: tarjeta "Suma de valores" (display con color de estado, barra, mensaje) + "Publicar tarea" primary lg block (deshabilitado si suma ≠ 20) + "Guardar borrador" + nota. Móvil: medidor sticky arriba + barra de acción inferior (sin barra de navegación en esta pantalla: es una tarea en curso).
- Eliminar pregunta: sin diálogo; toast "Pregunta eliminada" + "Deshacer".

### Ajustes de puntos (`/profe/puntos`)
- `g-home`: **Formulario** (card gap 24): "Ajustar a" Alumno/Equipo + "Sección" 5A/5C (segmentados, envuelven) · "¿A quién?" combobox con avatar y puntos actuales · **Motivo** fieldset, grilla 2 col (1 col < 768) de 8 opciones radio 52 px (borde 1 px `--input`, radio 12; elegida: fondo `--accent-soft`, borde+anillo `--accent`, Check) con valor en chip ok/err ("+2", "−3"; "Otro" con "± escribe") · Puntos stepper con signo (color `--success`/`--error` + signo explícito) "Propuesto por el motivo. Pasos de 0,5." · Detalle (obligatorio en Otro) · vista previa alert-ok/err con TrendingUp: "**Jorge Quintero** pasa de 17 a **19 pts** y sube del puesto 16 al 11. Su nota no cambia." · "Aplicar ajuste" primary lg.
- **Historial** (card): filas con chip ±, a quién (h4), motivo (+ detalle entre comillas en Otro), fecha + profe; "Filtrar" ghost sm (por sección, alumno/equipo, motivo). Cada ajuste se puede **anular** (no borrar) desde un menú de la fila: crea el ajuste inverso con motivo "Anulación".
- Motivos y valores (fijos): Participación destacada +2 · Ayudó a un compañero +1 · Trabajo extra +2 · No estuvo en clase −2 · No prestó atención −1 · Uso del celular −1 · Falta de respeto −3 · Otro (valor libre ±, detalle obligatorio).

### Premios (`/profe/premios`)
- `g3` de tarjetas: cuadro 56 (ganado: `--secondary` + Trophy; en juego: secondary 30 % + Gift; por definir: `--surface-2`) · h3 premio · "{tarea} · {sección}" · estado: chip-cap "Ganó {equipo}" + "nota 19 · fecha" / chip-ok "En juego" + avance / tarjeta punteada "Premio por definir" + "Agregar premio" (va al constructor). Empate en la mejor nota: chip "Empate: G2 y G5" y el profe decide desde el menú de la tarjeta (§9).

---

## 4. Grilla y layout global

| Ancho | Columnas de contenido | Padding lateral | Gutter | Nav | Contenedor |
|---|---|---|---|---|---|
| 320–767 | 1 | 16 | 16 | topbar 56 + barra inferior 72 | 100 % |
| 768–1023 | 1 (2 en grillas `g2/g3/g4`) | 24 | 24 | topbar 64 + barra inferior | 100 % |
| 1024–1439 | 12 implícitas vía `g-home` (7/5) y `g-side` (1fr/360) | 32 | 24 / 32 | barra lateral 248 | estudiante máx. 1120 · profe 1280 · lectura 760 |
| 1440–1919 | ídem | 40 | 24 / 32 | lateral 264 | ídem |
| ≥ 1920 | ídem | 40 | 24 / 32 | lateral 264 | estudiante 1280 · profe 1440 · lectura 760 |

- Ritmo vertical: padding superior del contenido 16/24/32/40 y padding inferior 32/48/64/80 (por breakpoint). Entre secciones 24 (< 768) y 32 (≥ 768). Entre tarjetas de una columna 24.
- En < 1024 el contenido deja 72 px + `safe-area-inset-bottom` libres al final por la barra inferior.
- **Barra de acción** (entregar, guardar nota, publicar): < 1024 `position: sticky; bottom: 72px` (0 si la pantalla no tiene barra inferior), fondo `--bg` 94 %, borde superior, padding 12 16, márgenes −16 para tocar los bordes. ≥ 1024 estática.
- Sin scroll horizontal de página a 320 px: todo envuelve (`flex-wrap`), las tablas y los segmentados largos tienen scroll propio, los nombres largos usan elipsis solo en filas del ranking y podio.
- Los breakpoints se implementan con media queries de Tailwind (`md` 768, `lg` 1024, `xl` 1440, `3xl` 1920). En el lienzo se usaron container queries con los mismos cortes.

---

## 5. Assets

| Asset | Archivo | Formato / medidas | Notas |
|---|---|---|---|
| Logo | `public/brand/krea-logo.svg` (ya en el repo, D002) o componente React inline | SVG 1779 × 981, 2 capas `krea-logo__ink` y `krea-logo__splash` con `fill="var(--krea-logo-ink)"` / `var(--krea-logo-splash)` | Inline (no `<img>`) para colorear: ink = `--accent` (claro y oscuro), splash = `--splash`. Sobre `--accent` (login, correo): ink = `--on-accent`. Ancho: 88 topbar · 132 lateral · 140 login móvil · 260 panel login · 300 OG. `role="img"` + `<title>KREA Escuela Creativa</title>`. |
| Isotipo | `isotipo.svg` (baldosa) · `isotipo-glifo-claro.svg` / `-oscuro.svg` (sin baldosa) | SVG 100 × 100 | La "a" + gotas del mismo trazado del logo (recorte x 1322–1792, y 120–720). Baldosa radio 22 %. |
| Favicon | `favicon.svg` (con `@media (prefers-color-scheme: dark)`), `favicon-16.png`, `favicon-32.png` | SVG + PNG | Genera `favicon.ico` 16/32/48 desde los PNG (p. ej. `bunx png-to-ico`). Next: `app/icon.svg` + `app/favicon.ico`. |
| Apple touch | `apple-touch-icon.png` (+ `.svg` fuente) | PNG 180 × 180, fondo opaco #295AC3, sin esquinas | `app/apple-icon.png`. |
| PWA | `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (+ `maskable.svg`) | PNG | Maskable: glifo dentro del círculo seguro del 80 %. `manifest.ts`: `theme_color` #295AC3, `background_color` #F6F4FA, `display: standalone`, nombre "KREA", `short_name` "KREA". |
| Open Graph | generar con `app/opengraph-image.tsx` (`ImageResponse`) | PNG 1200 × 630 | Ver plantilla abajo. |
| Íconos | `lucide-react` | 16/20/24/32, trazo 2 | Tabla de mapeo abajo. |
| Avatares | DiceBear 9.x (API) | SVG | Licencias: adventurer-neutral y fun-emoji CC BY 4.0 (créditos en un pie de Perfil o página de créditos), bottts-neutral y notionists-neutral libres. Los 32 SVG del lienzo son solo muestras. |
| Logos de equipo | subidos por el profe a Firebase Storage | JPG/PNG/WebP → 512 × 512 WebP | Respaldo §2.5. |
| Imágenes de respuesta | subidas por el alumno a Storage | JPEG ≤ 1600 px lado mayor | En el lienzo son degradados de placeholder. |
| Fuentes | `next/font/google` | Poppins 600/700, Nunito Sans 400/600/700 | — |

**Plantilla OG (1200 × 630):** fondo #F6F4FA; círculo #295AC3 Ø 560 con centro en (1180, 120) aprox. (sale por la esquina superior derecha) y 2 gotas #00E5F5 (Ø 56 en x 844 y 60; Ø 28 en x 922 y 140); logo azul 300 px en (80, 80); título "Tus notas, tu equipo y el ranking en vivo." Poppins 700 52/60 #221D2B (15,05:1) ancho 640; bajada "Portal de la Escuela Creativa · 5.º año" Nunito Sans 600 24/32 #5E5869 (6,26:1); 3 píldoras decorativas abajo a la derecha (18,5 #17A127 72 alto; 10 #F5D400 y 15 #57C110 56 alto). **Zona segura:** margen de 60 px; el recorte cuadrado central 630 × 630 (x 285–915) conserva el logo parcialmente y el título — por eso el título empieza en x 80 y no se pone texto a la derecha de x 915. Texto fijo para todas las páginas (no hay OG por página en v1).

**Mapeo de íconos (lienzo → lucide-react):** home `House` · notas `FileText` · tareas `ClipboardCheck` · ranking `Trophy` · equipo `Users` · perfil/individual `User` · panel `LayoutDashboard` · evaluar `SquareCheckBig` · puntos `Diff` · premio `Gift` · corona `Crown` · alerta `TriangleAlert` · chevrons `ChevronLeft/Right/Up/Down` · imagen `Image` · texto `Type` · candado `Lock` · ojo `Eye`/`EyeOff` · dado `Dices` · salir `LogOut` · correo `Mail` · sin red `WifiOff` · recargar `RefreshCw` · copiar `Copy` · buscar `Search` · más/menos `Plus`/`Minus` · papelera `Trash2` · subir `Upload` · check `Check` · x `X` · reloj `Clock` · sol `Sun` · luna `Moon` · sistema `Monitor` · info `Info` · lápiz `Pencil` · menú `Menu` · chispa `Sparkles` · calendario `Calendar` · flecha `ArrowRight` · enviar `Send` · mover `Move` · filtro `ListFilter` · tendencia `TrendingUp` · ampliar `Maximize2`.

---

## 5b. Pantallas de estado

Familia común (tableros "Pantallas de estado" 1440 y 390): cabecera mínima 64 px (56 móvil) con logo 88 (80) a la
izquierda y, a la derecha, avatar 32 (con sesión) o "Iniciar sesión" ghost sm (sin sesión). Cuerpo: columna
alineada a la izquierda, máx. 640, centrada en vertical, padding 40 24 (32 20 móvil), gap 16: código grande
(Poppins 700 96/1, −0,04em, `--accent-ink`, `aria-hidden`; 80 en móvil) o burbuja de ícono 72 · eyebrow · h1 ·
una línea `--text-2` · extra · acciones (fila, gap 8; en móvil apiladas `lg block`). Sin barras de navegación.

| Variante | Eyebrow | Título | Línea | Extra | Acciones |
|---|---|---|---|---|---|
| 404 con sesión · estudiante | Error 404 | Esta página se fue de recreo | La dirección no existe o esa tarea ya no está publicada. | — | Ir al inicio · Mis notas |
| 404 con sesión · profesor | ídem | ídem | ídem | — | Ir al inicio · Evaluar |
| 404 sin sesión | ídem | ídem | ídem | cabecera con "Iniciar sesión" | Ir al inicio · Iniciar sesión |
| 500 con código | Error 500 | Algo se nos rompió por dentro | No es tu culpa. Intenta de nuevo; si sigue pasando, mándale este código a tu profe. | caja de código 44 alto, `--surface-2`, monoespaciada 700 15, botón copiar (toast "Código copiado") + fecha y hora | Reintentar (RefreshCw) · Ir al inicio |
| 500 sin código | Error 500 | ídem | No es tu culpa. Intenta de nuevo en un momento. | — | Reintentar · Ir al inicio |
| Sin conexión (nada en caché) | Sin conexión | Se te fue la señal | Revisa esto y vuelve a intentar: | lista con Check: "Activa los datos o conéctate a un wifi." / "Si te queda poco saldo, prueba más tarde." (+ "Última actualización: …" si hay hora) | Reintentar |
| Sin conexión (con datos en caché) | — | — | — | No es pantalla: banner sobre la app, 12 px de los bordes bajo la topbar, fondo #221D2B, texto #F4F1F8 14/20 600, WifiOff #FFC23D, "Sin conexión. Ves tus notas de las 4:20 p. m." + "Reintentar" | se oculta solo al volver la conexión ("Volviste a estar en línea" toast 3 s) |

- Código de error: `KR-{status}-{6 hex}` = id de la traza en el registro del servidor. Se muestra solo si existe.
- Con hora / sin hora: la línea "Última actualización" solo aparece si hay datos en caché con marca de tiempo.
- Mantenimiento: no aplica en v1.

---

## 5c. Correo — Restablecer contraseña (único en v1)

Lo envía Firebase Auth con plantilla personalizada (o Trigger Email si Firebase no permite el HTML; §9).

- **Asunto:** Restablece tu contraseña de KREA
- **Preheader:** El enlace vence en 1 hora. Si no lo pediste, ignora este correo.
- **Variables:** `{nombre}` (primer nombre), `{cedulaEnmascarada}` (`33•••397`: 2 primeros + 3 puntos + 3 últimos), `{enlace}` (acción de Firebase con `oobCode`, apunta a `/recuperar/nueva`).
- **Copy completo:** "Hola, {nombre}" / "Recibimos un pedido para cambiar la contraseña de tu cuenta de KREA (C.I. {cedulaEnmascarada}). Toca el botón para crear una nueva. El enlace vence en **1 hora** y sirve una sola vez." / [Crear nueva contraseña] / "¿El botón no funciona? Copia este enlace en tu navegador:" + `{enlace}` / "Si no pediste el cambio, ignora este correo: tu contraseña sigue igual." / Pie: "Recibes este correo porque tienes una cuenta en KREA, el portal de notas de la Escuela Creativa del liceo. ¿Dudas? Escríbele a tu profe o a [correo de contacto del liceo]." (placeholder §9).
- **Plantilla base:** tabla de una columna, ancho 600 (contenido 560 con fondo exterior #F6F4FA y padding 24 0). Tarjeta #FFFFFF radio 16 (Outlook: esquinas rectas). Fuente `Arial, Helvetica, sans-serif` en todo.
  - Cabecera: banda #295AC3, padding 24 32, logo PNG **blanco** con gotas #00E5F5, 120 × 66 (2× para retina), `alt="KREA · Escuela Creativa"` con estilo de alt blanco 22/28 bold — así el correo se entiende con imágenes bloqueadas y el logo sigue claro sobre banda oscura al invertir colores.
  - Cuerpo padding 32: título 24/32 bold #221D2B (16,42:1) · texto 16/24 #221D2B · botón HTML (tabla + `<a>`; VML `v:roundrect` para Outlook) 48 alto, padding 0 28, radio 12, fondo #295AC3, texto #FFFFFF 16 bold (6,28:1) · textos secundarios 14/20 #5E5869 (6,83:1) · enlace #295AC3 subrayado (6,28:1), `word-break: break-all`.
  - Pie: fondo #F0EDF6, padding 20 32, 13/18 #5E5869 (5,90:1).
- **360 px:** padding 16/20; título 22/28; botón `display:block` ancho completo; mismo copy (el pie se acorta: "Recibes este correo porque tienes una cuenta en KREA. ¿Dudas? …").
- **Sin imágenes:** solo cae el logo (queda el alt sobre la banda azul); todo lo demás es texto.
- **Invertido (Gmail/Outlook oscuro):** la banda azul y el botón se mantienen oscuros, el logo blanco sigue visible; nunca logo azul sobre blanco. Agregar `<meta name="color-scheme" content="light dark">` y `supported-color-schemes`.

---

## 6. Movimiento

Todo con `transform`/`opacity`. `prefers-reduced-motion: reduce` → duración 0 para todo lo de abajo, salvo
cambios de color de 150 ms.

| Elemento | Abrir / entrar | Cerrar / salir | Reducido |
|---|---|---|---|
| Acordeón ("¿Cómo se calculan…?", `details`) | contenido `opacity 0→1` + `translateY(−4px→0)` 250 ms; chevron rota 180° 250 ms | inverso 150 ms | sin animación |
| Pestañas y segmentados | indicador (fondo de la opción o barra de 3 px) se desliza con `transform` 250 ms `--ease`; panel entra con opacidad 150 ms | — | salto inmediato |
| Indicador de nav activo (lateral e inferior) | la píldora de fondo cambia con opacidad 150 ms (no se desliza entre ítems) | — | inmediato |
| Select / menú / popover | `opacity 0→1` + `scale(.96→1)` desde el origen del disparador, 150 ms | 100 ms | sin escala |
| Diálogo | overlay opacidad 250 ms; caja `opacity` + `translateY(8px→0)` + `scale(.98→1)` 250 ms | 150 ms | solo opacidad |
| Hoja inferior | `translateY(100%→0)` 250 ms `--ease` | 200 ms | aparece sin desplazamiento |
| Toast | `translateY(16px→0)` + opacidad 250 ms | opacidad 150 ms | opacidad |
| Botón activo | `translateY(2px)` 150 ms | — | se mantiene (no es movimiento ambiental) |
| Skeleton | pulso de opacidad 1400 ms infinito | — | estático |
| "En vivo" | punto con onda `scale(1→2,6)` + opacidad .6→0, 1600 ms infinito | — | punto fijo |
| Dado "Otros 8" | ícono `rotate(0→360°)` 600 ms `--bounce`; opciones viejas a opacidad .4 | nuevas con opacidad 150 ms cada una | sin giro |
| Subir de puesto (top 10) | FLIP: la fila se eleva `scale(1.03)` + `--shadow-3` y se traslada 600 ms; las desplazadas se trasladan a la vez; puntos cuentan 600 ms; brillo de acento 1200 ms una vez; chip ▲n 10 s | chip se desvanece 250 ms | reordena al instante; borde 2 px `--accent` 3 s; anuncio de texto |
| Entrar al podio | FLIP 600 ms + avatar pop `scale(.6→1)` 600 ms `--bounce` + confeti 24 piezas 1200 ms + toast | — | sin confeti ni pop; toast y anuncio |
| Caer a zona de riesgo | FLIP 600 ms + temblor `translateX(−4,4,−3,2,0)` 400 ms una vez + cambio a tono apagado | — | sin temblor; anuncio |
| Fuera del top 10 (11–30) | solo FLIP 600 ms, sin brillo ni chip | — | inmediato |
| Anclas internas (índice de preguntas, "Ir a la pregunta 3") | `scroll-behavior: smooth`; `scroll-margin-top` = 64 (topbar) + 72 (medidor fijo) + 16 = **152 px** en móvil, 24 px en escritorio | — | `auto` |

Anuncios de texto (región `aria-live="polite"` única por página, también con movimiento normal): "{Nombre} subió al
puesto {n}", "{Nombre} entró al podio", "{Nombre} bajó a la zona de riesgo", agrupados si llegan varios en 1 s
("3 cambios en el ranking: …").

---

## 7. Orden de implementación

1. **Tokens** (`globals.css` + `@theme`): variables de §1, `data-theme`/`data-accent` en `<html>`, script anti-parpadeo que lee `localStorage` antes de pintar, fuentes. → base de todo.
2. **Utilidades:** `gradeColor(n)`, `formatNota` (coma, 1 decimal máx.), `notaFinal(puntaje, base)` (§9 redondeo), `puntosRanking(nota)`, `rankCompetition(list)`, `maskEmail`, `maskCedula`. Con pruebas (tabla §1.3). ← 1
3. **Primitivas shadcn tematizadas:** Button, Input/Textarea/Select, Badge, Tabs/ToggleGroup, Dialog/Sheet/DropdownMenu, Alert, Sonner, Skeleton, Table, Avatar. ← 1
4. **Componentes propios:** GradePill, TeamLogo, RankRow, Podium, SumMeter, ScorePicker, QuestionCard (3 variantes), ImageUpload, EmptyState, Logo/Isotipo. ← 2, 3
5. **Layout:** AppShell estudiante y profesor (lateral, topbar, barra inferior, hoja Menú), ActionBar, StatusScreen. ← 3, 4
6. **Auth:** Ingresar, Recuperar, Enviado, Nueva + correo. ← 5 (y backend D008/D009)
7. **Estudiante:** Inicio → Mis notas → Detalle → Tareas/Entrega → Mi equipo → Perfil (avatar, apariencia). ← 4, 5
8. **Ranking en vivo** (onSnapshot + FLIP + celebraciones + anuncios). ← 4, 7
9. **Profesor:** Panel → Evaluar → Constructor/Tareas → Alumnos → Equipos → Puntos → Premios. ← 4, 5
10. **Estados:** 404/500/sin conexión (+ caché offline), vacíos, skeletons, errores en pantalla. ← 5 (se puede adelantar)
11. **Marca/SEO:** favicon, apple, manifest, OG. ← 1
12. **QA:** 4 acentos × claro/oscuro en Inicio, Detalle, Ranking (comparar con página "Acentos"); 320 px sin scroll; movimiento reducido.

---

## 8. Decisiones y trampas

**Decisiones (no "arreglarlas"):**
- La fórmula HSL de la nota manda sobre los hex de control del brief (5 y 8 no coinciden con su propia fórmula).
- Texto normal sobre `--accent-soft-2` en `--text`, no en el acento (rojo/morado no llegan a 4,5:1). El acento queda en el ícono.
- Chips de estado verde/ámbar con tinte 10 % (no 14 %) en claro: con 14 % quedaban en 4,44:1.
- El isotipo conserva el corte recto a la izquierda de la "a" (es donde se une con la "e" en el logo): no se redibuja.
- Favicon, apple touch, maskable y OG siempre en azul: el sistema operativo no conoce el acento del usuario. La baldosa del isotipo dentro de la app sí sigue el acento.
- Puntos de ranking del equipo = suma de sus notas grupales ≥ 10 + ajustes al equipo (no la suma de los puntos de sus integrantes). Con el seed: G2 19 · G3 18 · G1 17 · G5 17 · G4 15 · G6 14.
- Empates: ranking de competencia 1-2-2-4; dentro del empate, orden alfabético por primer apellido; chip "Empate" solo en el top 10.
- Zona de riesgo = 5 últimos puestos **incluyendo empatados en el borde** (puede tener más de 5 filas).
- Los valores > 6 se puntúan con stepper, no con 41 botones.
- El correo usa logo blanco sobre banda azul (no logo azul sobre blanco) por la inversión de colores de los clientes.
- Profesor en móvil: Tareas, Equipos y Premios van en la hoja "Menú" de la topbar.
- En móvil el constructor de tareas no muestra la barra inferior (es una tarea en curso, su barra de acción va a `bottom: 0`); Evaluar sí la muestra (el profe salta entre entregas y el panel) y su barra de acción va encima, a `bottom: 72px`.

**Lo que es fácil hacer mal:**
- La píldora de nota nunca cambia el color del número (siempre #111111) ni aparece sin número; el color no se usa como texto en ningún lado.
- `Pendiente` ≠ 0: una nota `null` nunca se muestra como "0" ni con color rojo (D003).
- Los ajustes de conducta mueven puntos, nunca la nota (D007); la vista previa del formulario de puntos lo dice.
- Base: la nota final se calcula `puntaje × base / 20`; los puntos por pregunta mostrados al alumno son los originales (sin escalar).
- Debe verse idéntico entre secciones: filas de nota de Inicio, Mis notas y Mi equipo (mismo `GradeRow`); tarjeta de usuario de la lateral en ambos roles; encabezado de pregunta en sus 3 variantes.
- **No convertir en componente compartido:** `QuestionCard` de detalle, responder y evaluar comparten cabecera pero no cuerpo; la tarjeta de puntos de Inicio no es una `Card` con otra variante (tiene decoración y colores propios); el medidor del constructor y el de evaluación se parecen pero tienen datos y reglas distintas.
- Espaciados intencionales que parecen inconsistentes: la tarjeta de puntos y las tarjetas hero tienen radio 24 (las demás 16); el input en error baja el padding a 13 para compensar el borde de 2 px; la barra de acción tiene márgenes −16 para llegar al borde.
- Opacidad en la zona de riesgo solo sobre el avatar, nunca sobre texto.
- Textos `sr-only` dentro de contenedores con scroll horizontal (tablas): el contenedor necesita `position: relative`, si no el `sr-only` absoluto se sale y crea scroll horizontal de página a 320 px.
- Segmentado de ancho completo (Tema en Perfil, Tipo en Constructor): por debajo de 400 px de ancho se ocultan los íconos y queda solo el texto, para no desbordar a 320.
- En oscuro las tarjetas pierden la sombra y ganan borde 1 px; no dejar ambas.
- El acento es variable: ningún componente puede tener `#295AC3` escrito (salvo íconos de instalación, OG y correo).
- Avatar del alumno "(tú)" en el ranking: el chip "tú" se agrega al nombre accesible ("Jorge Quintero, tú").

**Contenido placeholder (registrar en `CONTENT_CHECKLIST.md`):** respuestas de los alumnos (Brasa Express, repostería…), tareas "Presentación de la marca", "Logo y paleta del emprendimiento", "Moodboard de la marca", "Plan de redes sociales" y sus preguntas, premios (los dos del brief se usan como ejemplo), nombre del profe `[Nombre del profe]`, correo remitente y de contacto, fechas de entrega, ajustes de puntos del historial, la base 15 de Jailyn Martínez en Alumnos (ejemplo), logos de equipo (degradados de placeholder), código `KR-500-7F3A9C`, deltas del ranking. Reales: nombres, cédulas, secciones, equipos, capitanes, temas, notas individuales/grupales y puntajes por pregunta de "Identidad de marca" (seed).

---

## 9. Preguntas abiertas

| # | Pregunta | Recomendación |
|---|---|---|
| 1 | ¿Cómo se redondea la nota final con base? (18,5 × 15 / 20 = 13,875) | Redondear a 1 decimal, mitad hacia arriba (13,9), y mostrar el cálculo. Alternativa: a 0,5 (14). |
| 2 | ¿La base aplica a las notas grupales? | Sí, por integrante: cada uno recibe `notaGrupal × suBase / 20`; el equipo y el premio usan la nota grupal sin base. |
| 3 | Empate en la mejor nota de una tarea con premio | El profe elige ganador o declara premio compartido desde la tarjeta del premio. |
| 4 | ¿Los alumnos de un equipo pueden ver las respuestas antes de que el capitán entregue? | No en v1 (el borrador vive en el teléfono del capitán). Con Firestore se podría compartir el borrador en vivo; decidir en la fase de backend. |
| 5 | Correo de contacto y remitente del correo | Usar una cuenta del liceo; mientras, el placeholder del pie. |
| 6 | Nombres de los profesores y saludo | Mostrar "Prof. {nombre}" en la lateral; saludo "Buenos días, {nombre}". |
| 7 | ¿El profe puede ver el ranking de "Ambas" secciones juntas? | No: el ranking es por sección (brief). El panel sí agrega ambas. |
| 8 | ¿Se notifica al alumno cuando cambia su base o recibe un ajuste? | Sí, con un aviso en Inicio la próxima vez que entre ("Tu profe cambió tu base a 15: …"). |
| 9 | Plantilla de correo: Firebase Auth no admite HTML propio en todos los planes | Si no se puede, enviar con la extensión Trigger Email + SMTP del liceo usando el enlace generado por el Admin SDK. |
| 10 | ¿Plazo y entrega tardía? | Mostrar "Vencida" y permitir entregar con chip "Tarde" si el profe lo habilita por tarea (interruptor en el constructor). |
| 11 | Logos de los equipos (fotos de baja calidad) | El recorte cuadrado + borde interior ya los iguala; si son muy oscuros, no se hace nada (el contenedor no depende del contenido). |
| 12 | Créditos de avatares (CC BY 4.0) | Línea en Perfil bajo la grilla: "Avatares de DiceBear (Lisa Wischofsky, Davis Uche…)" con enlace. |
