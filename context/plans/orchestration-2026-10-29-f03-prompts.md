# Prompts por unidad — orquestación 2026-10-29 (fase 03, olas 1 y 2)

Brief compartido: `C:\Users\Cesar\Documents\Work\krea\context\plans\orchestration-2026-10-29-f03.md`

---

## W1 — `feat/ui-base`

Eres el worker **W1**. Rama: `feat/ui-base`. Slot y puerto: los del mensaje que te lanza.
Decisiones: rango **D025–D029**. Filas de CONTENT_CHECKLIST: **23–25**.
Modelo · esfuerzo: **opus · medium** (base de toda la fase). Docker: **no**.
Dependencias permitidas (todas las de la fase, de una vez): `radix-ui` (o los `@radix-ui/react-*` que use la
versión actual de shadcn), `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `sonner`, y lo
que `shadcn add` instale para los primitivos listados abajo. **No** `next-themes` (el tema es propio, D015)
ni `tw-animate-css` (el movimiento sale de nuestros tokens).

Primero lee el brief compartido (arriba). Decisiones previas que te limitan — `cat context/decisions/D0NN-*.md`:
D001 (acento variable `data-accent`), D015 (tema/acento en localStorage + anti-parpadeo), D016 (capas de tokens CSS
y derivados), D017 (utilidades de tipografía y capas), D019 (utilidades de layout), D021 (AppShell estructural).

### Qué pide César
> "/orchestrate fase 03" — fase `phases/03-COMPONENTS.md`: "The `components/ui/` primitives everything else will
> use. Bring from the chosen library what applies and style it with the project's tokens… Every state of each…
> The transition between states of whatever opens, closes or switches… animated with the motion tokens, off under
> reduced motion… There is a reference page with all the components and their states."

Esta unidad es la **base** de la fase: deja instalado y configurado todo lo que las olas 2 y 3 necesitan para
trabajar en paralelo sin tocar `package.json`, `bun.lock` ni el bloque de movimiento; y entrega la primera familia
(botones) completa como patrón de las demás.

### Dónde está
- `design/HANDOFF.md:154-169` — convenciones de §2 (foco `outline 2px --accent-ink offset 2`, táctil 44, íconos lucide
  trazo 2 / 20 px) y §2.1 Button completo (variantes, tamaños, estados, a11y).
- `design/HANDOFF.md:447-475` — §6 movimiento (tabla de abrir/cerrar/reducido por elemento).
- `design/HANDOFF.md:128-152` — §1.5 radios, sombras, z-index, tokens de movimiento.
- `design/canvas/krea.css:203-227` — referencia exacta de `.btn*` y `.spin` (`@keyframes k-spin`). Keyframes del lienzo
  que las olas siguientes usarán: `k-pulse` :325, `k-sk` :372, `k-up` :391, `k-glow` :393, `k-shake` :395, `k-pop` :397.
- `design/canvas/Componentes.dc.html` — lámina de componentes del diseño (orden y agrupación para `/componentes`).
- `app/globals.css` (794 líneas): tema claro :18, acentos :70, oscuro explícito :87, sistema `@media (prefers-color-scheme: dark)`
  :140, derivados :194 (`--accent-hover` :208, mezcla con `--hover-mix` :65/:123), tokens sin tema :248 (radios :251,
  `--d-*`/`--ease`/`--bounce` :258-263, z :266-275), reduced motion pone `--d-*` a 0 :330-338, `@theme inline` :341,
  utilidades `shadow-*` :398, `duration-*`/`z-*`/`nums` ≈:409-450, tipografía ≈:453, layout ≈:479-530, bloque "Base" al final.
  **No hay** `@custom-variant dark` ni token de texto sobre `--error`.
- `app/tokens/page.tsx` — página de referencia de la fase 01: `metadata` con `robots: { index: false }` y bloques con
  `data-theme`/`data-accent` (:194-195) para ver los 4 acentos × claro/oscuro. Copia ese patrón para `/componentes`.
- `tsconfig.json` alias `@/*` → raíz. `biome.json`: lint recomendado + dominios next/react; formatea a 2 espacios.

### Enfoque decidido
1. **shadcn init** (variante Radix, `iconLibrary: lucide`, alias `@/components`, `@/components/ui`, `@/lib/utils`,
   `tailwind.css: app/globals.css`, `rsc: true`, `tsx: true`). **Después de cada comando de shadcn**, `git diff app/globals.css`
   y deshaz todo lo que haya añadido (su `:root` de variables, `@import "tw-animate-css"`, `@custom-variant`, `@theme`):
   nuestros tokens son la única fuente. Decisión (tu rango): **sin capa de alias** con los nombres de shadcn
   (`--primary`, `--muted-foreground`…); cada componente tematizado usa los tokens del proyecto directamente.
   Si ves una razón fuerte para lo contrario, toma la opción conservadora y explícalo.
2. **`lib/utils.ts`** con `cn` (clsx + tailwind-merge). Si `tailwind-merge` agrupa mal nuestras utilidades propias
   (`text-display`… de D017, `shadow-1/2/3`, `z-*`, `duration-*`, `radius-*` propios), configúralo con `extendTailwindMerge`
   para que no se pisen entre sí ni se borren; prueba unitaria de los casos que configures.
3. **Primitivos crudos para las olas 2–3** con `shadcn add`: `input textarea select label badge avatar tabs toggle-group
   dialog sheet dropdown-menu alert skeleton table card separator`. Se quedan **crudos** (los tematiza su familia en la ola 2);
   solo arréglales lo mínimo para que typecheck, lint y build pasen. **No** añadas `sonner.tsx` de shadcn (importa
   `next-themes`): instala solo el paquete `sonner`; el wrapper lo escribe la ola 2.
4. **Variante `dark:`** en `globals.css` (`@custom-variant dark`) que coincida exactamente con el tema oscuro de D015/D016:
   `[data-theme="dark"]` explícito **o** sistema oscuro sin `[data-theme="light"]`, y que respete un `data-theme` puesto en
   un contenedor (como en `/tokens`). Las olas 2–3 la necesitan para "en oscuro sin sombra y con borde `--divider`" (HANDOFF §8).
5. **Token de texto sobre error** (`--on-error`: #FFFFFF claro / #14121A oscuro, HANDOFF §2.1 `danger` 6,64:1) en los bloques
   claro, oscuro y sistema + su color en `@theme inline`. Revisa si `tokens.test.ts` exige listar los tokens de tema y actualízalo.
6. **Bloque "Movimiento de componentes"** en `globals.css` (nuevo, después de las utilidades): `@keyframes` y utilidades que las
   olas 2–3 consumen, todas con `transform`/`opacity` y duraciones/curvas de los tokens:
   - spinner (giro 800 ms lineal), skeleton (pulso 1 → .45 → 1, 1400 ms ease-in-out infinito; estático en reduce);
   - popover/menú/select: entrar `opacity` + `scale(.96→1)` 150 ms desde el origen del disparador (Radix expone
     `--radix-*-transform-origin`), salir 100 ms; reduce: sin escala;
   - diálogo: overlay opacidad 250 ms; caja `opacity` + `translateY(8px→0)` + `scale(.98→1)` 250 ms, salir 150 ms; reduce: solo opacidad;
   - hoja inferior: `translateY(100%→0)` 250 ms, salir 200 ms; reduce: sin desplazamiento;
   - toast: `translateY(16px→0)` + opacidad 250 ms, salir opacidad 150 ms;
   - panel de pestañas: opacidad 150 ms.
   Las duraciones que no existen como token (100, 200, 800, 1400 ms) se añaden como tokens con comentario de origen (§6) y
   también se anulan en el bloque de reduced motion cuando corresponda. Pensadas para usarse con `data-[state=open]` /
   `data-[state=closed]` de Radix. Documenta los nombres de las utilidades en una decisión de tu rango (las olas 2–3 las leerán ahí).
7. **`components/ui/button.tsx`** (cva) con §2.1 completo: variantes `primary` · `secondary` · `ghost` · `danger`; tamaños
   `sm` · `md` · `lg`; `icon` (cuadrado, 44 / 36 en sm) y `block`; `asChild` (Radix `Slot`) para `<a>`/`Link`; estados hover,
   foco (anillo §2), activo (`translateY` 2 / 1 px), deshabilitado (incl. `secondary` con borde `--divider`), **cargando**
   (`loading` → `aria-busy="true"`, `Spinner` 18 px borde 2,5, etiqueta en gerundio que pasa el llamador, ancho estable: no salta).
   Sombra inferior de `primary` = `color-mix(accent 60%, #000)`: como derivado/token, no hex en el componente. Medidas
   (36/44/52, padding 14/20/24, radios 12/16, 14/15/16 px, gap 8, ícono 20) desde tokens/escala; si una no existe, token nuevo.
   **`components/ui/spinner.tsx`** reutilizable (`role="status"` solo cuando va suelto; dentro del botón, `aria-hidden`).
8. **Carpeta de componentes propios:** `components/krea/` para los propios del handoff (GradePill, RankRow…), `components/ui/`
   para los de shadcn. Regístralo en una decisión.
9. **Página `/componentes`** (`app/componentes/page.tsx`, `robots: { index: false, follow: false }`, título "Componentes · KREA"):
   selector o rejilla para ver cada familia en los 4 acentos × claro/oscuro (patrón de `/tokens`), y **un archivo por familia**
   en `app/componentes/_familias/`: `botones` (tuyo, completo: cada variante × tamaño × estado, incl. cargando, deshabilitado con
   razón vía `aria-describedby`, solo ícono con `aria-label`, `asChild` como enlace) y stubs para `formularios`, `overlays`,
   `chips`, `contenedores`, `identidad`, `ranking`, `evaluacion`, `preguntas`, `navegacion` (cada stub: `<section>` con su `h2`
   y "Pendiente — fase 03, ola N"). La página los importa todos; las olas siguientes solo editan su archivo.
   `robots.ts` ya bloquea todo salvo `/ingresar`: no lo toques.

### Trampas conocidas
- `shadcn init`/`add` reescribe `globals.css` y puede tocar `tsconfig.json`/`biome` o crear `lib/utils.ts` con otro contenido:
  revisa cada diff. Si el CLI pide elegir paleta base o estilo, no importa: sus variables se borran.
- Los primitivos crudos usan clases de tokens que no existen aquí (`bg-primary`, `text-muted-foreground`): Tailwind v4 las ignora;
  no las "arregles" ahora salvo que rompan typecheck/lint/build.
- El foco del botón es `outline` (no `ring`/`box-shadow`): `secondary` ya usa `box-shadow` inset para el borde.
- `danger` en oscuro: texto #14121A (token nuevo), no `--on-accent`.
- `cn` con `tailwind-merge` por defecto **borra** clases propias que crea en conflicto (p. ej. `text-display` vs `text-text-2`): por eso el punto 2.
- Next 16 + React 19: `forwardRef` ya no hace falta (ref es prop); sigue la forma que genere la versión actual de shadcn.
- `asChild` + `loading`: el `Slot` exige un solo hijo; resuélvelo sin romperlo (p. ej. `loading` no aplica con `asChild`) y dilo.

### Cómo verificar
- typecheck, lint, test, build. Sin servidor ni navegador. En la salida del build debe aparecer `/componentes` (estática).
- Pruebas unitarias: `cn` con las utilidades propias (punto 2) y, si sacas la lógica de clases del botón a una función pura, sus casos.
- Revisión por código: ningún hex ni `[Npx]` en `components/` (`grep -rnE '\[[0-9]+px\]|\[#[0-9a-fA-F]{3,8}\]' components/`),
  `globals.css` sin restos de shadcn, `dark:` resuelve igual que el tema (explícito y sistema), reduced motion cubre todo el bloque nuevo.

### Cierre
Changeset: ninguno. En el PR: lista de dependencias añadidas y de primitivos crudos que quedan para la ola 2; "Decisión tomada /
alternativa" para: sin capa de alias shadcn, `components/krea/`, variante `dark:`, `asChild` + `loading`, nombres del bloque de
movimiento. Acciones manuales: ninguna. Reporte final como dice el brief (con tus filas de `COMPONENTS_INVENTORY`: Button, Spinner).

---

# Ola 2 (main @ fec1d1a) — W2 a W6, en paralelo

**Común a las cinco** (además del brief):
- Lee D025 (sin alias shadcn, `cn` extendido), D026 (`dark:`), D027 (utilidades de movimiento: tabla con los nombres),
  D028 (Button: `loading`, `asChild`), D029 (carpetas: `components/ui/` = shadcn tematizado, `components/krea/` = propios;
  `/componentes` con `Familia`/`Muestra`/`Escenario`). Mira `app/componentes/_familias/botones.tsx` como patrón de familia
  completa y `components/ui/button.tsx` como patrón de tematizado (cva + tokens).
- Convenciones de §2 (`design/HANDOFF.md:156-159`): foco `outline 2px --accent-ink offset 2` (inputs: borde + halo), táctil 44,
  íconos lucide trazo 2 / 20 px (16 en chips y textos pequeños).
- Los crudos de `components/ui/` traen `[3px]`, `rounded-[min(...)]`, `bg-primary`, `text-muted-foreground`, `animate-in`,
  `data-open:`…: al tematizar **limpia todo** lo del archivo (cero `[Npx]`, cero `[#hex]`, cero clases de tokens shadcn que no
  existen aquí) y usa las utilidades de D027 para los estados `data-[state=open|closed]`.
- No corras `shadcn add` (todo lo que necesitas ya está). Si de verdad lo haces: el CLI v4 escribe `from "cn"`, añade los paquetes
  `cn`/`shadcn`/`tw-animate-css` y toca `globals.css`/`layout.tsx` → cambia a `@/lib/utils`, `bun remove`, revierte.
- Textos en inglés de los crudos ("Close", "Toggle"…) → español; registro en la fila 24 del checklist (ya existe: di en tu reporte
  qué textos tradujiste para que el orquestador la actualice).
- Tu página: **solo** `app/componentes/_familias/<tu-familia>.tsx`: cada componente × variante × tamaño × estado, con textos de
  ejemplo realistas en español (provisional → tus filas del checklist). Se ve en los 4 acentos × claro/oscuro por el `Escenario`.
- Antes de `gh pr create`, confirma que el Write de `.qa/pr-body.md` funcionó (el slot puede traer uno viejo de otra unidad).
- Nadie añade dependencias (`radix-ui`, `cva`, `lucide-react`, `sonner` ya están). No hay entorno DOM: pruebas solo de lógica pura.

---

## W2 — `feat/ui-formularios`

Eres el worker **W2**. Rama: `feat/ui-formularios`. Slot y puerto: los del mensaje que te lanza.
Decisiones: rango **D030–D033**. Filas de CONTENT_CHECKLIST: **26–28**.
Modelo · esfuerzo: **sonnet · medium**. Docker: **no**.

Primero lee el brief compartido y el bloque "Común a las cinco". Decisiones previas además: D004 (pasos de 0,5),
D006 (base 10–20), D008 (login por cédula) — `cat context/decisions/D0NN-*.md`.

### Qué pide César
> "/orchestrate fase 03" — plan de la fase, ola 2: "`feat/ui-formularios` · Label, Input, Textarea, Select, campo con
> ayuda/error/éxito, contraseña con ojo, cédula, `NumberStepper` (§2.2)"

### Dónde está
- `design/HANDOFF.md:170-177` — §2.2 completo (anatomía, estados, textarea, cédula, contraseña, stepper).
- `design/canvas/krea.css:230-245` — referencia exacta de `.field`, `.label`, `.input` (+ `:hover`, `:focus-within`, `.is-error`,
  `.is-success`, `.is-disabled/.is-readonly`), `.err`, `.ok`, `.input .i`.
- `components/ui/{input,textarea,select,label}.tsx` — crudos de shadcn (Select = Radix Select con popover).
- `lib/grades.ts` (`formatNota`, `BASE_MIN/MAX`) y `lib/mask.ts` — utilidades existentes; reúsalas, no las dupliques.
- `app/componentes/_familias/formularios.tsx` — stub a reemplazar.

### Enfoque decidido
1. **Tematiza** `input`, `textarea`, `select` (trigger + contenido + ítems), `label` con §2.2. El contenedor de 48 px con borde,
   ícono líder y elemento final se resuelve con un envoltorio (p. ej. `InputGroup` o props `leading`/`trailing` en `Input`): tú
   eliges la forma, documéntala en una decisión. Estados por **atributos** (`aria-invalid`, `data-state`/`data-success`,
   `disabled`/`readOnly`), no por clases sueltas: error = borde 2 px `--error` + padding 13 (no se mueve); solo lectura/
   deshabilitado = fondo `--surface-2` + borde **punteado** + candado; foco = borde `--accent-ink` + halo `color-mix(accent 28%)`
   (como token/derivado si no existe; nunca hex) y sin outline.
2. **`components/ui/field.tsx`** (propio de formularios, en `ui/` por ser primitivo): `Field` con label, control, ayuda y mensaje
   de error/éxito, que **cablea solo** `id`, `htmlFor`, `aria-describedby` (ayuda + mensaje) y `aria-invalid`. Error con ícono 16 y
   `role` adecuado (el mensaje no debe anunciarse dos veces).
3. **Textarea:** mín. 112 px (variante compacta 72 para tarjetas de evaluación), contador bajo el campo a la derecha ("128 / 600").
4. **`components/krea/password-input.tsx`:** botón ojo = `Button variant="ghost" size="icon"` sm, `aria-pressed`,
   `aria-label` "Mostrar contraseña"/"Ocultar contraseña", `autocomplete` lo pasa el llamador.
5. **`components/krea/cedula-input.tsx`** + **`lib/cedula.ts`** (puro, con pruebas): `inputmode="numeric"`, `autocomplete="username"`,
   `maxlength=9`, solo dígitos (al escribir y al pegar se descartan puntos, espacios, "V-"), y la validación con los dos mensajes
   literales del handoff (7–9 dígitos). La validación es una función pura que devuelve el mensaje o `null`.
6. **`components/krea/number-stepper.tsx`** + lógica pura en **`lib/stepper.ts`** (con pruebas): − (secondary icon 44) · input
   84–120 px centrado Poppins 700 tabular · + · unidad. Props `min`, `max`, `step` (0,5 por defecto), `value`/`onChange`.
   Muestra con coma (es-VE) y acepta "17,5" o "17.5" al escribir; ↑/↓ suman/restan un paso; − y + se deshabilitan en los límites;
   al salir del campo corrige al paso y al rango más cercanos. Lo reutilizará `ScorePicker` (ola 3) para valores > 6: exporta
   una API limpia y documéntala en una decisión.
7. **Familia** `formularios.tsx`: cada control en reposo, hover (no se puede forzar: con su texto), foco, lleno, error, éxito,
   deshabilitado, solo lectura, enviando (readonly + botón cargando); Select abierto no (se prueba interactivo); cédula con los
   dos errores; stepper en mín., medio y máx.

### Trampas conocidas
- El foco del input es borde + halo, **no** el `outline` global: anula el outline solo en el control y que el halo no dependa del color
  (el borde cambia de grosor/color también).
- `Select` de Radix: contenido con `origin-trigger` + `animate-pop-in/out` (D027); en < 640 Radix puede quedar debajo de la barra
  inferior: z-index del token de popover (`z-*` de `globals.css`).
- `type="number"` no: con coma decimal y spinners nativos rompe; el stepper usa `type="text"` + `inputMode="decimal"`.
- React 19: `ref` es prop. Componentes controlados y no controlados en `Input`/`Textarea` deben seguir funcionando.
- Los mensajes de cédula son contenido del handoff (no provisionales); los ejemplos de ayuda sí (tus filas).

### Cómo verificar
- typecheck, lint, test, build; en el build `/componentes` sigue estática.
- Pruebas puras: `lib/cedula.ts` (pegar "V-12.345.678" → "12345678"; 6, 7, 9 y 10 dígitos; letras) y `lib/stepper.ts`
  (redondeo al paso, límites, parseo con coma y punto, formato con coma).
- Revisión por código: el `grep` del cierre de fase limpio en tus archivos; cada estado de error tiene texto + ícono, no solo color.

### Cierre
Changeset: ninguno. En el PR, "Decisión tomada / alternativa" para: forma del contenedor con íconos (InputGroup vs props), `Field`
y su cableado ARIA, API de `NumberStepper`. Acciones manuales: ninguna. Reporte final como dice el brief (inventario: Label,
Input, Textarea, Select, Field, PasswordInput, CedulaInput, NumberStepper).

---

## W3 — `feat/ui-overlays`

Eres el worker **W3**. Rama: `feat/ui-overlays`. Slot y puerto: los del mensaje que te lanza.
Decisiones: rango **D034–D037**. Filas de CONTENT_CHECKLIST: **29–31**.
Modelo · esfuerzo: **opus · medium** (foco, capas y movimiento: riesgo de a11y). Docker: **no**.

Primero lee el brief compartido y el bloque "Común a las cinco". Decisiones previas además: D015 (tema propio, sin `next-themes`),
D021 (AppShell estructural: dónde viven los slots) — `cat context/decisions/D0NN-*.md`.

### Qué pide César
> "/orchestrate fase 03" — plan de la fase, ola 2: "`feat/ui-overlays` · Dialog, Sheet (hoja inferior), DropdownMenu,
> Toaster/Sonner (§2.13, §2.14 toast, §6)"

### Dónde está
- `design/HANDOFF.md:247-251` — §2.13 diálogo, hoja inferior, menú contextual.
- `design/HANDOFF.md:256` — §2.14 toast. `design/HANDOFF.md:447-475` — §6 (filas Select/menú, Diálogo, Hoja, Toast).
- `design/canvas/krea.css:366` (`.toast`), `:374` (`.dialog`); hoja y menú: búscalos en `design/canvas/Componentes.dc.html`
  (`grep -n "sheet\|menu" `) — si un valor no está en el handoff ni en el lienzo, déjalo marcado y dilo.
- `components/ui/{dialog,sheet,dropdown-menu}.tsx` — crudos. `components/ui/button.tsx` — para cerrar/acciones.
- `app/globals.css` — tokens `z-*` (overlay, modal, toast…), `--shadow-3`, y las utilidades D027 (`animate-overlay-*`,
  `animate-dialog-*`, `animate-sheet-*`, `animate-pop-*`, `origin-trigger`, `animate-toast-*`). **No lo edites.**
- `app/componentes/_familias/overlays.tsx` — stub a reemplazar.

### Enfoque decidido
1. **Dialog:** máx. 520–560 px, padding 24, radio 24, `--shadow-3`, overlay `rgb(20 18 26/.55)` (como token si no existe:
   no puedes tocar `globals.css`, así que si falta, usa un token existente equivalente o la clase con `color-mix` de tokens, y
   dilo en el PR — el orquestador lo añade al cerrar la fase). Cabecera: título h3 + subtítulo small + cerrar (ghost icon sm,
   `aria-label="Cerrar"`). Pie: acciones a la derecha, gap 8. En < 768: ancho con margen 16 y alineado arriba a 96 px.
   Movimiento D027. Variante de confirmación (Cancelar secondary + confirmar primary/danger) como composición de ejemplo.
2. **Sheet:** solo la **hoja inferior** está en el diseño: radio 24 24 0 0, padding 8 16 24, asa 40 × 4 `--surface-3`
   (decorativa, `aria-hidden`), respeta `env(safe-area-inset-bottom)`. Mantén el prop `side` del crudo si no estorba, pero tematiza
   y documenta solo `bottom`. **No** escribas el contenido del Menú del profesor (es de `feat/ui-navegacion`, ola 3): en la
   familia, un ejemplo con ítems 48 px y "Cerrar sesión" en `--error` tras divisor basta para ver la hoja.
3. **DropdownMenu:** 240 px, padding 6, radio 16, borde 1 px + `--shadow-3`; etiqueta tipo eyebrow; ítems 40 px; variante
   destructiva (`--error`) tras separador; `origin-trigger` + `animate-pop-in/out`. Foco visible por teclado en ítems
   (`data-highlighted`). Esc cierra y devuelve el foco (Radix lo hace: no lo rompas).
4. **Toaster** (`components/ui/sonner.tsx`, propio, **sin** `next-themes`): mín. 52 alto, padding 12 16, radio 16, máx. 420,
   `--shadow-3`, 15/20 600; abajo al centro en móvil a 88 px del borde (sobre la barra inferior), abajo a la derecha en escritorio;
   4 s; acción opcional "Deshacer". Estilo con `classNames`/`unstyled` de Sonner y tokens (así sigue al tema por CSS, no por prop
   `theme`). Variantes con ícono para ok/err si Sonner las da. **No** lo montes en `app/layout.tsx` (montaje global = fase 05):
   móntalo dentro de tu familia para la demo y documenta en una decisión dónde se montará y por qué.
5. **Familia** `overlays.tsx`: botones que abren cada overlay (diálogo simple, de confirmación destructiva, hoja inferior, menú
   "Mover a…", toasts ok/err/con "Deshacer"). Es un componente cliente: que sea solo esa sección, no la página.

### Trampas conocidas
- Varios `Escenario` (4 acentos × claro/oscuro) en la página: los portales de Radix montan en `body`, **fuera** del contenedor con
  `data-theme`/`data-accent` → el overlay saldría con el tema/acento de la página, no del escenario. Resuélvelo (p. ej. `container`
  del Portal apuntando al escenario, o propagar `data-theme`/`data-accent` al contenido) y documenta la opción en una decisión.
- Sonner monta su propio `<ol>` con `aria-live`: no añadas otra región viva alrededor. Las animaciones propias de Sonner usan
  `transform` con sus duraciones: alinéalas a §6 (`animate-toast-*` o variables de Sonner) y que con reduced motion sean solo opacidad.
- `DialogContent` sin `DialogTitle` da aviso de a11y de Radix: el título siempre (oculto con `sr-only` si el diseño no lo muestra).
- El overlay del diálogo y la hoja no deben dejar scroll horizontal a 320 px (margen 16, `max-w` relativo).

### Cómo verificar
- typecheck, lint, test, build. Revisión por código: patrones WAI-ARIA dialog / menu (rol, título, descripción, retorno de foco),
  reduced motion cubre las 4 piezas, `grep` de cierre limpio. Si extraes lógica pura (p. ej. mapa de variantes del toast), pruébala.

### Cierre
Changeset: ninguno. En el PR, "Decisión tomada / alternativa" para: tema/acento dentro de portales, dónde se monta el Toaster,
`side` del Sheet, token del overlay. Acciones manuales: ninguna. Reporte final como dice el brief (inventario: Dialog, Sheet,
DropdownMenu, Toaster).

---

## W4 — `feat/ui-chips-tabs`

Eres el worker **W4**. Rama: `feat/ui-chips-tabs`. Slot y puerto: los del mensaje que te lanza.
Decisiones: rango **D038–D041**. Filas de CONTENT_CHECKLIST: **32–34**.
Modelo · esfuerzo: **sonnet · medium**. Docker: **no**.

Primero lee el brief compartido y el bloque "Común a las cinco". Decisiones previas además: D003 (nota `null` = Pendiente),
D004 (escala `gradeColor`), D006 (base), D013 (redondeo de la nota final) — `cat context/decisions/D0NN-*.md`.

### Qué pide César
> "/orchestrate fase 03" — plan de la fase, ola 2: "`feat/ui-chips-tabs` · Badge/chips (todas las variantes + estados de
> tarea/entrega), `GradePill` (§2.3), Tabs de línea, segmentado (Tabs `tablist` y ToggleGroup `radiogroup`, `seg-block`) (§2.4, §2.6)"

### Dónde está
- `design/HANDOFF.md:179-203` — §2.3 GradePill, §2.4 Chip/Badge, §2.6 Tabs/Segmented. `:455` §6 fila "Pestañas y segmentados".
  `:511-512` §8 (número siempre #111111, Pendiente ≠ 0) y `:520` "segmentado de ancho completo < 400 px oculta íconos".
- `design/canvas/krea.css:249-257` (`.gp*`), `:260-275` (`.chip*`), `:289-299` (`.seg`, `.seg-block`, `.tabs-line`).
- `lib/grades.ts:37` `gradeColor(n)`, `:48` `formatNota` — úsalos, no los dupliques.
- `components/ui/{badge,tabs,toggle-group,toggle}.tsx` — crudos.
- `app/componentes/_familias/chips.tsx` — stub a reemplazar.

### Enfoque decidido
1. **Badge** (cva): neutro, `base`, `cap` (Crown + "Capitán"/"Capitana" por prop), `acc`, `ok`, `warn`, `err`, `prize` (Gift),
   `tu` (22 px, radio 999). Tintes de §8: verde/ámbar 10 % en claro (no 14 %). Ícono 16 opcional como hijo.
   **`components/krea/status-badge.tsx`**: mapa puro estado → {variante, ícono, palabra} para tarea (Borrador · Abierta · Evaluada)
   y entrega (Entregada · Por entregar · Vencida); siempre ícono + palabra. Mapa en lógica pura con prueba.
2. **`components/krea/grade-pill.tsx`**: `nota: number | null`, `size: sm|md|lg|xl`, `base?`. Fondo `gradeColor(n)` como estilo
   en línea (es el **único** valor dinámico permitido: viene de la función, no es un hex escrito), número `#111111`… como token
   (p. ej. `--on-grade`; si no existe, no puedes tocar `globals.css`: usa el token de texto oscuro equivalente y dilo). Raspado
   (< 10) → chip `Raspado` (err + TriangleAlert) a 8 px, y modo tabla con solo el ícono 16 `aria-label="Raspada"`. Pendiente (`null`)
   → borde 2 px punteado `--text-2`, "Pendiente" + Clock 14, nunca "0". Base ≠ 20 → chip `Base 15`. xl: 104 (120 desde 768) y
   texto accesible "Nota 18,5 de 20". Números con `formatNota` (coma).
3. **Tabs de línea** (`components/ui/tabs.tsx`, variante `line` y variante `segmented`): §2.6, panel con `animate-fade-in`;
   pestañas de línea con scroll horizontal propio si no caben. **Segmentado como valor** con `ToggleGroup type="single"` en
   `components/ui/toggle-group.tsx` (`role="radiogroup"`), y `block` = `seg-block` (reparte el ancho; < 400 px oculta íconos).
   El indicador que "se desliza con `transform` 250 ms" (§6): hazlo si sale sin medir el DOM a mano de forma frágil; si no, el
   fondo de la opción cambia con opacidad 150 ms y lo dices en el PR (alternativa conservadora). Reduced motion: salto inmediato.
4. **Familia** `chips.tsx`: todas las variantes de chip, los 6 estados, GradePill en los 4 tamaños con notas 4, 9,5, 10, 14,5, 18,5,
   20, `null` y base 15, el modo tabla; tabs de línea, segmentado tablist (Estudiantes/Equipos), radiogroup (5A/5C, tema), `seg-block`.

### Trampas conocidas
- Radix `ToggleGroup type="single"` **no** da `role="radiogroup"`/`role="radio"` por defecto (usa `role="group"` + `aria-pressed`):
  léelo en `node_modules/@radix-ui/react-toggle-group` (o el que reexporte `radix-ui`) y pon los roles y `aria-checked` correctos sin
  romper su navegación con flechas; no permitas deseleccionar (single sin valor vacío).
- Texto sobre `--accent-soft-2` en `--text`, nunca en el acento (§8). El color de la nota nunca va como texto.
- `formatNota(null)` y `gradeColor` de `null`: mira qué devuelven antes de llamar; Pendiente se pinta aparte, no con el color.
- `badge.tsx` crudo puede traer `asChild`/`Slot`: consérvalo si no estorba.

### Cómo verificar
- typecheck, lint, test, build. Pruebas puras: mapa de estados de tarea/entrega, y la lógica de GradePill que extraigas
  (tamaño → clases, "raspado", texto accesible con coma). Revisión por código: patrón WAI-ARIA tabs y radiogroup (roles, flechas,
  Inicio/Fin, activación automática), `grep` de cierre limpio.

### Cierre
Changeset: ninguno. En el PR, "Decisión tomada / alternativa" para: roles del ToggleGroup, indicador deslizante o no, token del
número de la píldora, API de GradePill. Acciones manuales: ninguna. Reporte final como dice el brief (inventario: Badge,
StatusBadge, GradePill, Tabs, ToggleGroup).

---

## W5 — `feat/ui-contenedores`

Eres el worker **W5**. Rama: `feat/ui-contenedores`. Slot y puerto: los del mensaje que te lanza.
Decisiones: rango **D042–D045**. Filas de CONTENT_CHECKLIST: **35–37**.
Modelo · esfuerzo: **sonnet · medium**. Docker: **no**.

Primero lee el brief compartido y el bloque "Común a las cinco". Decisiones previas además: D016 (capas de tokens y derivados),
D019 (utilidades de layout) — `cat context/decisions/D0NN-*.md`.

### Qué pide César
> "/orchestrate fase 03" — plan de la fase, ola 2: "`feat/ui-contenedores` · Card (`hero`, `flat`, lista interna), Alert, Skeleton,
> Table con contenedor desplazable, `EmptyState` (§2.8, §2.14, §2.15)"

### Dónde está
- `design/HANDOFF.md:213-216` — §2.8 Card. `:253-258` — §2.14 Alert, vacío, skeleton (el toast es de W3). `:260-262` — §2.15 Table.
  `:516-521` — §8: radio 24 solo hero/puntos; "en oscuro sin sombra y con borde 1 px, no ambas"; `sr-only` dentro de contenedor
  con scroll necesita `position: relative`; la tarjeta de puntos de Inicio **no** es una variante de Card.
- `design/canvas/krea.css:190-194` (`.card*`), `:360-365` (`.alert*`), `:369-373` (`.empty`, `.sk`), `:419-428` (`.tbl*`).
- `components/ui/{card,alert,skeleton,table,separator}.tsx` — crudos.
- `app/componentes/_familias/contenedores.tsx` — stub a reemplazar.

### Enfoque decidido
1. **Card:** `--surface`, radio 16, padding 16 (24 desde 768), `--shadow-1`; en oscuro sin sombra + borde 1 px `--divider` (variante
   `dark:` de D026). Variantes `hero` (radio 24) y `flat` (borde, sin sombra). `CardHeader` = fila título + acción (gap 8 12, mb 12,
   envuelve). **Lista interna** (`CardList`/`CardListItem` o similar): filas mín. 64, padding 12 4, separador 1 px; si la fila es
   enlace (`asChild`), hover `--surface-2`, radio 12 y foco con anillo.
2. **Alert:** info/ok/warn/err (§1.2), padding 12 16, radio 16, gap 12, ícono 20, 15/22. `role="alert"` solo en err, `role="status"`
   en los demás (por defecto según la variante, sobreescribible). Ícono por variante, no solo color.
3. **Skeleton:** `--surface-3`, radio 10 por defecto (o el de la pieza), `animate-skeleton` (D027, ya quieto con reduce). Ejemplo de
   contenedor con `aria-busy="true"` + `aria-label="Cargando notas"`; los bloques `aria-hidden`.
4. **Table:** contenedor `overflow-x: auto`, radio 16, `--surface`, `--shadow-1`, `role="region"`, `tabIndex={0}`, `aria-label`
   obligatorio en la API, `position: relative`; tabla mín. 760; encabezado 44, 12/16 700 MAYÚSCULAS +.06em `--text-2`, sticky;
   celdas 60, padding 8 12 (16 extremos); hover de fila `--surface-2`; columnas numéricas con `tabular-nums` (prop o clase);
   bajo la tabla en < 1024 la pista "Desliza la tabla para ver más columnas" con ícono.
5. **Separator:** tematizado (`--divider`), decorativo por defecto.
6. **`components/krea/empty-state.tsx`:** centrado, padding 32 16, gap 8; burbuja 72 × 72 radio 24 `--accent-soft` con ícono 32
   `--accent-ink` (ícono por prop); título h4 (nivel configurable: no rompas la jerarquía de la página); texto small `--text-2`;
   acción opcional (`Button`).
7. **Familia** `contenedores.tsx`: card normal/hero/flat con cabecera y lista interna (filas enlace y no enlace), las 4 alertas,
   skeleton de una lista de notas, tabla de alumnos de ejemplo (8–10 filas con datos realistas del seed: nombres reales son
   contenido real, el resto provisional), vacío con y sin acción.

### Trampas conocidas
- "Sin sombra en oscuro": no dejes sombra **y** borde a la vez; con `dark:` de D026 (que también cubre el sistema oscuro).
- `sticky` del `<th>` dentro de un contenedor con `overflow-x: auto` solo pega respecto a ese contenedor: está bien así, no metas
  `overflow-y` que rompa el scroll de página.
- El nivel de título del EmptyState y del CardHeader no puede ser fijo (h2/h3/h4 según dónde se use).
- Los crudos de shadcn `card` traen `CardAction`, `CardFooter`, `@container`…: quita lo que el handoff no usa o déjalo tematizado; dilo.

### Cómo verificar
- typecheck, lint, test, build. Si extraes lógica pura (variante de alerta → rol/ícono), pruébala. Revisión por código: tabla
  con región nombrada y enfocable, `position: relative`, `grep` de cierre limpio, nada a menos de 4,5:1 (colores del handoff).

### Cierre
Changeset: ninguno. En el PR, "Decisión tomada / alternativa" para: API de la lista interna, rol por defecto de Alert, partes de
Card que se quitaron, nivel de título configurable. Acciones manuales: ninguna. Reporte final como dice el brief (inventario: Card,
CardList, Alert, Skeleton, Table, Separator, EmptyState).

---

## W6 — `feat/ui-identidad`

Eres el worker **W6**. Rama: `feat/ui-identidad`. Slot y puerto: los del mensaje que te lanza.
Decisiones: rango **D046–D049**. Filas de CONTENT_CHECKLIST: **38–40**.
Modelo · esfuerzo: **sonnet · medium**. Docker: **no**.

Primero lee el brief compartido y el bloque "Común a las cinco". Decisiones previas además: D001 (acento variable), D002 (logo SVG
en dos capas), D010 (avatares DiceBear), D016 (capas de tokens) — `cat context/decisions/D0NN-*.md`.

### Qué pide César
> "/orchestrate fase 03" — plan de la fase, ola 2: "`feat/ui-identidad` · Avatar (tamaños, anillo "tú", pila +n, DiceBear D010),
> `TeamLogo` (respaldo 6 colores como tokens), Logo/Isotipo con acento (§2.5)"

### Dónde está
- `design/HANDOFF.md:193-197` — §2.5 Avatar y TeamLogo (tamaños, anillo, pila, DiceBear 9.x y estilos, respaldo de 6 colores con
  contraste). `:383-404` — §5 Assets (logo/isotipo). `:500-503` — §8: el isotipo conserva el corte recto; la baldosa del isotipo en
  la app sigue el acento; favicon/OG siempre azul.
- `design/canvas/krea.css:124-135` (`.logo`, `.iso`), `:279-286` (`.av`, `.av-ring`, `.tl`, `.tl-fb`, `.tl-photo`).
- `public/brand/krea-logo.svg` — logo actual (D002). `components/ui/avatar.tsx` — crudo (Radix Avatar).
- `app/globals.css` — puedes añadir **un bloque nuevo propio** "Identidad" (al final de los tokens sin tema, con comentario de
  origen §2.5) con `--team-1`…`--team-6` y su `@theme inline` si los usas como clases; **no toques nada más** del archivo.
  Revisa `tests/unit/tokens.test.ts`: puede exigir algo de los tokens nuevos.
- `app/componentes/_familias/identidad.tsx` — stub a reemplazar.

### Enfoque decidido
1. **Avatar** tematizado: círculo, tamaños 32 · 36 · 40 · 48 · 56 · 64 · 80 · 96 (prop `size`), fondo `--surface-2` mientras carga,
   anillo "tú/elegido" `0 0 0 2px surface, 0 0 0 4px accent` (prop `ring`, como utilidad/sombra de tokens). `alt` lo pasa el llamador
   (vacío cuando el nombre está al lado). Respaldo (`AvatarFallback`) con iniciales.
   **`AvatarStack`**: máx. 5 visibles, solapamiento −8 px, anillo 2 px `--surface`, luego "+n" (Poppins 700 13), con texto accesible
   del total ("5 integrantes más").
2. **`lib/dicebear.ts`** (puro, con pruebas): `avatarUrl({ estilo, seed })` →
   `https://api.dicebear.com/9.x/{estilo}/svg?seed={seed}` con el seed codificado; lista tipada de los 4 estilos de D010/§2.5; valida
   el estilo. `<img>` normal (el SVG remoto no necesita `next/image`; no toques `next.config.ts`); `loading="lazy"`, `decoding="async"`.
   El cacheo del SVG (§2.5 "se cachea") es de fase 07: dilo y no lo implementes.
3. **`components/krea/team-logo.tsx`:** cuadrado radio 28 %, `object-fit: cover`, borde interior 1 px `rgb(0 0 0/.08)` (token),
   tamaños 40 · 56 · 64 · 72 · 80 · 96 · 112. Sin logo: inicial del tema (o del nombre) en blanco Poppins 700 al 42 % del lado sobre
   `--team-{hash(teamId) % 6 + 1}`; los 6 colores son fijos (no siguen el acento). `hash` determinista en lógica pura con pruebas.
4. **`components/krea/logo.tsx`:** `Logo` (palabra) e `Isotipo` (baldosa) que siguen el acento (`--accent`/`--accent-ink` según
   D002 y `.logo`/`.iso` del lienzo), como SVG en línea o máscara: nada de `#295AC3` escrito. Nombre accesible "KREA" (o `aria-hidden`
   si va junto al texto), tamaños de §2.7 (132 lateral, 88 topbar) como prop.
5. **Familia** `identidad.tsx`: avatares en los 8 tamaños (los 4 estilos DiceBear), con anillo, cargando/respaldo, pila con 3 y con 9;
   TeamLogo con imagen y con respaldo en los 6 colores y varios tamaños; Logo e Isotipo. Usa seeds y nombres de equipo del seed.

### Trampas conocidas
- `tokens.test.ts` prohíbe hex en `app/` fuera de `globals.css`: los 6 colores van **solo** en tu bloque de `globals.css`.
- Los portales no aplican aquí, pero el `Escenario` sí cambia el acento: el logo debe seguirlo por CSS, no por prop.
- Avatares remotos: en el build no hay red garantizada; nada se descarga al construir (solo `<img src>` en el navegador).
- El anillo con `box-shadow` de dos capas debe verse sobre `--surface`; en la pila, el anillo de separación es `--surface` (no el acento).
- La inicial: primer carácter visible del tema (cuidado con tildes y emojis: usa la primera letra con `Intl.Segmenter` o el primer grafema).

### Cómo verificar
- typecheck, lint, test, build. Pruebas puras: `avatarUrl` (codificación del seed, estilo inválido), `hash(teamId) % 6` estable y
  repartido, inicial con tilde ("Ñandú" → "Ñ"). Revisión por código: `grep` de cierre limpio; contraste de los 6 colores con blanco
  ya medido en el handoff (≥ 6,28:1).

### Cierre
Changeset: ninguno. En el PR, "Decisión tomada / alternativa" para: `<img>` vs `next/image`, cómo sigue el logo al acento (SVG en
línea vs máscara), función de hash, API de AvatarStack. Acciones manuales: ninguna. Reporte final como dice el brief (inventario:
Avatar, AvatarStack, TeamLogo, Logo, Isotipo).
