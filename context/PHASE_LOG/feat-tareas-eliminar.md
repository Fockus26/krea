# feat/tareas-eliminar (W4, tanda 2026-11-06, ola 1)

- **Hecho:** acción `eliminarTarea` (tarea + entregas + notas, ranking recalculado en la misma transacción, imágenes B2 después sin fallar); confirmación con notas que se pierden (lista y constructor); salida animada con FLIP del resto y foco a la vecina; acciones de la card arriba con los chips; cabecera de la pregunta arriba; separación aviso/formulario (`gap-section` no existía → `page-stack`, también en `ReviewForm`).
- **Decisiones:** D242 (transacción), D243 (UI y foco), D244 (acciones de la card), D245 (pregunta y separación).
- **Pruebas:** unitarias de `perdidaAlEliminar`, `perdidasPorTarea`, `planEliminar`, copy, `conLaQueSale`, `vecinaAlQuitar`; emulador `tests/rules/eliminar-tarea.test.ts`.
- **Copy provisional sin fila:** título, descripción, botón y toast de eliminar (`lib/tareas-profe.ts`).
- **Sigue:** QA final: profe elimina una tarea evaluada y el ranking baja.
