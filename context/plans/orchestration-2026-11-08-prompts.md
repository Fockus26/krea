# Tanda 2026-11-08 — prompts por unidad

Brief compartido: `C:\Users\Cesar\Documents\Work\krea\context\plans\orchestration-2026-11-08.md`
(léelo primero). Carpeta principal (context/ local): `C:\Users\Cesar\Documents\Work\krea`.

---

## Y1 — `fix/texto-blanco-rellenos-oscuro`

Worker **Y1**. Decisiones **D328–D330**. Checklist: ninguna. Modelo: sonnet · medium. Docker: no.
Decisiones que te limitan: D301 (blanco sobre acento oscurecido), D238 (barrido de contraste
versionado), D286 (extremos de gradeColor para blanco), D297 (ghost-danger), D016/D026 (capas de tokens).

### Qué pide César
> "habíamos dicho que en modo oscuro el texto iba a ser blanco en los botones como guardar cambios,
> alumno... es decir esos botones cuyo contraste no es tan alto, ahorita revisando vi otro botón
> llamado Cerrar sesión el que está en el modal y su texto está oscuro necesito que halles este
> patrón porque no me gusta"

D301 lo resolvió solo para el acento. El patrón que queda: **rellenos de color con texto oscuro en
el tema oscuro**. Caso visto: botón `danger` (`components/sections/perfil/security-settings.tsx:96`,
y `components/layout/menu-sheet.tsx:76-81`).

### Dónde está
- `app/globals.css:64-66` (claro: `--error #c80300`, `--on-error #fff`), `:139-140` (oscuro explícito:
  `--error #ff6b5e`, `--on-error #14121a`), `:195-196` (oscuro por sistema, mismos valores).
- `components/ui/button.tsx:52-56` — `danger`: `bg-error text-on-error`, hover `brightness-92`.
- Otros `bg-error text-on-error`: `components/krea/podium.tsx:162`, `components/krea/rank-row.tsx:198`
  (chip «VS»), `components/krea/image-upload.tsx:305` (hover del botón quitar).
- `components/sections/tareas/task-delivered.tsx:33` — `bg-success text-surface` (en oscuro, texto
  `--surface` oscuro sobre verde claro: mismo patrón).
- Tests: `tests/unit/contraste-acentos.test.ts`, `contraste-tokens.test.ts`, `ghost-danger-contraste.test.ts`.

### Enfoque decidido
- Igual que D301: en oscuro (explícito **y** por sistema) el texto sobre el relleno es **blanco** y
  el **relleno** se oscurece hasta que el blanco pase **4,5:1**. `--error` sigue siendo el rojo claro
  como **texto/borde** sobre fondo oscuro (lo usan `ghost-danger`, mensajes de error, bordes de
  campo): por eso hace falta un token de relleno aparte, p. ej. `--error-fill` (`bg-error-fill`),
  que en claro vale lo mismo que `--error`. Mismo criterio para `success`/`warning` si aparecen como
  relleno con texto (`--success-fill`, …). Nómbralos tú y regístralos en una decisión.
- Barre la clase entera: `grep -rn "bg-\(error\|success\|warning\|info\)\b" app components` y todo
  `text-on-*`/`text-surface`/`text-bg` sobre un relleno de color. Píldoras de nota quedan fuera
  (ya son blancas, D286) salvo que midas que fallan.
- El relleno oscurecido debe quedar ≥ 3:1 contra `--bg` y `--surface` del oscuro (componente no textual).
- `danger` hover: `brightness-92` oscurece; comprueba que el blanco siga ≥ 4,5:1 en hover.

### Trampas conocidas
- Hay dos bloques oscuros en `globals.css` (`[data-theme="dark"]` y `@media (prefers-color-scheme: dark)`
  sin `data-theme="light"`): cambia los dos.
- Solo tú editas `globals.css` en esta tanda.

### Cómo verificar
- Extiende o crea una prueba de contraste versionada (como D238) con cada par relleno/texto nuevo
  en claro y oscuro (≥ 4,5:1) y relleno vs `--bg`/`--surface` (≥ 3:1).
- En el PR, tabla antes/después de cada par con su ratio.

### Cierre
Sin changeset. PR: «Decisión tomada / alternativa» para el nombre y valores de los tokens de relleno.
Cómo probar: modo oscuro → Perfil → Cerrar sesión (modal), Ranking (chip VS), entrega enviada.

---

## Y2 — `feat/matriz-contraste`

Worker **Y2**. Decisiones **D331–D332**. Checklist: ninguna. Modelo: sonnet · medium. Docker: no.
Decisiones: D016/D026 (tokens por `data-theme`/`data-accent` en un contenedor), D238, D236 (tinta de
la píldora por contraste), D286, D162 (galería solo en desarrollo y vistas previas).

### Qué pide César
> "necesito que me digas dónde puedo ver los componentes de botones y el de las notas que van de
> rojo al verde con sus textos, poder verlos con todos los acentos, en modo claro y oscuro para
> decidir qué botones me gustan con su contraste y cuáles no"

César eligió: **una matriz 4 acentos × claro/oscuro, todo a la vez, con el contraste medido**.

### Dónde está
- `app/componentes/page.tsx` — galería (lista `FAMILIES`, orden de la lámina); `layout.tsx` la oculta
  en producción (`lib/galerias.ts:6`).
- `app/componentes/_familias/escenario.tsx:65-94` — patrón de contenedor con `data-theme` +
  `data-accent` (siempre `data-theme` explícito, ver el comentario).
- `app/componentes/_familias/botones.tsx` — variantes y etiquetas de botones.
- `components/krea/grade-pill.tsx`, `lib/grades.ts` (`gradeColor`) — píldora de nota.

### Enfoque decidido
- Familia nueva `app/componentes/_familias/matriz-contraste.tsx`, entrada nueva en `FAMILIES`
  («Matriz de contraste»), con enlace de ancla como las demás.
- 8 celdas (azul, rojo, verde, morado × claro, oscuro), cada una un contenedor con `data-theme` y
  `data-accent`. En cada celda: los botones `primary`, `secondary`, `ghost`, `ghost-danger`,
  `danger` (normal y deshabilitado) y la escala de píldoras de nota (p. ej. 0, 5, 9,5, 10, 12, 14,
  16, 18, 20 y `null` = Pendiente).
- Junto a cada muestra, su **ratio de contraste medido** en vivo (`getComputedStyle` de texto y
  fondo, cálculo WCAG en un helper puro con test) con marca «AA» / «No AA» en **texto** (no solo
  color). Componente cliente; cálculo después de montar.
- Responsive: en móvil las celdas se apilan; sin scroll horizontal a 320 px.

### Trampas conocidas
- Si un fondo es transparente (ghost), el contraste se mide contra el fondo de la celda.
- No edites `globals.css` (Y1 cambia los tokens de relleno de error; la matriz los lee en vivo).

### Cómo verificar
- Test unitario del helper de contraste (valores conocidos: blanco/negro 21:1, etc.).
- typecheck, lint, test. a11y por revisión de código.

### Cierre
Sin changeset. Cómo probar: vista previa del PR → `/componentes#matriz-contraste`.

---

## Y3 — `fix/tarjeta-ingresar`

Worker **Y3**. Decisiones **D333–D334**. Checklist: ninguna. Modelo: sonnet · low. Docker: no.
Decisiones: grep `context/decisions/` por «Ingresar» y «auth» antes de tocar.

### Qué pide César
> "en el formulario de login hay un box shadow, el problema con esto es que se ve solo en modo claro
> y que no hay padding en el contenedor así que se ve todo pegado a los márgenes"

César eligió para el oscuro: **superficie más clara + borde sutil** (en vez de sombra).

### Dónde está
- `components/sections/auth/auth-layout.tsx:13-16` — marco de Ingresar/Recuperar. Tarjeta solo de
  768 a 1023 (`md:`), con `md:shadow-2`; en oscuro `md:dark:border md:dark:border-divider md:dark:shadow-none`
  sobre `md:bg-surface`. < 768 sin tarjeta y padding `px-4`; ≥ 1024 sin tarjeta (`lg:p-0`).
- Tokens: `--surface-2` existe (`globals.css:55`, oscuro `:130`, `:186`); `--divider`.

### Enfoque decidido
- En oscuro la tarjeta usa `bg-surface-2` (o el token de superficie elevada que ya exista y sea más
  claro que `--bg` oscuro) + borde `--divider`, sin sombra. Comprueba que el texto y los campos dentro
  sigan ≥ 4,5:1 sobre esa superficie.
- **Padding:** mide (por cálculo de clases, sin servidor) dónde el contenido queda pegado al borde de
  la ventana o de la tarjeta en todos los anchos: 320, 375, 768, 1024, 1280. Dos sospechosos: < 768
  (`px-4` sin tarjeta) y ≥ 1024 (`lg:p-0` del formulario, columna izquierda). Da padding interno
  cómodo en cada tramo con tokens de espaciado existentes. Si concluyes que César se refería a un
  tramo concreto, dilo en el PR.
- Sin editar `globals.css`.

### Cómo verificar
typecheck, lint, test; a11y por revisión (contraste en 4 acentos × claro/oscuro, 320 px).

### Cierre
Sin changeset. Cómo probar: `/ingresar` en oscuro a 800 px y en móvil, y `/recuperar`.

---

## Y4 — `feat/aviso-tarea-push`

Worker **Y4**. Decisiones **D335–D340**. Checklist: **171–173**. Modelo: opus · medium. Docker: no.
Decisiones: D327 (Postgres + Better Auth), D291 (service worker propio, sin librería), D012
(capitán), D326 (secciones dinámicas), D015/D191 (preferencias en el perfil). Tech ref:
`~/.claude/kit-reference/tech/vps-postgres.md`.

### Qué pide César
> "quiero agregar que cada vez que un profesor realice una tarea le llegue una notificación a los
> alumnos que hayan permitido esas notificaciones"

César eligió: **push del navegador** (Web Push con VAPID), activado por el alumno en Perfil. Se envía
cuando la tarea **pasa a «abierta» (se publica)**, no al guardar un borrador ni al editar una ya publicada.

### Dónde está
- `lib/acciones/tareas.ts:46-75` — `guardarTarea` / `guardarTareaPendiente` → `guardar()`.
- `lib/tareas-profe-datos.ts:148-243` — transición a `{ estado: "abierta" }` (`publicada(...)`);
  ahí sabes si antes era borrador/nueva (`previa?.estado`).
- `lib/db/schema.ts` — `tareas` (`secciones: text[]`, `estado`, `importada`), `usuarios`.
- `drizzle/` — migraciones; `drizzle.config.*`.
- `public/sw.js` — service worker (D291); `components/offline/registro-sw.tsx` lo registra.
- `app/(estudiante)/perfil/` y `components/sections/perfil/appearance-settings.tsx` — preferencias del alumno.
- `app/manifest.ts` — PWA (en iPhone, push solo con la app en pantalla de inicio, iOS 16.4+).

### Enfoque decidido
- Tabla nueva `push_suscripciones`: `endpoint text pk`, `cedula text not null` (índice), `p256dh text`,
  `auth text`, `creado_en` (ms como el resto). Migración Drizzle **escrita, no aplicada** (acción para
  César, aditiva).
- Dependencia `web-push` (`bun add web-push`, tipos `@types/web-push`). Envío solo servidor.
- Variables nuevas en `.env.example` sin valores: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`
  (SECRETA), `VAPID_SUBJECT` (mailto del remitente). Sin ellas: la opción en Perfil no aparece
  (o aparece explicada como no disponible) y no se envía nada, sin errores. Script
  `scripts/generar-vapid.ts` que imprime un par nuevo (para César).
- Server Actions `suscribirPush(sub)` / `desuscribirPush(endpoint)` con `exigirSesion("estudiante")`,
  zod para el `PushSubscription` JSON, `refresh()` al terminar.
- UI en Perfil del alumno: interruptor «Avisarme cuando haya una tarea nueva», estados: no soportado
  (explica, p. ej. iPhone sin instalar), permiso denegado (explica cómo reactivarlo), activado,
  desactivado. Pide permiso **solo** al activar el interruptor (gesto del usuario).
- En `sw.js`: listeners `push` (muestra la notificación: título «Nueva tarea», cuerpo con el título
  de la tarea, ícono de `public/icons`) y `notificationclick` (abre o enfoca `/tareas/<id>`).
  Mantén el SW sin librería y revisable.
- Al publicar: en `after()` (no retrasa al profe), buscar alumnos de `tareas.secciones` con
  suscripción, enviar; borrar suscripciones con 404/410. Nunca registrar endpoints ni cédulas:
  solo códigos y conteos. No enviar para tareas `importada`.
- Copy nuevo → filas 171–173 del checklist (PROVISIONAL).

### Trampas conocidas
- Un mismo alumno puede tener varios dispositivos: varias filas por cédula.
- La transición correcta es borrador/nueva → abierta; la cola sin conexión puede reintentar el mismo
  guardado: el envío no debe repetirse (usa `previa?.estado`, no «guardó con estado abierta»).
- `cache-rutas.test.ts` vigila `refresh()` en acciones que escriben.

### Cómo verificar
- Tests PGlite: suscribir/desuscribir, consulta de destinatarios por sección, limpieza 410, publicar
  dispara una vez y re-guardar no. `web-push` inyectado/mocked (sin red).
- Test puro del payload de notificación.
- typecheck, lint, test; a11y del interruptor.

### Cierre
Sin changeset. Acciones para César en el PR: generar VAPID (`bun scripts/generar-vapid.ts`), cargar
las 3 variables en Vercel (Production y Preview), aplicar la migración en `krea` y `krea_preview`,
redeploy. Cómo probar: alumno → Perfil → activar; profe publica una tarea de su sección.

---

## Y5 — `feat/correo-variantes`

Worker **Y5**. Decisiones **D341–D344**. Checklist: **174–175**. Modelo: opus · medium. Docker: no.
Decisiones: D185–D188 (recuperación por correo, Brevo), D015/D191 (apariencia en el perfil), D001
(acentos), D301 (valores de acento en oscuro), D162 (galerías solo dev/preview).

### Qué pide César
> "Dame otras presentaciones de email template para restablecer la contraseña para ver si la cambio,
> además este puede utilizar los colores accent que decidió por default, hasta podría tomar en
> cuenta si es modo oscuro o claro?"

### Dónde está
- `lib/correo/restablecer.ts` — `COLORES_CORREO` fijos (`:7-15`, marca `#295AC3`), `correoRestablecer`
  (`:60`), HTML de una columna + texto plano. Lienzo: `design/canvas/Correo.dc.html`.
- `lib/recuperar.ts:85-105` — `procesarRecuperacion` arma y envía; `lib/data/recuperacion.ts` —
  `depsRecuperacion` (lee email y nombres de `usuarios`).
- `lib/db/schema.ts:127` — `usuarios.apariencia` (jsonb `Apariencia`: acento y tema; `zApariencia`
  en `lib/modelo.ts`).
- Valores de acento claro/oscuro: `app/globals.css` (bloques `[data-accent=…]`).
- Tests: `tests/unit/recuperar.test.ts`.

### Enfoque decidido
- **Tres presentaciones** además de la actual (que sigue siendo la que se envía hasta que César
  elija): p. ej. «Tarjeta» (la actual), «Banda de color» (cabecera llena con el acento), «Minimal»
  (solo tipografía y un botón), «Lúdica» (con la píldora de nota/forma de marca). Tú las diseñas con
  el tono del proyecto (cálido, lúdico, justo) y la estructura de correo segura (tablas, estilos en
  línea, ancho 600, botón «a prueba de balas»).
- Cada variante recibe `acento` (azul/rojo/verde/morado; ausente = azul) y `tema` (claro/oscuro;
  `sistema` o ausente = claro) **del perfil del alumno**. Colores hex fijos derivados de los tokens
  (un cliente de correo no lee CSS vars) en una tabla `COLORES_CORREO_POR_ACENTO` claro/oscuro, con
  test de contraste ≥ 4,5:1 del texto y del botón. Además, `@media (prefers-color-scheme: dark)` en
  el `<style>` para los clientes que lo soportan cuando el tema es claro/sistema.
- `depsRecuperacion` lee también `apariencia`; `procesarRecuperacion` la pasa. Una constante
  `VARIANTE_CORREO` (por defecto la actual) elige cuál se envía.
- Galería `app/correos/page.tsx` (oculta en producción como `/componentes`, `lib/galerias.ts`): cada
  variante × 4 acentos × claro/oscuro en `<iframe srcDoc>` con un enlace y nombre de ejemplo
  (no reales). Así César compara y elige.
- No cambies el flujo de recuperación (respuesta igual, límites, `after`), solo los datos del correo.

### Trampas conocidas
- Gmail ignora `prefers-color-scheme` e invierte por su cuenta: por eso el tema elegido en el perfil
  se aplica con colores fijos, no solo con media query.
- `escaparHtml` en todo lo que venga del usuario (nombre).
- No registrar email, enlace ni código (regla del módulo).

### Cómo verificar
- Tests puros: cada variante × acento × tema produce HTML con el enlace escapado, el asunto y el texto
  plano; contraste de la tabla de colores; `procesarRecuperacion` pasa la apariencia (deps falsas).
- typecheck, lint, test.

### Cierre
Sin changeset. Cómo probar: vista previa → `/correos`. Decisión pendiente para César: qué variante
queda (`VARIANTE_CORREO`).

---

## Y6 — `fix/hover-perfil`

Worker **Y6**. Decisión **D345**. Checklist: ninguna. Modelo: sonnet · low. Docker: no.

### Qué pide César
> "me gustaría que el botón de perfil al hacer hover mostrara algún estilo para saber que estoy
> haciendo hover"

### Dónde está
- `components/layout/top-bar.tsx:96-111` — `Link` «Tu perfil» (alumno): `size-11 rounded-pill`,
  solo `focus-visible`, sin hover. Avatar `UserAvatar` 36 px.
- Profe: `components/layout/menu-sheet.tsx` (disparador del Menú) — revisa si su disparador tiene
  hover; aplica lo mismo para que sean coherentes. `user-card.tsx` si es clicable.

### Enfoque decidido
- Hover con tokens existentes: fondo `bg-accent-soft` en el círculo de 44 px detrás del avatar + un
  anillo sutil (`ring` con `--accent-ink` o `--divider`), transición solo de `opacity`/`transform`
  si animas (regla del proyecto) y `motion-reduce` sin animación. `active:` con `bg-accent-soft-2`.
  No uses solo color para el foco: el `focus-visible` actual se queda.
- `hover:` solo en punteros que lo soportan (Tailwind 4 ya lo hace con `@media (hover: hover)`).

### Cómo verificar
typecheck, lint, test; a11y por revisión (contraste del anillo ≥ 3:1 en 4 acentos × claro/oscuro).

### Cierre
Sin changeset. Cómo probar: alumno → barra superior → pasar el mouse por el avatar; profe → Menú.
