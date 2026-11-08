# Tanda 2026-11-08 — brief compartido

Pedidos 59–64 de César (2026-11-08). Una sola ola (6 unidades en paralelo; no se pisan archivos).
main @ 6847dae (migración al VPS mergeada, #108: Postgres + Drizzle + Better Auth, sin Firebase).
Prompts: `context/plans/orchestration-2026-11-08-prompts.md` (secciones Y1–Y6).
Carpeta principal: `C:\Users\Cesar\Documents\Work\krea`.

## Unidades

| # | Rama | Qué | Modelo | Decisiones | Filas checklist | Docker |
|---|---|---|---|---|---|---|
| Y1 | `fix/texto-blanco-rellenos-oscuro` | Texto blanco en oscuro en `danger` y demás rellenos con texto oscuro | sonnet · medium | D328–D330 | — | no |
| Y2 | `feat/matriz-contraste` | Matriz 4 acentos × claro/oscuro de botones y píldoras en `/componentes` | sonnet · medium | D331–D332 | — | no |
| Y3 | `fix/tarjeta-ingresar` | Tarjeta de Ingresar: oscuro con superficie + borde, padding | sonnet · low | D333–D334 | — | no |
| Y4 | `feat/aviso-tarea-push` | Push del navegador a los alumnos que lo activen al publicarse una tarea | opus · medium | D335–D340 | 171–173 | no |
| Y5 | `feat/correo-variantes` | 3 variantes del correo de restablecer con acento y tema del alumno + galería | opus · medium | D341–D344 | 174–175 | no |
| Y6 | `fix/hover-perfil` | Estado hover visible en el botón de perfil (avatar) | sonnet · low | D345 | — | no |

Sin changesets (proyecto sin versionado). Sin QA de ola (memoria: QA solo al final).

## Formas compartidas

Ninguna entre unidades. Y2 lee los tokens en vivo: muestra lo que Y1 deje cuando se mergee.
Solo **Y1** edita `app/globals.css`. Y3 usa tokens existentes (`--surface-2`, `--divider`); si de
verdad necesita uno nuevo, lo explica en el PR y no edita `globals.css` (lo hace Y1 o una ronda
posterior).

## Reglas de la tanda (encima de `CLAUDE.md`)

1. **Lee solo** `CLAUDE.md`, lo que cita tu prompt y, si tocas una tecnología de `Tech refs`,
   ese archivo. El resto, con `grep`.
2. **Slot y rama:** trabajas SOLO en tu slot (`C:\Users\Cesar\Documents\Work\krea-wt\wtN`), que ya
   tiene tu rama desde `origin/main`, `node_modules` y los `.env*`. No crees ni borres worktrees,
   no corras `wt`, no cambies de rama.
3. **Archivos locales compartidos:** no edites `CURRENT_PHASE.md` ni `CONTENT_CHECKLIST.md`.
   Escribe `C:\Users\Cesar\Documents\Work\krea\context\PHASE_LOG\<tu-rama-con-guiones>.md`; si no
   puedes, entrégalo en tu informe (con las filas de checklist que te tocan, si las hay).
4. **Decisiones:** un archivo por decisión, `context/decisions/D0NN-<tema>.md` en tu slot, con
   los IDs de tu rango y el encabezado de una línea (formato en `context/decisions/README.md`).
   Si cambias una vieja: «Reemplaza a D0NN» (y en la vieja, su estado).
5. **Sin versionado:** ningún changeset, ni `version`, ni CHANGELOG.
6. **Servidor y navegador:** no se usan (César: QA solo al final). Verificas con tests, typecheck,
   lint y revisión de código. Contrastes: calcúlalos con una prueba o script (no a ojo).
7. **Datos reales:** `.env` apunta a producción. No inicies sesión, no escribas datos, no apliques
   migraciones. El «Cómo probar» de tu PR dice qué flujo y qué rol, para el QA final.
8. **Tests:** `bun run test:related` mientras trabajas. Antes del PR la suite entera sola:
   `mkdir -p .qa && bun run test > .qa/test.log 2>&1` en segundo plano, luego el resumen. Las
   pruebas de base de datos corren sobre PGlite (`tests/db/`).
9. **Archivos:** con Write/Edit; léelo con **Read** antes de editar. Toda Server Action nueva que
   escriba llama `refresh()` al terminar (guardián `tests/unit/cache-rutas.test.ts`). Nada de
   heredoc largo ni `node -e` con comillas.
10. **Esperas:** `sleep` bloqueado; lo que tarde > 2 min va en segundo plano. `grep` con rutas
    (`app/`, `lib/`, `components/`), nunca en la raíz.
11. **Commit al cerrar cada etapa** y un `wip:` cada ~20 min en etapas largas, con dos líneas en
    `.qa/progress.md` (hecho / sigue).
12. **Verificación antes del PR:** `bun run typecheck`, `bun run lint`, `bun run test`; si tocaste
    UI, la skill `a11y` por revisión de código (contraste de los pares que tocas en 4 acentos ×
    claro/oscuro, teclado, foco, 320 px, reduced motion). Sin build local.
13. **Sin poder preguntar:** dato que falta → opción conservadora + «Decisión tomada /
    alternativa» en el PR.
14. **Arregla la clase en la primera pasada** (`grep` en `app/ components/ lib/`). Lo que veas
    después va al informe como «visto de paso».
15. **PR:** modo `pr` (skill `git-flow`): push a tu rama y `gh pr create` en español, cuerpo con
    Qué / Por qué / Cómo probar / Decisión tomada / Acciones para César / Kit feedback. Nunca merge.

## Informe final (lo que devuelves)

PR (número y URL) · qué cambió en 3 líneas · decisiones creadas · acciones manuales para César ·
filas de checklist (texto) si te tocaban · visto de paso · kit feedback.
