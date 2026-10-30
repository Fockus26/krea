# feat/ui-evaluacion — W8 (fase 03, ola 3) · PR #18 · 2026-10-30

- ScorePicker (`components/krea/score-picker.tsx` + `lib/score.ts`): ≤ 6 radiogroup de ToggleGroup (D038), un radio por paso
  de 0,5; > 6 NumberStepper + 5 atajos ghost sm (medios hacia arriba: ¼ de 7 → 2); teclas 0–9 y `,` con búfer puro (1 s) — D054, D055.
- SumMeter (barra y tarjeta «Suma de valores») y LiveTotal (barra y tarjeta «Total en vivo», nota por `notaFinal`) separados
  por §8; comparten solo MeterBar y `lib/meters.ts` — D056, D057.
- Familia «Evaluación y puntaje» completa e interactiva. Barra por pregunta → W9.
- Verificado: typecheck, lint, build, test 195/195 y CSS compilado. Sin navegador (QA final).
- Tokens pendientes: `text-score` (Poppins 700 15/20), `--w-score-max` 1,5 px (hoy `--w-btn-border`), píldora 88×64 fuente 32 de Total en vivo (hoy GradePill lg).
- Visto de paso: NumberStepper sin `value: null` ni `aria-labelledby` (rodeado con 0 + «Sin puntuar» y `fieldset`); GradePill sin tamaño 88×64 y con chip Raspado fijo (<10).
