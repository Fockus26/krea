# D187 · Auth · Límite de envíos del enlace por cédula en `recuperaciones/{cedula}` (1 por minuto, 3 por hora) · Implemented

**Decision:** antes de generar el enlace, una transacción del Admin SDK sobre `recuperaciones/{cedula}` (`{ envios: number[] }`, solo servidor; las reglas la niegan por omisión) guarda el instante de cada envío y lo impide si hubo uno hace menos de 60 s (`REENVIO_SEGUNDOS`) o ya hay 3 en la última hora (`LIMITE_RECUPERAR`, `reservarEnvio` en `lib/recuperar.ts`). Solo se escribe para cédulas con email. En el límite no se envía nada y la respuesta es la misma (D186).
**Why:** el bloqueo de W2 es el de Firebase Auth para el login (`auth/too-many-requests`) y no cubre este flujo; sin límite cualquiera podría llenarle el buzón a un alumno o gastar la cuota de Brevo.
**Discarded alternative:** límite por IP — en Vercel la IP llega por cabecera y varios alumnos comparten la del liceo. Reutilizar `bloqueado` de W2 — no existe como dato propio (es de Firebase).
