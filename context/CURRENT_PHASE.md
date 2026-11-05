# Current Phase — KREA

> **A board, not a diary.** ≤ 60 lines / 4 KB. Local file: backed up with
> `bun run context:backup` (branch `context-state`).

## Now

**Phase:** 07 — Backend · **cerrada** (D211, W8 #55 b5de523, 2026-11-05) · resumen: `PHASE_LOG/07-backend.md`
Fases 01–06 cerradas (D173) · **Track:** Product · main @ 73df0ea
**Sin QA hasta el final** (César, 2026-10-29) · **sin servidor, solo build** (César, 2026-11-03).

| Unit | Branch | Status |
|---|---|---|
| Fases 05–06 · fase 07 W1–W7 | #35–#54 | merged (73df0ea) |
| W8 alumnos y equipos, errores con sesión, cierre (D209–D213) | claude/dreamy-babbage-vloz3y | merged (#55, b5de523) |

## Blocked (actions for César or external)

**QA pendiente para la fase 09** (functional-qa contra emuladores + axe, teclado, 320 px):
- W2 login/sesión/salir (+ axe /ingresar, /salir) · W3 envío real por Brevo con 38291460 (api.brevo.com bloqueado), enlace → /recuperar/nueva → aviso y sesiones revocadas.
- W4 pantallas del estudiante con datos, ranking en vivo en dos navegadores, cambio de contraseña.
- W5 subida real a B2 (host bloqueado), enviar individual/grupal (capitán / no), borrador tras recargar.
- W6 borrador a medias, publicar (suma 20), editar con/sin entregas, cerrar, empate de premio.
- W7 evaluar la cola, corregir, «Deshacer», ajuste + anulación en el ranking y en el detalle del alumno.
- W8 editar alumno (base + motivo → historial y ranking; email → «Olvidé mi contraseña»), mover/quitar/capitán (el alumno movido debe volver a entrar con su equipo nuevo), logo real en B2 (tablero, ranking equipos, Mi equipo, Inicio), 404/500 con cada sesión; axe de /profe/alumnos, /profe/equipos, /profe/ranking.
- Fase 06: axe, teclado, 320 px y 4 acentos × claro/oscuro de `/estados` y los `loading.tsx`.

**Decisiones de César:**
- Cambiar a un alumno de **sección** (W7/W8): no hay acción; ¿hace falta? y sus ajustes viejos ¿siguen en la sección vieja? (fila 134).
- El alumno no ve su historial de base en ninguna pantalla (D108 dice «el alumno lo verá»): ¿dónde?
- Galerías `/secciones`, `/componentes`, `/estados` públicas con datos reales del seed (D181): ¿bloquear ya o en la fase 09?
- Contraste de la tarjeta de puntos de Inicio (axe 4,1:1 y 4,26:1, fase 04): decisión de diseño (backlog, alta).
- Perfil en la hoja Menú del profe (fila 97) y avatar/Menú junto a «En vivo» en Ranking móvil.
- Género del capitán (D075) · tildes de «Identidad de marca» (fila 64) · empates de premio (D086, D123–D124, fila 96).
- Seed de 5C sin notas evaluadas (ranking 5C empatado en 0) · HANDOFF §9 #3–#12 al llegar a su fase.
- Copy provisional de la fase 07: filas 121–136 del checklist.

**Acciones manuales:**
- **Rotar la clave de la cuenta de servicio** de `krea-d22f7` (se pegó en el chat). Faltan las cuentas de los demás profesores.
- Vercel: confirmar las `B2_*` (Production y Preview) y bucket privado; el código solo lee `B2_*` (D194), no `AWS_*`.
- Emails reales de los estudiantes (checklist #3): ya se cargan desde Alumnos → Editar (D209).
- Confirmar indexación solo `/ingresar` (D023) y metadata (fila 22) · `NEXT_PUBLIC_SITE_URL` con dominio (fila 21).
- Java en la máquina de César para `qa:local`.

## Next

- Tras el merge de W8: **fase 08 — Responsive y pulido** (`phases/08-RESPONSIVE-POLISH.md`): pide navegador a 320–1920 px; con «sin servidor» vigente, César decide si se hace en preview de Vercel o se salta a la **fase 09 — QA final** (`phases/09-QA-FINAL.md`) con la lista de arriba.
- Fase 09: bloquear o borrar `/secciones`, `/componentes`, `/tokens` (y `/estados` 404 en producción).

## Phases

| # | Phase | Status |
|---|---|---|
| 01–06 | Tokens · Layout · Components · Sections · Pages · States | closed |
| 07 | Backend | closed (D211) |
| 08 | Responsive and polish | pending |
| 09 | Final QA | pending |
