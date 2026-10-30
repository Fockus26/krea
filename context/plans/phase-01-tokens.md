# Fase 01 — Tokens · plan de olas

> Escrito por `orchestrate` el 2026-10-29. Cada ola corre en **su propia sesión**.
> Carpeta principal: `C:\Users\Cesar\Documents\Work\krea` · Fase: `phases/01-TOKENS.md`
> **Sin QA hasta el final del proyecto** (decisión de César, 2026-10-29): ninguna ola lanza `wave-qa`.

## Olas

| Ola | Unidades (rama · qué · archivos) | Depende de | Estado |
|---|---|---|---|
| 1 | `feat/tokens` · tokens de §1 (4 acentos × claro/oscuro/sistema, neutros, estados, tipografía, espaciado, radios, sombras, z-index, movimiento, selección, scrollbar), fuentes, script anti-parpadeo, página `/tokens` · `app/globals.css`, `app/layout.tsx`, `app/tokens/` | — | cerrada |
| 1 | `feat/utilidades-nota` · `gradeColor`, `formatNota`, `notaFinal`, `puntosRanking`, `rankCompetition`, `maskEmail`, `maskCedula` + pruebas · `lib/`, `tests/unit/` | — | cerrada |

Las 3 unidades de `phases/01-TOKENS.md` van en una sola (`feat/tokens`): todas viven en `globals.css`.
Las utilidades (paso 2 del orden de HANDOFF §7) no tocan los mismos archivos y van en paralelo.

## Ola actual: 1 (cerrada — fase 01 cerrada)

- Brief y prompts: `context/plans/orchestration-2026-10-29.md` / `…-prompts.md`
- PRs: #6 W1 tokens · #5 W2 utilidades — mergeados (main @ e905b5e)
- QA: no aplica (decisión de César)

## Cierres

| Ola | PRs | QA | Pasa a la siguiente | Datos sin borrar |
|---|---|---|---|---|
| 1 | #5, #6 | no aplica (César: QA solo al final) | — | ninguno |

## Lo que sigue (fases siguientes, se dividen en olas al empezar cada una)

- **Fase 02** — layout base: `app/layout.tsx`, contenedor, skip link, assets de marca/SEO init.
- **Fase 03** — primitivas shadcn tematizadas + componentes propios (GradePill, RankRow, Podium…), por familias.
- **Fases 04–06** — secciones, páginas (estudiante → profesor), estados.
- **Fase 07** — backend Firebase (bloqueado: proyecto Firebase y claves en Vercel).

## Prompt de inicio de la siguiente ola

```
/orchestrate fase 02. Plan de la fase 01 cerrado: context/plans/phase-01-tokens.md
```
