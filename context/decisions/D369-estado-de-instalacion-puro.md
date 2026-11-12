# D369 · Data · El estado de instalación lo decide una función pura y se calcula solo en el cliente · Implemented

**Decision:** `estadoInstalacion({ standalone, iosStandalone, esIOS, hayEvento })` (`lib/instalar-pwa.ts`) devuelve `instalada | disponible | ios | no-disponible`, con prioridad en ese orden. `esDispositivoIOS` cuenta como iOS al iPad que se presenta como «MacIntel» con pantalla táctil. El hook `useInstalarPwa` arranca en `null` (servidor y primer render no muestran nada, sin desajuste de hidratación) y tras montar lee `display-mode: standalone` y `navigator.standalone`, y escucha `beforeinstallprompt` y `appinstalled`.
**Why:** la lógica pura se prueba sin DOM (`tests/unit/instalar-pwa.test.ts`); el control aparece tras montar sin ocupar espacio antes.
**Discarded alternative:** leer `navigator` durante el render (rompe la hidratación).
