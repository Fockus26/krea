# Current Phase — KREA

> **A board, not a diary.** ≤ 60 lines / 4 KB. Local file: backed up with
> `bun run context:backup` (branch `context-state`).

## Now

**Phase:** 04 — Secciones · **Ola:** 2 de 4 (ola 1 cerrada: #20–#22) · **Plan:** `context/plans/phase-04-secciones.md` · **Track:** Product
**Sin QA hasta el final del proyecto** (César, 2026-10-29). Fase 03 cerrada el 2026-10-30 (#9–#19).
Sesión cloud: las unidades de una ola van en serie (PR → CI verde → squash).

| Unit | Branch | Status |
|---|---|---|
| Cierre fase 03 | `claude/…` (cloud) | merged (#19) |
| W1 base de secciones | ídem | merged (#20) |
| W2 Ingresar / Recuperar | ídem | merged (#21) |
| W3 Inicio del estudiante | ídem | merged (#22) |

## Blocked (actions for César or external)

- Género del capitán: el seed no lo trae; hoy «Capitán» por defecto (D075). ¿Campo editable por el profe o texto neutro?

- Confirmar si la base aplica a notas grupales por integrante (provisional: no, D014).
- HANDOFF §9 restantes (#3–#12: empates de premio, borrador compartido, entrega tardía…): se preguntan al llegar a su fase.
- Crear el proyecto Firebase (Auth, Firestore, Storage) y cargar las claves en Vercel.
- Emails reales de los estudiantes para "Olvidé mi contraseña" (checklist #3).
- Confirmar: indexación solo `/ingresar` (D023, provisional) y descripción de metadata (fila 22).
- Fijar `NEXT_PUBLIC_SITE_URL` en Vercel cuando haya dominio (fila 21).
- Instalar Java (emuladores de Firebase para `qa:local`).

## Next

- Fase 04 ola 2 (notas, tareas, equipo, perfil), en otra sesión: `/orchestrate ola 2 de la fase 04. Plan: context/plans/phase-04-secciones.md`
- Fase 07: esquema Firestore desde `data/seed/` + reglas de seguridad por rol.

## Phases

| # | Phase | Status |
|---|---|---|
| 01 | Tokens | closed |
| 02 | Base layout | closed |
| 03 | Components | closed |
| 04 | Sections | in progress (ola 1/4) |
| 05 | Pages | pending |
| 06 | States | pending |
| 07 | Backend | pending |
| 08 | Responsive and polish | pending |
| 09 | Final QA | pending |
