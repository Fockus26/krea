# D228 · Data · La fecha de entrega va de hoy a un año, y el día tiene que existir · Implemented

**Decision:** `zDia` comprueba además que el día exista (`esDiaValido`). La fecha de entrega al publicar o editar queda entre hoy y `FECHA_ENTREGA_MAX_DIAS` = 366 días, que cubre el mismo día del año siguiente aunque sea bisiesto. Se aplica en el formulario (`ERRORES.fechaLejana`) y en el servidor (`fecha-lejana`). Una fecha ya guardada se conserva, como con la fecha pasada (D200). El copy es provisional (CONTENT_CHECKLIST fila 90).
**Why:** QA de la versión 1 (F-B2): se publicaba una tarea con fecha 31/12/9999. Por petición directa, `2027-02-31` no se guardaba pero respondía `red` («No se pudo conectar») en vez de `invalida`. Un año alcanza para el período escolar.
