# Fase 05 — Páginas · plan de olas

> Escrito por `orchestrate` el 2026-11-03 (sesión cloud). Cada ola corre en **su propia sesión**: la que empieza una ola
> lee este archivo, `CURRENT_PHASE.md` y nada más del plan.
> Fase: `phases/05-PAGES.md` · Handoff §3 (rutas por pantalla), §4 (layout), §8 (trampas) · notas de entrada: «Para la
> fase 05» de `context/plans/phase-04-secciones.md`.
> **Sin QA hasta el final del proyecto** (César, 2026-10-29). **Sin servidor** (César, 2026-11-03): la verificación es
> typecheck, lint, test, build y el HTML del build (`bun run check:paginas`, lo crea la ola 1). Ni `next dev`/`next start`
> ni capturas. Sin versionado: ningún changeset. Sin datos reales: no se toca Firebase (fase 07).
> **En sesión cloud** no hay pool: las unidades van una tras otra, cada una PR → CI verde → squash (`cloud-session` §2).

## Decisiones de César para esta fase (2026-11-03)

- **Ranking del profesor en `/profe/ranking`** (dentro del grupo del profesor, con 5A/5C). `/ranking` es del estudiante.
  El handoff decía `/ranking` para los dos: se cambia el `href` del ítem Ranking del profesor en `lib/nav.ts`.
- **Perfil del profesor en `/profe/perfil`**: reutiliza Apariencia y Seguridad de Perfil (sin avatar ni «Tus datos»).
  La tarjeta de usuario del profe enlaza ahí.
- **`/secciones`, `/componentes` y `/tokens` se quedan hasta la fase 09**, sin indexar. Se bloquean o borran al cerrar.
- **Bug reportado:** los selectores de acento y de tema «se juntan en un solo lugar y no se pueden seleccionar». Causa
  (mapeo del orquestador): `@container` (`container-type: inline-size`) en `ToggleGroup` y `Tabs variant="segmented"`
  también cuando son `inline-flex w-fit` → el grupo no toma el ancho de su contenido y colapsa. Lo arregla W1.

## Cómo se monta una página (lo fija W2, ola 1)

- Grupos de rutas: `app/(estudiante)/layout.tsx` (AppShell estudiante), `app/(profesor)/profe/layout.tsx` (AppShell
  profesor), `app/(auth)/…` (Ingresar y recuperar, sin shell). `/secciones`, `/componentes`, `/tokens` quedan fuera.
- El shell vive en el **layout** (persiste al navegar), con `RouteSideNav`/`RouteTopBar`/`RouteBottomNav` (D063).
  La topbar móvil de cada ruta (logo, o volver + título, chip «En vivo», X de Evaluar, sin barra inferior en el
  constructor) sale de una función pura por `pathname` en `lib/` con pruebas. Un `<Toaster />` global por grupo (D035).
- Cada `page.tsx` real importa las mismas secciones que su vista de `/secciones/<pantalla>` con los datos de `lib/demo/`,
  pasa los `href` reales y declara su `metadata` (`title` único, `robots: { index: false }` salvo `/ingresar`, D023).
  Las rutas dinámicas: `generateStaticParams` desde `lib/demo/` + `notFound()` si el id no existe.
- Las vistas `/secciones/*` no se tocan (siguen siendo el catálogo de estados).

## Olas

| Ola | Unidades (rama · qué · archivos) | Depende de | Estado |
|---|---|---|---|
| 1 | `fix/segmentado-container` · bug de César: `@container` solo en modo `block` de `ToggleGroup` y `Tabs` segmentado; barrido de la clase; script de medida versionado · `components/ui/toggle-group.tsx`, `components/ui/tabs.tsx`, `scripts/qa/` | — | cerrada (#35) |
| 1 | `feat/pag-shell` · grupos de rutas + layouts por rol, topbar por ruta (`lib/topbar.ts`), slot de acción en la topbar, Toaster global con offset sobre la `ActionBar`, nav del profe (`/profe/ranking`, `/profe/perfil`), páginas `/` (Inicio) y `/profe` (Panel), `check:paginas` · `app/(estudiante)/`, `app/(profesor)/profe/`, `components/layout/*`, `lib/topbar.ts`, `lib/nav.ts`, `scripts/qa/paginas.mjs` | W1 | cerrada (#36) |
| 1 | `feat/pag-auth` · `/ingresar`, `/recuperar`, `/recuperar/enviado`, `/recuperar/nueva` (indexable solo `/ingresar`) · `app/(auth)/` | W2 | cerrada (#37) |
| 2 | `feat/pag-notas` · `/notas`, `/notas/[tarea]` | ola 1 | cerrada (#38) |
| 2 | `feat/pag-tareas` · `/tareas`, `/tareas/[tarea]` (capitán / no capitán / individual / entregada según los datos) | ola 1 | cerrada (#39) |
| 2 | `feat/pag-equipo-ranking-perfil` · `/equipo`, `/ranking` (chip «En vivo» en la topbar móvil), `/perfil` | ola 1 | cerrada (#40) |
| 3 | `feat/pag-profe-evaluar` · `/profe/evaluar` (redirige a la primera entrega de la cola, vacío si no hay), `/profe/evaluar/[entrega]` (X + «Entrega n de m» en la topbar móvil, Toaster global en vez del local) | ola 1 | pendiente |
| 3 | `feat/pag-profe-tareas` · `/profe/tareas`, `/profe/tareas/nueva`, `/profe/tareas/[id]` (sin barra inferior, «Guardar borrador» en la topbar) + alinear ids de `COLA` y `TAREAS` | ola 1 | pendiente |
| 3 | `feat/pag-profe-gestion` · `/profe/alumnos`, `/profe/equipos`, `/profe/puntos`, `/profe/premios`, `/profe/ranking`, `/profe/perfil` + cierre de la fase (`PAGE_INVENTORY`, `seo` modo página, `check:paginas` en verde sobre todas) | ola 1 (y las otras dos de la ola 3, va última) | pendiente |

Reglas de reparto:
- Cada unidad crea **solo** sus `page.tsx` (y `layout.tsx`/`not-found.tsx` propios si los necesita) bajo su grupo; usa
  las secciones de `components/sections/*` y los datos de `lib/demo/*` por import. Si una sección necesita una prop nueva
  (un `href` que hoy está fijo, un callback), la añade de forma retrocompatible sin romper su vista de `/secciones`.
- `components/layout/*`, `lib/nav.ts`, `lib/topbar.ts` y los layouts de grupo son de W2 (ola 1). Las olas 2 y 3 añaden
  filas a `lib/topbar.ts` si su ruta lo necesita (una entrada por ruta, con su prueba), no cambian su forma.
- Cada unidad corre `bun run check:paginas` antes del PR y añade sus filas a `PAGE_INVENTORY.md` (local).
- Tokens nuevos: bloque propio al final de `app/globals.css` (`/* ---------- Página <ruta> (Dnnn) ---------- */`).

## Números reservados (contra `origin/main`: última decisión D125, última fila del checklist 94)

| Ola | Decisiones | Filas `CONTENT_CHECKLIST` | Reparto |
|---|---|---|---|
| 1 | D126–D135 | 95–99 | W1 D126–D127 · W2 D128–D133, filas 95–97 · W3 D134–D135, filas 98–99 |
| 2 | D136–D147 | 100–108 | 4 IDs y 3 filas por unidad, en el orden de la tabla |
| 3 | D148–D159 | 109–117 | ídem |

## Para la ola 2 y la 3 (lo dejó la ola 1)

- Leer D126 (segmentados: `@container` solo con `block`; `bun run qa:segmentado`), D128 (topbar por ruta: `topbarDe` en
  `lib/topbar.ts`, títulos dinámicos como diccionario armado en el servidor en `lib/demo/topbar.ts`), D129 (ancho por
  ruta: `anchoDe` + `AppShell anchoPorRuta`, `RouteMain`), D130 (`TopBarAccion`: `<TopBarAccion><Button…>Guardar
  borrador</Button></TopBarAccion>`), D131 (Toaster por grupo; el toast sube sobre la `ActionBar` con `ActionBarAltura`),
  D132 (nav del profe), D133 (saludo del Panel en cliente).
- Las páginas nuevas **no** montan Toaster propio: `toast()` sin `toasterId` usa el global (Evaluar incluido).
- **Ids de entrega del Panel ≠ `COLA`:** `ENTREGAS_PANEL` (`lib/demo/panel.ts`: `5a-g2-logo`, `32828381-identidad`…) no
  casan con `COLA` (`lib/demo/evaluar.ts`: `5a-g2-logo-y-paleta`…), ni en orden. `feat/pag-profe-evaluar` (ola 3) los
  alinea (el Panel lee de `COLA` o usa sus ids); `check:paginas` fallará hasta entonces si no.
- `RUTAS_PLANIFICADAS` (`scripts/qa/paginas.mjs`): **cada unidad quita de la lista las rutas que crea** (hoy aún
  lista `/`, `/profe` y las de auth, que ya existen: la primera unidad de la ola 2 las quita).
- Auth (D134–D135): `RecoverForm` con `enviadoHref`; «Cerrar sesión» del profe → `/ingresar` (`salirHref`); el del
  estudiante (Seguridad de Perfil) lo cablea `feat/pag-equipo-ranking-perfil` igual. Fila 99 del checklist quedó libre.
- Verificación sin servidor: Playwright sirviendo `.next/server/app/*.html` + `/_next/static` con `page.route` (receta
  en `.qa/a11y-paginas.mjs` de W2 no está versionada: rehacerla o versionarla en `scripts/qa/`).

## Ola actual: 3 (siguiente sesión)

- Ola 2 (cloud, en serie, sin brief aparte): #38 notas · #39 tareas · #40 equipo/ranking/perfil — merged. D136, D140, D144; filas 100 y 103.
- Ola 1: brief y prompts en `context/plans/orchestration-2026-11-03-f05-ola1.md` / `…-prompts.md`
- PRs ola 1: #35 W1 segmentados · #36 W2 shell · #37 W3 auth — merged
- QA: no aplica (César: QA solo al final)

## Cierres

| Ola | PRs | QA | Pasa a la siguiente | Datos sin borrar |
|---|---|---|---|---|
| 1 | #35 segmentados (bug de César), #36 shell por rol + `/` y `/profe`, #37 ingresar y recuperar (cloud, en serie) | no aplica (César: QA solo al final) | notas de «Para la ola 2 y la 3»; backlog: contraste de la tarjeta de puntos (alta, a César), ids Panel ≠ `COLA` (ola 3) | ninguno |

| 2 | #38 notas (D136), #39 tareas (D140), #40 equipo, ranking y perfil (D144) (cloud, en serie) | no aplica (César: QA solo al final) | notas abajo; backlog: ver `backlog.md` | ninguno |

### Para la ola 3 (lo dejó la ola 2)

- `check:paginas` ya ignora el esqueleto `[param].html` del prerender parcial (cacheComponents); las rutas dinámicas se comprueban por sus páginas de `generateStaticParams`. Quedan en `RUTAS_PLANIFICADAS` solo las 11 del profe.
- Patrón de rutas dinámicas: `generateStaticParams` desde `lib/demo/*`, `generateMetadata` async, `notFound()`; los enlaces de las listas apuntan a todos los ids, así que cada id debe tener página (aviso vacío si falta dato, D136).
- `titulosTopbar` usa los ids de `TAREAS`/`COLA`: las rutas dinámicas del profe deben usar esos mismos (alinear `COLA`/`ENTREGAS_PANEL`).
- Secciones con modo por datos: `modoDe()` en `lib/demo/entrega.ts` (D140). Ranking del estudiante: `/ranking` + `/ranking/equipos` (D144); para el profe `/profe/ranking` tiene 6 estados (`estadoSlug`, 5A/5C): usar subrutas o `?`-less rutas como D144.
- Reservado ola 3: D148–D159, filas 109–117 (la ola 2 usó solo D136, D140, D144 y filas 100, 103; D137–139, D141–143, D145–147 y filas 101–102, 104–108 quedan libres).

## Prompt de inicio de la siguiente ola

```
/orchestrate ola 3 de la fase 05. Plan: context/plans/phase-05-paginas.md
```
