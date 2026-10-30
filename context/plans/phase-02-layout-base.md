# Fase 02 — Layout base · plan de olas

> Escrito por `orchestrate` el 2026-10-29. Cada ola corre en **su propia sesión**.
> Carpeta principal: `C:\Users\Cesar\Documents\Work\krea` · Fase: `phases/02-LAYOUT-BASE.md` · Handoff §4, §5, §2.7
> **Sin QA hasta el final del proyecto** (decisión de César, 2026-10-29): ninguna ola lanza `wave-qa`.

Ya hecho en la fase 01 (no se repite): `::selection`, scrollbar (`scrollbar-color` + `::-webkit-scrollbar`),
`:focus-visible`, fuentes, `lang="es-VE"`, script anti-parpadeo, breakpoint `3xl` (1920).
La ambigüedad >1920 la resuelve HANDOFF §4: el contenedor sube a estudiante 1280 · profe 1440 · lectura 760 y se fija.

## Olas

| Ola | Unidades (rama · qué · archivos) | Depende de | Estado |
|---|---|---|---|
| 1 | `feat/layout-base` · contenedores por rol (§4), padding lateral y ritmo vertical por breakpoint, smooth scroll solo con movimiento, `scroll-margin-top`, skip link, landmarks, `AppShell` estructural (lateral ≥1024 / topbar + barra inferior <1024, sin contenido de navegación) · `app/globals.css` (bloque Layout), `app/layout.tsx` (solo `<body>`), `components/layout/`, `app/page.tsx`, `app/tokens/page.tsx` | — | en curso |
| 1 | `feat/marca-seo` · seo init: `metadata`/`viewport` base, `icon.svg`, `favicon.ico`, `apple-icon.png`, `manifest.ts`, `opengraph-image.tsx`, `robots.ts`, `sitemap.ts` · `app/layout.tsx` (solo exports `metadata`/`viewport`), `app/*` de assets, `lib/site.ts` | — | en curso |

Las dos tocan `app/layout.tsx` en bloques distintos (W1 el JSX de `<body>`, W2 los exports): se reparte explícitamente en los prompts.
El contenido de la navegación (ítems, íconos lucide, tarjeta de usuario, hoja Menú) es HANDOFF §7 paso 5 y llega con las fases 03–04.

## Ola actual: 1

- Brief y prompts: `context/plans/orchestration-2026-10-29-f02.md` / `…-f02-prompts.md`
- PRs: #7 W1 layout · #8 W2 marca/SEO — abiertos, sin conflicto entre sí
- QA: no aplica (decisión de César)

## Cierres

| Ola | PRs | QA | Pasa a la siguiente | Datos sin borrar |
|---|---|---|---|---|

## Prompt de inicio de la siguiente fase

```
/orchestrate fase 03. Plan de la fase 02 cerrado: context/plans/phase-02-layout-base.md
```
