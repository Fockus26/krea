# D160 · States · El 404 y el 500 suponen la sesión por la dirección hasta la fase 07 · Superseded (D213)

**Decision:** `sesionPorRuta(pathname)` (`lib/estados.ts`): `/profe…` → profesor (avatar del profe, «Ir al inicio» → `/profe`, «Evaluar»); `/` y las rutas del estudiante → estudiante («Mis notas»); el resto → sin sesión («Iniciar sesión» en la cabecera y como segunda acción). El 404 es estático: en el servidor sale «sin sesión» y al hidratar (`useSyncExternalStore` sobre `location.pathname`) pasa a la variante del rol. El usuario de la cabecera es el de ejemplo (`lib/demo/usuarios.ts`).
**Why:** no hay sesión real hasta la fase 07 y el handoff (§5b) pide tres variantes del 404. La dirección es la mejor pista sin cookies.
**Discarded alternative:** leer `headers()`/cookies en `app/not-found.tsx` — vuelve dinámica la raíz y no hay sesión que leer todavía. **Fase 07:** sustituir por la sesión de Firebase Auth en el servidor.
