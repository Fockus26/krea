# Orquestación del 2026-10-29 (fase 03) — brief compartido para los workers

> Fase 03, ola 1 de 3 — plan: `context/plans/phase-03-componentes.md`

> **Todo worker** lee esto antes de empezar. Su prompt trae solo lo específico de su unidad.
> Carpeta principal del repo: `C:\Users\Cesar\Documents\Work\krea` (ahí viven los archivos
> locales/gitignorados: `context/CURRENT_PHASE.md`, `context/CONTENT_CHECKLIST.md`,
> `context/PHASE_LOG/`, `context/plans/`, `.env*`). Ojo: la carpeta principal **no** está en `main`;
> lee el código y los archivos versionados en tu slot, nunca en la carpeta principal.

## Unidades y orden

| # | Rama | Qué | Ola | Slot / puerto |
|---|---|---|---|---|
| W1 | `feat/ui-base` | shadcn init + dependencias de toda la fase, `cn`, variante `dark:`, movimiento compartido, `Button`/`Spinner`, página `/componentes` | 1 | lo asigna `wt take` |

Ola de una sola unidad: lo que deja W1 (dependencias, `components.json`, archivos crudos de shadcn,
bloque de movimiento, estructura de `/componentes`) es la base sobre la que corren en paralelo las olas 2 y 3.

## Números reservados

| Unidad | IDs de decisión | Filas de `CONTENT_CHECKLIST` |
|---|---|---|
| W1 | D025–D029 | 23–25 |

No uses números fuera de tu rango (D018 quedó sin usar a propósito).

## Decisiones de César para esta tanda

- **Sin QA y sin servidor:** no se levanta dev server, no se sacan capturas, no se corre `qa:local`
  ni Playwright. Se verifica con `bun run typecheck`, `bun run lint`, `bun run test` y `bun run build`,
  más revisión de código. El `a11y` se hace a nivel de código (semántica, roles WAI-ARIA, foco,
  contrastes ya medidos en el handoff, `prefers-reduced-motion`), sin axe en navegador.
- **Proyecto sin versionado:** ningún PR lleva changeset, ni toca `version` ni `CHANGELOG.md`.

## Simular el backend

No aplica: componentes de presentación, sin datos remotos.

## Reglas de la tanda (además de `CLAUDE.md`)

1. **Lee solo** `CLAUDE.md` y lo que cite tu prompt (rutas, líneas, decisiones). No leas todo `context/` ni todo el handoff; el resto, con `grep`.
2. **Next 16:** antes de escribir código de una API de Next, lee su guía en `node_modules/next/dist/docs/` (AGENTS.md). **shadcn/Radix/Tailwind v4:** consulta la documentación actual por Context7 antes de `shadcn init`/`add`; no confíes en lo que recuerdas.
3. **Slot y rama:** trabajas SOLO en la ruta de tu slot (`..\krea-wt\wtN`), que ya tiene tu rama creada, `node_modules` instalado y los `.env*` copiados. No crees ni borres worktrees, no ejecutes `wt` y no cambies de rama.
4. **Carpeta principal = solo lectura.** No puedes escribir ahí (en la fase 02 no se pudo): **no** intentes escribir `context/PHASE_LOG/` ni nada local. Entrega en tu reporte final, completos: tu PHASE_LOG, tus filas de `CONTENT_CHECKLIST` y tus filas de `COMPONENTS_INVENTORY` (columnas: Component · Path · Used in · Phase that closed it · Notes). El orquestador los copia.
5. **Decisiones:** un archivo por decisión, `context/decisions/D0NN-<tema>.md` **en tu slot** (van en git), con IDs de tu rango y el encabezado de una línea (formato en `context/decisions/README.md`).
6. **Changeset:** ninguno.
7. **Servidor y navegador:** no autorizados. Verifica por código y dilo en el PR.
8. **Datos reales:** no hay; no toques Firebase.
9. **Dependencias:** solo las que tu prompt lista, con `bun add` / `bunx shadcn@latest add`. Nunca npm/yarn/pnpm.
10. **Pruebas:** no hay entorno DOM: pruebas unitarias solo de lógica pura (mapas de variantes, helpers) en `tests/unit/`. `bun run test:related` mientras trabajas. Antes del PR, la suite completa **sola**, no a la vez que el build y sin pipe: `mkdir -p .qa && bun run test > .qa/test.log 2>&1` en segundo plano, luego lee el resumen al final.
11. **`tests/unit/tokens.test.ts` prohíbe colores hex en `app/` fuera de `globals.css`**, y el cierre de fase prohíbe `[#hex]` y `[Npx]` en `components/`. Todo color/medida sale de los tokens; si falta uno que el handoff define, añádelo al bloque de tokens de `globals.css` con su comentario de origen.
12. **Archivos:** **Read antes de cada Edit** (también de los que generó una herramienta: `shadcn add`, `biome --write`); el Edit sin Read previo falla. Creados con Write/Edit; nada de heredoc para archivos largos, ni `node -e` con backticks, ni Python en modo texto (CRLF).
13. **Esperas y búsquedas:** `sleep` está bloqueado; lo que tarde más de 2 min (suite, build, typecheck) va en segundo plano. `grep` siempre con rutas acotadas (`app/`, `lib/`, `components/`, `tests/`).
14. **Commit al cerrar cada etapa**, no solo al final. Al retomar: `git status` y sigue.
15. **Verificación mínima antes del PR:** typecheck, lint (sin errores nuevos), tests, build.
16. **Capturas:** no. Di en el PR que la revisión visual queda para el QA final.
17. **Sin poder preguntar:** si falta un dato, la opción conservadora + "Decisión tomada / alternativa" en el PR. Un valor que falte en el handoff no se estima del mockup: `design/canvas/krea.css` es la referencia exacta; si tampoco está ahí, déjalo marcado y dilo.
18. **Estados y movimiento:** cada componente con todos sus estados del handoff (reposo, hover, foco, activo, deshabilitado, cargando, error cuando aplique). Animaciones solo `transform`/`opacity` con las duraciones de los tokens (`--d-*`, `--ease`), y con `prefers-reduced-motion: reduce` sin desplazamiento (HANDOFF §6).
19. **Arregla la clase en la primera pasada.** Lo que veas después de abrir el PR va al reporte como "visto de paso".
20. **Copy nuevo = provisional:** marcado en el código + tu fila reservada del checklist.
21. **Archivo sin uso:** se señala en el PR, no se borra.
22. **Cierre:** commits Conventional (solo tus archivos) con descripción en español, push de tu rama, `gh pr create --base main --body-file .qa/pr-body.md` (PR en español; el cuerpo escrito con Write). Termina con el pie `🤖 Generated with [Claude Code](https://claude.com/claude-code)` y los commits con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Deja el slot limpio (`git status` vacío). **Nunca** `gh pr merge`, push a `main`, force-push ni amend de lo empujado.
23. **Reporte final** (breve): URL del PR, slot, verificado / no verificado, decisiones abiertas, acciones manuales, bugs vistos de paso, PHASE_LOG + filas de checklist + filas de inventario (regla 4), y "Kit feedback" si el kit te hizo tropezar.
