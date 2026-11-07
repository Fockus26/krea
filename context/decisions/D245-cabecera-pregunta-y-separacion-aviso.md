# D245 · Sections · Cabecera de la pregunta alineada arriba; el aviso del constructor separado con `page-stack` · Implemented

**Decision:**
- **Pregunta** (`QuestionEditor`): «Pregunta n» deja `self-center` y ocupa la línea de 32 del número (`flex min-h-8 items-center`), y crece hacia abajo si envuelve; el botón eliminar (36, 44 < lg) se centra en esa línea con margen negativo (`-my-0.5`, `max-lg:-my-1.5`) sin estirar la fila. Antes el título se centraba en el alto del botón y quedaba más abajo que el número (pedido 33).
- **Aviso de entregas** (pedido 30): la causa era la clase `gap-section`, que no existe (el token es la variable `--gap-section`, no `--spacing-section`): el contenedor del constructor no tenía separación. Pasa a la utilidad `page-stack` (flex en columna con `--gap-section`). Mismo fallo y arreglo en `ReviewForm` (`components/sections/evaluar/review-form.tsx`), comprobado en el CSS compilado: `.gap-section` no estaba y `.page-stack` sí.
**Why:** pedidos 30 y 33 de César.
**Discarded alternative:** añadir `--spacing-section` al `@theme` para que `gap-section` funcione — crea un segundo nombre para el mismo token.
