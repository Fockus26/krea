# D334 · Ingresar · Tarjeta también bajo 768 (padding 24; 40 desde 768) y columna del formulario con `lg:px-12` · Implemented

**Decision:** el contenido de Ingresar/Recuperar deja de tocar los márgenes: bajo 1024 va dentro de la tarjeta (`p-6`, `md:p-10`) con `px-4` de ventana (a 320 px quedan 40 px a cada lado); ≥ 1024 la columna izquierda lleva `lg:px-12` y la tarjeta se quita. Reemplaza el tramo «< 768 sin tarjeta» y «≥ 1024 `p-0` pegado» de D070.
**Why:** César: «no hay padding en el contenedor, se ve todo pegado a los márgenes». Se atendieron ambos tramos sospechosos (móvil y escritorio).
**Discarded alternative:** solo tocar el tramo 768–1023 — ya tenía `p-10`, no era el problema.
