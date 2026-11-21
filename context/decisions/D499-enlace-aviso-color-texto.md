# D499 · Colors · El enlace del aviso usa el color del texto, subrayado · Implemented

**Decision:** el enlace de `ErrorEnPantalla` (`components/estados/errores.tsx`) usa `text-text` con subrayado en lugar de `text-accent-ink`. Cubre el aviso «Esa entrega no se puede elegir» de la ideal del profe y todos los avisos con enlace.
**Why:** QA versión 2 D-M2: en oscuro `--accent-ink` sobre el fondo del aviso `warn` daba 3,56:1. Es un enlace dentro de un bloque tintado: el subrayado ya lo marca como enlace (no depende del color) y `--text` es el color del resto del aviso, que ya pasa AA.
**Discarded alternative:** otro token de acento (no hay uno que pase sobre el tinte `warn` en los 4 acentos).
