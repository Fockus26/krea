# D541 · Components · «Cerrar sesión» no lleva «Sin conexión»: es un enlace a /salir y no se bloquea · Implemented

**Decision:** «Cerrar sesión» (menú, Perfil › Seguridad, `crear-password`) es un enlace/navegación a `/salir` (D182), no un botón de envío: no usa `BotonEnLinea`. Una vez en `/salir`, la página vacía lo guardado en el dispositivo (páginas, avisos) y vuelve a Ingresar aunque `cerrarSesion()` falle (su `finally`). Si el navegador puede cargar `/salir` sin red no se midió: va al QA final.
**Why:** bloquearlo dejaría una sesión abierta en un teléfono compartido justo cuando no hay red; salir del dispositivo no necesita al servidor. Queda como hueco conocido: sin red `cerrarSesion()` no llega al servidor y la cookie sigue viva hasta que expire o se vuelva a salir con red (a revisar en QA).
**Discarded alternative:** deshabilitar el enlace sin red — peor para el caso de un teléfono prestado.
