# Current Phase — KREA

> **A board, not a diary.** ≤ 60 lines / 4 KB. Local file: backed up with
> `bun run context:backup` (branch `context-state`).

## Now

**Phase:** 04 — Secciones · **Ola:** 4 de 4 (ola 3 cerrada: #27–#30; ola 2: #23–#26; ola 1: #20–#22) · **Plan:** `context/plans/phase-04-secciones.md` · **Track:** Product
**Sin QA hasta el final del proyecto** (César, 2026-10-29). Fase 03 cerrada el 2026-10-30 (#9–#19).
Ola 4 en local con el pool (como la ola 3): brief y prompts nuevos; notas en «Para la ola 4» del plan. Pool wt1–wt5 libre.

| Unit | Branch | Status |
|---|---|---|
| Olas 1–2 (base, ingresar, inicio, notas, tareas, equipo, perfil) | cloud | merged (#20–#26) |
| Ola 3 · Ranking | `feat/sec-ranking` | merged (#28) |
| Ola 3 · Panel del profesor | `feat/sec-profe-panel` | merged (#29) |
| Ola 3 · Evaluar entrega | `feat/sec-evaluar` | merged (#30) |
| Ola 3 · Alumnos | `feat/sec-alumnos` | merged (#27) |

## Blocked (actions for César or external)

- Género del capitán: el seed no lo trae; hoy «Capitán» por defecto (D075). ¿Campo editable por el profe o texto neutro?
- Enunciados de «Identidad de marca» sin tildes en el Excel (fila 64): ¿corregir en el Excel o en el import?
- Empate en la mejor nota de una tarea con premio (HANDOFF §9 #3): hoy no se muestra ganador (D086, fila 69).
- Confirmar si la base aplica a notas grupales por integrante (provisional: no, D014).
- Seed de 5C sin notas evaluadas: ranking 5C todo empatado en 0. ¿Datos de ejemplo para 5C o esperar a datos reales?
- HANDOFF §9 restantes (#3–#12: empates de premio, borrador compartido, entrega tardía…): se preguntan al llegar a su fase.
- Crear el proyecto Firebase (Auth, Firestore, Storage) y cargar las claves en Vercel.
- Emails reales de los estudiantes para "Olvidé mi contraseña" (checklist #3).
- Confirmar: indexación solo `/ingresar` (D023, provisional) y descripción de metadata (fila 22).
- Fijar `NEXT_PUBLIC_SITE_URL` en Vercel cuando haya dominio (fila 21).
- Instalar Java (emuladores de Firebase para `qa:local`).

## Next

- Fase 04 ola 4 (equipos del profe, tareas del profe, puntos, premios), en otra sesión: `/orchestrate ola 4 de la fase 04. Plan: context/plans/phase-04-secciones.md`
- Fase 05: topbar móvil (chip «En vivo», X de Evaluar), Toaster global sin tapar la `ActionBar` (backlog).
- Fase 07: esquema Firestore desde `data/seed/` + reglas de seguridad por rol.

## Phases

| # | Phase | Status |
|---|---|---|
| 01 | Tokens | closed |
| 02 | Base layout | closed |
| 03 | Components | closed |
| 04 | Sections | in progress (ola 3/4 cerrada) |
| 05 | Pages | pending |
| 06 | States | pending |
| 07 | Backend | pending |
| 08 | Responsive and polish | pending |
| 09 | Final QA | pending |
