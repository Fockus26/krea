# D368 · Components · Botón «Instalar KREA» dentro de la tarjeta Avisos de Perfil · Implemented

**Decision:** la tarjeta «Avisos» (D340) muestra, encima del interruptor, una línea breve y el botón secundario «Instalar KREA» cuando el navegador entregó `beforeinstallprompt` (Chrome/Edge). El botón llama `prompt()` y espera `userChoice`. Solo en Perfil › Avisos, sin franja en Inicio.
**Why:** instalar la app ayuda a que los avisos funcionen (sobre todo en iPhone) y el alumno ya está en el lugar donde decide sobre los avisos.
**Discarded alternative:** franja o banner en Inicio (ruido en la pantalla principal; César eligió solo Avisos).
