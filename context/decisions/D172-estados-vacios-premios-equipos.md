# D172 · States · Vacíos de Premios y de Equipos del profesor · Implemented

**Decision:** `PrizesBoard` sin tarjetas → `EmptyState` (Trophy) «Todavía no hay premios» / «Cuando una tarea tenga premio, aquí verás quién lo gana y podrás decidir los empates.»; `TeamsBoard` sin equipos → `EmptyState` (Users) «Todavía no hay equipos en {sección}» / «Cuando armes los equipos, aquí verás a sus integrantes y a su capitán.» (sobre la tarjeta «Sin equipo», que sigue). Copy provisional (fila 120). El resto de las listas ya tenía vacío (Inicio, Mis notas, Tareas, Panel, Puntos, Tareas del profe, Evaluar) o un texto en línea (notas y premios de Mi equipo).
**Why:** criterio de cierre de la fase 06: ninguna lista queda en blanco. El lienzo no diseña estos dos: mismo patrón `EmptyState`.
**Discarded alternative:** dejarlas sin vacío hasta tener datos — con Firestore una sección nueva arranca vacía.
