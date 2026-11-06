# fix/fecha-entrega · PR #74 · 2026-11-06

**Qué:** `zDia` exige día real; fecha de entrega ≤ hoy + 366 días (`fecha-lejana`), D228.
**Repro:** 3 pruebas nuevas fallan con main y pasan en la rama. Sin repro UI.
