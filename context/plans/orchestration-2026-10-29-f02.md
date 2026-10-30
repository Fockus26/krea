# Orquestación del 2026-10-29 (fase 02) — brief compartido para los workers

> Fase 02, ola 1 de 1 — plan: `context/plans/phase-02-layout-base.md`

> **Todo worker** lee esto antes de empezar. Su prompt trae solo lo específico de su unidad.
> Carpeta principal del repo: `C:\Users\Cesar\Documents\Work\krea` (ahí viven los archivos
> locales/gitignorados: `context/CURRENT_PHASE.md`, `context/CONTENT_CHECKLIST.md`,
> `context/PHASE_LOG/`, `context/plans/`, `.env*`).

## Unidades y orden

| # | Rama | Qué | Ola | Slot / puerto |
|---|---|---|---|---|
| W1 | `feat/layout-base` | Contenedores, ritmo, skip link, landmarks, `AppShell` estructural | 1 | lo asigna `wt take` |
| W2 | `feat/marca-seo` | seo init: metadata, favicons, apple, manifest, OG, robots, sitemap | 1 | lo asigna `wt take` |

Comparten **solo** `app/layout.tsx`, repartido así: W1 toca únicamente el JSX dentro de `<body>`
(y la clase de `<html>` si hace falta para el smooth scroll); W2 toca únicamente los exports
`metadata` y `viewport` (y sus imports). Nadie más mueve el `themeScript` ni las fuentes.
Ninguno depende del otro.

## Números reservados

| Unidad | IDs de decisión | Filas de `CONTENT_CHECKLIST` |
|---|---|---|
| W1 | D019–D021 | 19–20 |
| W2 | D022–D024 | 21–22 |

No uses números fuera de tu rango (D018 y la fila 18 quedan sin usar a propósito).

## Decisiones de César para esta tanda

- **Sin QA y sin servidor:** no se levanta dev server, no se sacan capturas, no se corre `qa:local`
  ni Playwright. Se verifica con `bun run typecheck`, `bun run lint`, `bun run test` y `bun run build`,
  más revisión de código. El `a11y` se hace a nivel de código (semántica, landmarks, foco, contrastes
  ya medidos en el handoff, `prefers-reduced-motion`), sin axe en navegador.
- **Proyecto sin versionado:** ningún PR lleva changeset, ni toca `version` ni `CHANGELOG.md`.
- Nota final 1 decimal mitad arriba (D013); base no aplica a grupales (D014) — no afectan esta ola.

## Simular el backend

No aplica: no hay backend ni datos remotos en esta ola.

## Reglas de la tanda (además de `CLAUDE.md`)

1. **Lee solo** `CLAUDE.md` y lo que cite tu prompt (rutas, líneas, decisiones). No leas todo `context/` ni todo el handoff; el resto, con `grep`.
2. **Next 16:** antes de escribir código de una API de Next (metadata, `ImageResponse`, `manifest`, `robots`, `sitemap`, layouts), lee su guía en `node_modules/next/dist/docs/` (AGENTS.md). No confíes en lo que recuerdas.
3. **Slot y rama:** trabajas SOLO en la ruta de tu slot (`..\krea-wt\wtN`), que ya tiene tu rama creada, `node_modules` instalado y los `.env*` copiados. No crees ni borres worktrees, no ejecutes `wt` y no cambies de rama.
4. **Archivos locales compartidos:** no edites `CURRENT_PHASE.md` ni `CONTENT_CHECKLIST.md`. Escribe `context/PHASE_LOG/<tu-rama-con-guiones>.md` en la carpeta principal; si no tienes permiso, entrégalo completo en tu reporte final, junto con las filas de checklist que reservaste.
5. **Decisiones:** un archivo por decisión, `context/decisions/D0NN-<tema>.md`, con IDs de tu rango y el encabezado de una línea (formato en `context/decisions/README.md`). Va en git.
6. **Changeset:** ninguno.
7. **Servidor y navegador:** no autorizados. Verifica por código y dilo en el PR.
8. **Datos reales:** no hay; no toques Firebase.
9. **Dependencias:** solo si tu prompt lo permite, con `bun add`. Nunca npm/yarn/pnpm.
10. **Pruebas:** `bun run test:related` mientras trabajas. Antes del PR, la suite completa **sola**, no a la vez que el build y sin pipe: `mkdir -p .qa && bun run test > .qa/test.log 2>&1` en segundo plano, luego lee el resumen al final.
11. **Archivos:** creados y cambiados con Write/Edit. Nada de heredoc para archivos largos, ni `node -e` con backticks, ni Python en modo texto (CRLF). Si tocaste un archivo por shell (`biome --write`), léelo antes de editarlo.
12. **Esperas y búsquedas:** `sleep` está bloqueado; lo que tarde más de 2 min (suite, build, typecheck) va en segundo plano. `grep` siempre con rutas acotadas (`app/`, `lib/`, `components/`, `tests/`).
13. **Commit al cerrar cada etapa**, no solo al final. Al retomar: `git status` y sigue.
14. **Verificación mínima antes del PR:** typecheck, lint (sin errores nuevos), tests, build.
15. **Capturas:** no. Di en el PR que la revisión visual queda para el QA final.
16. **Sin poder preguntar:** si falta un dato, la opción conservadora + "Decisión tomada / alternativa" en el PR. Un valor que falte en el handoff no se estima del mockup: `design/canvas/krea.css` es la referencia exacta; si tampoco está ahí, déjalo marcado y dilo.
17. **Cero valores mágicos:** medidas, colores y z-index desde los tokens de `app/globals.css` (fase 01). Si falta un token que el handoff sí define (p. ej. alto de topbar), añádelo al bloque de tokens con su comentario de origen.
18. **Arregla la clase en la primera pasada.** Lo que veas después de abrir el PR va al reporte como "visto de paso".
19. **Copy nuevo = provisional:** marcado en el código + tu fila reservada del checklist.
20. **Archivo sin uso:** se señala en el PR, no se borra (salvo lo que tu prompt diga que reemplazas).
21. **Cierre:** commits Conventional (solo tus archivos) con descripción en español, push de tu rama, `gh pr create --base main --body-file .qa/pr-body.md` (PR en español; el cuerpo escrito con Write). Termina con el pie `🤖 Generated with [Claude Code](https://claude.com/claude-code)` y los commits con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Deja el slot limpio (`git status` vacío). **Nunca** `gh pr merge`, push a `main`, force-push ni amend de lo empujado.
22. **Reporte final** (breve): URL del PR, slot, verificado / no verificado, decisiones abiertas, acciones manuales, bugs vistos de paso, tu PHASE_LOG y filas de checklist si no pudiste escribirlos, y "Kit feedback" si el kit te hizo tropezar.
