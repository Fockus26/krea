# D243 · Sections · Eliminar tarea: botón de ícono en la card y botón en el constructor, confirmación con lo que se pierde, salida animada · Implemented

**Decision:**
- **Card** (`TeacherTaskCard`): botón ghost de ícono `Trash2` en `--error`, el último de las acciones, en todos los estados, con nombre «Eliminar <título>» y `aria-haspopup="dialog"`. Solo con la Server Action (la galería `/secciones` no lo muestra).
- **Constructor:** «Eliminar tarea» (ghost, `--error`, bloque), al final de la columna ≥ 1024 y en el flujo < 1024, cuando la tarea ya está guardada (cualquier modo, también cerrada). Tras eliminar: toast y vuelta a la lista.
- **Confirmación** (`Dialog`, un solo diálogo por lista): «¿Eliminar «título»?» y lo que se pierde, de `perdidaAlEliminar`: notas (una por integrante de cada entrega evaluada; también las < 10), entregas sin evaluar y las secciones con notas («Se borrarán 23 notas de 5A y 5C. Los puntos del ranking se recalculan. Esto no se puede deshacer.»). Botón `danger` «Eliminar tarea» con «Eliminando…» y `disabled` mientras vuela. Copy PROVISIONAL (W4 no tiene fila reservada en el checklist: va en el informe).
- **Salida** (pedido 44): la tarjeta se queda en su sitio mientras responde la acción (`conLaQueSale`, aunque `refresh()` ya la quitó de las props), sale con opacidad y escala (`--d-normal`, `--ease`, WAAPI) y las demás suben con el FLIP existente (`useFlip`, `--d-rank`). Con reduced motion las duraciones valen 0 y desaparece al instante. Mientras sale, `inert`.
- **Foco:** cancelar → vuelve al botón que abrió; eliminar → título (`h2`, `tabIndex=-1`) de la siguiente tarjeta, si no la anterior, si no el `<h1>` (`vecinaAlQuitar`).
**Why:** pedidos 6 y 44 de César; brief de W4. Un botón de ícono como el de eliminar pregunta evita meter un menú nuevo en la card.
**Discarded alternative:** menú «⋯» con «Eliminar» — un patrón más para una sola acción. Animar antes de que responda el servidor — si falla, la tarjeta tendría que volver.
