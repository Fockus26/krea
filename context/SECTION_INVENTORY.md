# Section Inventory — KREA

> Se llena desde la fase 04. Referencia visual de cada sección: `design/prototype/` y el
> handoff de Claude Design.

| Section | Path | Page(s) | Phase that closed it | Status | Notes |
|---|---|---|---|---|---|
| PageHeader · GradeRow · ActionBar (compartidas) | `components/sections/shared/` | todas | F04 ola 1 (W1) | Done | D066–D068 |
| AuthLayout · LoginForm · RecoverForm · RecoverSent · NewPasswordForm | `components/sections/auth/` | Ingresar, Recuperar (`/secciones/ingresar/[estado]`) | F04 ola 1 (W2) | Done | D070–D072; errores de servidor y enlace vencido como estados |
| HomeGrid · PointsCard · RecentGrades · PendingTasks · TeamSummary (+ saludo con PageHeader) | `components/sections/inicio/` | Inicio (`/secciones/inicio`) | F04 ola 1 (W3) | Done | D074–D076; vacíos del lienzo Vacíos |
| GradeLegend · GradesList (Mis notas) · GradeSummary · QuestionList · BackLink (Detalle) | `components/sections/notas/` | Mis notas (`/secciones/notas`), Detalle (`/secciones/notas/[estado]`) | F04 ola 2 (notas) | Done | D078–D080; filtro local, Raspado por la píldora |
| TaskHeader · PrizeCard · CaptainNotice · TaskAnswerForm · TaskDelivered · DeliveredTasks (+ PendingTasks de Inicio) | `components/sections/tareas/` | Tareas (`/secciones/tareas`), Entrega (`/secciones/tareas/[estado]`) | F04 ola 2 (tareas) | Done | D082; borrador local de textos; BackLink → shared |
| TeamHero · TeamMembers · TeamGrades · TeamPrizes | `components/sections/equipo/` | Mi equipo (`/secciones/equipo/[estado]`) | F04 ola 2 (equipo) | Done | D086; premio solo con ganador único |
| ProfileIdentity · ProfileData · AvatarPicker · AppearanceSettings · SecuritySettings | `components/sections/perfil/` | Perfil (`/secciones/perfil`) | F04 ola 2 (perfil) | Done | D090; `lib/apariencia.ts` compartido con el índice |
| RankingList + Podium | — | Ranking | — | Pending | prototipo: `#/ranking` |
| TaskBuilder | — | Tareas (profesor) | — | Pending | prototipo: `#/profe/tareas/nueva` |
| GradingPanel | — | Evaluar entregas | — | Pending | prototipo: `#/profe/evaluar` |
| StudentFilters · StudentsTable · EditStudentDialog · StudentsDirectory (Alumnos del profesor) | `components/sections/alumnos/` | Alumnos (`/secciones/alumnos`; final `/profe/alumnos`) | F04 ola 3 (W4) | Review (PR #27) | D106–D109; búsqueda sin tildes, contador `<output>`, un `Dialog` por fila, guardado local (Firestore en fase 07) |
| RankingHeader · SegmentedLinks · RankingBoard · RankingRules · RankingFeed · RankingHowTo | `components/sections/ranking/` | Ranking (`/secciones/ranking/[estado]`, 6 estados; final `/ranking`) | F04 ola 3 (W1) | Review (PR #28) | D094–D097; pestañas y sección como enlaces con `aria-current`; feed `aria-live` solo ≥ 1024; `<details>` móvil con `localStorage` |
| PanelHeader · PanelMetrics · PendingReviews · RecentAdjustments · PanelView (Panel del profesor) | `components/sections/profe-panel/` | Panel (`/secciones/profe/[estado]`: mañana/tarde/noche/5c; final `/profe`) | F04 ola 3 (W2) | Review (PR #29) | D098–D101; saludo por hora puro (hora fija por estado), filtro 5A/5C/Ambas local con `<output>`, métricas `g3` enlace, `DemoAjuste` en `lib/demo/ajustes.ts` |
| ReviewHeader · ReviewIndex · ReviewForm (Evaluar entrega) | `components/sections/evaluar/` | Evaluar (`/secciones/evaluar/[estado]`, 7 estados; final `/profe/evaluar/[entrega]`) | F04 ola 3 (W3) | Review (PR #30) | D102–D105; medidor `LiveTotal` bar (móvil) / card (aside), índice desde 6, Ctrl+Enter, toast con Deshacer (Toaster local en `layout.tsx`), `ActionBar` móvil |
