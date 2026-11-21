# D536 · Push · El aviso de parte entregada no tiene preferencia propia: lo recibe quien ya tiene activado el aviso · Implemented

**Decision:** no existe preferencia por tipo de aviso (Perfil tiene un solo interruptor que guarda la suscripción del navegador). El capitán recibe el aviso de parte en los navegadores donde ya activó el de tarea nueva; sin suscripción, no pasa nada. No se crea columna ni interruptor nuevo.
**Why:** una preferencia por tipo pide migración e interfaz y la tanda reservó «no la crees, dilo». El que no quiera avisos los apaga todos en Perfil.
**Discarded alternative:** interruptor «Avisarme de partes entregadas» en Perfil con columna en `push_suscripciones`: más fino, pero cambia el esquema y el diálogo por un caso de un solo capitán por equipo. Queda para pedirlo si los capitanes se quejan de ruido.
