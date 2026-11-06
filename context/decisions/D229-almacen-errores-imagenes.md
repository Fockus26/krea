# D229 · Data · Los fallos de B2 tienen su propio error y una imagen nunca subida no se entrega · Implemented

**Decision:**
- **Error `almacen`:** existe en la subida de respuestas, en el envío y en el logo de equipo. Cubre B2 sin configurar, caído o que rechaza, y se registra en el log del servidor (`almacén sin configurar…`). El copy dice que el problema es del portal y no de la conexión. `red` queda para cuando falla la red del cliente (la acción no llega).
- **Comprobación al enviar:** `enviarEntrega` comprueba con `HEAD` firmado (`Almacen.existe`) que cada `imagenPath` exista en B2, mediante `comprobarImagenes` (pura y con pruebas). Si falta alguna, responde `imagen-falta` («Súbela otra vez…»). La comprobación va fuera de la transacción, porque B2 es otro servicio.
- El copy es provisional (CONTENT_CHECKLIST filas 129 y 135).

**Why:** QA de la versión 1:
- **F-B4:** sin `B2_*`, el alumno veía «Revisa tu conexión» y reintentaba en bucle, y nadie se enteraba de que faltaba configurar B2.
- **F-B3:** una ruta inventada con el formato correcto se aceptaba, y el profe veía «Imagen no disponible».
