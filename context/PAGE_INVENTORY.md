# Page Inventory — KREA

| Page | Route | Sections it uses | Status | Notes |
|---|---|---|---|---|
| Iniciar sesión | /ingresar | LoginCard | Pending | |
| Olvidé mi contraseña | /recuperar | RecoverForm, RecoverSent | Pending | |
| Inicio estudiante | / | GradeHero, PointsSummary, PendingTasks, MiniRanking, TeamCard | Pending | |
| Mis notas | /notas | GradeList | Pending | |
| Detalle de nota | /notas/[tareaId] | GradeBreakdownHeader, QuestionResult ×n | Pending | |
| Tareas / entregar | /tareas, /tareas/[tareaId] | TaskList, SubmissionForm | Pending | grupal: solo capitán envía |
| Mi equipo | /equipo | TeamHeader, Members, TeamGrades, Prize | Pending | |
| Ranking | /ranking | RankingTabs, Podium, RankingList | Pending | en vivo |
| Perfil | /perfil | ProfileInfo, AvatarPicker, Appearance, Security | Pending | |
| Panel profesor | /profe | TeacherStats, ToGrade, RecentAdjustments | Pending | |
| Alumnos | /profe/alumnos | StudentsTable, StudentDrawer | Pending | |
| Equipos | /profe/equipos | TeamBoard | Pending | |
| Tareas (profesor) | /profe/tareas, /profe/tareas/[id] | TaskTable, TaskBuilder | Pending | suma = 20 |
| Evaluar entregas | /profe/tareas/[id]/entregas | SubmissionQueue, GradingPanel | Pending | |
| Ajustes de puntos | /profe/puntos | AdjustmentForm, AdjustmentLog | Pending | |
| Premios | /profe/premios | PrizeList | Pending | |
| 404 / 500 / offline | — | StatusScreen | Pending | |
