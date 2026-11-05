# D009 · Email · Solo el correo de restablecer contraseña · Superseded in part by D185 (envío con Brevo desde la app)

**Decision:** v1 envía un único correo (restablecer contraseña) con la plantilla de Firebase Auth, personalizada con el nombre KREA. Si la consola no deja editar la plantilla, se envía desde una Cloud Function con Brevo SMTP y el diseño del brief.
**Why:** es el único correo que pidió César.
