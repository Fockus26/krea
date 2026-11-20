# D449 · Components · `ScorePicker` modo stepper: 12 entre el campo y los atajos · Implemented

**Decision:** la raíz del modo stepper pasa de `gap-1` (4) a `gap-3` (12) entre `NumberStepper` y los atajos ghost. El modo botones ya separa sus opciones con `gap-1.5` y el rótulo «Puntaje» con `gap-2`: sin cambio.
**Why:** César: «Las opciones para puntuar y el campo para anotar el puntaje no tienen un gap»; con 4 px los atajos parecían pegados al campo.
**Discarded alternative:** `gap-2` (8) — sigue leyéndose como un mismo bloque; `gap-4` (16) — más que el que separa el rótulo del control.
