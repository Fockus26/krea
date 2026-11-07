# D260 · Puntos · El Historial no muestra los ajustes importados del Excel (`motivoId: "importado"`); siguen contando en los puntos · Implemented

**Decision:** `filtrarHistorial`/`historialMostrable` excluyen las filas con `motivoId === "importado"`; tampoco entran en el total de la frase del filtro ni en el estado vacío. El ajuste no se borra ni se toca en Firestore, así que los puntos del ranking no cambian.
**Why:** César: «quitar "Ajuste del Excel"» del Historial (ruido que no explica nada al profe). Alternativa descartada: borrar los documentos (cambiaría los puntos).
