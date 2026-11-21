# D504 · Layout · La 404 de una ruta dinámica con sesión se pinta dentro del shell, sin header ni `main` propios · Implemented

**Decision:** `app/(estudiante)/not-found.tsx` y `app/(profesor)/not-found.tsx` pintan `PantallaNotFound sesion=… enShell`: solo el cuerpo (código, título, línea, acciones) dentro del `<main id="contenido">` del shell. `StatusScreen` gana `enShell`; sin él sigue siendo la pantalla completa (la de `app/not-found.tsx`, para direcciones que no existen en absoluto, 500 y sin conexión).
**Why:** el `not-found.tsx` de la raíz se pintaba dentro del layout del grupo: dos `main#contenido`, un segundo encabezado con «Tu perfil» de 32 px y la barra del shell duplicada (QA v2, D-A3; WCAG 1.3.1, 2.5.8).
**Discarded alternative:** comprobar la existencia antes del Suspense para devolver HTTP 404 real: exige leer datos antes de `loading.tsx` y rompe el streaming de `cacheComponents`; el 200 sigue aceptado (D225).
