# Current Phase — KREA

> **A board, not a diary.** ≤ 60 lines / 4 KB. Local file: backed up with
> `bun run context:backup` (branch `context-state`).

## Now

**Phase:** 07 — Backend · en curso (2026-11-03) · fase 06 cerrada (D173) · **Track:** Product
Plan: `context/plans/phase-07-backend.md` · main @ f3a8d6d
**Sin QA hasta el final** (César, 2026-10-29) · **sin servidor, solo build** (César, 2026-11-03).

| Unit | Branch | Status |
|---|---|---|
| Fases 05–06 completas | #35–#47 | merged (03c6178) |
| W1 modelo de datos, reglas y emuladores (D174–D177) | #48 | merged (27bd040) |
| W2 login, sesión, protección y salir (D180–D183) | #49 | merged (f3a8d6d) |
| W3–W8 (recuperar, lecturas, entregas, tareas, evaluar, gestión) | — | pendiente (ver plan) |

## Blocked (actions for César or external)

- QA pendiente: login/sesión/salir (functional-qa + axe de /ingresar y /salir) — sin servidor por decisión de César; probado contra los emuladores (cookie, revocación, reglas). Fase 09.
- Galerías `/secciones`, `/componentes`, `/estados` públicas con nombres y notas reales del seed (D181): ¿bloquearlas ya o en la fase 09?

- QA pendiente: fase 06 — axe, teclado, 320 px y 4 acentos × claro/oscuro de `/estados` y los `loading.tsx` (sin servidor; QA final).
- Contraste de la tarjeta de puntos de Inicio (axe: 4,1:1 y 4,26:1 en desglose y chip, fase 04): decisión de diseño de César (backlog, alta).
- Perfil en la hoja Menú del profe (fila 97) y avatar/Menú junto al chip «En vivo» en Ranking móvil: confirmar.

- Género del capitán: el seed no lo trae; hoy «Capitán» por defecto (D075). ¿Campo editable por el profe o texto neutro?
- Enunciados de «Identidad de marca» sin tildes en el Excel (fila 64): ¿corregir en el Excel o en el import?
- Empate en la mejor nota de una tarea con premio (HANDOFF §9 #3): al estudiante no se le muestra ganador (D086, fila 69); el profe da el premio o lo comparte (D123–D124, «Compartido» provisional, fila 96).
- Seed de 5C sin notas evaluadas: ranking 5C todo empatado en 0. ¿Datos de ejemplo para 5C o esperar a datos reales?
- HANDOFF §9 restantes (#3–#12: empates de premio, borrador compartido, entrega tardía…): se preguntan al llegar a su fase.
- Firebase `krea-d22f7` creado (Auth + Firestore, plan Spark, sin Storage); reglas de Firestore publicadas y seed cargado (69 usuarios, 12 equipos, 2 tareas, 18 entregas, 3 ajustes, ranking 5A/5C; sin cuentas de Auth) 2026-11-04. Falta: contraseña inicial de los alumnos y datos del profesor real. **Rotar la clave de la cuenta de servicio** (se pegó en el chat). Archivos → Backblaze B2 (registrar decisión en W5; variables `B2_*` pendientes en Vercel y en la nube).
- Emails reales de los estudiantes para "Olvidé mi contraseña" (checklist #3).
- Confirmar: indexación solo `/ingresar` (D023, provisional) y descripción de metadata (fila 22).
- Fijar `NEXT_PUBLIC_SITE_URL` en Vercel cuando haya dominio (fila 21).
- Java: en la nube ya está (emuladores OK); en la máquina de César falta para `qa:local`.

## Next

- W3 Recuperar contraseña (privados/{cedula}.email, enlace de Firebase Auth).
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
