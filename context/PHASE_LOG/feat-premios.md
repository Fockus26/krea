# feat/premios (W11, tanda 2026-11-06, ola 2)

- Premio opcional en tareas individuales (D263): sin la regla «solo grupales»; constructor con el campo en los dos tipos; `darAlumno` en `zDecisionPremio`.
- Ganador individual = mejor nota final (con base) de la sección (D264); alumno eliminado → la decisión deja de contar.
- Foto del premio en B2 `premios/{tareaId}/{uuid}.{ext}` (D265), firmada en Premios y en la tarea del alumno; se borra al reemplazar, al quitar el premio y al eliminar la tarea.
- «Crear premio» + «Editar / Agregar premio» en la tarjeta, Server Action `guardarPremio` (D266).
- Tests: `tests/unit/premios-individual.test.ts` (16) y `tests/rules/premios.test.ts` (4, emulador). Suite 945/945, rules 70/70.
- Checklist 146 (copy de premios individuales) y 147 (copy del diálogo): provisionales, descritas en el informe.
