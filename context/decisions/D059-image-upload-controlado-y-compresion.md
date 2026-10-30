# D059 · Components · ImageUpload controlada: valida y comprime en cliente, emite `onSelect(blob)`, no sube · Implemented

**Decision:** `ImageUpload` recibe `status` (`vacia`/`subiendo`/`lista`/`error`), `file`, `progress`, `error` y emite `onSelect(blob, {name, originalSize})` ya validado y comprimido, `onReject(mensaje)` y `onRemove`. `lib/image.ts` tiene la validación (JPG/PNG, ≤ 5 MB), `targetSize` (lado mayor 1600, sin agrandar), `formatFileSize` y `compressImage` (`createImageBitmap` + canvas → JPEG 0,8, EXIF respetado, PNG sobre blanco), aislada porque necesita DOM. El `<input type="file">` va `hidden` y lo abre un `<button>` real. La vista previa de un `Blob` usa `URL.createObjectURL` con `revokeObjectURL` al cambiar o desmontar. La subida a Storage es de la fase 07.
**Why:** presentación sin Firebase; la lógica de decisión (tipo, peso, tamaño) es pura y probada.
**Discarded alternative:** que el componente suba el archivo — acopla a Storage antes de la fase 07.
