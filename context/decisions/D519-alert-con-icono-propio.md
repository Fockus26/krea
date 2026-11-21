# D519 · UI · `Alert` acepta `icon`; el aviso de vista previa de Puntos sigue en spans dentro de `<output>` · Implemented

**Decision:** `Alert` tiene prop `icon` (por defecto el de la variante). `adjustment-form.tsx` no migra a `Alert`: `<output aria-live>` solo admite contenido de frase y `Alert` es un `div` con su propio `role=status`, lo que anidaría dos regiones vivas.
**Why:** conservar la semántica de la región viva estable (la frase completa).
**Discarded alternative:** reemplazar `<output>` por `Alert role=status` — la región debería existir vacía cuando no hay vista previa y se duplicaría el anuncio.
