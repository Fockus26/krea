# D370 · Copy · En iPhone/iPad sin instalar, texto con pasos en vez de botón · Implemented

**Decision:** Safari de iOS no tiene `beforeinstallprompt`: en estado `ios` la tarjeta muestra el texto «toca Compartir y luego Agregar a inicio». Instalada, o en un navegador sin soporte (`no-disponible`), no se muestra nada.
**Why:** es la única vía real de instalación en iOS; ocultar el control cuando ya está instalada evita ruido.
**Discarded alternative:** mostrar siempre un botón que no funcionaría en iOS; ilustración paso a paso (más peso y copy sin aprobar).
