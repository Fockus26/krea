# D498 · Colors · El número de la píldora va en tinta oscura sin sombra solo en las notas 10–12 · Implemented

**Decision:** `gradeNumeroClass(n)` (`lib/grades.ts`) devuelve `text-grade-ink` (#111111, sin sombra) cuando el blanco sobre `gradeColor(n)` da menos de 1,55:1 (notas 10 a 12) y `GRADE_NUMERO_CLASS` (blanco con sombra, D347) en el resto. Aplica en `GradePill`, el ejemplo de `ranking-rules.tsx`, la leyenda (usa `GradePill`) y la imagen OG (pastilla del 10). Decide la función por contraste medido, no por una lista.
**Why:** decisión de César (2026-11-21, QA versión 2 D-M1): cumplir AA solo donde falla más (amarillos/lima, donde el blanco con sombra rinde 3,6–3,84:1 efectivos); el resto de la escala sigue como eligió en D347. Con tinta oscura esas notas dan más de 12:1.
**Discarded alternative:** tinta oscura en todas las notas con `gradeInk` (D236, vuelve a cambiar la apariencia de la escala entera); umbral más alto (metería la 9,5 y la 12,5, que César no pidió).
