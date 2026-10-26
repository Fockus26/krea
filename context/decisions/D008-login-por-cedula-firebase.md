# D008 · Auth · Login con cédula + contraseña sobre Firebase Auth · Pending

**Decision:** el usuario escribe su cédula (solo dígitos, 7–9); la app la traduce a un email interno `<cedula>@alumnos.krea.app` para Firebase Auth email/contraseña. El rol (estudiante/profesor) va en un custom claim. "Olvidé mi contraseña" busca el email real guardado en `usuarios/<cedula>.email` y envía el correo de restablecimiento de Firebase a esa dirección (Cloud Function).
**Why:** Firebase Auth no tiene login por documento; el email interno evita pedir un correo para entrar. La recuperación sí necesita un email real (checklist #3).
**Discarded alternative:** auth propia con tabla de contraseñas — reinventar seguridad.
