# D329 · Colors · Barrido de rellenos de color con texto: qué se cambió y qué queda fuera · Implemented

**Decision:** migrados a `bg-error-fill` / `bg-success-fill`: `Button` danger, chip «VS» (`podium.tsx`, `rank-row.tsx`), hover del botón quitar de `image-upload.tsx` y `task-delivered.tsx`. Quedan fuera, medido y razonado: barras de medidor (`lib/meters.ts`, `bg-warning/error/success`, sin texto encima, su contraste es de gráfico ≥ 3:1 ya cubierto), píldoras de nota (blancas, D286), `bg-secondary text-on-secondary` (dorado con tinta oscura en ambos temas, ≥ 4,5:1, no cambia entre temas) y `bg-accent` (D301). No existe relleno `warning`/`info` con texto, así que no se crea `--warning-fill`.
**Why:** César pidió hallar el patrón completo, no solo el botón visto. Si aparece un relleno nuevo con texto, usa estos tokens o crea el suyo con prueba en `tests/unit/contraste-rellenos.test.ts`.
**Discarded alternative:** tokens `--*-fill` también para warning/info sin uso (código muerto).
