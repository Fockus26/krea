# D446 · Data · Comentarios opcionales de Evaluar hasta 300 caracteres, también en el servidor · Implemented

**Decision:** `COMMENT_MAX_LENGTH` 280 → 300 (decisión de César, 2026-11-20). El servidor (`zGuardarEvaluacion`) usa la misma constante para el comentario por pregunta y el general (antes `.max(1000)`); `zEvaluacion` sigue en 1000 porque lee lo guardado. El campo y su contador cuentan unidades UTF-16 (`maxLength`, `String.length`): un emoji cuenta 2. zod 4.6 cuenta puntos de código (un emoji, 1), así que el servidor es un poco más permisivo y lo que el campo deja escribir siempre pasa.
**Why:** una sola fuente del tope; contar igual en el campo y en el contador evita que el contador diga «300 / 300» con texto que el navegador ya no deja escribir.
**Discarded alternative:** contar graphemes con `Intl.Segmenter` (como `lib/auth.ts`) — `maxLength` del navegador no lo hace, así que el contador y el campo dejarían de coincidir.
