# D327 · Backend · Firebase → Postgres del VPS con Better Auth · In progress (cutover pendiente)

**Decision:** KREA deja Firestore y Firebase Auth (pedido de César, 2026-11-07; kit `tech/migrate-firebase-vps.md`). Base: Postgres en el VPS (`krea` producción, `krea_preview` Vercel Preview, `krea_dev` desarrollo), Drizzle con `pg`, migraciones en `drizzle/`. Sesión: Better Auth dentro de la app (`/api/auth/*`, cookie httpOnly `krea.session_token`, 5 días, límite de intentos en la base, sin registro público). Datos: **no se migran**; solo los profesores, con su contraseña.

- **Modelo:** una tabla por colección con el mismo id; lo que se filtra en columnas y lo anidado (preguntas, respuestas, evaluación, filas del ranking, decisiones de premio) en `jsonb`, validado con los esquemas de `lib/modelo` al leer (`lib/data/filas.ts`). `privados` es la columna `usuarios.email_recuperacion`. `user.id` = cédula (D008); `usuarios.cedula` → `user.id` en cascada.
- **Reglas → código:** el navegador ya no lee la base. Lecturas del servidor en `lib/datos/*` detrás de `exigirSesion` con consultas por sesión; las dos rutas que el navegador consulta (`/api/ranking/[seccion]`, `/api/presencia`) usan `lib/acceso.ts`, con prueba.
- **Claims → perfil:** rol, sección, equipo, admin y contraseña temporal se leen de `usuarios` en cada request (`lib/data/sesion.ts`). Mover a un alumno de equipo ya no le cierra la sesión (antes solo hacía falta para refrescar los claims, D210).
- **Transacciones:** cada escritura que recalcula el ranking toma el turno de la sección (`SELECT … FOR UPDATE` sobre su fila de `ranking`); las entregas, el de su tarea. Sustituye al reintento de Firestore. Borrar un alumno borra su cuenta en la misma transacción: ya no queda «a medias».
- **Tiempo real:** sondeo cada 5 s (`lib/sondeo.ts`) en vez de `onSnapshot`; el ranking responde 204 si no cambió.
- **Contraseñas:** hashes de Firebase importados como `firebase$<hash>$<salt>` y verificados con su scrypt (`FIREBASE_HASH_*`); al cambiarla pasan al formato de Better Auth. Recuperar: el código lo genera Better Auth y el correo sigue saliendo por la API de Brevo con la plantilla de la app (no SMTP: ya estaba configurado, D185).
- **Archivos:** sin cambio (Backblaze B2, D194).

**Rollback:** el proyecto Firebase `krea-d22f7` queda 30 días sin tocar después del cutover; volver = revertir el merge en Vercel (las variables de Firebase siguen allí hasta entonces). Borrarlo es acción de César.

**Why:** pedido de César: todo en el VPS central, sin depender de Firebase.
**Discarded alternative:** migrar todos los datos (César: se borran todos menos los profesores); SSE para el ranking (conexiones largas en Vercel, más código, sondeo alcanza); SMTP de Brevo (pide una clave nueva y la API ya funciona); tablas normalizadas para preguntas y respuestas (rediseño grande sin consulta que lo pida).
