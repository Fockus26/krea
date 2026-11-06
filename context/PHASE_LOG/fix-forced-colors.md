# fix/forced-colors — D-A2/D-A3 (QA versión 1) · PR #63

**Qué:** bloque `@media (forced-colors: active)` en `app/globals.css`. Capas con máscara del
logo/isotipo → `CanvasText` (tinta) y `Highlight` (salpicadura) con `forced-color-adjust: none`.
Opción activa de ToggleGroup, Tabs y enlaces con `aria-current="page"` → `Highlight`/`HighlightText`.

**Guardia:** `tests/unit/forced-colors.test.ts` (una regla por cada `@utility krea-(mask|iso)-*`
y los tres selectores de estado activo). FAIL en main 3/3, PASS en la rama.

**Preview:** `wt3/.qa/repro/4b-5b-forced-colors-preview.mjs`. Control (preview de #62): logo blanco
sobre blanco, 7/12 grupos indistinguibles → FAIL. Rama → PASS.

**Decisión:** colores del sistema, no tokens (en modo forzado los tokens no aplican). Salpicadura
en `Highlight` para conservar las dos capas del logo.

**Sin verificar:** rutas con sesión en el preview (mismos componentes; cuentas solo en emuladores).
