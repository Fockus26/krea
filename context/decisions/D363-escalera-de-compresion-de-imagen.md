# D363 · Components · Escalera de compresión de imagen · Implemented

**Decision:** `COMPRESSION_STEPS` / `nextCompressionStep(intento)` (puros, probados): 1600 px con calidad 0,8 → 0,7 → 0,6 → 0,5; si aún no cabe, 1400 px/0,7 → 1200/0,6 → 1000/0,5. `compressImage` decodifica el archivo una sola vez (`createImageBitmap`, orientación EXIF) y reescala en canvas por intento, con fondo blanco para PNG con alfa; se detiene en el primer resultado ≤ 1,5 MB o devuelve el último paso.
**Why:** conserva resolución (1600 px, se ve bien al descargar) y solo sacrifica calidad/lado cuando hace falta. Decodificar una vez evita repetir el costo en teléfonos modestos.
**Discarded alternative:** decodificar con `resizeWidth/resizeHeight` para ahorrar memoria en fotos de 48 MP: exige conocer las dimensiones antes (otra decodificación) y la orientación EXIF no es fiable entre navegadores; se deja como mejora si aparecen fallos de memoria.
