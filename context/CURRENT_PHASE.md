# Current Phase — KREA

> **A board, not a diary.** ≤ 60 lines / 4 KB. Local file: backed up with
> `bun run context:backup` (branch `context-state`).

## Now

**Phase:** 07 — Backend · en curso (2026-11-03) · fase 06 cerrada (D173) · **Track:** Product
Plan: `context/plans/phase-07-backend.md` · main @ 27bd040
**Sin QA hasta el final** (César, 2026-10-29) · **sin servidor, solo build** (César, 2026-11-03).

| Unit | Branch | Status |
|---|---|---|
| Fases 05–06 completas | #35–#47 | merged (03c6178) |
| W1 modelo de datos, reglas y emuladores (D174–D177) | #48 | merged (27bd040) |
| W2–W8 (auth, recuperar, lecturas, entregas, tareas, evaluar, gestión) | — | pendiente (ver plan) |

## Blocked (actions for César or external)

- QA pendiente: fase 06 — axe, teclado, 320 px y 4 acentos × claro/oscuro de `/estados` y los `loading.tsx` (sin servidor; QA final).
- Contraste de la tarjeta de puntos de Inicio (axe: 4,1:1 y 4,26:1 en desglose y chip, fase 04): decisión de diseño de César (backlog, alta).
- Perfil en la hoja Menú del profe (fila 97) y avatar/Menú junto al chip «En vivo» en Ranking móvil: confirmar.

- Género del capitán: el seed no lo trae; hoy «Capitán» por defecto (D075). ¿Campo editable por el profe o texto neutro?
- Enunciados de «Identidad de marca» sin tildes en el Excel (fila 64): ¿corregir en el Excel o en el import?
- Empate en la mejor nota de una tarea con premio (HANDOFF §9 #3): al estudiante no se le muestra ganador (D086, fila 69); el profe da el premio o lo comparte (D123–D124, «Compartido» provisional, fila 96).
- Seed de 5C sin notas evaluadas: ranking 5C todo empatado en 0. ¿Datos de ejemplo para 5C o esperar a datos reales?
- HANDOFF §9 restantes (#3–#12: empates de premio, borrador compartido, entrega tardía…): se preguntan al llegar a su fase.
- Crear el proyecto Firebase (Auth, Firestore, Storage) y cargar las claves en Vercel.
- Emails reales de los estudiantes para "Olvidé mi contraseña" (checklist #3).
- Confirmar: indexación solo `/ingresar` (D023, provisional) y descripción de metadata (fila 22).
- Fijar `NEXT_PUBLIC_SITE_URL` en Vercel cuando haya dominio (fila 21).
- Java: en la nube ya está (emuladores OK); en la máquina de César falta para `qa:local`.

## Next

- W2 Auth (login por cédula, cookie de sesión, protección en el servidor, `qa-local` con claims) → functional-qa.
- Fase 09: bloquear o borrar `/secciones`, `/componentes`, `/tokens` (y comprobar que `/estados` da 404 en producción).

## Phases

| # | Phase | Status |
|---|---|---|
| 01 | Tokens | closed |
| 02 | Base layout | closed |
| 03 | Components | closed |
| 04 | Sections | closed |
| 05 | Pages | closed |
| 06 | States | closed |
| 07 | Backend | in progress |
| 08 | Responsive and polish | pending |
| 09 | Final QA | pending |
