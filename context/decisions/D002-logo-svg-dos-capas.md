# D002 · Brand · Logo SVG único de dos capas coloreable por CSS · Implemented

**Decision:** `public/brand/krea-logo.svg`, vectorizado (potrace) del PNG de César: `path.krea-logo__ink` (letras, `var(--krea-logo-ink, #295ac3)`) y `path.krea-logo__splash` (gotas, `var(--krea-logo-splash, #00e5f5)`); sin variables (por ejemplo en un `<img>`) se ve en el preset azul. El comentario del SVG no puede contener dos guiones seguidos (XML). Presets: azul #295AC3 + #00E5F5, verde #115445 + #A0F25A, rojo #EE0400 + #FFC23D, morado #734AD1 + #FF8AD8.
**Why:** César pidió un solo SVG cuyo color cambie desde el código. Los PNG traían azul/cian y verde/lima: mismo trazo, dos tintas.
**Discarded alternative:** un SVG por color — 4 archivos que se desincronizan.
