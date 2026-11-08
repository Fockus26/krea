# feat/aviso-tarea-push — tanda 2026-11-08 Y4

Push del navegador (Web Push + VAPID, `web-push`) a los alumnos que lo activan en Perfil, al
publicarse una tarea (borrador/nueva → abierta, una vez, en `after()`). D335–D340.

- Tabla `push_suscripciones` + migración `drizzle/0001_push_suscripciones.sql` (escrita, NO aplicada).
- `lib/push.ts` (puro), `lib/data/push.ts` (base, PGlite), `lib/push-envio.ts` (web-push, server-only),
  `lib/acciones/push.ts`, `lib/push-cliente.ts`, `components/ui/switch.tsx`,
  `components/sections/perfil/aviso-tareas.tsx`, listeners en `public/sw.js`, `scripts/generar-vapid.ts`.
- Cerrar sesión cancela la suscripción del navegador (D339).
- Pendiente de César: generar VAPID, 3 variables en Vercel (Production + Preview), migrar `krea` y
  `krea_preview`, redeploy. QA final: alumno → Perfil → activar; profe publica una tarea de su sección.

## Filas de CONTENT_CHECKLIST (para que las añada el orquestador)

| 171 | Aviso de tarea nueva en Perfil: tarjeta «Avisos», interruptor «Avisarme cuando haya una tarea nueva», «Te llegará un aviso a este dispositivo cuando un profe publique una tarea para tu sección.» / «Solo en este dispositivo. Puedes desactivarlo cuando quieras.»; notificación: título «Nueva tarea», cuerpo = título de la tarea | `components/sections/perfil/aviso-tareas.tsx`, `lib/push.ts`, `public/sw.js` | tanda 11-08 Y4 | — | Provisional — confirmar con César |
| 172 | Aviso no disponible: «Este navegador no puede recibir avisos. En iPhone (iOS 16.4 o más), agrega KREA a tu pantalla de inicio (Compartir › Agregar a inicio) y ábrela desde ahí.» · bloqueado: «Bloqueaste los avisos de KREA en este navegador. Para activarlos, permite las notificaciones en la configuración del sitio (el ícono junto a la dirección) y vuelve a esta página.» | `aviso-tareas.tsx` | tanda 11-08 Y4 | — | Provisional — confirmar con César |
| 173 | Toasts del aviso: «Listo: te avisaremos de las tareas nuevas.» · «Avisos desactivados en este dispositivo.» · «Para recibir avisos, acepta el permiso de notificaciones.» · «No se pudo cambiar el aviso. Revisa tu internet y vuelve a intentar.» | `aviso-tareas.tsx` | tanda 11-08 Y4 | — | Provisional — confirmar con César |
