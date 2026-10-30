# D013 · Grading · Nota final con base redondeada a 1 decimal, mitad hacia arriba · Implemented

**Decision:** `notaFinal = puntaje × base / 20`, redondeada a 1 decimal con la mitad hacia arriba (18,5 × 15 / 20 = 13,875 → 13,9). Decisión de César, 2026-10-29. Implementada con aritmética entera en `lib/grades.ts`.
**Why:** un decimal es lo que muestra la interfaz (`formatNota`) y la mitad hacia arriba es el redondeo escolar esperado.
**Discarded alternative:** redondear a 0,5 (como los pasos de evaluación): pierde información y 13,875 pasaría a 14.
