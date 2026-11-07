# D274 · Pages · «Mensaje del día» en Inicio por banda del promedio y día de Caracas · Implemented

**Decision:** `lib/mensaje-diario.ts`: bandas sin notas / raspado (< 10) / media (10–13,5) / alta (14–16,5) / excelente (17–20); índice = día del año (ISO de Caracas) módulo los mensajes de la banda (4–5 por banda). El día se lee en la página de Inicio con `diaDeInstante(Date.now())` **después** de `await datosAlumno()` (la sesión ya es dato de la petición, `connection()`), nunca en prerender (D098). `DailyMessage` va entre el saludo y las tarjetas. Textos PROVISIONAL, filas 150–153; ninguno culpa al raspado. Sin animación (W15).
**Why:** pedido 37; cambia cada día y no cada recarga.
**Discarded alternative:** elegir en el cliente con `new Date()`: parpadeo de hidratación y distinto día según el huso del dispositivo.
