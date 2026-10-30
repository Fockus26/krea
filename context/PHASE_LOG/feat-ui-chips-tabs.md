# feat/ui-chips-tabs — W4 (fase 03, ola 2)

2026-10-30 · PR #11 · Badge (9 variantes, `asChild`), `StatusBadge` + `CaptainBadge`, `GradePill` (sm/md/lg/xl, Raspado, Pendiente, Base, modo tabla; lógica en `lib/grade-pill.ts`), Tabs (line, segmented, block), `ToggleGroup` radiogroup con `block`, `Toggle` tematizado (sin uso) + familia chips · D038–D041 · typecheck/lint/test (95)/build OK · sin QA visual.

Para el cierre de fase: token `--r-grade-xl` (28 px) en lugar de `rounded-[1.75rem]` (2 clases en `lib/grade-pill.ts`). D038: flechas seleccionan con bandera de teclado + `click()` en `onFocus` (frágil, revisar con teclado real). D039: indicador sin deslizamiento (opacidad 150 ms). `text-small-b` sube a 14 px desde 3xl (desvío menor en chips).
