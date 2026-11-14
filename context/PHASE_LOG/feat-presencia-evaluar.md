# feat/presencia-evaluar — W2 (tanda 2026-11-14, ola 2)

2026-11-14 · PR #146 · D408–D410 · fila 217. Aviso «otro profe está evaluando esta entrega» (pedido 8):
tabla `presencia` con clave `entrega:<id>` (sin migración), `/api/presencia` acepta `entrega`,
hook `usePresenciaEntrega`, componente `presencia-evaluar.tsx` tras la cabecera (no en `?ver`). CI verde.
Sin verificar: axe y navegador (QA al final).
