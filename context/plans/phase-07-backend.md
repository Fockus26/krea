# Fase 07 — Backend · plan de unidades

> Escrito el 2026-11-03 (sesión cloud). Fase: `phases/07-BACKEND.md` (adaptada: Firebase, sin
> pagos ni migraciones SQL). Decisiones de César del 2026-11-03: escrituras solo en el servidor
> (D175), base por alumno con historial (D176), base por integrante en grupales (D177).
> **Sin QA hasta el final** (César): los `functional-qa` de los flujos de riesgo quedan como «QA
> pendiente» para la fase 09, igual que el servidor (sin servidor, solo build). En la nube: unidades una tras otra (PR → CI → squash). Emuladores: hay Java en el
> contenedor; `bun run test:rules` y `bun run seed:emulator` funcionan.

## Unidades

| # | Unidad · qué | Estado |
|---|---|---|
| W1 | Modelo de datos y conexión: `lib/modelo.ts` (zod), `lib/ranking-datos.ts`, seed del emulador, reglas de Firestore + pruebas (job `rules` en CI), clientes `lib/firebase/*`, `.env.example` (D174–D177) | cerrada (#48) |
| W2 | Auth: login con cédula (email interno, D008), cookie de sesión `httpOnly` (session cookie del Admin SDK), `proxy`/layout que protege `/(estudiante)` y `/profe` en el servidor, logout, límite de intentos (`bloqueado`). `qa-local`: claims `rol/seccion/equipoId` y doc `usuarios` para las cuentas de prueba (`assignRoleFirebase`) · **functional-qa** | PR |
| W3 | Recuperar contraseña: busca `privados/{cedula}.email`, enlace de Firebase Auth (D009; plantilla en la consola si se deja, si no Admin SDK + Brevo); misma respuesta exista o no la cédula · **functional-qa** | pendiente |
| W4 | Lecturas del estudiante: Inicio, Notas, detalle, Equipo, Ranking en vivo (`onSnapshot` de `ranking/{seccion}`, D011), Perfil (avatar/tema/acento al perfil, D015) — reemplaza `lib/demo/*` por Firestore | pendiente |
| W5 | Entregas: borrador local + enviar (individual; grupal solo el capitán, D012), respuestas en imagen a Storage (abrir `storage.rules`) · **functional-qa** | pendiente |
| W6 | Profesor — tareas: constructor (borrador, publicar con suma 20), cerrar; premios (D123–D124) | pendiente |
| W7 | Profesor — evaluar (puntos por pregunta en pasos de 0,5, comentario, recalcular ranking en transacción) y ajustes de puntos con motivo + anulación (D007, D121) · **functional-qa** | pendiente |
| W8 | Profesor — alumnos y equipos: editar nombres, base con historial (D176), mover de equipo (claims), capitán, logo (Storage). Enchufar `components/estados/errores.tsx` (D171) y la sesión real en 404/500 (D160) · cierre de la fase | pendiente |

## Números reservados (contra `origin/main`: última decisión D173, última fila 120)

| Unidad | Decisiones | Filas |
|---|---|---|
| W1 | D174–D179 | 121–122 |
| W2 | D180–D184 | 123–124 |
| W3 | D185–D188 | 125–126 |

## Para las siguientes (lo deja W1)

- Escribir SIEMPRE con `firebaseAdmin()` (`lib/firebase/admin.ts`, `server-only`) y recalcular
  `ranking/{seccion}` con `calcularRanking` en la misma transacción. Validar con los esquemas de
  `lib/modelo.ts` (ya hacen `trim`, pasos de 0,5, suma 20, año de 4 cifras).
- Al cambiar sección o equipo de un alumno: actualizar sus custom claims (`claimsDe`) y revocar
  tokens, o las reglas le seguirán mostrando lo viejo.
- `qa-local.ts` crea cuentas con el claim `role` y uid aleatorio: W2 adapta `assignRoleFirebase`
  (uid = cédula + `rol`/`seccion`/`equipoId` + doc `usuarios`).
- Los tests de reglas van en `tests/rules/` (fuera de `test`/`test:related`; los corre el job
  `rules` de CI con Java).

## Para las siguientes (lo deja W2)

- Páginas y acciones con datos: `exigirSesion(rol)` de `lib/dal.ts` (revocación incluida); nunca el
  uid del body. El proxy (`proxy.ts`) es solo la comprobación rápida.
- Los shells aún muestran `USUARIO_ESTUDIANTE`/`USUARIO_PROFESOR` de ejemplo: W4 los cambia por el
  usuario de la sesión (con `<Suspense>`: `cacheComponents` está activo).
- Pruebas que necesitan Auth: `tests/rules/` (corren con `--only auth,firestore`).
