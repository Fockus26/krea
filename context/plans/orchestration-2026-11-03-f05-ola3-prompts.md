# Fase 05 · ola 3 — prompts por unidad (sesión cloud, en serie)

Brief compartido = `context/plans/phase-05-paginas.md` (secciones «Cómo se monta una página», «Para la ola 2 y la 3», «Para la ola 3»). Léelo entero.
Orden: W1 evaluar → W2 profe-tareas → W3 profe-gestión (cada una se mergea antes de empezar la siguiente).
Sin servidor, sin capturas, sin QA, sin Firebase, sin changesets. Verificación: `bun run typecheck && bun run lint && bun run test && bun run build && bun run check:paginas`.
Idioma: Spanish para commits y texto. Trabajas en `/home/user/krea`, rama `claude/tender-mayer-qjl4d3` (ya parte de `origin/main`). **No hagas PR ni merge**: commit + `git push -u origin claude/tender-mayer-qjl4d3` y reporta. `context/` es local: léelo/escríbelo en esta misma carpeta.

Patrón de referencia: `app/(estudiante)/notas/[tarea]/page.tsx`, `app/(estudiante)/ranking/*`, `app/(profesor)/profe/page.tsx`, `app/(profesor)/profe/layout.tsx`.
Cada `page.tsx` importa las mismas secciones que su vista `app/secciones/<pantalla>` (léelas para ver qué props/datos pasan) con `lib/demo/*`, pasa `href` reales, declara `metadata` (`title` único, `robots: { index: false }`). Dinámicas: `generateStaticParams` desde `lib/demo/`, `generateMetadata` async, `notFound()`. Si una sección necesita una prop nueva, retrocompatible (sin romper `/secciones`). No montes Toaster propio (D131). No toques `components/layout/*`, `lib/nav.ts` ni layouts de grupo; `lib/topbar.ts` solo si falta una fila (ya cubre todas las rutas del profe). Cada unidad: quita de `RUTAS_PLANIFICADAS` (`scripts/qa/paginas.mjs`) las rutas que crea, añade filas a `context/PAGE_INVENTORY.md`, una decisión `context/decisions/Dnnn-*.md` por cada elección no obvia (formato: mira D140), filas de `context/CONTENT_CHECKLIST.md` solo para copy/dato provisional. Tokens nuevos: bloque propio al final de `app/globals.css`. Cero valores mágicos, WCAG AA (skill `a11y`: revisión por código, sin servidor). Si una decisión visual es nueva, elige la conservadora y explícala en el reporte. Reporta: archivos, decisiones usadas, filas del checklist, resultado de cada comando, problemas "de paso" (no los arregles si son de código cerrado).

## W1 — `feat/pag-profe-evaluar` · D148–D151 · filas 109–111

Rutas: `/profe/evaluar` y `/profe/evaluar/[entrega]` (vista de referencia `app/secciones/evaluar/[estado]`, datos `lib/demo/evaluar.ts`: `COLA`, `evaluarVista(indice)`).
- `/profe/evaluar` redirige (`redirect`) a la primera entrega de `COLA`; si `COLA` está vacía, estado vacío (el de la vista `/secciones/evaluar`).
- `/profe/evaluar/[entrega]`: `generateStaticParams` desde `COLA`; el índice de la entrega en la cola da `evaluarVista`. La topbar móvil ya sale de `topbarDe` + `titulosTopbar` (`lib/demo/topbar.ts`, «Entrega n de m»). El Toaster es el global (quita cualquier Toaster local de la sección al usarla en la página, sin romper la vista de `/secciones/evaluar`).
- **Alinear ids:** `ENTREGAS_PANEL` (`lib/demo/panel.ts:51`, ids `5a-g2-logo`, `45003711-identidad`…) no casa con `COLA` (`5a-g2-logo-y-paleta`…). Haz que el Panel (`/profe`) enlace a ids de `COLA` (lo más simple: que `ENTREGAS_PANEL` derive sus `href`/ids de `COLA` o use esos ids; mantén los tests de `lib/demo` verdes y actualízalos si dependían del id viejo). Cada enlace del Panel a Evaluar debe tener página.
- Navegación anterior/siguiente dentro de la cola con enlaces reales si la sección lo admite.

## W2 — `feat/pag-profe-tareas` · D152–D155 · filas 112–114

Rutas: `/profe/tareas`, `/profe/tareas/nueva`, `/profe/tareas/[id]` (vistas `app/secciones/tareas-profe/[estado]`, datos `lib/demo/tareas-profe.ts`: `tareasProfeVista`, `BORRADOR_DEMO`, `NUEVA_DEMO`, `BORRADOR_ID`).
- Lista con enlaces reales a cada tarea; «Nueva tarea» → `/profe/tareas/nueva`.
- Constructor sin barra inferior (ya en `lib/topbar.ts`: `CONSTRUCTOR`); «Guardar borrador» en la topbar con `<TopBarAccion>` (D130) solo en móvil como definen D130/vista; el constructor de `/secciones` puede tener su propia acción: no la dupliques en la página real.
- `/profe/tareas/[id]`: `generateStaticParams` desde los ids de `TAREAS` (`lib/demo/tareas.ts`) + `BORRADOR_ID`; `titulosTopbar` del profe debe usar esos mismos ids (añade a `lib/demo/topbar.ts` los títulos de las rutas del profe que dependan de datos). Id sin datos de borrador → el constructor con el dato disponible o aviso vacío (D136), nunca inventar. Alinear ids de `TAREAS` y de la lista de `tareasProfeVista` para que cada enlace tenga página.
- Reglas del constructor intactas: las tareas suman exactamente 20, pasos de 0,5 (D004).

## W3 — `feat/pag-profe-gestion` · D156–D159 · filas 115–117 · va última, cierra la fase

Rutas: `/profe/alumnos`, `/profe/equipos` (+ estados que use la vista `equipos-profe/[estado]`, como D144: subrutas), `/profe/puntos`, `/profe/premios`, `/profe/ranking` (6 estados 5A/5C vía `estadoSlug`, subrutas o rutas sin query como `/ranking` del estudiante, D144), `/profe/perfil` (Apariencia y Seguridad de Perfil, sin avatar ni «Tus datos»; «Cerrar sesión» → `/ingresar` con `salirHref`). Vistas: `app/secciones/{alumnos,equipos-profe,puntos,premios,ranking,perfil}`; datos `lib/demo/{alumnos,equipos-profe,puntos,premios,ranking,perfil}.ts`. Nota ≠ puntos: los ajustes de conducta mueven puntos, nunca la nota (D007).
Cierre de fase: `RUTAS_PLANIFICADAS` queda vacía (o se elimina con su lógica si ya no tiene sentido; mantén `check:paginas` útil), `check:paginas` en verde sobre **todas** las rutas; `PAGE_INVENTORY.md` completo; skill `seo` en modo página (metadata única, `robots` noindex salvo `/ingresar`, `sitemap`/`robots` coherentes; no toques `/secciones`, `/componentes`, `/tokens`); skill `a11y` sobre las páginas de la fase por lectura de código y del HTML del build. Reporta además un resumen de la fase (rutas, decisiones D126–D159, filas del checklist).
