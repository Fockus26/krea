# D434 · Data · Vigencia de la ideal al leer, sin borrado en cascada · Implemented

**Decision:** no hay cascada: si la entrega elegida se elimina, se devuelve o se corrige a menos de 20, la fila de `ideales` queda, pero `vigencia` la da por caducada: el alumno no ve nada (ni el enlace) y el profe ve en la lista «La entrega ideal ya no se muestra» con «Escribir la respuesta ideal» y «Quitar». Si la tarea se elimina, la fila queda huérfana (pendiente de limpieza: borrar `ideales` al eliminar la tarea en `lib/data/tareas.ts`, que esta ola no podía tocar).
**Why:** `lib/data/devolver-entrega.ts`, `lib/data/tareas.ts` y Evaluar son de otras unidades o están cerrados; leer con vigencia es seguro y no toca su código.
**Discarded alternative:** borrar la ideal dentro de devolver/eliminar/evaluar — tocaría tres transacciones ajenas en una unidad experimental.
