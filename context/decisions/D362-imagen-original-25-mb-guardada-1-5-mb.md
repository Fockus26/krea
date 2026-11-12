# D362 · Components · Imagen: original hasta 25 MB, guardada ≤ 1,5 MB · Implemented

**Decision:** la subida de imágenes (`lib/image.ts`) acepta originales de hasta 25 MB (`IMAGE_MAX_BYTES`, antes 5 MB) y `compressImage` garantiza, hasta donde alcanzan los pasos, que lo guardado pese ≤ 1,5 MB (`IMAGE_TARGET_BYTES`). El máximo del servidor (`IMAGEN_SUBIDA_MAX_BYTES`, 2,5 MB) no cambia: queda de red de seguridad. El copy «hasta 5 MB» pasa a 25 MB (subida y galerías de estados); el logo de equipos es otra subida y no cambia.
**Why:** César (2026-11-12): los alumnos suben imágenes muy pesadas; no deben pasar de ~2 MB y debe verse bien al descargarla para evaluar. Las fotos de celular de 4–12 MB fallaban aunque comprimidas pesaban < 1 MB.
**Discarded alternative:** bajar el tope del original (rechaza fotos normales de celular); comprimir en el servidor (más tráfico y memoria en el VPS).
