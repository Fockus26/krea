# D175 · Data · Escrituras solo en el servidor (Server Actions + Admin SDK); el cliente solo lee · Implemented

**Decision:** decisión de César (2026-11-03). Toda escritura en Firestore pasa por Server Actions con el Admin SDK: validan con zod, calculan nota y puntos y reescriben `ranking/{seccion}` en la misma transacción. Las reglas niegan cualquier escritura del cliente (también del profesor). El SDK del navegador queda para Auth y lecturas (`onSnapshot`). Storage: cerrado en W1; la unidad que suba imágenes abre lo mínimo.
**Why:** sumas exactas de 20, pasos de 0,5, roles y el ranking derivado se validan en un solo lugar con tests; funciona en el plan gratuito Spark (sin Cloud Functions).
**Discarded alternative:** escribir desde el cliente con reglas — reglas frágiles y el ranking derivado necesita Cloud Functions (plan Blaze). Contra aceptado: sin conexión no se guarda (el borrador sigue en el teléfono).
