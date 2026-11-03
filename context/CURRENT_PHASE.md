# Current Phase — KREA

> **A board, not a diary.** ≤ 60 lines / 4 KB. Local file: backed up with
> `bun run context:backup` (branch `context-state`).

## Now

**Phase:** 05 — Páginas · **Ola:** 3 de 3 cerrada (2026-11-03) · fase 05 completa (46 páginas, D126–D159) · siguiente: fase 06 · **Track:** Product
Plan: `context/plans/phase-05-paginas.md` (notas «Para la ola 2 y la 3») · main @ 3b61ea3
**Sin QA hasta el final** (César, 2026-10-29) · **sin servidor, solo build** (César, 2026-11-03).

| Unit | Branch | Status |
|---|---|---|
| W1 fix segmentados (tema/acento colapsados) | #35 | merged (b793c77) |
| W2 shell por rol + `/` y `/profe` | #36 | merged (8a57c4b) |
| W3 ingresar y recuperar | #37 | merged (11ba253) |
| Ola 2 notas · tareas · equipo/ranking/perfil | #38 #39 #40 | merged (3b61ea3) |
| Ola 3 evaluar · tareas profe · gestión profe | #41 #42 #43 | merged |

## Blocked (actions for César or external)

- Contraste de la tarjeta de puntos de Inicio (axe: 4,1:1 y 4,26:1 en desglose y chip, fase 04): decisión de diseño de César (backlog, alta).
- Perfil en la hoja Menú del profe (fila 97) y avatar/Menú junto al chip «En vivo» en Ranking móvil: confirmar.

- Género del capitán: el seed no lo trae; hoy «Capitán» por defecto (D075). ¿Campo editable por el profe o texto neutro?
- Enunciados de «Identidad de marca» sin tildes en el Excel (fila 64): ¿corregir en el Excel o en el import?
- Empate en la mejor nota de una tarea con premio (HANDOFF §9 #3): al estudiante no se le muestra ganador (D086, fila 69); el profe da el premio o lo comparte (D123–D124, «Compartido» provisional, fila 96).
- Confirmar si la base aplica a notas grupales por integrante (provisional: no, D014).
- Seed de 5C sin notas evaluadas: ranking 5C todo empatado en 0. ¿Datos de ejemplo para 5C o esperar a datos reales?
- HANDOFF §9 restantes (#3–#12: empates de premio, borrador compartido, entrega tardía…): se preguntan al llegar a su fase.
- Crear el proyecto Firebase (Auth, Firestore, Storage) y cargar las claves en Vercel.
- Emails reales de los estudiantes para "Olvidé mi contraseña" (checklist #3).
- Confirmar: indexación solo `/ingresar` (D023, provisional) y descripción de metadata (fila 22).
- Fijar `NEXT_PUBLIC_SITE_URL` en Vercel cuando haya dominio (fila 21).
- Instalar Java (emuladores de Firebase para `qa:local`).

## Next

- Fase 06 (estados). Fase 09: bloquear o borrar `/secciones`, `/componentes`, `/tokens`.
- Fase 07: esquema Firestore desde `data/seed/` + reglas de seguridad por rol.

## Phases

| # | Phase | Status |
|---|---|---|
| 01 | Tokens | closed |
| 02 | Base layout | closed |
| 03 | Components | closed |
| 04 | Sections | closed |
| 05 | Pages | closed |
| 06 | States | next |
| 07 | Backend | pending |
| 08 | Responsive and polish | pending |
| 09 | Final QA | pending |
