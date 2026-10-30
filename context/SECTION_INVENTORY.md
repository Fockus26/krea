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
