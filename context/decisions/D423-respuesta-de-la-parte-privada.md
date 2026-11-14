# D423 · Auth · La respuesta de una parte la ven solo su autor y el capitán hasta el envío · Implemented

**Decision:** la página lee todas las partes del equipo en el servidor (`partesDelEquipo`), pero `repartoVista` solo pasa al integrante la respuesta de SUS partes (de las demás, solo de quién es) y `rutasReparto` solo firma sus imágenes; el capitán recibe todas. Después del envío lo que ven todos es la entrega (como hoy). Ninguna acción devuelve respuestas ajenas.
**Why:** cada quien trabaja lo suyo; el capitán decide qué se acepta.
**Discarded alternative:** que el equipo entero vea las partes — se copiarían entre ellos y el crédito de la parte dejaría de significar algo.
