# D337 · Data · VAPID en tres variables; sin cualquiera, Perfil no ofrece el aviso y publicar no envía nada · Implemented

**Decision:** `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (pública), `VAPID_PRIVATE_KEY` (SECRETA, solo servidor) y `VAPID_SUBJECT` (`mailto:` del remitente). `configPush(env)` exige las tres; sin ellas la tarjeta «Avisos» no se pinta, `suscribirPush` responde `{ ok: false }` y `programarAvisoTarea` no programa nada, sin errores. `bun scripts/generar-vapid.ts` imprime un par nuevo (César lo corre en su terminal). El par no se rota sin motivo: cambiarlo obliga a cada alumno a reactivar el aviso (el cliente reintenta una vez quitando la suscripción vieja).
**Why:** la app tiene que andar igual en un clon limpio, en `next dev` y en una vista previa sin las claves (como Brevo, D185).
**Discarded alternative:** mostrar la tarjeta explicada como «no disponible» sin claves (copy que el alumno no puede resolver; es un asunto de configuración).
