# feat/sec-tareas-profe — W2 (fase 04, ola 4) · PR #33 · 2026-10-30

Tareas del profesor y constructor. Lista: `TasksHeader`, filtro local `ToggleGroup` (Todas · Borradores · Abiertas · Evaluadas) con
`<output>`, tarjetas fila `TeacherTaskCard` (`h2` tamaño h3, `MeterBar` máx. 320). Constructor `TaskBuilder` con reducer puro en
`lib/tareas-profe.ts`: Datos (fecha con máscara sin calendario, premio solo grupal conservado al pasar a Individual), Preguntas 1–20 con
toast «Pregunta eliminada» + Deshacer en su posición, `SumMeter` bar (móvil) / card (aside), «Publicar» deshabilitado si suma ≠ 20 y
validación del resto al pulsar. Datos `lib/demo/tareas-profe.ts` (TAREAS + borrador `plan-redes`). Toaster local. `globals.css`: solo
scroll-padding. D114–D117. typecheck, lint, test (427), build OK; sin navegador (QA final).
- Abierto fase 05: sin barra inferior en móvil y «Guardar borrador» en la topbar (`Vista`/`TopBar` no lo admiten); «Ver notas» → `/profe/alumnos`.
- «Identidad de marca» = Abierta para el profe (12 de 69 evaluadas) aunque `TAREAS` diga «evaluada» (estado del alumno).
- Visto de paso: ids de `COLA` (`logo-y-paleta-emprendimiento`, `plan-de-ventas`) no están en `TAREAS` → backlog.
