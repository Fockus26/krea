# D520 · A11y · `CedulaInput` acepta `autoComplete`; `off` en los formularios del profesor · Implemented

**Decision:** por defecto sigue `username` (login, recuperar). En «Añadir alumno» y «Profesor» (cédula de otra persona) va `off`, para que el navegador no ofrezca autocompletar la cédula del propio profe.
**Why:** `username` es correcto solo cuando la persona escribe su propia cédula.
**Discarded alternative:** quitar `autoComplete` del componente — rompe el gestor de contraseñas en el login.
