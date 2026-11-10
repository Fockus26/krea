# D351 · Components · El colapsable del año usa `<h2><button>` y no `<details>` · Implementado

**Decisión:** el cabezal del año es un botón dentro de `<h2>` con el panel `hidden`; las acciones (agregar/editar/eliminar año) quedan fuera del botón, en la misma fila.
**Por qué:** un `<summary>` no puede convivir con botones hermanos en su fila sin controles anidados (interactivos dentro de interactivos). Mismo aspecto que `ranking-how-to` (chevron, foco, duración de transición).
**Alternativa descartada:** `<details>` con las acciones dentro del `<summary>`: el clic de editar/eliminar alternaría el colapsable y los lectores de pantalla anunciarían botones anidados.
