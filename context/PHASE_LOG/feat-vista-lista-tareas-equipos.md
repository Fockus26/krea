# feat/vista-lista-tareas-equipos (X4, tanda 2026-11-07, ola 2)

- Interruptor Tarjetas / Lista en /profe/tareas y /profe/equipos (D313), recordado en localStorage (`krea.vista.tareas`, `krea.vista.equipos`).
- Vista Lista con casillas, Shift = rango y barra del lote; `EliminarEnLote` y `lib/lote` por `id`; `Sustantivo` con género (`femenino`, `cosa`).
- `eliminarTareas` (D314) y `eliminarEquipos` (D315, una transacción por equipo con D307); `zIdsLote`.
- `totalTitulares` cuenta las entregas de equipos eliminados (D316): «1 de 3», no «3 de 2».
- Copy provisional: filas 164 (interruptor) y 165 (diálogos del lote) — las describe el informe.
- Verificado: typecheck, lint, tests puros, a11y por código. Sin servidor, sin capturas, sin build local.
