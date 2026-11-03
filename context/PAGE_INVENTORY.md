# Page Inventory — KREA

| Page | Route | Sections it uses | Status | Notes |
|---|---|---|---|---|
| Iniciar sesión | /ingresar | LoginCard | Done (F05 W3) | `app/(auth)/ingresar/page.tsx` (D134) |
| Olvidé mi contraseña | /recuperar | RecoverForm, RecoverSent | Done (F05 W3) | `app/(auth)/recuperar/{,enviado,nueva}/page.tsx` (D134) |
| Inicio estudiante | / | HomeGrid: PageHeader, PointsCard, RecentGrades, PendingTasks, TeamSummary | Done (F05 W2) | `app/(estudiante)/page.tsx`; shell en `app/(estudiante)/layout.tsx` (D128–D131) |
| Mis notas | /notas | GradeList | Pending | |
| Detalle de nota | /notas/[tareaId] | GradeBreakdownHeader, QuestionResult ×n | Pending | |
| Tareas / entregar | /tareas, /tareas/[tareaId] | TaskList, SubmissionForm | Pending | grupal: solo capitán envía |
| Mi equipo | /equipo | TeamHeader, Members, TeamGrades, Prize | Pending | |
| Ranking | /ranking | RankingTabs, Podium, RankingList | Pending | en vivo |
| Perfil | /perfil | ProfileInfo, AvatarPicker, Appearance, Security | Pending | |
| Panel profesor | /profe | PanelConHora → PanelView (PanelHeader, PanelMetrics, PendingReviews, RecentAdjustments) | Done (F05 W2) | `app/(profesor)/profe/page.tsx`; saludo en cliente (D133); shell en `app/(profesor)/profe/layout.tsx` |
| Alumnos | /profe/alumnos | StudentsTable, StudentDrawer | Pending | |
| Equipos | /profe/equipos | TeamBoard | Pending | |
| Tareas (profesor) | /profe/tareas, /profe/tareas/[id] | TaskTable, TaskBuilder | Pending | suma = 20 |
| Evaluar entregas | /profe/tareas/[id]/entregas | SubmissionQueue, GradingPanel | Pending | |
| Ajustes de puntos | /profe/puntos | AdjustmentForm, AdjustmentLog | Pending | |
| Premios | /profe/premios | PrizeList | Pending | |
| 404 / 500 / offline | — | StatusScreen | Pending | |
