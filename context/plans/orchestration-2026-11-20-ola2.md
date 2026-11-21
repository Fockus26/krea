# Tanda 2026-11-20 — brief común de la ola 2 (Q6, Q7)

> Plan de la tanda: `context/plans/batch-2026-11-20.md`. Prompts de esta ola:
> `context/plans/orchestration-2026-11-20-ola2-prompts.md` (tu sección `## Qn`).
> Carpeta principal: `C:\Users\Cesar\Documents\Work\krea` — su `context/` es
> `C:\Users\Cesar\Documents\Work\krea\context` (ruta absoluta siempre). main @ 4de1237.
>
> Hechos del proyecto: pruebas con `bun:test` (`tests/unit`, `tests/db` sobre PGlite; `tests/db/base.ts`
> aplica las migraciones de `drizzle/`). **No hay entorno DOM**: lógica pura + capa de datos. Linter:
> `bun run lint` (Biome; en main falla por formato en `app/layout.tsx` y
> `tests/unit/instalar-pwa.test.ts`, no es tuyo: no lo arregles). Referencia del kit en
> `~/.claude/kit-reference/`.

## Unidades

| # | Rama | Qué | Modelo |
|---|---|---|---|
| Q6 | `feat/partes-capitan` | Reparto: se actualiza solo (sin «Actualizar»); el capitán ve en solo lectura las preguntas asignadas a otros, envía la tarea entera y puede «La respondo yo» | opus · high |
| Q7 | `feat/respuesta-url` | Nuevo formato de pregunta «Enlace» (respuesta URL) + costura D457 en Evaluar | opus · medium |

## Números reservados

| Unidad | Decisiones | Filas de CONTENT_CHECKLIST | Migración |
|---|---|---|---|
| Q6 | D461–D467 | 265–270 | ninguna prevista (ver su prompt); si de verdad hace falta, `drizzle/0008_*` |
| Q7 | D468–D471 | 271–274 | ninguna |

Rangos cerrados. Si al mezclar `origin/main` un ID tuyo ya existe, toma el siguiente libre y dilo.
Docker: no. Build local: no. Servicios de prueba en puertos fijos: no (el CI corre la suite).

## Formas compartidas (Q6 y Q7 corren a la vez)

- **`lib/modelo.ts`**: Q6 solo `ESTADOS_PARTE` (`:523-531`, añade `"tomada"`). Q7 solo
  `zPregunta.formato` (`:221`), `limiteImagenes`/tipos de formato (`:234`) y `zRespuesta`
  (`:408-415`, añade `{ url: string }`).
- **`lib/partes.ts`**: Q7 solo `RespuestaParte` y `respuestaParte` (`:246-260`, añade
  `{ tipo: "url"; url: string }`). Q6 todo lo demás (transiciones, vistas, copy).
- **`components/sections/tareas/task-answer-form.tsx`**: Q6 añade el bloqueo por pregunta (una
  prop nueva, p. ej. `bloqueos?: Record<preguntaId, …>`) y lo pasa a cada `QuestionCardAnswer`;
  Q7 añade la rama `p.formato === "url"` en el render (`:620-700`), el estado del campo y
  `completa`. **Costura:** quien mergee segundo pasa también el bloqueo de Q6 a la rama url y
  comprueba que la respuesta url de una parte aceptada precarga bien.
- **`components/sections/tareas/partes-integrante.tsx`**: Q6 el aviso de una parte `tomada`;
  Q7 el campo url de una parte. Zonas distintas del archivo.
- **`components/krea/question-card-answer.tsx`**: Q7 añade el formato `"url"` (campo + badge);
  Q6 no lo toca (usa `bloqueo` tal cual existe, `:27-28, 83-86`).
- **Respuesta en la vista** (`QuestionAnswer` de `components/krea/question-card-detail.tsx`): Q7
  añade la variante enlace. Q6 pinta las respuestas de otros con `RespuestaParteVista`
  (`estado-parte.tsx`), que Q7 extiende para url.
- Nadie más toca `lib/db/schema.ts` salvo Q6 si necesita `0008` (no se espera).

## Decisiones de César (2026-11-20)

- **Partes:** el capitán puede **«La respondo yo»** con una parte no entregada; el integrante
  queda premarcado «No participó» (D420).
- Sin dev server ni QA en esta ola (QA al final del proyecto).

## Reglas de la tanda (además de `CLAUDE.md`)

Las mismas 17 reglas del brief de la ola 1
(`C:\Users\Cesar\Documents\Work\krea\context\plans\orchestration-2026-11-20.md` › «Reglas de la
tanda»): léelas, valen tal cual. Cambios para esta ola:

- Tu slot es `C:\Users\Cesar\Documents\Work\krea-wt\wtN` (el del mensaje que te lanza).
- Con 2 workers la máquina va holgada: puedes correr `bun run typecheck` y las pruebas de tu zona
  más de una vez, pero la suite entera la sigue corriendo el CI (`gh pr checks <n> --watch` en
  segundo plano; arregla hasta verde).
- Estado de la tarea: usa `estadoEfectivo` / `estadoEn` de `lib/estado-tarea.ts` (Q4), nunca
  `tarea.estado !== "abierta"`.
