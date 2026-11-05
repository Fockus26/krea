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
| W2 | Auth: login con cédula (email interno, D008), cookie de sesión `httpOnly` (session cookie del Admin SDK), `proxy`/layout que protege `/(estudiante)` y `/profe` en el servidor, logout, límite de intentos (`bloqueado`). `qa-local`: claims `rol/seccion/equipoId` y doc `usuarios` para las cuentas de prueba (`assignRoleFirebase`) · **functional-qa** | cerrada (#49) |
| W3 | Recuperar contraseña: busca `privados/{cedula}.email`, enlace de Firebase Auth (D009; plantilla en la consola si se deja, si no Admin SDK + Brevo); misma respuesta exista o no la cédula · **functional-qa** | cerrada (#51) |
| W4 | Lecturas del estudiante: Inicio, Notas, detalle, Equipo, Ranking en vivo (`onSnapshot` de `ranking/{seccion}`, D011), Perfil (avatar/tema/acento al perfil, D015) — reemplaza `lib/demo/*` por Firestore | cerrada (#50) |
| W5 | Entregas: borrador local + enviar (individual; grupal solo el capitán, D012), respuestas en imagen a Storage (abrir `storage.rules`) · **functional-qa** | cerrada (#52) |
| W6 | Profesor — tareas: constructor (borrador, publicar con suma 20), cerrar; premios (D123–D124) | PR abierto (D199–D202) |
| W7 | Profesor — evaluar (puntos por pregunta en pasos de 0,5, comentario, recalcular ranking en transacción) y ajustes de puntos con motivo + anulación (D007, D121) · **functional-qa** | pendiente |
| W8 | Profesor — alumnos y equipos: editar nombres, base con historial (D176), mover de equipo (claims), capitán, logo (Storage). Enchufar `components/estados/errores.tsx` (D171) y la sesión real en 404/500 (D160) · cierre de la fase | pendiente |

## Números reservados (contra `origin/main`: última decisión D173, última fila 120)

| Unidad | Decisiones | Filas |
|---|---|---|
| W1 | D174–D179 | 121–122 |
| W2 | D180–D184 | 123–124 |
| W3 | D185–D188 | 125–126 |
| W4 | D189–D193 | 127–128 |
| W5 | D194–D198 | 129–130 |
| W6 | D199–D203 | 131–132 |
| W7 | D204–D208 | 133–134 |
| W8 | D209–D213 | 135–136 |

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

## Para las siguientes (lo deja W4)

- Lecturas del estudiante: `lib/datos/estudiante.ts` (Admin SDK, `cache()`); mapeo puro en
  `lib/vistas-estudiante.ts`. `/tareas` (W5) sigue en demo: los «Por entregar» de Inicio ya enlazan
  a `/tareas/<id real>`, que hoy da 404 hasta W5.
- `ranking/{seccion}.alumnos.*.semilla` existe (D191): `calcularRanking` la escribe; quien recalcule
  (W6–W8) no tiene que hacer nada más. Logos de equipo en el ranking: `src: null` hasta W8.
- `apariencia` opcional en `usuarios` (D191). `SecuritySettings.onCambiar` es async y devuelve el
  error (D192): el Perfil del profe puede reutilizar `SeguridadConectada` y las acciones de Perfil
  (no exigen rol).

## Para las siguientes (lo deja W3)

- Correos: `lib/correo/brevo.ts` (`enviarCorreo(config, correo, fetch)`, `configBrevo(env)`); el
  HTML de §5c en `lib/correo/restablecer.ts`. Nunca registrar destinatario ni enlace.
- `recuperaciones/{cedula}` (límite, solo servidor) existe en `COL`. Si W8 cambia el email de
  `privados`, el flujo lo toma solo. `/recuperar/nueva` es pública también con sesión (D188).

## Para las siguientes (lo deja W5)

- Archivos: Backblaze B2 (D194), no Firebase Storage. `almacenB2()` (`lib/almacen/b2.ts`, server-only)
  da `subir(clave, bytes, tipo)`, `urlFirmada(clave, s?)` y `borrar(clave)`; núcleo probado con
  dobles en `lib/almacen/s3.ts`. Validar imágenes con `validarImagenSubida` (`lib/almacen/imagen.ts`).
  W8 (logos): clave `logos/{equipoId}/{uuid}.jpg` (`urlsFirmadas` ya acepta `logos/`), guardar la
  ruta en `equipos.logoPath` y en `ranking.equipos.*.logoPath` en la misma transacción.
- Lectura de imágenes: `urlsFirmadas(rutas)` (`lib/datos/imagenes.ts`) firma solo lo que se pinta;
  quien llama garantiza el permiso. W7 (evaluar): firmar las imágenes de la entrega que se abre.
- Entregas: `enviarEntrega` escribe `entregada` sin tocar el ranking; W7 recalcula al evaluar.
  Permiso puro en `permisoEntrega` (`lib/entregas.ts`). Se acepta mientras la tarea esté `abierta`
  (D196): «cerrar» en W6 = sacar de `abierta`.
- `serverActions.bodySizeLimit` es `3mb` (global). `horaDeInstante(ms)` da la hora de Caracas.

## Para las siguientes (lo deja W6)

- Lecturas del profe: `lib/datos/profesor.ts` (`profesorActual`, `tareasProfe`, `entregasTodas`,
  `equiposTodos`, `conteos`; `cache`, Admin SDK). Ayudas comunes en `lib/datos/comun.ts`. El shell
  del profe ya sale de la sesión (`app/(profesor)/profe/_shell.tsx`); **el contador y los títulos de
  Evaluar siguen con `COLA` de ejemplo**: W7 los cambia (`entregas` con `estado == "entregada"`).
- Documentos de `tareas`: leer con `zTareaDoc` (un borrador a medias no valida con `zTarea`, D199).
  Una tarea cerrada es `estado: "evaluada"` (D202) y se puede seguir evaluando. W7: evaluar una
  entrega NO depende del estado de la tarea; el premio se resuelve solo (`estadoPremioSeccion`).
- Con entregas, las preguntas de una tarea no cambian (D200): W7 puede confiar en los ids.
- Panel (`lib/demo/panel.ts`) sigue en demo: es la cola y la actividad de evaluar (W7/W8).
