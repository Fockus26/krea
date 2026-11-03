# Prompts de la ola 1 · fase 05 (2026-11-03)

Brief compartido: `context/plans/orchestration-2026-11-03-f05-ola1.md` (léelo antes que tu sección).

---

## W1 — `fix/segmentado-container`

Eres el worker **W1**. Rama: `claude/wizardly-allen-pixhf6` (ya sobre `origin/main`). Decisiones: **D126–D127**.
Checklist: ninguna fila. Modelo · esfuerzo: **sonnet · medium**. Docker: **no**.

Decisiones previas: D038 (`ToggleGroup` sin deseleccionar, flechas seleccionan), D090 (`ToggleGroup` como radiogroup
visual en Perfil; `lib/apariencia.ts`), D099 (filtro local con `ToggleGroup`) — `cat context/decisions/D0{38,90,99}-*.md`.

### Lo que pide César
> «hay como un problema con el selector de los acentos y del modo (claro, oscuro...) ya que todos como que se juntan en
> un solo lugar y no puedo seleccionarlos correctamente»

Lo leo como: en `/secciones` (barra `Apariencia` de las vistas previas) y en Perfil (`AppearanceSettings`), las opciones
de tema y acento se apilan/superponen y el clic cae en otra opción.

### Dónde está
- `components/ui/toggle-group.tsx:79-83` — la raíz lleva `@container` siempre, también con `inline-flex w-fit max-w-full`.
- `components/ui/tabs.tsx:51-54` — `Tabs variant="segmented"` igual: `@container` también sin `block`.
- `app/secciones/_vista/apariencia.tsx` — dos `ToggleGroup` no-block lado a lado (`flex flex-wrap gap-x-8`).
- `components/sections/perfil/appearance-settings.tsx:66-97` — acentos: `ToggleGroup` con
  `className="flex flex-wrap gap-4 bg-transparent p-0"` (no-block) y cada ítem dentro de un `div`.
- Usos: `grep -rn "<ToggleGroup\|variant=\"segmented\"" components app` (13 archivos con `ToggleGroup`).

### Causa (hipótesis del orquestador — confírmala midiendo antes de arreglar)
`@container` = `container-type: inline-size`: el ancho del elemento deja de depender de su contenido. En un grupo de
ancho intrínseco (`inline-flex w-fit`) el grupo colapsa al padding (~8 px) y las opciones se desbordan encima del grupo
vecino; en el de acentos con `flex-wrap`, se apilan. El `@container` solo hace falta en modo `block` (la regla
`@max-seg` que oculta íconos bajo 400 px, HANDOFF §8).

### Enfoque decidido
- `@container` **solo** cuando `block` (en `ToggleGroup` y en `Tabs` segmentado). Nada más cambia en el modo block.
- Barre la clase: cualquier otro `@container` sobre un elemento de ancho intrínseco en `components/` y `app/`
  (`grep -rn "@container" components app`), y revisa cada uso no-block de ambos componentes por si alguno dependía del
  contenedor (no debería: `@max-seg` solo aplica con `data-block`).
- Si al medir la causa no es esa, arregla la real y explica en el PR lo que encontraste.

### Trampas conocidas
- `cn` (tailwind-merge) fusiona las clases del consumidor: en Perfil `flex` pisa `inline-flex`; mira el resultado final.
- No cambies roles ARIA ni el teclado (lo cubre `tests/unit/toggle-group.test.ts`).

### Cómo verificar
- Script **versionado** `scripts/qa/segmentado.mjs` (node + Playwright, ver brief «Verificación de páginas sin
  servidor»): tras `bun run build`, carga el CSS de `.next/static/css/*.css` con `page.setContent()` y un HTML que
  reproduce las dos anatomías (dos grupos no-block en fila con `flex-wrap`; acentos con ítems dentro de `div` y
  `flex-wrap`; y un grupo `block` a 320 y a 1024). Mide con `getBoundingClientRect`: el ancho del grupo ≥ suma de sus
  ítems, ningún par de ítems se solapa, ningún ítem sale de su grupo, y en block a 320 los íconos se ocultan bajo 400 px.
  Usa las clases que generan los componentes (cópialas del resultado de `cn`, o renderiza con `react-dom/server`
  `renderToStaticMarkup` si es sencillo). Imprime PASS/FAIL por caso.
- Córrelo en `main` (antes del arreglo: FAIL) y en tu rama (PASS); los dos resultados en el PR.
- Añade al `package.json` el script `"qa:segmentado": "node scripts/qa/segmentado.mjs"` (sin dependencias nuevas:
  Playwright ya está preinstalado globalmente; si `require('playwright')` no resuelve desde el repo, documéntalo en el
  script y usa `NODE_PATH`).
- typecheck, lint, test, build.

### Cierre
Sin changeset. PR `fix(ui): segmentados de ancho propio sin container-type (tema y acento)`. En el PR: causa medida,
antes/después del script, «Decisión tomada / alternativa» si tocaste algo más. Reporte como el brief.

---

## W2 — `feat/pag-shell`

Eres el worker **W2**. Rama: `claude/wizardly-allen-pixhf6` (el orquestador la rehace desde `main` con W1 ya mergeado).
Decisiones: **D128–D133**. Checklist: filas **95–97**. Modelo · esfuerzo: **opus · high**. Docker: **no**.

Decisiones previas: D021 (AppShell estructural), D035 (Toaster global en el AppShell en la fase 05), D063 (ruta activa
por prop + envoltorios `Route*`), D066 (secciones por props; vistas en `/secciones`), D067 (`ActionBar`, `sinBarraInferior`),
D072 (con `cacheComponents`, `searchParams` rompe el prerender), D098 (saludo del panel por hora; el servidor no lee el
reloj), D105 (Toaster local de Evaluar) — `cat context/decisions/D0{21,35,63,66,67,72,98}-*.md context/decisions/D105-*.md`.

### Lo que pide la fase
> `phases/05-PAGES.md`: «Assemble the sections into real routes, with their navigation and their metadata.»
> Y de «Para la fase 05» (`context/plans/phase-04-secciones.md`): constructor sin barra inferior en móvil, «Guardar
> borrador» en la topbar, chip «En vivo» y X de Evaluar en la topbar móvil, un `<Toaster />` global.

### Dónde está
- `app/page.tsx` — portada provisional (enlaza a `/tokens`): la reemplaza Inicio.
- `app/layout.tsx` — layout raíz (skip link, script de tema). No metas el shell aquí: `/secciones`, `/componentes`,
  `/tokens` y auth no lo llevan.
- `app/secciones/_vista/vista.tsx` — cómo se arma hoy el shell (AppShell + SideNav/TopBar/BottomNav con `ruta` fija,
  `evaluarCount` 7 en el profe). Tu layout hace lo mismo con los `Route*` de `components/layout/route-nav.tsx`.
- `components/layout/AppShell.tsx` — slots `sidebar`/`topbar`/`bottomNav`; `components/layout/top-bar.tsx` — logo o
  volver + título; avatar → Perfil (estudiante) o `MenuSheet` (profe).
- `components/layout/user-card.tsx:16` — `href = PERFIL_HREF`; `lib/nav.ts` — ítems por rol (Ranking del profe con
  `href: "/ranking"`, `PERFIL_HREF`).
- `components/ui/sonner.tsx:19-24` — offset del toast sobre la barra inferior (88 px); no contempla la `ActionBar`
  (`components/sections/shared/action-bar.tsx:22-24`, `bottom-action`).
- Vistas que reutilizas tal cual: `app/secciones/inicio/page.tsx` (→ `/`) y `app/secciones/profe/[estado]/page.tsx`
  (→ `/profe`, `PanelView` con `saludoTexto(hora)` y `panelDe()`).
- HANDOFF §3 «Ranking» (chip «En vivo» en la topbar móvil), «Evaluar entrega» (topbar móvil: X · «Entrega 1 de 7» ·
  Menú), §8 (constructor sin barra inferior y su `ActionBar` a `bottom: 0`; Evaluar sí la muestra).

### Enfoque decidido
1. **Grupos:** `app/(estudiante)/layout.tsx` + `app/(estudiante)/page.tsx` (Inicio, borra `app/page.tsx`: es el que
   reemplazas, no un archivo sin uso); `app/(profesor)/profe/layout.tsx` + `app/(profesor)/profe/page.tsx` (Panel).
   Cada layout: `AppShell` del rol con `RouteSideNav`/`RouteTopBar`/`RouteBottomNav`, usuario de `lib/demo/usuarios.ts`,
   `evaluarCount` = largo de la cola de `lib/demo/evaluar.ts` (no un 7 fijo), y **un** `<Toaster />` (D035).
2. **Topbar por ruta:** función pura `topbarDe(rol, pathname)` en `lib/topbar.ts` (con pruebas) que devuelve la variante
   de la topbar móvil y si la ruta lleva barra inferior: `logo` (raíces y pantallas de lista), `detalle` (volver + título:
   `/notas/[tarea]`, `/tareas/[tarea]`, `/profe/tareas/nueva`, `/profe/tareas/[id]`, `/profe/alumnos/…` si aplica),
   `evaluar` (X «Salir de la evaluación» → `/profe` + texto central + Menú) y `enVivo` (chip «En vivo» en `/ranking` y
   `/profe/ranking`); `sinBarraInferior` para el constructor. Rellena la tabla para **todas** las rutas finales del brief
   (las que aún no existen también: así las olas 2–3 solo crean páginas). Títulos que dependen de datos (título de la
   tarea, «Entrega n de m»): la función recibe un resolvedor opcional, o el valor sale de una búsqueda en `lib/demo/`
   hecha en el envoltorio cliente — elige y documenta (D-ID). Extiende `TopBar` de forma retrocompatible (sus usos en
   `/componentes` y `_vista` siguen igual) y haz que el layout oculte la barra inferior cuando `sinBarraInferior`.
3. **Acción en la topbar** («Guardar borrador» del constructor, ola 3): deja un mecanismo para que una página ponga un
   botón en la topbar móvil (recomendado: un nodo destino en `TopBar` + un componente cliente `TopBarAccion` que hace
   `createPortal` a él). Solo el mecanismo y su documentación; el botón lo pone la ola 3.
4. **Toaster sobre la `ActionBar`:** en < lg, si la página tiene `ActionBar`, el toast sube por encima de ella (backlog
   F04 ola 3 W3). Recomendado: la `ActionBar` marca el documento (p. ej. atributo en `body` o variable CSS al montarse)
   y el offset de `sonner.tsx` lo suma; elige y documenta.
5. **Nav del profe** (decisión de César): Ranking → `/profe/ranking`; tarjeta de usuario y hoja Menú del profe → Perfil
   `/profe/perfil` (prop `perfilHref` o similar por rol; el estudiante sigue en `/perfil`). Actualiza las pruebas de
   `lib/nav.ts`.
6. **Panel `/profe`:** el saludo por hora en el cliente (hora del visitante tras hidratar, con el texto de la mañana o
   uno neutro en el HTML del servidor; D098 dice por qué el servidor no lee el reloj). Inicio igual que su vista, con
   los `href` reales.
7. **Metadata:** `title` «Inicio» y «Panel» (la plantilla añade « · KREA»), `robots: { index: false, follow: false }`
   en los layouts de grupo (heredan las páginas). Sitemap/robots no cambian (D023).
8. **`bun run check:paginas`** (`scripts/qa/paginas.mjs`, node, sin dependencias): recorre `.next/server/app/**/*.html`
   salvo `_not-found`, `secciones/`, `componentes`, `tokens`; por página: exactamente un `<h1>` y un `<main>`, `<title>`
   único entre páginas, `noindex` salvo `/ingresar`; y todo `<a href>` interno (sin `#`, sin externos) debe ser una
   página generada o estar en `RUTAS_PLANIFICADAS` (lista del brief, con patrones para `[tarea]`/`[id]`/`[entrega]`).
   Sale con código ≠ 0 y lista los fallos. Córrelo con `/` y `/profe`.

### Trampas conocidas
- Next 16 + `cacheComponents`: lee en `node_modules/next/dist/docs/` lo de route groups, layouts y `usePathname` antes de
  escribir. `usePathname` solo en cliente (los `Route*` ya lo son). Constantes que consume un archivo cliente viven en
  `lib/` puro (comentario de `lib/nav.ts`: Next 16 rompe el prerender si no).
- Dos grupos con `page.tsx` en la misma URL rompen el build: `(estudiante)/page.tsx` es `/`, `(profesor)/profe/page.tsx`
  es `/profe`.
- `/secciones/*` y `/componentes` montan `TopBar`/`SideNav` directamente: tu cambio de props no puede romperlos (build).
- Hay Toasters locales en `app/secciones/{evaluar,equipos-profe,tareas-profe,puntos,premios}/layout.tsx`: se quedan (están
  fuera de los grupos, no duplican el global).
- El skip link del layout raíz apunta a `#contenido`: el `<main>` lo pone `AppShell`; no añadas otro `<main>`.

### Cómo verificar
- Pruebas puras: `tests/unit/topbar.test.ts` (todas las rutas finales: variante, título, barra inferior, en vivo) y las de
  `lib/nav.ts` actualizadas.
- `bun run build` + `bun run check:paginas` en verde; en `.next/server/app/index.html` y `profe.html`: un `<h1>`, nav con
  el ítem activo (`aria-current="page"`), `noindex`, un solo contenedor de Sonner.
- typecheck, lint, test.

### Cierre
Sin changeset. PR `feat(paginas): shell por rol, topbar por ruta e Inicio y Panel reales`. En el PR, «Decisión tomada /
alternativa» para: títulos dinámicos de la topbar, mecanismo de acción en la topbar, offset del toast sobre la
`ActionBar`, saludo del panel en cliente. Filas 95–97 para el copy nuevo (p. ej. «Salir de la evaluación», texto del
chip «En vivo» si no está en el handoff). Reporte como el brief.

---

## W3 — `feat/pag-auth`

Eres el worker **W3**. Rama: `claude/wizardly-allen-pixhf6` (rehecha desde `main` con W2 mergeado). Decisiones:
**D134–D135**. Checklist: filas **98–99**. Modelo · esfuerzo: **sonnet · medium**. Docker: **no**.

Decisiones previas: D023 (solo `/ingresar` indexable), D070 (`AuthLayout`), D071 (errores de auth y foco), D072, y la
que W2 haya escrito sobre los grupos de rutas (`grep -l "grupo\|group" context/decisions/D12[89]-* context/decisions/D13[0-3]-*`).

### Lo que pide la fase
> HANDOFF §3: «Ingresar (`/ingresar`) y recuperar (`/recuperar`, `/recuperar/enviado`, `/recuperar/nueva`)».

### Dónde está
- `app/secciones/ingresar/[estado]/page.tsx` — las cuatro pantallas con `AuthLayout`, `LoginForm` (`recuperarHref`,
  `error`), `RecoverForm` (`volverHref`), `RecoverSent` (`email` placeholder, `volverHref`), `NewPasswordForm`
  (`vencido`, `pedirOtroHref`). `components/sections/auth/*`.
- `app/sitemap.ts`, `app/robots.ts` — ya listan solo `/ingresar`.

### Enfoque decidido
- `app/(auth)/layout.tsx` con el `<main id="contenido">` (como `Vista sinNavegacion`) y las cuatro páginas, enlazadas
  entre sí con rutas reales. Los estados de error de servidor (credenciales, bloqueado, vencido) **no** son rutas: se
  quedan en `/secciones/ingresar/*`; la fase 07 los pinta desde la respuesta de Auth.
- Sin autenticación: «Entrar», «Enviar enlace» y «Guardar contraseña» hacen lo que hacen hoy en la sección (sin navegar
  a `/` fingiendo un login). Si alguno necesita un destino para no quedar muerto (p. ej. «Enviar enlace» →
  `/recuperar/enviado`), añade la prop de forma retrocompatible y documéntalo (D-ID).
- Metadata: `/ingresar` indexable con `title` y `description` propios + `alternates.canonical`; las otras tres `noindex`.
  JSON-LD: `seo` skill en modo página para `/ingresar` (probablemente `WebPage`/`WebSite` mínimo; el resto no lleva).
- Añade `/ingresar` como destino del «Cerrar sesión» si el shell de W2 lo dejó sin destino (solo el enlace; nada de sesión).

### Trampas conocidas
- El layout raíz pone `robots` del sitio; el `noindex` de `/secciones` está en cada vista. Comprueba en el HTML del build
  que `/ingresar` no hereda un `noindex` del grupo.
- `RecoverSent` muestra un correo placeholder (fila 3 del checklist): mantenlo marcado.

### Cómo verificar
- `bun run build` + `bun run check:paginas` en verde (las cuatro rutas, sus enlaces entre sí, `/ingresar` sin `noindex`).
- typecheck, lint, test.

### Cierre
Sin changeset. PR `feat(paginas): ingresar y recuperar como rutas reales`. Reporte como el brief.
