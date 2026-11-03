# D181 · Auth · Las rutas se protegen siempre, también sin Firebase configurado · Implemented

**Decision:** decisión de César (2026-11-03). Sin sesión válida, las rutas del estudiante y `/profe/**` redirigen a `/ingresar`, también en las vistas previas de Vercel. Si Firebase no está configurado nadie entra (`firebaseAdmin()` → `null` → sin sesión) y el login dice «El acceso todavía no está disponible…». Públicas: `/ingresar`, `/recuperar/**` (con sesión llevan al inicio del rol), `/salir`, las galerías internas y los archivos.
**Why:** las pantallas mostraban nombres y notas reales del Excel sin login en cada vista previa.
**Discarded alternative:** abierto mientras falten las claves — expone datos reales y una variable mal puesta en producción dejaría la app abierta.
**Open:** las galerías `/secciones`, `/componentes`, `/estados` también muestran datos reales del seed y siguen públicas (backlog, alta; fase 09 las bloquea).
