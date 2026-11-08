# D336 · Data · El aviso sale solo en la transición borrador/nueva → abierta, decidida dentro de la transacción · Implemented

**Decision:** `guardarTareaEnTransaccion` devuelve `aviso` (id, título, secciones) solo si la tarea queda `abierta`, no es `importada` y antes no existía o era `borrador` (`debeAvisar(previa, nueva)`). Guardar cambios de una publicada, guardar un borrador y el reintento de la cola con el mismo `opId` (D293, sale antes de armar) no avisan. La acción quita `aviso` del resultado antes de devolverlo al cliente.
**Why:** César pidió avisar «cuando se publica», no en cada edición. Mirar `previa.estado` bajo `FOR UPDATE` evita el doble aviso aunque el mismo guardado llegue dos veces; «guardó con estado abierta» avisaría en cada reintento.
**Discarded alternative:** una columna `avisada_en` en `tareas` (otra migración sobre una tabla con datos, y el estado previo ya lo dice).
