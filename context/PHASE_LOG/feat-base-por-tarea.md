# feat/base-por-tarea — W1 (tanda 2026-11-14, ola 2)

2026-11-14 · PR #147 · D403–D407 (D176 sustituida en parte) · filas 212–216. La base pasa a ser por
alumno en cada tarea: `evaluacion.bases` en el jsonb (sin migración), `baseDeIntegrante` con respaldo
a la base vigente, control «Base de esta tarea» en Evaluar (individual) y uno por integrante (grupal);
la base de «Editar alumno» queda como la de las próximas evaluaciones. SQL de datos
`scripts/sql/2026-11-14-bases-por-entrega.sql` para congelar las ya evaluadas: pendiente de aplicar
(D407 Pending). CI verde. Sin verificar: axe y navegador (QA al final).
