# QA funcional — versión 1 (fase 09) — 2026-11-05/06

`main @ d50568b` · slot `C:/Users/Cesar/Documents/Work/krea-wt/wt2` (detached, sin cambios de código)

**Entorno:** `http://localhost:4302` (next dev) contra emuladores Firebase `demo-krea` (Auth 9099, Firestore 8080) con el seed de `scripts/seed-emulator.ts` y las cuentas de `.env.test.local` (ESTUDIANTE_ / PROFESOR_). Alumnos extra: cuentas del seed (contraseña del seed, solo emulador). Sin B2 ni Brevo en este entorno (`.env.local` solo trae `VERCEL_OIDC_TOKEN`): subidas y correos se prueban hasta su manejo de error. Nunca se tocó la base real.
**Resultado:** 0 críticos · 2 altos · 2 medios · 4 bajos (8 hallazgos; repro 1 y 6 se escribieron como sospecha y **pasan** en main: quedan como regresión).

## Resumen
- **No debe llegar a producción sin arreglo:** (A1) si el alumno toca «Entrar» antes de que cargue el JS (móvil lento), cédula y contraseña viajan en la URL por GET (historial, logs de Vercel); en `/recuperar/nueva` pasa con la contraseña nueva y además se pierde el `oobCode`. (A2) un alumno que el profe cambia de equipo después de una entrega grupal queda en las DOS entregas de esa tarea y el ranking le suma la nota grupal dos veces.
- Reglas de Firestore sólidas (17 sondeos con token de alumno: lo ajeno 403, toda escritura 403). Permisos de las Server Actions correctos (cédula siempre de la sesión; el alumno no ejecuta acciones del profe; el no capitán no entrega; 5C no entrega tareas de 5A).
- Validación del servidor sólida en tareas, evaluación, ajustes y entregas (suma ≠ 20, pasos de 0,5, espacios, 10 000 caracteres, ids repetidos, doble envío y doble anulación simultáneos).

## Hallazgos

### [Alto] A1 — La contraseña queda en la URL si se envía el formulario antes de hidratar
- **Flujo:** W2 Ingresar y W3 `/recuperar/nueva` (también `/recuperar`, solo la cédula).
- **Pasos:**
  1. Abrir `/ingresar` con red lenta (JS aún sin cargar).
  2. Escribir cédula y contraseña y tocar «Entrar» antes de que hidrate React.
  3. Mirar la URL o el log del servidor.
- **Esperado:** no se envía nada hasta que el JS esté listo, o se envía por POST; nunca la contraseña en la URL.
- **Ocurre:** GET nativo `/ingresar?cedula=…&password=…` (el login no ocurre y el formulario se vacía). En `/recuperar/nueva?mode=resetPassword&oobCode=…` el GET reemplaza la query por `?password=…&password-repetida=…`: contraseña en la URL y enlace inservible.
- **Evidencia:** el log del dev server tiene 5 líneas `GET /ingresar?cedula=<n>&password=<x> 200`, generadas por las propias pruebas al escribir antes de hidratar, y `GET /recuperar/nueva?password=<x>&password-repetida=<x> 200`. En producción eso queda en los logs de Vercel y en el historial del teléfono.
- **Impacto:** fuga de credenciales de menores (teléfonos compartidos, logs); en la recuperación, además, el alumno pierde el enlace.
- **Dónde mirar:** `components/sections/auth/login-form.tsx:57`, `components/sections/auth/new-password-form.tsx:86`, `components/sections/auth/recover-form.tsx:57` (`<form noValidate onSubmit>` sin `method="post"` ni bloqueo previo a la hidratación). El cambio de contraseña de Perfil no está afectado (vive en un diálogo que necesita JS).
- **Para:** frontend-build
- **Reproducible:** siempre (script: `/ingresar` con el JS desactivado y `/recuperar/nueva` con los chunks de JS retrasados 20 s; última corrida: FAIL en los 2 formularios).
- **Script:** `C:/Users/Cesar/Documents/Work/krea-wt/wt2/.qa/repro/2-password-en-url-antes-de-hidratar.mjs` (FAIL en main)

### [Alto] A2 — Cambiar de equipo tras una grupal deja al alumno en dos entregas y duplica sus puntos
- **Flujo:** W8 mover alumno + W5 entrega grupal + W7 evaluar.
- **Pasos:**
  1. El profe publica una grupal de 5A (12 + 8).
  2. El capitán de 5A-G1 la entrega (la entrega guarda los integrantes de ese momento, incluido M).
  3. El profe mueve a M (no capitán de G1) a 5A-G2.
  4. El capitán de 5A-G2 entrega la misma tarea: `integrantes` se arma con quien hoy tiene `equipoId = 5a-g2`, M otra vez.
  5. El profe evalúa las dos con 20.
- **Esperado:** M figura en una sola entrega de la tarea (cuál, lo decide César: ver acciones).
- **Ocurre:** M está en `T__5a-g1` y en `T__5a-g2`; su ranking pasa de 17 a 57 (+40; una grupal de 20 con base 20 vale 20). «Mis notas» muestra solo una (`entregaDe` toma la primera), así que el desglose de Inicio no cuadra con el ranking. Además, en `/tareas/T` M ve «¡Tarea entregada!» con las respuestas del equipo viejo aunque su equipo nuevo no haya entregado.
- **Evidencia:** `{"entregasConElAlumno":["…__5a-g1","…__5a-g2"],"puntosAntes":17,"puntosDespues":57}`
- **Impacto:** ranking y premios injustos; la nota no coincide con lo que ve el alumno.
- **Dónde mirar:** `lib/firebase/entregas.ts:126-130` (integrantes por `equipoId` sin excluir a quien ya está en otra entrega de la tarea), `lib/ranking-datos.ts:37` (suma toda entrega que lo incluya), `lib/vistas-estudiante.ts:135`.
- **Para:** backend-build
- **Reproducible:** siempre
- **Script:** `C:/Users/Cesar/Documents/Work/krea-wt/wt2/.qa/repro/3-doble-grupal-al-cambiar-de-equipo.mjs`

### [Medio] M1 — Una corrección abierta antes pisa sin aviso la nota que guardó otro
- **Flujo:** W7 evaluar (dos pestañas o dos profes).
- **Pasos:** 1) La pestaña A abre `/profe/evaluar/<entrega>` (Pendiente). 2) La pestaña B guarda 20 con comentario. 3) A guarda 8.
- **Esperado:** A recibe «Otra persona cambió esta nota. Recarga…» (el copy ya existe).
- **Ocurre:** A guarda 8 con `ok: true`; la nota 20 y el comentario de B se pierden. `guardarEvaluacion` no recibe con qué versión se abrió el formulario; el chequeo `cambio` solo existe para Deshacer. Mismo patrón «el último gana» en Editar alumno.
- **Dónde mirar:** `lib/evaluar-datos.ts:52` (`zGuardarEvaluacion` sin versión base), `lib/firebase/evaluar.ts:32`.
- **Para:** backend-build (y frontend-build para mandar la versión)
- **Reproducible:** siempre
- **Script:** `C:/Users/Cesar/Documents/Work/krea-wt/wt2/.qa/repro/7-correccion-pisa-sin-aviso.mjs`

### [Medio] M2 — Dejar «Primer nombre» en blanco borra el primer nombre sin avisar
- **Flujo:** W8 Alumnos › Editar.
- **Pasos:** 1) Editar a un alumno con dos nombres (p. ej. «Génesis Julibeth», C.I. 34.125.858). 2) Borrar «Primer nombre» o dejarlo con espacios. 3) Guardar.
- **Esperado:** error en el campo («Escribe el primer nombre»), como pasa si ambos nombres quedan vacíos.
- **Ocurre:** se guarda sin error y el diálogo se cierra; el alumno pasa a llamarse «Julibeth» en su perfil y en el ranking. Igual con «Primer apellido» si hay segundo apellido.
- **Dónde mirar:** `lib/alumnos.ts:160` (valida el nombre ya unido) y `lib/alumnos.ts:177` (`unirNombre`); `components/sections/alumnos/edit-student-dialog.tsx:127`.
- **Para:** frontend-build · **Reproducible:** siempre
- **Script:** `C:/Users/Cesar/Documents/Work/krea-wt/wt2/.qa/repro/10-primer-nombre-vacio-se-pierde.mjs` (restaura el nombre al terminar)

### [Bajo] B1 — Contraseña de solo espacios aceptada
- **Pasos:** Perfil › Cambiar contraseña: actual correcta y nueva de 8 espacios → se guarda (`ok: true`). Lo mismo en `/recuperar/nueva` (usa la misma `validarPassword`).
- **Dónde mirar:** `lib/auth.ts:58` (cuenta caracteres sin exigir alguno visible).
- **Para:** backend-build · **Reproducible:** siempre
- **Script:** `C:/Users/Cesar/Documents/Work/krea-wt/wt2/.qa/repro/8-password-solo-espacios.mjs`

### [Bajo] B2 — Fecha de entrega 31/12/9999 aceptada
- **Pasos:** publicar una tarea con fecha `9999-12-31` (el constructor también acepta «31/12/9999»). Por petición directa, `2027-02-31` no se guarda pero responde `red` («No se pudo conectar») en vez de `invalida`.
- **Dónde mirar:** `lib/modelo.ts:70` (`zDia` sin rango ni día real), `lib/tareas-profe.ts:350`.
- **Para:** backend-build · **Reproducible:** siempre
- **Script:** `C:/Users/Cesar/Documents/Work/krea-wt/wt2/.qa/repro/4-fecha-anio-9999.mjs`

### [Bajo] B3 — Se puede entregar una pregunta de imagen sin haber subido nada
- **Pasos:** el alumno llama a `enviarEntrega` con un `imagenPath` inventado con el formato correcto (`entregas/<tarea>/<sha256(tarea__cédula), 32 hex>/<uuid>.jpg`) → entrega aceptada; el profe ve «Imagen no disponible».
- **Dónde mirar:** `lib/entregas.ts:184` (solo valida el formato de la ruta, no que el objeto exista en B2).
- **Para:** backend-build · **Reproducible:** siempre (requiere una petición hecha a mano)
- **Script:** `C:/Users/Cesar/Documents/Work/krea-wt/wt2/.qa/repro/5-imagen-nunca-subida.mjs`

### [Bajo] B4 — Un fallo del almacén se muestra como «Revisa tu conexión»
- **Pasos:** con B2 sin configurar o caído, el alumno sube un JPG válido → «No se pudo conectar. Revisa tu conexión e inténtalo otra vez.» (la acción respondió 200 con `error: "red"`). Logo de equipo: «No se guardó: revisa tu conexión…». El reintento funciona y «Entregar» queda bloqueado (bien).
- **Impacto:** el alumno culpa a su internet y reintenta en bucle; nadie se entera de que falta configurar B2.
- **Dónde mirar:** `lib/acciones/entregas.ts:39` y `:72`, `lib/acciones/equipos.ts:83` (mismo código `red` para «servidor sin almacén» y «sin red»).
- **Para:** backend-build + frontend-build · **Reproducible:** siempre sin `B2_*`
- **Script:** `C:/Users/Cesar/Documents/Work/krea-wt/wt2/.qa/repro/9-error-servidor-como-conexion.mjs`

### Sospechas descartadas (scripts de regresión, PASS en main)
- `repro/1-bucle-sesion-revocada.mjs`: con la cookie revocada (Salir en otro equipo) no hay bucle `/ ↔ /ingresar`; termina en un Ingresar usable.
- `repro/6-id-con-barra-500.mjs`: `/profe/evaluar/a%2Fb` y `/profe/tareas/a%2Fb` muestran el 404, aunque el servidor registra `documentPath must point to a document` desde `generateMetadata` (`lib/datos/profesor.ts:57` y `:130`): ruido en los logs, sin impacto visible.

## Lo que sí funciona (camino feliz y casos adversariales que pasaron)
- **W2:** cédula vacía, de espacios, con letras o de 6 dígitos → validación; cédula inexistente y contraseña errónea → mismo mensaje (no revela cuentas); doble clic en Entrar → un solo login; sin sesión todo está protegido (→ `/ingresar`); alumno en `/profe/*` → `/`, profe en rutas de alumno → `/profe`; cookie `__session` httpOnly + Lax; cookie manipulada → `/ingresar` y se borra.
- **W3:** `/recuperar` con cédula inválida → «Faltan dígitos…»; inexistente y real → la misma pantalla «Revisa tu correo»; `/recuperar/nueva` sin código, vacío, basura o de 3000 caracteres → «Este enlace ya venció»; con un código real del emulador → contraseña corta bloqueada, guardar → `/ingresar?aviso=password-nueva`, la otra sesión abierta se cierra, el mismo código otra vez → vencido.
- **W4:** ranking en vivo: un ajuste del profe mueve la fila del alumno en otro navegador sin recargar («subió 9 puestos») y la anulación la devuelve. Cambio de contraseña: actual errónea, menos de 8 y no coinciden bloquean; al cambiar, la sesión actual sigue y la otra va a Ingresar.
- **W5:** el borrador se restaura tras recargar; red caída al entregar → error claro, respuestas conservadas, reintento ok; doble clic en «Entregar» → 1 POST y 1 entrega; dos envíos simultáneos → 1 entrega; el no capitán ve las preguntas bloqueadas y el servidor le responde `no-capitan`; ejecutable renombrado a `.jpg`, archivo vacío y PDF rechazados con mensaje; espacios, 601 caracteres y respuestas de más rechazados; unicode (`José ñ 日本語 👨‍👩‍👧‍👦`) intacto y recortado.
- **W6:** suma 19,5 o 20,5, valor 0,25, 0 o negativo, fecha pasada, título de espacios o de 10 000, ids repetidos, 21 preguntas y enunciado de espacios → bloqueados; el borrador a medias se guarda y no se publica; en la UI «Publicar» está deshabilitado con «Falta 1»; doble clic en «Guardar borrador» → 1 tarea; con entregas solo cambian título, fecha y premio; cerrar dos veces, entregar tras cerrar y editar una cerrada → bloqueados; empate de premio: dar a un no empatado → `invalida`, dar a un empatado y luego compartir → ok, sección ajena → `sin-empate`.
- **W7:** 10,25, sobre el valor, negativo, falta una pregunta o comentario de 1001 → bloqueados; 11,5 + 7,5 = 19 y el ranking sube; «Deshacer» del toast vuelve a Pendiente, al ranking anterior y a la entrega con los puntajes marcados; Deshacer dos veces → `cambio`; radios de 0 a 4 en pasos de 0,5; doble clic en Guardar → 1 POST.
- **Ajustes (D007):** 0,25, 0, 21, motivo fuera del catálogo, «Otro» con detalle de espacios y profe, cédula o equipo inexistente → bloqueados; −1,5 mueve puntos y no toca ninguna nota; dos anulaciones simultáneas → una sola; anular una anulación → bloqueado.
- **W8:** mover por el menú del tablero funciona y revoca la sesión del alumno movido; logo PNG sin B2 → error (B4); ejecutable `.png` → «No se pudo leer la imagen».
- **Contenido:** `<script>` e `<img onerror>` en títulos, premios, respuestas, comentarios y motivos se pintan como texto; 0 `alert` disparados.

## No verificado
| Qué | Por qué no se pudo |
|---|---|
| Envío real del correo por Brevo; límite de 1/min y 3/hora por cédula | `BREVO_*` no está en este entorno y `api.brevo.com` está bloqueado; `procesarRecuperacion` ni corre sin Brevo |
| Subida real a B2, URL firmada, borrado del logo anterior | `B2_*` no está en este entorno (host bloqueado) |
| Caducidad del enlace (1 h) y de la sesión (5 días) | el emulador no permite adelantar el reloj |
| Bloqueo por intentos de login (50 seguidos) | el emulador de Auth no limita; solo Firebase real |
| Dos cuentas de profesor distintas | solo existe una; M1 se hizo con dos sesiones del mismo profe |
| Editar alumno por la UI: base sin motivo y email `a@` (lo de nombre en blanco quedó en M2), y la segunda parte del constructor (recargar el borrador, 31/02 en la UI) | la sesión de QA se cortó dos veces; scripts listos: `.qa/ui-alumnos.mjs`, `.qa/ui-builder.mjs`. Por petición directa el servidor sí lo valida |
| Sesión revocada a mitad de entregar o evaluar (¿se pierde lo escrito?) | mismo corte; script listo: `.qa/ui-sesion-vencida.mjs` |
| Reglas de Storage | el emulador de Storage no respondió en 9199; la app no usa Firebase Storage (usa B2) |

## Datos creados
Todo en los emuladores `demo-krea` (en memoria): tareas «[QA] …», entregas, evaluaciones, ajustes y anulaciones, movimientos de alumnos del seed entre equipos y, si llegó a correr `ui-sesion-vencida`, un profe de QA `10000001`. Se borra al bajar los emuladores; nada en datos reales. La cuenta de prueba del alumno se movió una vez a 5A-G1 desde el tablero y se devolvió por la app a 5A-G2 como capitana; sus contraseñas y las de las cuentas del seed que se tocaron se restauraron. Aviso para design-qa (wt3): comparte estos emuladores, así que verá tareas «[QA]» y rankings movidos, y las sesiones de la cuenta de prueba del alumno se revocaron varias veces (repro 1 y los movimientos de equipo).

## Acciones requeridas de César
1. **Decidir qué pasa con la grupal al cambiar de equipo (A2)**
   - Por qué: el arreglo depende de la regla.
   - Opciones: (a) el alumno se queda con la nota del equipo con el que entregó y no entra en la del equipo nuevo; (b) pasa al equipo nuevo y sale de la vieja si todavía no está evaluada; (c) no dejar mover alumnos mientras haya grupales abiertas.
   - Qué necesito de vuelta: a, b o c.
2. **Configurar y probar Brevo (W3)**
   - Pasos: Brevo › Senders, Domains & Dedicated IPs › Domains → verificar el dominio del remitente (DKIM/DMARC); Brevo › SMTP & API › API Keys → crear una clave. Vercel › krea › Settings › Environment Variables: `BREVO_API_KEY` y `BREVO_SENDER_EMAIL` en Production y Preview. En el preview, Alumnos › Editar al alumno 38291460 con tu correo y pedir el enlace desde `/recuperar`.
   - Qué necesito de vuelta: que llegue el correo (bandeja o spam), que el enlace abra `/recuperar/nueva`, y que un 4.º pedido en la misma hora no llegue.
3. **Confirmar B2 (W5, W8)**
   - Pasos: Backblaze › Buckets → el bucket en **Private**; Application Keys → clave limitada a ese bucket con lectura, escritura y borrado. Vercel: `B2_KEY_ID`, `B2_APPLICATION_KEY`, `B2_BUCKET_NAME`, `B2_ENDPOINT` (https) y `B2_REGION` en Production y Preview. En el preview: subir una respuesta en imagen y cambiar dos veces el logo de un equipo.
   - Qué necesito de vuelta: que la imagen se le vea al profe en Evaluar y que en el bucket quede solo el último logo.
4. **Cuentas de los demás profesores** (ya pendiente): crearlas para probar M1 con dos profes reales.
5. **Rotar la clave de la cuenta de servicio de `krea-d22f7`** (ya pendiente: se pegó en el chat).

## Feedback para el kit
| Tipo | Archivo | Clase | Regla que lo habría evitado |
|---|---|---|---|
| Prevención | reference/QA-PREVENTION.md | Formulario enviado antes de hidratar (GET nativo con la contraseña en la URL) | Todo `<form>` con campos sensibles lleva `method="post"` (o una Server Action en `action`) y el submit deshabilitado hasta hidratar; nunca solo `onSubmit` |
| Prevención | reference/QA-PREVENTION.md | Pertenencia copiada en el momento + reasignación posterior → doble conteo | Si un documento copia los miembros de un grupo, la escritura comprueba que nadie esté ya en otro documento del mismo padre; con una prueba de «mover y volver a entregar» |
| Prevención | reference/QA-PREVENTION.md | Edición concurrente que pisa la anterior (el último gana) | Toda acción que sobrescribe un recurso editable recibe la versión con que se abrió y responde «cambió» si no coincide |
| Prevención | reference/QA-PREVENTION.md | Espacios como contenido (contraseña de espacios; campo obligatorio partido en dos que se valida ya unido) | Cada campo obligatorio se valida recortado y por separado; el mínimo de contraseña exige un carácter no blanco |
| Prevención | reference/QA-PREVENTION.md | Error del servidor mostrado como «revisa tu conexión» | Separar en el tipo de error «no hay red» de «el servicio falló», con copy distinto |
| Kit (qa-local) | scripts/qa-local.ts | `firebase emulators:start` se cuelga en silencio por el aviso de actualización cuando lo lanza un agente; el `firebase-tools` local del slot falló con `chalk.blue is not a function`; el slot traía `node_modules` de antes de añadir firebase | Lanzar los emuladores con `NO_UPDATE_NOTIFIER=1` y comprobar `node_modules` contra `bun.lock` antes de empezar |
