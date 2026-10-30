# Orquestación del 2026-10-29 — brief compartido para los workers

> Fase 01, ola 1 de 1 — plan: `context/plans/phase-01-tokens.md`

> **Todo worker** lee esto antes de empezar. Su prompt trae solo lo específico de su unidad.
> Carpeta principal del repo: `C:\Users\Cesar\Documents\Work\krea` (ahí viven los archivos
> locales/gitignorados: `context/CURRENT_PHASE.md`, `context/CONTENT_CHECKLIST.md`,
> `context/PHASE_LOG/`, `context/plans/`, `.env*`).

## Unidades y orden

| # | Rama | Qué | Ola | Slot / puerto |
|---|---|---|---|---|
| W1 | `feat/tokens` | Tokens de HANDOFF §1 en `globals.css`, fuentes, tema sin parpadeo, página `/tokens` | 1 | lo asigna `wt take` |
| W2 | `feat/utilidades-nota` | Utilidades puras de nota/ranking/máscaras con pruebas | 1 | lo asigna `wt take` |

W1 y W2 no comparten archivos. Ninguno depende del otro.

## Números reservados

| Unidad | IDs de decisión | Filas de `CONTENT_CHECKLIST` |
|---|---|---|
| W1 | D015–D017 | 16–17 |
| W2 | D013–D014 (ya fijadas abajo) + D018 | 18 |

No uses números fuera de tu rango.

## Decisiones de César para esta tanda

- **Sin QA y sin servidor:** no se levanta dev server, no se sacan capturas, no se corre `qa:local`
  ni Playwright. Se verifica con `bun run typecheck`, `bun run lint`, `bun run test` y `bun run build`,
  más revisión de código. El `a11y` se hace a nivel de código (contrastes ya medidos en el handoff,
  semántica, `prefers-reduced-motion`), sin axe en navegador. Todos los QA se corren al final del proyecto.
- **Redondeo de la nota final con base:** 1 decimal, mitad hacia arriba (18,5 × 15 / 20 = 13,875 → 13,9).
- **Base en notas grupales:** por ahora **no** aplica (provisional; César confirmará si pasa a "por integrante").
- **Proyecto sin versionado:** ningún PR lleva changeset, ni toca `version` ni `CHANGELOG.md`.

## Simular el backend

No aplica en esta ola: no hay backend ni datos remotos.

## Reglas de la tanda (además de `CLAUDE.md`)

1. **Lee solo** `CLAUDE.md` y lo que cite tu prompt (rutas, líneas, decisiones). No leas todo `context/`; el resto, con `grep`.
2. **Slot y rama:** trabajas SOLO en la ruta de tu slot (`..\krea-wt\wtN`), que ya tiene tu rama creada, `node_modules` instalado y los `.env*` copiados. No crees ni borres worktrees, no ejecutes `wt` y no cambies de rama.
3. **Archivos locales compartidos:** no edites `CURRENT_PHASE.md` ni `CONTENT_CHECKLIST.md`. Escribe `context/PHASE_LOG/<tu-rama-con-guiones>.md` en la carpeta principal; si no tienes permiso, entrégalo completo en tu reporte final, junto con las filas de checklist que reservaste.
4. **Decisiones:** un archivo por decisión, `context/decisions/D0NN-<tema>.md`, con IDs de tu rango y el encabezado de una línea (formato en `context/decisions/README.md`). Va en git.
5. **Changeset:** ninguno (proyecto sin versionado).
6. **Servidor:** no autorizado. Verifica por código y dilo en el PR.
7. **Navegador:** no se usa en esta ola.
8. **Datos reales:** no hay; no toques Firebase.
9. **Pruebas:** `bun run test:related` mientras trabajas. Antes del PR, la suite completa **sola**, no a la vez que el build y sin pipe: `mkdir -p .qa && bun run test > .qa/test.log 2>&1` en segundo plano, luego lee el resumen al final.
10. **Archivos:** creados y cambiados con Write/Edit. Nada de heredoc para archivos largos, ni `node -e` con backticks, ni Python en modo texto (CRLF). Si tocaste un archivo por shell (`biome --write`), léelo antes de editarlo.
11. **Esperas y búsquedas:** `sleep` está bloqueado; lo que tarde más de 2 min (suite, build, typecheck) va en segundo plano. `grep` siempre con rutas acotadas (`app/`, `lib/`, `components/`, `tests/`).
12. **Commit al cerrar cada etapa**, no solo al final. Al retomar: `git status` y sigue.
13. **Verificación mínima antes del PR:** typecheck, lint (sin errores nuevos), tests, build.
14. **Capturas:** no (sin servidor). Di en el PR que la revisión visual queda para el QA final.
15. **Sin poder preguntar:** si falta un dato, la opción conservadora + "Decisión tomada / alternativa" en el PR. No te bloquees. Un valor que falte en el handoff no se estima del mockup: `design/canvas/krea.css` es la referencia exacta; si tampoco está ahí, déjalo marcado y dilo.
16. **Arregla la clase en la primera pasada.** Lo que veas después de abrir el PR va al reporte como "visto de paso".
17. **Copy nuevo = provisional:** marcado en el código + tu fila reservada del checklist.
18. **Cierre:** commits Conventional (solo tus archivos) con descripción en español, push de tu rama, `gh pr create --base main --body-file .qa/pr-body.md` (PR en español; el cuerpo escrito con Write). Termina con el pie `🤖 Generated with [Claude Code](https://claude.com/claude-code)` y los commits con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Deja el slot limpio (`git status` vacío). **Nunca** `gh pr merge`, push a `main`, force-push ni amend de lo empujado.
19. **Reporte final** (breve): URL del PR, slot, verificado / no verificado, decisiones abiertas, acciones manuales, bugs vistos de paso, tu PHASE_LOG y filas de checklist si no pudiste escribirlos, y "Kit feedback" si el kit te hizo tropezar.
