# D058 · Components · QuestionHeader compartida; tres tarjetas con cuerpos separados; la barra no repite la cifra en detalle · Implemented

**Decision:** `QuestionHeader` (número, enunciado `h2–h4`, valor por variante) es lo único común; `QuestionCardDetail`, `QuestionCardAnswer` y `QuestionCardReview` son archivos distintos sin cuerpo común (HANDOFF §8). Cada una renderiza un `<li>` (van en un `<ol>`). `QuestionBar` lleva su cifra en texto, salvo `hideText`, que usa la tarjeta de detalle porque el valor de la cabecera ya dice "3,5 / 4". Detalle sin nota: valor "Pendiente · vale 4" y barra sin relleno (D003). La barra se rellena con `width` (no se anima).
**Why:** §8 prohíbe unificar los cuerpos; la cifra duplicada a dos líneas sería ruido para el lector de pantalla. `lib/question.ts` concentra los textos y el cálculo (probado).
**Discarded alternative:** una `QuestionCard` con `variant` — viola §8 y mezcla props que no se cruzan.
