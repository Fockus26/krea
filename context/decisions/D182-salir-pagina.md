# D182 · Auth · «Salir» es la página /salir: cierra Firebase en el navegador, borra la cookie y revoca los tokens · Implemented

**Decision:** el menú del profe y Perfil (los dos roles) llevan a `/salir`, una página que al montar hace `signOut` del SDK del navegador y la Server Action `cerrarSesion` (borra `__session` y `revokeRefreshTokens`: la sesión se cierra en todos los equipos) y vuelve a `/ingresar`.
**Why:** los componentes ya navegan con `salirHref` (D135); una página con efecto no se ejecuta con el prefetch de un enlace, y la acción es POST con chequeo de origen (sin CSRF de un GET).
**Discarded alternative:** Route Handler GET que borre la cookie — lo dispararía el prefetch o un enlace externo.
