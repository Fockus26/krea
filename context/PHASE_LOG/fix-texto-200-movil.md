# fix/texto-200-movil — D-A1 (QA versión 1) · PR #64

**Qué:** con texto del sistema al 200 % (CDP `Page.setFontSizes` 32) en 390 px, lo de ancho fijo
en rem cede al contenedor: píldora de la barra inferior `w-full max-w-14`; `<header>` `@container`
y logo oculto bajo `--container-estrecho` (18 rem, nunca con texto normal); 7 `min-w-N` grandes →
`min-w-[min(--spacing(N),100%)]`; SegmentedLinks y ToggleGroup envuelven; píldora xl con tope;
`body { overflow-wrap: break-word }`.

**Medido** (`wt4/.qa/repro/3b-texto-200-todas.mjs`, emuladores con qa:local :4304): main 14/14
rutas con desborde → rama 6/14. Barrido 320–3840 con texto normal: 0 hscroll, recortes = main
(alumno) / −2 (profe). axe 0 en alumno y profesor. Guardia `tests/unit/texto-200.test.ts`.

**Queda (D-A1b, otra unidad):** fila del ranking (columnas auto chip + puntos), `Button` con
`whitespace-nowrap` (/perfil, /profe/tareas/nueva), fila de /profe/equipos.

**Decisión:** ocultar el logo antes que el texto «En vivo» (estado solo por color) o encoger el
avatar (área táctil 44).
