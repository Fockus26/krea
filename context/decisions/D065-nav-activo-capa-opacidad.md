# D065 · Components · Indicador de nav activo = capa de fondo con transición de opacidad (150 ms), sin deslizamiento; contador accesible · Implemented

**Decisión:** el fondo `--accent-soft-2` del ítem activo (lateral, hoja y píldora de la barra inferior) es una capa `absolute -z-10` con `opacity-0` que pasa a `opacity-100` según `aria-current="page"` (`duration-fast`; con reduced motion `--d-fast` vale 0). El estado activo no es solo color: peso 700 + fondo + `aria-current`. El contador de Evaluar es un `Badge acc` de 22 px con el número `aria-hidden` y el texto "n por evaluar" en `sr-only`. Tamaños sin token propio (15/20 del ítem) usan `text-[0.9375rem]`: queda como token pendiente.
**Why:** HANDOFF §6 (opacidad 150 ms, no se desliza) y la regla de no depender del color.
