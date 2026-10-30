# Prompts por unidad — orquestación 2026-10-29 (fase 03, ola 1)

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
