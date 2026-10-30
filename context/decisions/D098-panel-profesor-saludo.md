# D098 · Sections · Panel del profesor: saludo por hora como función pura (días 5–11, tardes 12–18, noches 19–4) con hora fija por estado · Implemented

**Decision:** `saludoPorHora(hora)` en `lib/panel.ts` recibe un entero 0–23 y devuelve "Buenos días" (5–11), "Buenas tardes" (12–18) o "Buenas noches" (19–4); `saludoTexto` añade ", profe". El nombre del profe es placeholder (HANDOFF §9 #6, checklist fila 53), así que se usa "profe" como el lienzo. La vista `/secciones/profe/[estado]` pasa una hora fija por estado (`manana` 9, `tarde` 15, `noche` 21, `5c` 9). La fase 05 decide el reloj del cliente.
**Why:** con `cacheComponents`, `new Date()` en el servidor rompe el prerender; la función pura se prueba en los bordes 4/5, 11/12 y 18/19. Los cortes son el criterio conservador habitual (la medianoche cuenta como noche).
**Discarded alternative:** leer la hora en el componente con `useEffect` — habría desajuste servidor/cliente y no se puede ver cada saludo en una ruta estática.
