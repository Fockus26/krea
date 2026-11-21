# QA funcional — versión 2 (QA final) — 2026-11-21

`main @ b9f51c9` · slot `C:/Users/Cesar/Documents/Work/krea-wt/wt2` (rama `qa/version-2-funcional`, sin cambios de código)

**Entorno:** `http://localhost:4392` — build de producción (`next build` + `next start`) contra Postgres local en Docker (contenedor `qa-krea-pg`, base `qa_4302`, migraciones 0000–0007 + `scripts/seed-db.ts`, datos ficticios del seed). Nunca la base real ni el VPS. B2, Brevo, Anthropic y Firebase neutralizados (variables a un espacio: el código las toma como «sin configurar»): no salió nada a servicios externos.
Por qué no 4302 ni `qa:local`: el 4302 lo ocupaba desde el inicio el servidor de otro proyecto (`maranatha-wt/wt2`), que no toqué; y `qa:local --postgres` no sirve en este proyecto (ver «Feedback para el kit»): se usó `--db-only` para la base y un lanzador propio (`.qa/v2/server.mjs`). El `next dev` inicial era inutilizable (compactación de la caché de Turbopack de 13 min con la máquina saturada por otros servidores), por eso el build de producción.
Cuentas: `ESTUDIANTE_*` (5A, capitana de 5a-g2) y `PROFESOR_*` (admin) de `.env.test.local`; alumnos del seed con la contraseña del seed (solo local); un segundo profe `10000002` creado con `crearProfesor` para los casos de dos profes.
**Resultado:** 0 críticos · 1 alto · 3 medios · 2 bajos.

## Resumen
- **No debería llegar así a producción (A1):** el bloqueo de 5 fallos por cuenta se salta por completo mandando el login como `application/x-www-form-urlencoded` (Better Auth lo acepta y la ruta solo lee el email de un JSON), y también en ráfaga paralela (18 de 30 contraseñas evaluadas). Solo queda el límite por IP (300 cada 5 min). Junto con M1 (cualquier alumno obtiene la cédula de todos los de su sección), un compañero puede probar contraseñas de cualquier cuenta sin freno por cuenta.
- La migración a Postgres/Better Auth quedó sólida en lo que más importa: permisos por rol y capitán, IDOR (otra sección, ids ajenos, alumno llamando acciones del profe), validación de servidor (suma 20, pasos de 0,5, bases 10–20, enlaces solo http/https), concurrencia (`cambio`, `editada`, doble envío, doble anulación), ranking y reparto en vivo, cola sin conexión, recuperar con código, y todas las regresiones de la versión 1 pasan.
- Lo demás es presentación y accesibilidad (M2 «Pendiente» en una tarea ya evaluada; M3 foco perdido al cerrar los diálogos de Evaluar) y dos casos de «el último gana» de severidad baja.

## Hallazgos

### [Alto] A1 — El bloqueo de login por cuenta se salta (cuerpo form-urlencoded y ráfaga paralela)
- **Flujo:** Ingresar (`POST /api/auth/sign-in/email`).
- **Pasos:**
  1. Mandar 12 intentos con contraseña errónea a una misma cuenta con `Content-Type: application/x-www-form-urlencoded` y cuerpo `email=<cédula>@alumnos.krea.app&password=<x>`.
  2. Mirar `rate_limit` (`fallos|<email>`) y mandar después la contraseña buena por el mismo camino.
  3. Por separado: 30 intentos JSON con contraseña errónea en paralelo.
- **Esperado:** desde el 5.º fallo, 429 «Demasiados intentos. Espera 5 minutos.» en los dos casos.
- **Ocurre:** (1) los 12 dan 401 (contraseña evaluada), el contador queda en 0 y la buena entra con 200: sin límite por cuenta. (3) 18 de 30 se evalúan (401) antes de que se registre el primer fallo; los otros 12 dan 500 por el pool (ver «No verificado»).
- **Evidencia:** `{"formA":[401 ×12],"filaFallosTrasForm":0,"formConBuena":200,"rafagaParalela":{"401":18,"429":0}}`.
- **Impacto:** fuerza bruta contra cuentas de menores limitada solo por el límite por IP (300 / 5 min y por IP). El usuario (cédula) lo tiene cualquier compañero (M1).
- **Dónde mirar:** `app/api/auth/[...all]/route.ts:41-56`: el email sale de `req.clone().json()`; si el cuerpo no es JSON queda `""` y va directo a `h.POST(req)` sin `cuentaBloqueada` ni `registrarFallo`. Además `cuentaBloqueada` → `h.POST` → `registrarFallo` es comprobar-y-luego-actuar: reservar el intento antes, en una sola sentencia atómica, y rechazar si ya pasó el tope. Lo simple para lo primero: 415 a todo `sign-in` que no sea `application/json`.
- **Para:** backend-build
- **Reproducible:** siempre (la parte paralela depende de la carga, pero en las dos corridas pasó de 5)
- **Script:** `C:/Users/Cesar/Documents/Work/krea-wt/wt2/.qa/repro/v2-01-bloqueo-login-saltable.mjs <base>` (sin `--env-file`; limpia `rate_limit` al terminar) — FAIL en main.

### [Medio] M1 — Cualquier alumno recibe la cédula de todos sus compañeros de sección
- **Flujo:** Ranking (`/ranking` y el sondeo `/api/ranking/<sección>`).
- **Pasos:** 1) Entrar como alumno de 5A. 2) `GET /api/ranking/5A` (o ver el HTML de `/ranking`).
- **Esperado:** filas identificadas sin la cédula (D388 sacó la cédula de la semilla del avatar porque «cualquiera que viera un avatar tenía la cédula»).
- **Ocurre:** `alumnos` es un objeto con la cédula como clave: 34 cédulas ajenas en la respuesta, las mismas 34 en el HTML de `/ranking`.
- **Impacto:** dato personal de menores a la vista de toda la sección; es además el usuario de ingreso (con A1, la mitad de la credencial de todos).
- **Dónde mirar:** `lib/data/ranking.ts` / `lib/ranking-datos.ts` (ranking por sección indexado por cédula) y `app/api/ranking/[seccion]/route.ts` (lo entrega tal cual); el ranking del cliente.
- **Para:** backend-build (+ frontend-build). Decisión de César: ver «Acciones».
- **Reproducible:** siempre
- **Script:** `C:/Users/Cesar/Documents/Work/krea-wt/wt2/.qa/repro/v2-02-ranking-expone-cedulas.mjs <base>` (con `--env-file=.env.test.local`) — FAIL en main.

### [Medio] M2 — Una tarea ya evaluada muestra cada pregunta como «Pendiente · vale N»
- **Flujo:** Alumno › Tareas › `/tareas/<tarea>` de una entrega evaluada.
- **Pasos:** 1) El alumno entrega una tarea de 12 + 8. 2) El profe la evalúa (11 y 7,5). 3) El alumno abre o recarga `/tareas/<tarea>`.
- **Esperado:** «11 / 12» y «7,5 / 8», o al menos sin «Pendiente» (D003: Pendiente = nota `null`).
- **Ocurre:** arriba «Tu profe ya la evaluó. Mira tu nota…» y en «Respuestas enviadas» cada pregunta dice «Pendiente · vale 12» / «Pendiente · vale 8». Individuales y grupales.
- **Impacto:** mensaje contradictorio en la pantalla que el alumno abre al enterarse de que lo evaluaron; la acción principal del portal es entender la nota pregunta a pregunta.
- **Dónde mirar:** `app/(estudiante)/tareas/[tarea]/page.tsx:208` (`obtenido={null}` fijo); `lib/question.ts:30-33` convierte `null` en «Pendiente · vale».
- **Para:** frontend-build
- **Reproducible:** siempre
- **Script:** `C:/Users/Cesar/Documents/Work/krea-wt/wt2/.qa/repro/v2-03-pendiente-en-tarea-evaluada.mjs <base>` (con `--env-file`; crea su tarea) — FAIL en main.

### [Medio] M3 — Al cerrar «Eliminar entrega» / «Devolver al alumno» en Evaluar, el foco se va a `<body>`
- **Flujo:** Profe › `/profe/evaluar/<entrega>` (variante de botones de `AccionesEntrega`).
- **Pasos:** 1) Tab hasta «Eliminar entrega» (o «Devolver al alumno») y Enter. 2) El foco entra bien al diálogo («Cancelar»). 3) Escape, o Enter en «Cancelar».
- **Esperado:** el foco vuelve al botón que abrió el diálogo (WCAG 2.4.3).
- **Ocurre:** `document.activeElement` = `BODY` tras Escape y tras Cancelar: con teclado se vuelve al principio de la página. En la lista (variante menú) sí vuelve a «Más acciones».
- **Dónde mirar:** `components/sections/evaluar/acciones-entrega.tsx:228-241`: `Dialog` controlado sin `DialogTrigger`; `onCloseAutoFocus` solo devuelve el foco si `desdeMenu`. Guardar una ref al botón pulsado y enfocarlo ahí.
- **Para:** frontend-build
- **Reproducible:** siempre
- **Script:** `C:/Users/Cesar/Documents/Work/krea-wt/wt2/.qa/repro/v2-04-foco-perdido-dialogo-evaluar.mjs <base>` (con `--env-file`) — FAIL en main.

### [Bajo] B1 — Un reenvío del capitán pisa la respuesta aceptada de un integrante (y la parte sigue «aceptada»)
- **Flujo:** grupal por partes ya enviada, sin evaluar.
- **Pasos:** 1) El capitán asigna h2 a un integrante; este la entrega; el capitán la acepta. 2) El capitán envía: h2 queda con el texto del integrante (bien, D463). 3) El capitán reenvía (Editar entrega, o un segundo `enviarEntrega` que llega mientras se procesa el primero) con otro texto en h2.
- **Esperado:** según el «Why» de D463 («el servidor es la fuente de lo aceptado: un teléfono con una versión vieja podría mandar otra respuesta en nombre del integrante»), lo aceptado se mantiene, o la parte deja de figurar como aceptada.
- **Ocurre:** h2 queda con el texto del capitán y la fila de `partes` sigue `aceptada` con el del integrante. Por la UI el capitán puede reescribirla en «Editar entrega» (el campo viene editable); D419 lo permite («el capitán edita la entrega enviada como siempre»): es más decisión que error.
- **Dónde mirar:** `lib/data/entregas.ts:262-295` (`repartoParaEnviar` solo con `m.modo === "nueva"`).
- **Para:** backend-build, tras la decisión de César (ver «Acciones»).
- **Reproducible:** siempre
- **Script:** `C:/Users/Cesar/Documents/Work/krea-wt/wt2/.qa/repro/v2-05-reenvio-pisa-parte-aceptada.mjs <base>` (con `--env-file`) — FAIL en main.

### [Bajo] B2 — Opciones de ajuste: editar con la lista vieja abierta pisa sin aviso el cambio del otro profe
- **Flujo:** Profe › Puntos › opciones de ajuste, dos profes.
- **Pasos:** 1) Profe 1 y profe 2 abren la lista. 2) Profe 1 edita «Trabajo extra» → ok. 3) Profe 2, con la lista de antes, edita la misma opción → ok.
- **Esperado:** el segundo recibe «otra persona cambió esta opción» (como `cambio` en Evaluar y Editar alumno, D224/D276).
- **Ocurre:** los dos `ok`; queda la del profe 2 y el cambio del profe 1 se pierde sin aviso. (Borrar una opción mientras otro aplica un ajuste con ella sí está bien: `motivo`.)
- **Dónde mirar:** `lib/acciones/motivos.ts` (`zEditar` sin versión) y `lib/data/motivos.ts` (`operarMotivosEnTransaccion`).
- **Para:** backend-build (+ frontend-build para mandar la versión)
- **Reproducible:** siempre (el script no distingue «lista vieja» de «edición posterior»: el servidor no recibe con qué versión se abrió, que es el problema)
- **Script:** `C:/Users/Cesar/Documents/Work/krea-wt/wt2/.qa/repro/v2-06-opcion-ajuste-ultimo-gana.mjs <base>` (con `--env-file`) — FAIL en main.

Los repros v2-03…v2-06 importan `C:/Users/Cesar/Documents/Work/krea-wt/wt2/.qa/v2/lib.mjs` (login por HTTP y Server Actions por el id del manifiesto del build, `.next/server/server-reference-manifest.json`; con `next dev`, `QA_DEV=1`) y usan la base local `qa_4302` (`QA_DB_URL` para otra). Base: `http://localhost:<puerto>`.

## Lo que está limpio (probado en esta corrida)
- **Regresiones v1:** F-A1 contraseña en la URL antes de hidratar → ahora POST sin la contraseña en la URL (`/ingresar`; `/recuperar/nueva` sin JS no muestra el formulario) · F-A2 alumno movido tras una grupal → en una sola entrega y el ranking no cambia · F-M1 corrección con versión vieja → `cambio` · F-M2 primer nombre en blanco → «Escribe el nombre.» y no se guarda · F-B1 contraseña de espacios → rechazada · F-B2 año 3000 → `fecha-lejana`, 31/02 → `invalida` · F-B4 fallo del almacén → «No pudimos guardar la imagen por un problema del portal, no de tu internet…».
- **Auth:** API sin sesión → 401 (`ranking`, `presencia`, `partes/version`, `evaluar/version`); rutas de Better Auth no públicas (sign-up, reset, change-password, update-user, revoke…) → 404; alumno en `/profe/*` → `/`; anónimo → `/ingresar`; cookie basura → `/ingresar`; cookie `httpOnly` + `Lax`; contraseña errónea y cédula inexistente → el mismo mensaje; salir en otro equipo revoca todas (la otra pestaña va a Ingresar) y una acción con la cookie revocada redirige sin escribir; recuperar: misma pantalla «Revisa tu correo», código válido → contraseña nueva → `/ingresar?aviso=password-nueva`, sesión previa revocada, código reusado y vencido → «Este enlace ya venció»; contraseña temporal → todo a `/crear-contrasena` y API 401; login con la API caída / 500 / 429 → mensaje claro distinto en cada caso; doble clic en Entrar → 1 POST.
- **Tareas (profe):** suma 19,5, pasos 0,25, hora `25:00` o `7pm`, título de espacios, sección fuera del catálogo → rechazados; hora ya pasada hoy → `hora-pasada`; vencida (fecha movida a ayer) → entregar, editar la entrega y editar la tarea → `cerrada`; reabrir con versión vieja → `cambio`, con alumno de otra sección → `invalida`, con fecha pasada → `fecha-pasada`; prórroga para uno → solo él entrega, repetirla → ok idempotente; reabrir para todos → todos entregan; la ideal no se ve con la tarea abierta ni durante una prórroga, sí con la tarea cerrada y solo en su sección; ideal de una entrega sin evaluar → `no-elegible`.
- **Enlaces (D468–D470):** `javascript:`, `JAVASCRIPT:`, con espacio o tab delante, `data:`, `vbscript:`, `file:`, `ftp:`, credenciales, `http://localhost`, más de 2000 caracteres, `%6Aavascript:` → `incompleta` (también en la parte del integrante); sin esquema → se guarda con `https://`; un `javascript:` metido a mano en la base se pinta como texto sin `href` en Evaluar y en la tarea del alumno.
- **Entregas (alumno):** otra sección → `no-existe`; respuesta de más, formato cruzado, texto de espacios → `incompleta`; profe o sin sesión → redirige; unicode (emoji de familia, japonés, «Matías ñ») intacto; `<script>` e `<img onerror>` en respuestas, comentarios, comentario general y motivos → texto, 0 diálogos; borrador restaurado tras recargar; doble clic en Entregar y en confirmar → 1 POST y 1 fila; editar tras evaluada → `ya-evaluada`; edición en la cola sin conexión → «Pendiente de enviar» y, si el profe la evalúa mientras tanto, al volver la red el toast «No se pudo enviar: tu profe ya evaluó la entrega…» sin pisar nada.
- **Evaluar:** fuera de rango, 0,25, negativo, falta o sobra pregunta, comentario de 301, «No participó» en individual o ajeno, base 9,5 / 20,5 / 10,25 o de no integrante → rechazados; el alumno no evalúa; `editada` en la UI («El alumno editó la entrega. Recarga…»); presencia de dos profes (toast a cada uno); cola en vivo (la entrega nueva aparece sin recargar); eliminar desde Evaluar → vuelve a la cola, sin 404; devolver → `entregada` sin evaluación; foco al abrir los diálogos en «Cancelar»; IA sin clave → sin botón y la acción responde `sin-configurar`; corregir conserva las bases por integrante.
- **Grupal por partes:** solo el capitán envía y asigna (`no-capitan`, D012); asignar a ajeno o al capitán → `integrante`; entregar parte ajena o no asignada → `no-asignada`; aceptar sin entregar y reentregar una aceptada → `estado`; enviar con partes sin aceptar → `partes-pendientes`; «La respondo yo» → `tomada`, el integrante ya no la entrega y queda en `sinParte` (premarcado No participó); tras enviar, partes congeladas (`enviada`); el no capitán ve preguntas y respuestas (D248) y otro equipo no; reparto en vivo para capitán e integrante sin «Actualizar» (sondeo 200/204); candado en las preguntas asignadas a otros con «Lo que entregó»; «Entregar tarea» deshabilitado hasta aceptar.
- **Puntos y ranking:** ajustes 0,25 / 0 / 21 / −21 / 1e10, detalle de 301, motivo reservado, a un profe, a equipo inexistente → rechazados; el alumno no ajusta; ningún ajuste toca una nota (D007); opción borrada mientras otro aplica un ajuste → `motivo`; opción repetida, de espacios o valor 0 → rechazada; doble anulación simultánea → una sola; ranking en vivo en otro navegador tras un ajuste, sin recargar; premio con empate: dar a no empatado o `darAlumno` en grupal → `invalida`, otra sección → `sin-empate`, dar a empatado y compartir → ok; el alumno no decide premios.
- **Perfil y contacto:** el alumno no tiene campos de nombre y `guardarMisDatos` / `guardarContacto` / `editarAlumno` no le cambian nada; contacto: `javascript:`, fijo 0212 y correo con `?cc=` → rechazados; `+58 0412 …` y correo en mayúsculas con espacios → normalizados; «Tus profesores» enlaza `https://wa.me/58…` y `mailto:`.
- **Rutas raras:** `/profe/evaluar/a%2Fb`, `/tareas/..%2F..%2Fetc`, `/notas/%3Cscript%3E…`, id de 3000 caracteres → pantalla 404 (HTTP 200, aceptado en D225) sin eco crudo.

## No verificado
| Qué | Por qué no se pudo |
|---|---|
| Envío real del correo de recuperación (Brevo), su plantilla y el límite 1/min · 3/h por cédula | La app solo envía por la API de Brevo (no hay camino SMTP a Mailpit) y la clave real está en `.env.local`: la neutralicé para no mandar correos reales. Restablecer se probó con un código insertado en `verification` |
| Subida real a B2, URL firmada, borrado de imágenes sin uso y del logo viejo; «imagen nunca subida» (F-B3) | Sin B2 local, y las `B2_*` de `.env.local` apuntan al bucket real: neutralizadas. Verificado hasta el mensaje de «problema del portal» y «Entregar» bloqueado |
| Estimación real de IA (Claude Haiku) | Sin `ANTHROPIC_API_KEY` en QA a propósito (la real está en `.env.local`) |
| 30 ingresos simultáneos: 12 de 30 dieron **500** (`timeout exceeded when trying to connect`; pool de 5 conexiones, 5 s de espera) | Solo visto en esta máquina saturada (unos 10 s de CPU por login); en Vercel cada instancia tiene su pool. Merece prueba de carga en el preview: un salón entero entra a la vez |
| Caducidad real del enlace (1 h) y de la sesión (5 días); la hora de entrega pasando en vivo | No se adelanta el reloj; se simuló moviendo la fecha en la base |
| Login lento: con la API a 30 s el botón queda en «Entrando…» sin aviso ni tope | Observación, no hallazgo: no hay timeout del lado del cliente |
| 320 px del reparto, contraste, diseño | Es de design-qa (wt3) |
| Instalar en iPhone real, push (VAPID) | Sin dispositivo ni VAPID local |

## Datos creados
Todo en la base local `qa_4302` (contenedor `qa-krea-pg`, desechable; se rehace con el próximo `qa:local` sin `--no-reset`): unas 20 tareas «[QA] …» con entregas, partes, evaluaciones, ideales, ajustes y anulaciones; opciones de ajuste editadas («Trabajo extra (profe 2)», «Ayudó (profe 2)») y una creada y borrada; el alumno 45021029 del seed movido de 5a-g2 a 5a-g1; contraseñas del seed tocadas y restauradas; un profe `10000002` («Profa QA Segunda»). Nada remoto ni en la base real; las cuentas de `.env.test.local` sin cambios. No toqué `qa_4303` (design-qa) ni el contenedor. Queda un build de producción en `wt2/.next`.

## Acciones requeridas de César
1. **Decidir cómo se identifica a cada alumno en el ranking (M1)**
   - Por qué: el arreglo cambia el formato que leen el ranking, el sondeo y las celebraciones.
   - Opciones: (a) id opaco por alumno (p. ej. la semilla del avatar, ya al azar por D388) en lugar de la cédula en `ranking.alumnos`; (b) dejarlo así porque los compañeros ya se conocen (entonces A1 urge más).
   - Qué necesito de vuelta: a o b.
2. **Decidir qué pasa con lo aceptado al editar una grupal por partes (B1)**
   - Opciones: (a) el servidor impone lo aceptado también al reenviar y la edición muestra esas preguntas con candado; (b) el capitán puede reescribirlas, como hoy, pero la parte pasa a «cambiada por el capitán» y el integrante lo ve; (c) dejarlo como está (D419).
   - Qué necesito de vuelta: a, b o c.
3. **Probar Brevo, B2 e IA en el preview** (en local no se puede sin tocar servicios reales)
   - Pasos: en el deploy de preview (Vercel › krea › Deployments › el de la rama), con un alumno de prueba que tenga tu correo como email de recuperación (Profe › Alumnos › Editar › «Email de recuperación»): `/recuperar` con su cédula → abre el correo → enlace → contraseña nueva. Pide el enlace 4 veces seguidas. Luego entrega como ese alumno una tarea con pregunta de imagen; como profe mírala en Evaluar y toca la estimación de IA en una respuesta de texto de varias líneas.
   - Qué necesito de vuelta: que el correo llegue (y el 4.º no), que la imagen se vea en Evaluar y el % que da la IA (o el mensaje que salga).
4. **Prueba de carga de ingresos en el preview** (opcional)
   - Pasos: pídeme el script; corre 30 logins simultáneos contra la URL del preview con cuentas de `krea_preview`.
   - Qué necesito de vuelta: la URL del preview y cuántos 500 salen.

## Camino feliz
Profe crea y publica una individual (texto + enlace) y una grupal (4 preguntas, una de enlace) → el alumno entrega (borrador, recarga, entrega, edita) → el capitán reparte, los integrantes entregan sus partes, el capitán acepta, toma una («La respondo yo») y envía → el profe evalúa desde la cola en vivo con bases por integrante, «No participó», comentarios y comentario general → el ranking sube en vivo en el navegador del alumno → el alumno ve su nota pregunta a pregunta en `/notas/<tarea>` (18 / 20) → el profe cierra, marca la ideal y el alumno la ve; reabrir con prórroga y para todos; ajustes con opción y anulación; devolver y eliminar entrega desde Evaluar. Todo funcionó.

## Feedback para el kit
| Tipo | Archivo | Clase | Regla que lo habría evitado |
|---|---|---|---|
| Prevención | reference/QA-PREVENTION.md | Freno por cuenta que solo lee un formato de cuerpo (JSON) mientras el endpoint acepta otros (form-urlencoded) | Todo freno de fuerza bruta se aplica al mismo valor que usa el autenticador, para cualquier `Content-Type` que este acepte (o 415 a lo que no sea JSON); prueba con un cuerpo form-urlencoded |
| Prevención | reference/QA-PREVENTION.md | Contador de intentos comprobar-y-luego-actuar (una ráfaga paralela pasa el tope) | Reservar el intento con una sola sentencia atómica (`insert … on conflict do update … returning count`) antes de evaluar la contraseña; prueba con 30 intentos en paralelo |
| Prevención | reference/QA-PREVENTION.md | Documento de identidad como clave de un dato que se reparte a otros usuarios | Lo que se envía a otros usuarios (rankings, listas) usa ids opacos; un test busca el patrón del documento en las respuestas que ven otros |
| Prevención | reference/QA-PREVENTION.md | Diálogo controlado sin `Trigger`: el foco se pierde al cerrar | Todo `Dialog` sin `DialogTrigger` devuelve el foco a mano en `onCloseAutoFocus`; prueba de teclado abrir → Escape → `activeElement` |
| Kit (qa-local) | scripts/qa-local.ts | Rama Postgres: crea las cuentas por sign-up y las busca por `email`; con sign-up desactivado y usuario ≠ email (cédula → email interno) aborta; sin `drizzle/seed.sql` no carga el seed del proyecto | Hook en `qa-roles.ts` para poner la contraseña a una cuenta existente del seed (como ya hace la rama Firebase con cédulas) y correr el script de seed del proyecto |
| Kit (qa-local) | scripts/qa-local.ts | No neutraliza claves reales de terceros de `.env.local` (`B2_*` del bucket real, `BREVO_API_KEY`, `ANTHROPIC_API_KEY`): el servidor de QA habría subido archivos, mandado correos y gastado API reales | Pisar con vacío los prefijos de terceros conocidos (`B2_`, `AWS_`, `BREVO_`, `RESEND_`, `ANTHROPIC_`, `OPENAI_`, `STRIPE_`…) salvo que el proyecto los mapee a un doble local |
| Kit (qa-local) | scripts/qa-local.ts | Varios `next dev` a la vez en Windows: la compactación de la caché de Turbopack bloqueó el servidor 13 min | Con otros servidores en la máquina, sugerir `--preview` (build + start) para un QA largo |
