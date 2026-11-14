# D385 · Components · Anterior, Saltar, Guardar y «entrega i de n» siguen la cola filtrada · Implemented

**Decision:** `/profe/evaluar/[entrega]?…filtros` calcula posición, vecinos, «Sigue: …» y `guardarHref` sobre la cola filtrada (`colaFiltradaCon`: si la entrega abierta está por evaluar pero no cumple el filtro, se queda en la cola para no perder el sitio). Todos los enlaces conservan la query; al terminar la cola filtrada, Guardar lleva a la cola con los mismos filtros (vacío «No hay entregas con esos filtros»). Línea «Filtro: Grupales · 5A» con «Cambiar» en la cabecera. La topbar móvil de una entrega queda en «Evaluar entrega» (antes «Entrega n de m» de la cola global, que ya no coincidiría): la posición la dice el eyebrow, visible en todos los anchos.
**Why:** coherencia: si se filtra, el recorrido se queda dentro del filtro.
**Discarded alternative:** que la topbar móvil lea la query (el shell está cacheado y no ve los `searchParams`).
