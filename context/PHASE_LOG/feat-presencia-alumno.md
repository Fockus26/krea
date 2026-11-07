# feat/presencia-alumno (W14, ola 3 · 2026-11-07)

- **Qué:** presencia en vivo al editar un alumno (pedido 5) + «el último gana» con aviso.
- **Datos:** `presencia/{cedulaAlumno}/editores/{cedulaProfe}` = `{ nombre, desde, latido }`, escrita por el navegador del profe (D275, única excepción a D175); reglas con claves exactas y timestamps del servidor; `borrarPresenciaAlumno` al eliminar alumno.
- **Conflicto:** `editarAlumno` recibe `version` (campos editables al abrir); si difiere en la transacción → `conflicto` con lo vigente (D276).
- **UI:** una suscripción a la consulta de grupo `editores` en la lista; chip en la fila, franja + `output aria-live` en la ficha (D277). Latido 20 s, vigencia 45 s.
- **Tests:** `tests/unit/presencia.test.ts` (puro), `tests/rules/presencia.test.ts` (reglas + dos guardados en conflicto + borrado).
- **Pendiente:** desplegar las reglas (`firebase deploy --only firestore:rules`); QA con dos profes en dos navegadores; copy fila 154.
