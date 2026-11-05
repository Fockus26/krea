# Current Phase — KREA

> **A board, not a diary.** ≤ 60 lines / 4 KB. Local file: backed up with
> `bun run context:backup` (branch `context-state`).

## Now

**Phase:** 07 — Backend · en curso (2026-11-03) · fase 06 cerrada (D173) · **Track:** Product
Plan: `context/plans/phase-07-backend.md` · main @ 7082686
**Sin QA hasta el final** (César, 2026-10-29) · **sin servidor, solo build** (César, 2026-11-03).

| Unit | Branch | Status |
|---|---|---|
| Fases 05–06 completas | #35–#47 | merged (03c6178) |
| W1 modelo de datos, reglas y emuladores (D174–D177) | #48 | merged (27bd040) |
| W2 login, sesión, protección y salir (D180–D183) | #49 | merged (f3a8d6d) |
| W4 lecturas del estudiante, ranking en vivo, Perfil (D189–D193) | #50 | merged (f775ec3) |
| W3 recuperar contraseña con Brevo (D185–D188) | #51 | merged (1b22d77) |
| W5 entregas: borrador local, enviar, imágenes en B2 (D194–D197) | #52 | merged (94ae747) |
| W6 tareas del profe: constructor, publicar, cerrar, premios (D199–D202) | #53 | merged (7082686) |
| W7 evaluar, ajustes de puntos y Panel con Firestore (D204–D208) | claude/dreamy-babbage-vloz3y | PR abierto |
| W8 (alumnos y equipos, cierre) | — | pendiente (ver plan) |

## Blocked (actions for César or external)

- QA pendiente: W3 — envío real por Brevo con el alumno de prueba 38291460 (la red del contenedor bloquea api.brevo.com), enlace → /recuperar/nueva → guardar → aviso en Ingresar y sesiones revocadas; axe de /recuperar y /recuperar/nueva. Fase 09.

- QA pendiente: W7 — evaluar la cola (individual/grupal, imagen firmada), corregir una evaluada, «Deshacer», ajuste + anulación y verlo en el ranking en vivo y en el detalle de nota del alumno, contra los emuladores; axe de /profe, /profe/evaluar/[id] y /profe/puntos. Fase 09.
- QA pendiente: W6 — crear borrador a medias, publicar (suma 20, fecha), editar con/sin entregas, cerrar (el alumno la ve cerrada), decidir empate y verlo en Mi equipo, contra los emuladores; axe de /profe/tareas, /profe/tareas/[id], /profe/premios y el diálogo Cerrar. Fase 09.
- QA pendiente: W5 — subida real a B2 (el host está bloqueado en el contenedor: probado con dobles), enviar individual y grupal (capitán / no capitán) contra los emuladores, borrador tras recargar, imagen en «Entregada» y en el detalle de nota; axe de /tareas y /tareas/[tarea]. Fase 09.
- W5: en el entorno existen también `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`; el código solo lee `B2_*` (D194). Confirmar que Vercel tiene las `B2_*` (Production y Preview) y que el bucket es privado.

- QA pendiente: W4 — pantallas del estudiante con datos (emuladores, axe), ranking en vivo en dos navegadores, cambio de contraseña (revoca y reabre). Fase 09.
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
- Firebase `krea-d22f7` creado (Auth + Firestore, plan Spark, sin Storage); reglas de Firestore publicadas y seed cargado (69 usuarios, 12 equipos, 2 tareas, 18 entregas, 3 ajustes, ranking 5A/5C; ) 2026-11-04. Cuentas de Auth creadas 2026-11-05 (69 alumnos + profesor César León 30262232, contraseña aleatoria por cuenta, lista CSV entregada a César; faltan los demás profesores). **Rotar la clave de la cuenta de servicio** (se pegó en el chat). Archivos → Backblaze B2 (registrar decisión en W5; claves cargadas como AWS_*; el host s3.us-east-005.backblazeb2.com está bloqueado por la red del entorno cloud).
- Emails reales de los estudiantes para "Olvidé mi contraseña" (checklist #3).
- Confirmar: indexación solo `/ingresar` (D023, provisional) y descripción de metadata (fila 22).
- Fijar `NEXT_PUBLIC_SITE_URL` en Vercel cuando haya dominio (fila 21).
- Java: en la nube ya está (emuladores OK); en la máquina de César falta para `qa:local`.

## Next

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
