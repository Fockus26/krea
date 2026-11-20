# Tanda 2026-11-20 — brief común de la ola 1 (Q1–Q5)

> Tanda suelta, 2 olas: plan en `context/plans/batch-2026-11-20.md`. Prompts de esta ola:
> `context/plans/orchestration-2026-11-20-prompts.md` (tu sección `## Qn`).
> Carpeta principal: `C:\Users\Cesar\Documents\Work\krea` — su `context/` es
> `C:\Users\Cesar\Documents\Work\krea\context` (ruta absoluta siempre). main @ 08b709a.
>
> Hechos del proyecto: pruebas con `bun:test` (`tests/unit`, `tests/db` sobre PGlite; `tests/db/base.ts`
> aplica las migraciones de `drizzle/`). **No hay entorno DOM**: lógica pura + capa de datos. Linter:
> `bun run lint` (Biome). Referencia del kit en `~/.claude/kit-reference/`.

## Unidades

| # | Rama | Qué | Modelo |
|---|---|---|---|
| Q1 | `fix/carga-estable` | «La página no carga»: permisos de tablas, sondeo y ranking tolerantes, recarga tras deploy | opus · medium |
| Q2 | `feat/evaluar-cola-en-vivo` | Cola de Evaluar: Por evaluar / Evaluadas / Todas, en vivo, contador del menú en vivo, «Cambiar» abre filtros, filtros que no se pegan | opus · medium |
| Q3 | `feat/evaluar-comentarios` | Formulario de Evaluar: textarea que crece, emojis, 300 caracteres, comentario general, gap del puntaje, aviso de presencia como snackbar, el alumno ve quién evaluó | opus · medium |
| Q4 | `feat/tareas-vencidas` | La tarea se cierra sola al vencer, se puede reabrir (para todos o para alumnos/equipos); filtro Abiertas · Cerradas · Evaluadas | opus · high |
| Q5 | `fix/alumno-detalles` | Padding del hover en filas, «Volver a tareas», «Tus profesores» con todos los profes | sonnet · medium |

Slot y puerto: los del mensaje que te lanza. **Ola 2** (otra sesión, tras mergear esta): Q6
`feat/partes-capitan`, Q7 `feat/respuesta-url`.

## Números reservados

| Unidad | Decisiones | Filas de CONTENT_CHECKLIST |
|---|---|---|
| Q1 | D436–D438 | 241–242 |
| Q2 | D439–D444 | 243–248 |
| Q3 | D445–D450 | 249–254 |
| Q4 | D451–D458 | 255–262 |
| Q5 | D459–D460 | 263–264 |

Rangos cerrados. Si al mezclar `origin/main` un ID tuyo ya existe, toma el siguiente libre y dilo.
Migraciones: solo Q4 genera una (`drizzle/0007_*`). Nadie más toca `lib/db/schema.ts` ni `drizzle/`.

## Formas compartidas

- **`estadoEfectivo`** (Q4, nuevo): solo Q4 lo crea y lo usa en esta ola. Los demás siguen leyendo
  `tarea.estado` como hoy.
- **`useSondeo(pedir, cadaMs, activo)`** (`lib/sondeo.ts`): Q1 cambia su comportamiento interno
  **sin cambiar la firma ni la exportación** de `SONDEO_MS`; Q2 lo usa tal cual.
- **`lib/evaluar-datos.ts`** lo tocan Q2 y Q3, por zonas:
  - Q2: filtros y cola (`:41-101`, `:374-523`) y lo de navegación de `vistaEvaluar` (`saltarHref`,
    `guardarHref`, eyebrow, `colaHref`).
  - Q3: `zGuardarEvaluacion` (`:114-146`), copy de errores (`:170-190`), `armarEvaluacion` (`:204-260`)
    y el campo `inicial` de `vistaEvaluar` (cerca de `:767`).
- **`app/(profesor)/profe/evaluar/[entrega]/page.tsx`** lo tocan Q2 y Q3:
  - Q2: la carga de listas (`:78-103`) y un montaje nuevo junto a la cabecera (`:140-150`).
  - Q3: el bloque `soloVer` (`:182-216`) y, si hace falta, el montaje de `PresenciaEvaluar` (`:164-170`).
- **`lib/vistas-estudiante.ts`** lo tocan Q3 (`detalleNota`, `:460-512`, y `DatosAlumno` `:249`) y
  Q4 (`:613`, `:902`, `:1035-1061`). Nadie más.
- **`app/(estudiante)/tareas/[tarea]/page.tsx`**: Q5 solo la línea `:163` (`inicioHref`); Q4 lo que
  dependa del estado (`:110` y lo que haga falta). Q3 no lo toca.

## Decisiones de César para esta tanda (2026-11-20)

- **Vencidas:** al llegar la fecha y hora de entrega la tarea **se cierra sola**, y el profe la
  puede **volver a abrir, para todos o para alumnos seleccionados** (en grupal, equipos).
- **Filtro de Profe › Tareas:** «Abiertas · Cerradas · Evaluadas». Cerradas = vencida o cerrada a
  mano; Evaluadas = todas sus entregas ya tienen nota, esté abierta o cerrada.
- **«Cambiar»** en Evaluar entrega: abre los filtros ahí mismo; al aplicar, salta a la primera
  entrega de la cola nueva.
- **Grupal por partes** (ola 2): el capitán puede «La respondo yo» con una parte no entregada.
- Comentarios opcionales: máximo **300** caracteres.

## Reglas de la tanda (además de `CLAUDE.md`)

1. Lee solo `CLAUDE.md`, `AGENTS.md`, este brief, tu sección de prompts y lo que cita (rutas,
   líneas, decisiones: `cat context/decisions/D0NN-*.md` desde la carpeta principal). Nada más de
   `context/`. AGENTS.md: este Next tiene cambios que rompen; lee la guía en
   `node_modules/next/dist/docs/` antes de usar una API de Next que no esté ya en el archivo.
2. Trabajas SOLO en tu slot (`C:\Users\Cesar\Documents\Work\krea-wt\wtN`), con la rama ya creada.
   No crees worktrees, no corras `wt`, no cambies de rama.
3. No edites `CURRENT_PHASE.md` ni `CONTENT_CHECKLIST.md`: tus filas (texto completo) y tu
   PHASE_LOG van en el informe.
4. Decisiones: un archivo por ID en `context/decisions/` (en git, en tu slot), formato de
   `context/decisions/README.md`, solo de tu rango.
5. **Sin versionado:** ningún changeset.
6. **Sin dev server, sin QA, sin build local** (César: QA al final; el build lo corren CI y
   Vercel). Verifica por código y pruebas; a11y a mano (semántica, teclado, foco, contraste con
   tokens ya medidos, 320 px sin scroll horizontal, estado nunca solo por color). Lo que no puedas
   medir sin servidor va en «Cómo probar» del PR para el QA final.
7. **La máquina se satura con 5 workers:** corre solo las pruebas de tus archivos
   (`bun test <archivo> --timeout 30000`) y, una vez al final, `bun run typecheck` y `bun run lint`
   en segundo plano. La suite entera la corre el CI: tras abrir el PR, `gh pr checks <n> --watch`
   en segundo plano y arregla lo que falle hasta dejarlo verde.
8. Datos reales: `.env` apunta a producción. No inicies sesión, no crees cuentas, no escribas datos.
9. Archivos con Write/Edit (Read antes de editar); scripts sueltos en `.qa/` con Write y `node`.
   Busca con `git grep -n <patrón> -- <rutas>`. Formatea con `bunx biome check --write <tus
   archivos>` una vez al cerrar una etapa.
10. Commit al cerrar cada etapa (y `wip:` cada ~20 min), push antes de los chequeos largos.
11. **Corrige la clase en la primera pasada:** si lo que arreglas tiene la misma forma en otro
    lado, búscalo en todo `app/`, `components/` y `lib/` y arréglalo ahora.
12. **Prevén lo que QA siempre encuentra:** textos `z.string().trim()` (vacío = sin texto),
    botones `disabled` mientras envían y servidor idempotente, `flex-wrap` en filas de botones,
    `min-w-0` en hijos flex con texto, objetivos táctiles ≥ 44 px en móvil.
13. Copy nuevo = PROVISIONAL (comentario en el código + tu fila). Español es-VE, decimales con
    coma. Cero valores mágicos: solo tokens y componentes que ya existen, sin color nuevo; un token
    que falte va en el informe como «Tokens que faltan» y usas el más cercano.
14. Sin poder preguntar: la opción conservadora + «Decisión tomada / alternativa» en el PR.
15. **Trampas conocidas:**
    - `tests/unit/cache-rutas.test.ts` exige `refresh()` (o revalidación) en **cada**
      `export async function` de `lib/acciones/`, y que `staleTimes` siga en minutos.
    - `tokens.test.ts` prohíbe hex en `app/` y `components/`, también en comentarios.
    - Estados de tarea en la base: `borrador | abierta | evaluada` («evaluada» = cerrada, D202).
    - `cacheComponents: true`: no hay `Date.now()` dentro de código cacheado; las páginas ya
      pasan `ahora`.
    - Nunca mandes la cédula de un profe al cliente (D380, D388).
16. Cierre: commits convencionales en español (solo tus archivos), push de tu rama,
    `gh pr create --body-file .qa/pr-body.md` (el Write y el `gh pr create` en turnos separados).
    Slot limpio al terminar. **Nunca** `gh pr merge`, push a `main`, force-push ni rebase; para
    ponerte al día, `git merge origin/main`.
17. **Informe final** (breve; lo primero, el enlace del PR y el estado del CI): verificado / no
    verificado, decisiones con su alternativa, filas del checklist (texto completo), PHASE_LOG,
    acciones manuales para César, «Tokens que faltan», vistos de pasada, «Kit feedback».
