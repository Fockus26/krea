# Prompts — ola de arreglos del QA v2 (2026-11-21)

Brief común: `context/plans/orchestration-2026-11-21-qa2.md` (léelo entero primero). Cada hallazgo
está descrito con pasos y causa en `context/plans/qa-version-2-functional.md` (F-*) o
`qa-version-2-design.md` (D-*): lee **solo** las secciones de tus IDs. Base de datos local de tu
servidor (si tienes): siempre `DATABASE_URL=<la URL que imprime qa:local --db-only>` al correr
`bun scripts/seed-db.ts` — ese script también acepta bases `_preview` del VPS: nunca lo corras sin
fijar la local.

Cierre de cada unidad (todas): PR en español contra `main` con «Qué cambia», «Hallazgos que
cierra» (ID → evidencia FAIL/PASS o prueba roja/verde), «Decisión tomada / alternativa», «Cómo
probar», y en tu informe: filas de CONTENT_CHECKLIST (texto completo), PHASE_LOG y «Feedback para
el kit». CI verde (`gh pr checks <n> --watch` en segundo plano). Sin changeset.

---

## R1 — `fix/login-bloqueo` (F-A1, Alto)

**Pedido de César:** «resolviendo todos los hallazgos altos medios y bajos».

**Hallazgo:** el bloqueo de 5 fallos por cuenta se salta. `app/api/auth/[...all]/route.ts:41-56`
lee el email solo con `req.clone().json()`: Better Auth también acepta
`application/x-www-form-urlencoded` (y posiblemente multipart), con lo que `email` queda vacío y
no se cuenta nada. Además `cuentaBloqueada` (antes) + `registrarFallo` (después),
`lib/data/intentos.ts:17,35`, no son atómicos: en ráfaga paralela pasan 18 de 30 intentos.
Repro HTTP: `context/plans/qa-version-2/funcional/v2-01-bloqueo-login-saltable.mjs`.

**Enfoque decidido:**
1. Extraer el identificador de cualquier content-type que Better Auth acepte en esa ruta (JSON y
   urlencoded como mínimo; mira en `node_modules/better-auth` qué parsea). Si no se puede leer
   el email de un cuerpo que no sea JSON, **rechazar** ese content-type en la ruta de ingreso
   (el formulario de la app ya manda JSON/POST: compruébalo en `/ingresar`; F-A1 de la v1 lo pasó
   a POST, no lo rompas).
2. Contador atómico: reservar el intento antes de verificar (un `INSERT … ON CONFLICT DO UPDATE
   … RETURNING` que incremente y devuelva el conteo; si supera el tope → 429 sin llamar a Better
   Auth); al éxito se limpia. Que la ráfaga paralela no pase de 5 evaluaciones.
3. El email normalizado igual que hoy (minúsculas/trim si ya se hace; cédula → email interno D008).

**Verificación:** pruebas en `tests/db` (PGlite) del contador: 30 llamadas concurrentes a la
función de reserva → como mucho 5 permitidas; y prueba unitaria del extractor por content-type.
Decisiones D491–D492. Fila 275 solo si cambia algún texto visible.

---

## R2 — `fix/id-opaco` (F-M1, Medio — decisión de César: id opaco)

**Hallazgo:** `/api/ranking/<sección>` y el HTML de `/ranking` usan la cédula como clave de cada
fila: un alumno recibe las cédulas de los 34 compañeros. `lib/ranking-datos.ts:121`
(`alumnos[u.cedula] = …`), `lib/ranking-en-vivo.ts:60,101` (`Tu = { cedula }`, `esTu: f.id ===
tu.cedula`). `user.id` = cédula (`lib/db/schema.ts:32-120`), así que no hay otro id que usar.
Repro: `context/plans/qa-version-2/funcional/v2-02-ranking-expone-cedulas.mjs`. Ver D388 (avatar
opaco: misma intención).

**Enfoque decidido:** id público derivado, sin migración: `idPublico(cedula)` = HMAC-SHA256 con
una clave derivada de `BETTER_AUTH_SECRET` (etiqueta propia, p. ej. `"krea:id-publico:v1"`),
truncado a 16–22 caracteres base64url, en un módulo `server-only` (`lib/id-publico.ts`). Estable
entre peticiones, no reversible sin el secreto. El ranking, su API y su sondeo usan ese id;
`esTu` se calcula en el servidor o con el id público del propio usuario.

**Clase completa:** busca **todo** payload o HTML que reciba un alumno con la cédula de **otro**
alumno (`git grep -n cedula -- app components lib`): equipo (`/equipo`), reparto de partes del
capitán (`lib/vistas-estudiante.ts` `integrantes: { cedula, nombre }`, `bloqueos`, formularios de
asignar), ideal con nombre, premios, notas. Donde el cliente devuelve ese id al servidor (asignar
una parte a un integrante, «La respondo yo»), el servidor lo traduce de vuelta (busca entre los
miembros del equipo cuyo `idPublico` coincida) y rechaza lo que no sea de su equipo. La vista del
profesor puede seguir con cédulas (las ve y edita, D-perfil). Lista en el PR cada sitio cambiado.

**Verificación:** pruebas unitarias de `idPublico` (estable, distinto por cédula, sin la cédula
dentro) y una prueba que recorra la salida de `rankingEnVivo`/vista de equipo/reparto y falle si
aparece una cédula ajena (patrón `\b\d{7,8}\b` con las del seed de la prueba). `tests/db` para la
traducción id→cédula en las acciones de partes. Decisiones D493–D496.

---

## R3 — `fix/contraste-oscuro` (D-A1 Alto, D-M1 Medio, D-M2 Medio)

1. **D-A1:** en oscuro, `components/sections/inicio/points-card.tsx:41`
   (`bg-accent-ink text-on-accent`) queda blanco sobre `--accent-ink` claro (`#7aa2f7`… en
   `app/globals.css:154-184, 213-238`): 2,51:1 en los 4 acentos. D217 eligió `accent-ink` cuando
   era oscuro en ambos temas; D301 lo aclaró en oscuro. Arreglo: el relleno de la tarjeta usa el
   token del acento lleno que D301 ya oscurece para texto blanco (busca cuál usan los botones
   primarios en oscuro) — **sin color nuevo**. Mide los 4 acentos × claro/oscuro ≥ 4,5:1 (texto
   normal) y deja los pares calculados en el PR. Barre la clase: todo `bg-accent-ink` con texto
   encima (`git grep -n "bg-accent-ink" -- app components`).
2. **D-M1 (decisión de César):** la píldora de nota (`components/krea/grade-pill.tsx:34`, D347,
   `lib/grades.ts` `GRADE_SOMBRA` / `gradeInk`) da 3,6–3,84:1 con número blanco + sombra en las
   notas **10–12** (amarillo/lima). Solo para esas notas, el número pasa a la tinta oscura que ya
   existe (`gradeInk` / `--grade-ink-on-light` o el token equivalente) sin sombra; el resto sigue
   como D347. Que la regla sea por contraste medido (la función decide con la luminancia del
   fondo de `gradeColor(n)`, y la prueba fija que 10–12 dan tinta oscura y 1–9, 13–20 blanco) y
   aplique igual en todos los sitios que pintan la píldora: `GradePill`, el ejemplo de
   `ranking-rules.tsx`, `question-bar.tsx`, `grade-legend.tsx` y la imagen OG si pinta nota.
   Nueva decisión que reemplaza a D347 en ese rango (márcalo en D347: «Reemplazada en parte por DNNN»).
3. **D-M2:** ideal del profe en oscuro, enlace subrayado 3,56:1 (repro
   `diseno/12-ideal-profe-contraste-oscuro.mjs`; archivo en `components/sections/tareas-profe/`
   o `components/sections/tareas/ideal-enlace.tsx`). Usa el token de enlace que ya pasa en oscuro.

Repros: `diseno/7-contraste-oscuro-inicio.mjs`, `8-contraste-pildora-nota-alumnos.mjs`,
`12-…` (datos con `diseno/datos.mjs`). FAIL antes / PASS después, más axe 4 acentos × 2 temas en
`/`, `/notas`, `/profe/alumnos`, `/ranking`. `tokens.test.ts` prohíbe hex en `app/` y `components/`.
Decisiones D497–D500.

---

## R4 — `fix/texto-200-rutas` (D-A2 Alto — clase; D-B1, D-B2 Bajo)

1. **D-A2:** con texto del sistema al 200 % en 390 px se desbordan `/profe/evaluar/[e]` (623 px),
   `/tareas/[t]` grupal (507), `/profe` (398) y `/profe/alumnos` (395). Causa común: chips y
   botones `inline-flex shrink-0` en filas sin `flex-wrap` (y el `min-content` de botones). La
   guarda medida decide, el grep solo orienta: versiona el repro
   `context/plans/qa-version-2/diseno/13-texto-200-rutas-nuevas.mjs` (y el `3-texto-200-movil`)
   en `scripts/qa/texto-200.mjs` con **todas** las rutas de alumno y profe (las de la lista del
   informe de diseño), córrelo, y arregla cada ruta que mida > 390 px. Arreglo por anatomía del
   componente (fila de chips/acciones → `flex-wrap` + `max-w-full`/`min-w-0`; `Button` ya tuvo
   D227: no lo rompas), nunca un `overflow-x:hidden` que esconda el problema.
2. **D-B1:** nombres con elipsis en el ranking también a 1024 px (con espacio de sobra).
3. **D-B2:** alturas desiguales de tarjetas en una misma fila: `/profe/equipos/5a` (594/699/687),
   `/equipo` (337 vs 342). Que las tarjetas hermanas estiren a la misma altura (grid
   `items-stretch` + la Card `h-full`), sin alturas fijas.

Solo clases de layout (otras unidades tocan color y aria en los mismos archivos). Vas último en el
orden de merge: antes del PR final, `git merge origin/main` y vuelve a correr la guarda.
Decisiones D501–D503 (una para la guarda versionada).

---

## R5 — `fix/a11y-estados` (D-A3 Alto; F-M2, F-M3, D-M3 Medio; D-B3 Bajo)

1. **D-A3:** las 404 de rutas dinámicas con sesión (`/notas/[tarea]`, `/tareas/[tarea]`,
   `/profe/tareas/[id]`, `/profe/evaluar/[entrega]`, `/profe/equipos/[seccion]`, y las
   `ideal`) se pintan **dentro** del shell: dos `main#contenido` y un segundo encabezado «Tu
   perfil» de 32 px (repro `diseno/9-404-dentro-del-shell.mjs`). Arreglo: la pantalla 404 dentro
   del shell no repite header, nav ni `main` (variante «en el shell» de `app/not-found.tsx`, o un
   `not-found.tsx` por grupo de rutas). El HTTP 200 está **aceptado en D225** (streaming tras
   `loading.tsx`): intenta comprobar la existencia antes del Suspense **solo si** es barato y no
   rompe `cacheComponents`; si no, deja el 200 y dilo. Repro `diseno/2-…` informa del status.
2. **F-M2:** `/tareas/<tarea>` de una tarea **ya evaluada** dice «Pendiente · vale N» en cada
   pregunta, justo bajo «Tu profe ya la evaluó»: `app/(estudiante)/tareas/[tarea]/page.tsx:208`
   pasa `obtenido={null}` fijo. Pasa lo obtenido por pregunta si la entrega está evaluada (como
   `/notas/[tarea]`); null = Pendiente solo cuando de verdad no hay evaluación (D003). Repro
   `funcional/v2-03-…`.
3. **F-M3:** en `/profe/evaluar/<entrega>`, cerrar «Eliminar entrega» o «Devolver al alumno» con
   Escape o Cancelar deja el foco en `<body>`: el `Dialog` no tiene `DialogTrigger` y
   `onCloseAutoFocus` solo devuelve el foco en la variante de menú
   (`components/sections/evaluar/acciones-entrega.tsx:228-241`). El foco vuelve siempre al botón
   que lo abrió. **Clase:** busca todo `Dialog`/`AlertDialog` controlado sin `DialogTrigger` en
   `components/` y aplica lo mismo. Repro `funcional/v2-04-…`.
4. **D-M3:** en `/ranking` y `/profe/ranking` el `aria-label` de las filas/podio no contiene el
   texto visible (35 nodos; WCAG 2.5.3) — repro `diseno/10-…`; en `/perfil` la pestaña de avatar
   tiene `aria-controls` hacia un id inexistente — repro `diseno/11-…`.
5. **D-B3:** copy con «él» fijo en la vista del integrante (grupal por partes): sin género, p. ej.
   con el nombre o «tu capitán»/«quien…». Busca la cadena en `components/sections/tareas/` y
   `lib/partes.ts`. Copy nuevo PROVISIONAL, filas 276–279.

Decisiones D504–D507.

---

## R6 — `fix/concurrencia-datos` (F-B1, F-B2 Bajo)

1. **F-B1 (decisión de César: opción a):** al reenviar/editar una grupal por partes, el capitán
   pisa la respuesta aceptada de un integrante: la parte sigue «aceptada» con el texto del
   integrante, pero la entrega guarda el del capitán. D463 (el servidor impone lo aceptado) solo
   actúa en el primer envío (`lib/data/entregas.ts:262-295`, modos `nueva | completar | reenvio`);
   D419 deja editar al capitán. Ahora: en **todo** modo, para cada pregunta con parte `aceptada`
   de otro integrante, el servidor guarda la respuesta aceptada de la parte, ignore lo que mande el
   cliente (como D463, función `repartoParaEnviar` / su equivalente). Las `tomada` (D461–D466,
   «La respondo yo») son del capitán: esas sí las edita. En el formulario del capitán, esas
   preguntas ya van en solo lectura (bloqueos): comprueba que también al editar. Repro
   `funcional/v2-05-…`; prueba en `tests/db` que reenviar con otro texto conserve el aceptado.
2. **F-B2:** opciones de ajuste (motivos): el último en guardar gana sin aviso; editar con la
   lista vieja abierta pisa el cambio del otro profe (`lib/data/motivos.ts:48-60`, ya guarda
   `actualizadoEn`). Concurrencia optimista: el cliente manda el `actualizadoEn` que leyó; si no
   coincide, el servidor responde `cambio` (como Evaluar, F-M1 de la v1) y la UI avisa y recarga la
   lista sin perder lo escrito si se puede. Sin migración (usa `actualizadoEn`); `0008` solo si de
   verdad hace falta. Repro `funcional/v2-06-…`; prueba en `tests/db`.

Copy nuevo (aviso de cambio) PROVISIONAL, filas 280–282. Decisiones D508–D511.
`tests/unit/cache-rutas.test.ts` exige `refresh()` en cada acción exportada de `lib/acciones/`.
