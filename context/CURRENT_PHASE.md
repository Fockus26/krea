# Current Phase — KREA

> **A board, not a diary.** ≤ 60 lines / 4 KB. Local file: backed up with
> `bun run context:backup` (branch `context-state`).

## Now

**Phase:** 02 — Layout base cerrada (main @ f37f6f6) · **Sigue:** fase 03 — Componentes · **Track:** Product
**Sin QA hasta el final del proyecto** (César, 2026-10-29).

| Unit | Branch | Status | Slot |
|---|---|---|---|
| W1 contenedores, skip link, landmarks, `AppShell` | `feat/layout-base` | merged (#7) | — |
| W2 seo init: metadata, favicons, manifest, OG, robots | `feat/marca-seo` | merged (#8) | — |

## Blocked (actions for César or external)

- Confirmar si la base aplica a notas grupales por integrante (provisional: no, D014).
- HANDOFF §9 restantes (#3–#12: empates de premio, borrador compartido, entrega tardía…): se preguntan al llegar a su fase.
- Crear el proyecto Firebase (Auth, Firestore, Storage) y cargar las claves en Vercel.
- Emails reales de los estudiantes para "Olvidé mi contraseña" (checklist #3).
- Confirmar: indexación solo `/ingresar` (D023, provisional) y descripción de metadata (fila 22).
- Fijar `NEXT_PUBLIC_SITE_URL` en Vercel cuando haya dominio (fila 21).
- Instalar Java (emuladores de Firebase para `qa:local`).

## Next

- Fase 03 (componentes) con `/orchestrate fase 03. Plan de la fase 02 cerrado: context/plans/phase-02-layout-base.md` en otra sesión.
- Fase 07: esquema Firestore desde `data/seed/` + reglas de seguridad por rol.

## Phases

| # | Phase | Status |
|---|---|---|
| 01 | Tokens | closed |
| 02 | Base layout | closed |
| 03 | Components | pending |
| 04 | Sections | pending |
| 05 | Pages | pending |
| 06 | States | pending |
| 07 | Backend | pending |
| 08 | Responsive and polish | pending |
| 09 | Final QA | pending |
