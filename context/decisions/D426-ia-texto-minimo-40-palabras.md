# D426 · Data · Mínimo de 40 palabras para analizar; tope de 5000 caracteres · Implemented

**Decision:** una respuesta de texto con menos de 40 palabras (`MIN_PALABRAS_IA`, `lib/ia-texto.ts`) no se analiza: en Evaluar sale «Texto muy corto para estimarlo (mínimo 40 palabras).» sin botón, y la acción responde `corto`. Lo que viaja se recorta a 5000 caracteres (`MAX_CARACTERES_IA`, el mismo tope de `zRespuesta`, así que en la práctica no recorta nada).
**Why:** en textos cortos en español cualquier número es ruido; 40 palabras es un párrafo breve, lo mínimo para hablar de estilo. El tope fija el costo máximo por análisis.
**Discarded alternative:** sin mínimo (el profe decide) — invita a leer como dato un número sin base; 100 palabras — dejaría fuera muchas respuestas reales de las tareas, que suelen ser de uno o dos párrafos.
