# Project Context — KREA

> Generado por `project-kickoff` (2026-10-25). Es el primer archivo que lee cualquier agente
> que entre al proyecto.

## Summary

KREA es el portal de notas de la Escuela Creativa del liceo (5.º año, secciones A y C).
Reemplaza el Excel: los estudiantes ven sus notas con el desglose de cada pregunta, su equipo
y un ranking en vivo; los profesores crean tareas-formulario, evalúan con rúbrica, ajustan
puntos y gestionan los equipos.

## Project type

dashboard/app (portal con dos roles: estudiante y profesor)

## Business

- **What it does:** escuela creativa dentro del liceo; los alumnos trabajan en equipos que
  crean una marca (barbería, repostería, ropa…) y entregan tareas individuales y grupales.
- **What the site must achieve:** transparencia de la evaluación y motivación (ranking, premios).
- **Main action:** estudiante → abrir su nota y entender cómo se evaluó cada pregunta.
  Profesor → evaluar una entrega en menos de 1 minuto.

## Target audience

- **Estudiantes** (15–17 años), casi siempre desde el teléfono y con datos móviles limitados.
  Buscan su nota, por qué la sacaron, en qué puesto van y qué gana su equipo.
- **Profesores** (2–3), desde una laptop en el liceo o en casa. Buscan evaluar rápido, ajustar
  puntos por conducta y mantener los equipos.

## Brand tone

Cálido, lúdico, enérgico, justo (la evaluación se entiende).

**Must not look like:** un sistema administrativo escolar gris; un videojuego infantil;
una red social ruidosa.

## Language and market

- Language(s): español
- Country / locale: Venezuela · es-VE
- Currency and format: no maneja dinero; decimales con coma (`18,5`), fechas `dd/mm/aaaa`.

## Visual references

- Duolingo — la celebración y el feedback inmediato (ligas, rachas), sin su densidad de mascotas.
- Kahoot — el podio y el cambio de puestos en vivo.
- Linear — la claridad del panel del profesor (tablas densas pero legibles).

## Brand constraints

- **Logo:** disponible — `public/brand/krea-logo.svg` (vectorizado de los PNG de César, dos
  capas: letras `--krea-logo-ink` y gotas `--krea-logo-splash`). Ver D002.
- **Mandatory colors:** acentos #ee0400 · #115445 · #734ad1 · #295ac3 (elegibles por el usuario, D001).
- **Mandatory font:** ninguna — propuesta Poppins + Nunito Sans (D005).
- **Other:** el alumno elige acento y tema (claro/oscuro/sistema); avatares DiceBear (D010).

## Tech stack

- Framework: Next.js (App Router)
- Language: TypeScript
- Components: shadcn/ui — reason: diseño propio y acentos intercambiables por variables CSS.
- Styling: Tailwind CSS — only one, never both
- Package manager: **bun**
- Documentation: **Context7** before using any library's API
- Database / ORM: Firebase Firestore (tiempo real con `onSnapshot` para el ranking)
- Authentication: Firebase Auth (cédula → email interno + email real para recuperación; D008)
- Payments: N/A
- Email: Firebase Auth (restablecer contraseña). Sin otros correos en v1 (D009).
- Storage: Firebase Storage (logos de equipo, respuestas en imagen)
- Avatares: DiceBear HTTP API 9.x (`https://api.dicebear.com/9.x/<estilo>/svg?seed=<semilla>`)
- Deployment: Vercel
- Domain: PENDING

## Repo and deployment

- Repo: https://github.com/Fockus26/krea (private) · `main` sin protección (403 en plan gratuito)
- Versioning: no versioning (portal interno)
- Vercel: proyecto `Fockus26/krea` en la cuenta de César, conectado a GitHub
- Production: PENDING (URL `*.vercel.app` tras el primer merge a `main`) · Previews: one per PR
- DNS managed by: PENDING
- Maintenance: does not apply en v1
- Local `context/` backup: branch `context-state` (private repo)

## Brand assets

| Piece | Status | Where / note |
|---|---|---|
| Logo | the client has it (vectorizado) | `public/brand/krea-logo.svg` |
| Icon / isotype | to be created (la "K" con las gotas) | brief §7 · checklist #1 |
| Favicon | to be created | brief §7 |
| Apple touch icon | to be created | brief §7 |
| Open Graph image | to be created | brief §7 |

## Emails

| Email | Sent by | Recipient | Status |
|---|---|---|---|
| Restablecer contraseña | Firebase Auth | estudiante / profesor | design pending |

Sending provider: Firebase Auth (plantilla de la consola; D009) · Sender: PENDING ·
Verified domain: pending — action for César.

## Page scope

| Page | Route | v1 priority |
|---|---|---|
| Iniciar sesión | `/ingresar` | high |
| Olvidé mi contraseña | `/recuperar` | high |
| Inicio estudiante | `/` | high |
| Mis notas / detalle de tarea | `/notas`, `/notas/[tareaId]` | high |
| Tareas pendientes / entregar | `/tareas`, `/tareas/[tareaId]` | high |
| Mi equipo | `/equipo` | high |
| Ranking | `/ranking` | high |
| Perfil y apariencia | `/perfil` | high |
| Panel profesor | `/profe` | high |
| Alumnos | `/profe/alumnos` | high |
| Equipos | `/profe/equipos` | high |
| Tareas (crear/editar) | `/profe/tareas`, `/profe/tareas/[id]` | high |
| Evaluar entregas | `/profe/tareas/[id]/entregas` | high |
| Ajustes de puntos | `/profe/puntos` | high |
| Premios | `/profe/premios` | medium |

## Functionality beyond static

- [x] User authentication — main destination when logged in: "Mis notas" (estudiante) /
      "Evaluar" (profesor)
- [x] User data persistence
- [ ] Payments
- [ ] Cart / checkout
- [x] Dashboard
- [x] Forms that really submit (entregas, evaluaciones, ajustes)
- [x] Emails the app sends (see § "Emails")
- [ ] CMS / blog
- [x] Search (alumnos en el panel del profesor)
- [ ] Multi-language

## Phase track

**Product** — Reason: auth con dos roles, datos persistidos y tiempo real.

## Way of working

- Dark mode: yes (claro / oscuro / sistema)
- Parent branch: no, units branch off main — see `GIT_STATE.md`

## Particulars

- Datos iniciales: `data/seed/*.json` (de `Notas.xlsx`, con `scripts/import-excel.py`).
  Nota 0 en el Excel = no entregado (D003).
- Estudiantes en teléfonos de gama baja: animaciones solo con `transform`/`opacity`.
- Prototipo de referencia: `design/prototype/` (vanilla, sin build). Diseño final: handoff de
  Claude Design en `design/HANDOFF.md`.
