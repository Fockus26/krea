# Current Phase — KREA

> **A board, not a diary.** ≤ 60 lines / 4 KB. Local file: backed up with
> `bun run context:backup` (branch `context-state`).

## Now

**Phase:** 03 — Componentes · **Ola:** 2 de 3 en curso (5 workers sobre main @ fec1d1a) · **Plan:** `context/plans/phase-03-componentes.md` · **Track:** Product
**Sin QA hasta el final del proyecto** (César, 2026-10-29). Brief/prompts: `context/plans/orchestration-2026-10-29-f03*.md`

| Unit | Branch | Status | Slot |
|---|---|---|---|
| W1 shadcn init, deps de la fase, `cn`, `dark:`, movimiento, Button, `/componentes` | `feat/ui-base` | merged (#9) | — |
| W2 Label, Input, Textarea, Select, Field, contraseña, cédula, NumberStepper | `feat/ui-formularios` | PR #13 abierto | wt1 |
| W3 Dialog, Sheet, DropdownMenu, Toaster | `feat/ui-overlays` | PR #14 abierto | wt2 |
| W4 Badge, StatusBadge, GradePill, Tabs, ToggleGroup | `feat/ui-chips-tabs` | PR #11 abierto | wt3 |
| W5 Card, Alert, Skeleton, Table, Separator, EmptyState | `feat/ui-contenedores` | PR #10 abierto | wt4 |
| W6 Avatar, AvatarStack, TeamLogo, Logo/Isotipo | `feat/ui-identidad` | PR #12 abierto | wt5 |

## Blocked (actions for César or external)

- Confirmar si la base aplica a notas grupales por integrante (provisional: no, D014).
- HANDOFF §9 restantes (#3–#12: empates de premio, borrador compartido, entrega tardía…): se preguntan al llegar a su fase.
- Crear el proyecto Firebase (Auth, Firestore, Storage) y cargar las claves en Vercel.
- Emails reales de los estudiantes para "Olvidé mi contraseña" (checklist #3).
- Confirmar: indexación solo `/ingresar` (D023, provisional) y descripción de metadata (fila 22).
- Fijar `NEXT_PUBLIC_SITE_URL` en Vercel cuando haya dominio (fila 21).
- Instalar Java (emuladores de Firebase para `qa:local`).

## Next

- Fase 03 ola 2: consolidar los 5 PRs (W2–W6); luego ola 3 en otra sesión.
- Fase 07: esquema Firestore desde `data/seed/` + reglas de seguridad por rol.

## Phases

| # | Phase | Status |
|---|---|---|
| 01 | Tokens | closed |
| 02 | Base layout | closed |
| 03 | Components | in progress (ola 2/3) |
| 04 | Sections | pending |
| 05 | Pages | pending |
| 06 | States | pending |
| 07 | Backend | pending |
| 08 | Responsive and polish | pending |
| 09 | Final QA | pending |
