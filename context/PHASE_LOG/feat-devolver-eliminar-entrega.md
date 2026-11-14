# feat/devolver-eliminar-entrega — 2026-11-14 · ola 3 · X1

«Devolver al alumno» y «Eliminar entrega» (pedidos 9 y 10), PR #148, D411–D415, filas 218–222.
Transacciones nuevas en `lib/data/devolver-entrega.ts` (sección bloqueada, `FOR UPDATE`, ranking
recalculado en la misma transacción); las imágenes se borran de B2 después del commit. UI en la
lista de entregas por tarea (menú) y en Evaluar (botones). Sin migración. Eliminar no llama
`refresh()` en el servidor: el cliente hace push a la cola y luego refresh (D413).
Sin verificar en navegador: foco menú → diálogo → botón; eliminar desde Evaluar sin 404 fugaz.
