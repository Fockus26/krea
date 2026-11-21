# D500 · Colors · Barrido de `bg-accent-ink` con texto encima: solo la tarjeta de puntos · Implemented

**Decision:** se buscó `bg-accent-ink` en `app/` y `components/`: el único relleno con texto encima era la tarjeta de puntos (D497). Los demás usos de `accent-ink` son texto/ícono sobre superficie o tinte, que ya miden ≥ 4,5:1 en `contraste-tokens.test.ts`.
**Why:** regla de clase completa de la tanda (corregir lo que tiene la misma forma en otro lado).
