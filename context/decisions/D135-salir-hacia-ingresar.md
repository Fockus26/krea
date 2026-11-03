# D135 · Pages · «Cerrar sesión» del Menú del profe enlaza a `/ingresar` (`salirHref`) mientras no hay sesión · Implemented

**Decision:** `MenuSheet` y `TopBar` aceptan `salirHref?`; con él «Cerrar sesión» es un `<Link>` (misma clase, dentro de `SheetClose`) que además llama a `onSignOut` si existe. `app/(profesor)/profe/layout.tsx` pasa `salirHref="/ingresar"` a `RouteTopBar`. El estudiante no tiene «Cerrar sesión» en el shell (está en Perfil, fuera de esta unidad). Nada de sesión ni cookies: la fase 07 cablea `onSignOut` y puede quitar el enlace.
**Why:** el botón no tenía destino; ahora cierra la hoja y lleva a la pantalla de ingreso, que es lo que ve quien sale.
**Discarded alternative:** `router.push` dentro de un `onSignOut` en el layout — un layout de servidor no puede pasar funciones a un componente cliente. Cambiar el botón siempre a enlace — rompe `/componentes`, que cuenta las pulsaciones.
