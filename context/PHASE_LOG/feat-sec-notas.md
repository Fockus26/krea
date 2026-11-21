# F04 ola 2 — Mis notas y Detalle de nota (cloud, 2026-10-30)

- `components/sections/notas/`: GradeLegend, GradesList (cliente, filtro con ToggleGroup), GradeSummary, QuestionList, BackLink.
- `lib/notas.ts` (filtro, degradado desde `gradeColor`, textos del resumen) con pruebas en `tests/unit/notas.test.ts`; `lib/demo/notas.ts` (filas de Raquel, detalle de Elsa/Angeles).
- Ancho `lectura` ahora alineado al inicio (`container-reading-start`, D078): afecta a toda pantalla con `width="lectura"`.
- Vistas: `/secciones/notas`, `/secciones/notas/{detalle,con-base,raspado}`.
- Decisiones D078–D080 (D081 libre). Filas 62–64.
