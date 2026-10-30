# Kit feedback — KREA

> What the **web-agent-kit** did wrong, too much or too little in this project, to improve
> it. It is not the project's diary: it is material for the kit. Searched with `grep`, not
> read by default. Kit version it started on / was updated to: see `.kit-version`.

## When a row is added (the agent does it, without being asked)

| Type | Signal |
|---|---|
| **Correction** | César corrects something the agent did following the kit ("no, así no", "otra vez el…", reverts a change) |
| **Repetition** | César had to ask for the same thing a second time, or do by hand a step the kit could do |
| **Gap** | The kit did not say what to do and the agent had to improvise or ask something that should be settled |
| **Friction** | A kit step cost a lot for what it gave (tokens, time, ceremony), or an instruction was wrong |
| **Prevention** | A QA report brings a class finding not yet in the kit's `reference/QA-PREVENTION.md` (its "Prevención" row): the rule that would have prevented it while building |

Not logged: agent mistakes the kit already clearly forbids (that is something else), or
preferences of this project alone (they go to `decisions/`).

**If a row for the same problem already exists, it is not duplicated: add 1 to "Times",
update the date and, if it was marked as sent (`→ PR …`), remove the mark** (so the next
send carries it with the new count). What repeats is what is most worth fixing.

## Log

| # | Date | Type | Times | Kit piece | What happened (1 line) | Proposal (1 line) |
|---|---|---|---|---|---|---|

## Sending it to the kit

When César asks for it (or when closing phase 09): the **`kit-feedback`** skill
(`/kit-feedback`). It builds the report with the unsent rows, grouped by kit piece with the
most repeated first, and opens a PR on the kit's repo with the `kit-feedback` label. Sent
rows get marked with `→ PR <owner/repo#N>` in "Proposal" (they are not deleted).
| 1 | 2026-10-25 | Gap | 1 | new-project.ps1 · .gitattributes | En Windows con core.autocrlf=true, al cambiar de rama los archivos quedan en CRLF y `bun run lint` (Biome) falla en local aunque el CI pase | La plantilla de .gitattributes debería traer `* text=auto eol=lf` |
| 2 | 2026-10-29 | Correction | 1 | orchestrate §8 · CLAUDE.md (QA por ola, dev server de workers) | César pidió no correr ningún QA (wave-qa, design-qa, qa:local, servidor de workers) hasta terminar el proyecto | Opción de proyecto "QA solo al final" que salte §8 y el servidor de workers sin preguntarlo en cada ola |
| 3 | 2026-10-29 | Friction | 2 | orchestrate · brief-template (atribución) | Los 2 workers recibieron en el brief una firma Co-Authored-By distinta a la de su modelo y tuvieron que elegir | Que el brief no fije la firma de commits: cada worker usa la de su sistema |
| 4 | 2026-10-29 | Gap | 1 | design handoff · §1.4 tipografía | El handoff no da alto de línea de botón lg ni píldoras sm/lg; el worker lo tomó de krea.css | Añadir columna de alto de línea para todos los tamaños de §1.4 |
| 5 | 2026-10-29 | Gap | 1 | orchestrate · brief-template (regla PHASE_LOG) | El brief pide escribir `context/PHASE_LOG/` en la carpeta principal sin decir si el worker puede hacerlo desde el slot | Que el brief diga explícitamente sí/no y, si no, que lo entregue en el reporte |
| 6 | 2026-10-29 | Friction | 3 | orchestrate · brief-template (regla de archivos) | La herramienta Edit exige Read previo aunque el archivo se viera con `cat`; costó rondas extra | Añadir al brief: "lee con Read los archivos que vas a editar" |
| 7 | 2026-10-29 | Gap | 1 | seo skill · OG con `ImageResponse` | En Next 16.4 con Cache Components, un `await fetch` de fuentes a nivel de módulo en `opengraph-image.tsx` cuelga el build | Documentar carga perezosa de fuentes o TTF versionados en el repo |
| 8 | 2026-10-29 | Gap | 1 | orchestrate · prompts (tests del proyecto) | El prompt de OG no avisó que `tokens.test.ts` prohíbe hex en `app/` (ni en comentarios) | Que el orquestador liste en el prompt los tests que vigilan los archivos de la unidad |
| 9 | 2026-10-29 | Bug | 2 | orchestrate · wt.ps1 (`take`) | El slot traía un `.qa/pr-body.md` de la fase anterior: el Write falló (sin Read), `gh pr create` encadenado corrió igual y el PR salió con el cuerpo viejo | Que `wt take` vacíe `.qa/` al asignar el slot, o que el brief pida crear el PR en un paso aparte tras confirmar el Write |
| 10 | 2026-10-29 | Gap | 1 | frontend-build · trampas (shadcn v4 con tokens propios) | `shadcn init` v4 reescribe `--accent/--secondary/--input`, cambia fuentes a Geist en `layout.tsx`, añade paquetes `cn`, `shadcn`, `tw-animate-css` y escribe `from "cn"` en cada archivo | Añadirlo a las trampas de frontend-build para proyectos con tokens propios |
| 11 | 2026-10-30 | Bug | 1 | orchestrate · prompts (trampas sin verificar) | El prompt de W4 afirmó que Radix ToggleGroup no da `radiogroup`; la versión instalada sí | Verificar en `node_modules` cualquier trampa sobre una librería antes de escribirla en el prompt |
| 12 | 2026-10-30 | Gap | 2 | orchestrate · brief-template (tokens en olas paralelas) | "No toques globals.css" choca con "añade el token que falte": W4 y W5 dejaron valores sin token | Dar una vía explícita: el worker lista los tokens que faltan y el orquestador los añade en un PR de cierre de ola |
| 13 | 2026-10-30 | Gap | 1 | orchestrate · brief-template (Next 16 RSC) | Un archivo con `"use client"` que exporta constantes usadas por un componente de servidor rompe el prerender (no el typecheck) | Añadirlo a las reglas del brief: constantes compartidas fuera de archivos cliente |
| 14 | 2026-10-30 | Gap | 1 | orchestrate · brief-template (regla sin `[Npx]`) | Borde de error 2 px y padding 13 solo salieron con utilidades fraccionarias (`px-3.25`) y `ring-accent/28` | Decir en el brief qué vía usar para medidas impares sin token (escala fraccionaria de Tailwind v4) |
