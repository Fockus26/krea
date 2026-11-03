# Page Inventory — KREA

| Page | Route | Sections it uses | Status | Notes |
|---|---|---|---|---|
| Iniciar sesión | /ingresar | LoginCard | Done (F05 W3) | `app/(auth)/ingresar/page.tsx` (D134) |
| Olvidé mi contraseña | /recuperar | RecoverForm, RecoverSent | Done (F05 W3) | `app/(auth)/recuperar/{,enviado,nueva}/page.tsx` (D134) |
| Inicio estudiante | / | HomeGrid: PageHeader, PointsCard, RecentGrades, PendingTasks, TeamSummary | Done (F05 W2) | `app/(estudiante)/page.tsx`; shell en `app/(estudiante)/layout.tsx` (D128–D131) |
| Mis notas | /notas | GradesList, GradeLegend | Done (F05 ola 2) | `app/(estudiante)/notas/page.tsx` |
| Detalle de nota | /notas/[tarea] | GradeSummary, QuestionList | Done (F05 ola 2) | una página por tarea; solo Identidad trae detalle (D136) |
| Tareas / entregar | /tareas, /tareas/[tarea] | PendingTasks, DeliveredTasks, TaskHeader, TaskAnswerForm, TaskDelivered | Done (F05 ola 2) | modo por los datos (D140); grupal: solo capitán envía |
| Mi equipo | /equipo | TeamHero, TeamMembers, TeamGrades, TeamPrizes | Done (F05 ola 2) | sin equipo por los datos |
| Ranking | /ranking, /ranking/equipos | Ranking | Done (F05 ola 2) | D144; en vivo en la topbar móvil |
| Perfil | /perfil | ProfileIdentity, ProfileData, AvatarPicker, AppearanceSettings, SecuritySettings | Done (F05 ola 2) | salir → /ingresar |
| Panel profesor | /profe | PanelConHora → PanelView (PanelHeader, PanelMetrics, PendingReviews, RecentAdjustments) | Done (F05 W2) | `app/(profesor)/profe/page.tsx`; saludo en cliente (D133); shell en `app/(profesor)/profe/layout.tsx` |
| Alumnos | /profe/alumnos | StudentsTable, StudentDrawer | Pending | |
| Equipos | /profe/equipos | TeamBoard | Pending | |
| Tareas (profesor) | /profe/tareas, /profe/tareas/nueva, /profe/tareas/[id] | TasksHeader, TeacherTaskList, TaskBuilder | Done (F05 ola 3) | D152–D154; una página por tarea de `TAREAS` + borrador; constructor sin barra inferior, «Guardar borrador» en la topbar; suma = 20 |
| Evaluar entrega | /profe/evaluar, /profe/evaluar/[entrega] | ReviewHeader, ReviewForm | Done (F05 ola 3) | `/profe/evaluar` redirige a la 1.ª de `COLA` (vacío si no hay); una página por entrega (D148); Panel enlaza a los ids de `COLA` |
| Ajustes de puntos | /profe/puntos | AdjustmentForm, AdjustmentLog | Pending | |
| Premios | /profe/premios | PrizeList | Pending | |
| 404 / 500 / offline | — | StatusScreen | Pending | |
