# D112 · Sections · Equipos del profesor: un equipo que queda vacío se queda en pantalla con un texto · Implemented

**Decision:** si se mueve a todos los integrantes de un equipo, la tarjeta se queda (sin capitán, sin Select) con el texto «Este equipo no tiene integrantes. Asígnale alumnos desde «Sin equipo» o desde el menú de otro equipo.» y el chip de puesto intacto (los puntos son del equipo, no de sus miembros). El lienzo no dibuja este estado: el texto es provisional (fila 88 del checklist). Un equipo sin tema (dos de 5C) dice «Sin tema elegido» (provisional, ídem).
**Why:** borrar el equipo sería destructivo y no está en el handoff; conservarlo permite devolver alumnos.
**Discarded alternative:** ocultar la tarjeta vacía.
