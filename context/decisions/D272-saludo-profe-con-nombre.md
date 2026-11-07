# D272 · Pages · Saludo del Panel: «Buenos días, profe César» = `profe` + primer nombre de la sesión · Implemented

**Decision:** `nombreSaludoProfe(nombres)` (`lib/panel.ts`) arma «profe <primer nombre>» con `usuarios/{cedula}.nombres` del profe en sesión (`profesorActual()`); sin nombre queda «profe». `PanelConHora` recibe `nombre` y lo pasa a `saludoTexto(hora, nombre)`. La hora sigue siendo la de D133/D098.
**Why:** pedido 25 de César. El nombre llega por props desde la página (dato de la petición), así que no cambia el prerender ni la hidratación.
