# F05 ola 1 W2 — Shell por rol, topbar por ruta, Inicio y Panel (cloud, 2026-11-03)

- Grupos `app/(estudiante)/` (`/`) y `app/(profesor)/profe/` (`/profe`): layout con `AppShell anchoPorRuta`, `Route*` navs, usuario de `lib/demo/usuarios.ts`, `evaluarCount = COLA.length`, `TopBarAccionProvider` y un `<Toaster />` por grupo. `robots` noindex en los layouts. `app/page.tsx` borrado (Inicio lo reemplaza).
- `lib/topbar.ts` `topbarDe(rol, pathname, titulos)` con todas las rutas finales; títulos con datos desde `lib/demo/topbar.ts` (diccionario armado en el servidor). `lib/layout.ts` `anchoDe` + `mainClass`; `RouteMain` en `route-nav.tsx`.
- `TopBar`: `volverLabel`, `volverIcono` (X de Evaluar), `enVivo` (chip; con él el Menú del profe va compacto), `accion` (hueco), `soloAccion` (constructor). `MenuSheet compacto`. `TopBarAccion` (portal por contexto) para «Guardar borrador» en la ola 3.
- Toast: `--toast-bnav` + `--toast-action` en `globals.css`; `ActionBar` con `data-slot="action-bar"` y `ActionBarAltura` (ResizeObserver → `--h-action-bar`). Sin barra inferior: marca `[data-sin-barra-inferior]` + `has-data-sin-barra-inferior:hidden` en el `<nav>`.
- Nav del profe: Ranking `/profe/ranking`; Perfil `/profe/perfil` en `UserCard` (por defecto `perfilHref(rol)`) y en la hoja Menú.
- Panel: `PanelConHora` (`useSyncExternalStore`, servidor = 9 h). Inicio igual que su vista.
- `bun run check:paginas` (`scripts/qa/paginas.mjs`) con `RUTAS_PLANIFICADAS` (la ola 3 la vacía).
- Medido (Playwright + CSS del build, sin servidor): topbars a 320/375 sin desbordar (Menú completo + chip desbordaba 14 px a 320 → compacto); offsets del toast 88/16/160/184/92; axe en `/` y `/profe` (320/375/1280 × claro/oscuro): 0 nuevas; 2 previas en Inicio (contraste de PointsCard, iniciales del avatar sin imagen).
- Decisiones D128–D133; D035 → Implemented. Filas 95–97.
