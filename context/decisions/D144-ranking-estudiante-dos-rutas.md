# D144 · Pages · Ranking del estudiante en dos rutas (`/ranking` y `/ranking/equipos`); «Cerrar sesión» de Perfil → `/ingresar` · Implemented

**Decision:** las pestañas Estudiantes | Equipos son enlaces entre rutas (D095): `/ranking` (estudiantes) y `/ranking/equipos`, ambas con la misma sección 5A y la fila «tú» de Yeilin Duarte (D069) desde `app/(estudiante)/ranking/_ranking.tsx`. El chip «En vivo» móvil lo pone la topbar (`subrutas: true`, D128). `/perfil` pasa `salirHref="/ingresar"` a `SecuritySettings`, igual que el profe (D135). `/equipo` decide con y sin equipo por los datos.
**Why:** cada estado es una URL compartible y el botón atrás recorre las pestañas; el estudiante no ve el ranking de 5C (solo su sección).
**Discarded alternative:** una sola ruta con `?vista=equipos` — las pestañas del catálogo ya son rutas (D095) y la topbar usa `subrutas`.
