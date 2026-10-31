# feat/sec-puntos — Ajustes de puntos (fase 04, ola 4, W3) · PR #34
- Fecha: 2026-10-30 · slot wt3 · base main @ 6b53b74 · opus · medium
- Hecho: lib/puntos.ts (+27 pruebas), components/ui/popover.tsx (nuevo), components/sections/puntos/ (combobox, formulario, historial,
  vista), app/secciones/puntos/ (page + layout con Toaster), lib/demo/puntos.ts, lib/demo/ajustes.ts (campos opcionales +
  AJUSTES_HISTORIAL; AJUSTES intacto), PANTALLAS (entre Panel y Evaluar).
- Decisiones: D118 combobox sobre Popover · D119 radios del motivo y stepper ±20 con signo · D120 vista previa (<output> único, puntos
  seed + sesión) y aplicar · D121 historial: anular = inverso «Anulación», filtro en menú.
- Verificación: typecheck, lint, test (432), build; HTML prerenderizado revisado. Sin servidor ni capturas.
- Pendiente: QA visual/teclado/lector (aria-controls con listbox en portal sin montar → axe en QA final); NumberStepper sin signo ni valuetext propio (backlog); copy filas 92–94.
