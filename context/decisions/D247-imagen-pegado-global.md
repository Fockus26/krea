# D247 · UI · Pegar una imagen sin foco en la zona solo funciona si hay una única zona vacía visible · Implemented

**Decision:** además del pegado con la zona enfocada, `ImageUpload` registra sus zonas abiertas (`vacia`/`error`, no preparando) y un único listener `paste` en `document`. Si hay exactamente una zona abierta, el foco no está en un campo de texto (`input`, `textarea`, `contenteditable`) y el portapapeles trae un archivo, ese archivo va a esa zona. Con varias zonas (tarea con varias preguntas de imagen) solo pega la que tiene el foco. Pegar texto nunca se intercepta (`preventDefault` solo si hay archivo).
**Why:** en la página de la tarea el alumno pega apenas llega, sin enfocar nada; con varias zonas elegir una al azar subiría la imagen a la pregunta equivocada. La regla `destinoDelPegado` está en `lib/image-entrada.ts` con pruebas.
**Discarded alternative:** pegado global siempre a la primera zona vacía — riesgo de respuesta en la pregunta equivocada.
