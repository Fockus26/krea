# QA de diseño — versión 2 (QA final) — 2026-11-21

**Entorno:** Chromium headless (Playwright, node) · `next dev` en :4303 (`qa:local --postgres`, base `qa_4303`) con el seed ficticio de `data/seed/` (`bun scripts/seed-db.ts`, contraseña de desarrollo) + datos extra sembrados por mí (`.qa/dqa/datos.mjs`: tareas `qa-partes`, `qa-enlace`, `qa-evaluada`, `qa-partes-env`, ideal, enlace de ~230 caracteres, palabra de 65 letras sin espacios) · `main @ b9f51c9` · **verificado en navegador: sí**.
**Resultado:** 0 críticos · 3 altos · 3 medios · 4 bajos.

**Incidencias del entorno (no son hallazgos de la app):**
- `qa:local` no creó las cuentas de prueba («no Better Auth sign-up route»); las del `.env.test.local` (45009896, 10000000) existen en el seed, pero la contraseña del archivo era de los emuladores: entré con la contraseña de desarrollo del seed.
- `next dev` en este disco tarda ~2 min por ruta en frío; el barrido llevó horas. El Chromium completo no arranca (`spawn UNKNOWN`): el texto al 200 % se midió con CDP `Page.setFontSizes` (32 px).
- Tras entrar, la URL queda en `/ingresar` mientras compila `/` en frío (solo dev; no lo cuento como hallazgo).

## Resumen

Las regresiones de v1 están cerradas: logo y segmentados en alto contraste (repros 4 y 5 PASS), foco bajo la barra (6 PASS), texto 200 % en las 5 rutas de v1 (3 PASS), cero scroll horizontal de 320 a 3840 en las ~40 rutas medidas, reduced motion sin animaciones, selección y scrollbar iguales a COLORS.md, cero valores mágicos. Lo nuevo que más importa: **(1)** en oscuro la tarjeta «Tus puntos del ranking» de Inicio es blanco sobre `#7aa2f7` (2,51:1) en los 4 acentos; **(2)** con texto del sistema al 200 % en 390 px se desborda Evaluar del profe (623 px), `/tareas/[tarea]` grupal (507 px) y Panel/Alumnos; **(3)** las rutas dinámicas inexistentes siguen respondiendo 200 y pintan la 404 dentro del shell (dos `<main>`, segundo «Tu perfil» de 32 px). Lo pedido de partes y enlace está limpio a 320 px.

## Hallazgos

### [Alto] 1 · Inicio en oscuro: tarjeta de puntos, blanco sobre azul claro (2,51:1), los 4 acentos
- **Dónde:** `/` (alumno) · `components/sections/inicio/points-card.tsx:41` (`bg-accent-ink text-on-accent`).
- **Condición:** tema oscuro, cualquier ancho y acento (rojo/verde/morado/azul: axe 5 nodos en cada uno).
- **Qué pasa:** D217 puso el fondo en `accent-ink`; D301 dejó `--on-accent` blanco en oscuro y `--accent-ink` en su tono claro (`#7aa2f7`). Eyebrow, `37,5`, «#1 de 35», «en 5A» y el desglose quedan a 2,51:1 (piden 4,5 y 3).
- **Por qué importa:** la cifra principal de Inicio es casi ilegible en oscuro (WCAG 1.4.3).
- **Evidencia:** `.qa/dqa/shots/repro7-inicio-oscuro.png`; `.qa/dqa/out/axe-estudiante-acentos.json`.
- **Repro:** `node .qa/repro/7-contraste-oscuro-inicio.mjs <base>` → `FAIL 5 nodos …`.
- **Corrección sugerida:** `dark:bg-accent` (relleno oscurecido de D301, blanco ≥ 4,66:1) y `accent-ink` solo donde haga falta (rojo claro); reabrir D217.
- **Tipo:** implementación.

### [Alto] 2 · Texto del sistema al 200 % en móvil: Evaluar, Tareas grupal, Panel y Alumnos se salen
- **Dónde:** `/profe/evaluar/[entrega]` (623 > 390: «0 de 3 puntuadas», «Saltar», «Guardar y seguir»), `/tareas/[tarea]` grupal (507 > 390: chips «La respondes tú en su lugar», «Entregada al capitán», botón «La respondo yo (pregunta 1)»), `/profe` («Evaluar la primera» 398), `/profe/alumnos` («Agregar alumno» 395).
- **Condición:** 390 × 844, fuente del navegador 32 px (CDP `Page.setFontSizes`).
- **Qué pasa:** `scrollWidth` > `clientWidth` en esas 4 rutas; las 5 de v1 y `/tareas`, `/equipo`, `/` quedaron limpias. Mismo patrón de v1: chips y botones `inline-flex shrink-0` sin `flex-wrap` ni `max-w-full`.
- **Por qué importa:** WCAG 1.4.4/1.4.10; el profe y el capitán pierden acciones sin scroll horizontal.
- **Evidencia:** `.qa/dqa/shots/t200-*.png`; `.qa/dqa/out/t200.log`, `r13.log`.
- **Repro:** `node .qa/repro/13-texto-200-rutas-nuevas.mjs <base>` → `FAIL /tareas/qa-partes 507>390 | /profe/evaluar/… 623>390 | /profe/alumnos 395>390 | /profe 398>390`.
- **Corrección sugerida:** `flex-wrap` + `max-w-full`/`min-w-0` en chips (`EstadoParte`, `Badge` de `QuestionCardAnswer`/`RepartoPanel`), en la barra de acción de Evaluar y en los botones del Panel/Alumnos; `whitespace-normal` en botones largos.
- **Tipo:** implementación.

### [Alto] 3 · 404 de rutas dinámicas: HTTP 200 y pintada dentro del shell (duplica `<main>` y «Tu perfil» de 32 px)
- **Dónde:** `/tareas/x`, `/notas/x`, `/profe/tareas/x`, `/profe/evaluar/x`, `/profe/equipos/5z`.
- **Condición:** cualquier ancho; alumno y profe.
- **Qué pasa:** estado 200 (hallazgo 4 de v1, sin corregir). Además la 404 aparece dentro del layout: dos `main#contenido` (id duplicado) y dos enlaces «Tu perfil», uno de 44 × 44 y otro de 32 × 32 (< 44 bajo 1024, D215); el foco queda en `body`.
- **Por qué importa:** lectores de pantalla ven dos landmarks principales; monitores/buscadores ven 200; objetivo táctil pequeño.
- **Evidencia:** `.qa/dqa/shots/repro9-404-shell.png`.
- **Repro:** `node .qa/repro/2-404-dinamico-http-200.mjs <base>` → `FAIL … HTTP 200 (5 rutas)`; `node .qa/repro/9-404-dentro-del-shell.mjs <base>` → `FAIL mains=2 #contenido=2 «Tu perfil»=44x44,32x32`.
- **Corrección sugerida:** comprobar existencia fuera del límite de Suspense/`loading.tsx` para devolver 404 real; que la página 404 no traiga su propio header ni `main` dentro del shell.
- **Tipo:** implementación.

### [Medio] 4 · Número blanco con sombra sobre amarillo/lima: 3,6–3,84:1 en notas 10–12 (D347 vs AA)
- **Dónde:** `GradePill` (`lib/grades.ts:104`, `GRADE_NUMERO_CLASS`); medido en `/profe/alumnos` (6 píldoras: 10, 11,5, 12…).
- **Condición:** claro y oscuro, 4 acentos.
- **Qué pasa:** axe: blanco + `text-shadow` sobre `rgb(245,212,0)`, `rgb(209,229,5)`, `rgb(189,224,7)` da 3,6–3,84:1 (< 4,5); sin sombra el blanco sobre ese amarillo es ≈ 1,4:1. En las pantallas del alumno no salió solo porque el seed del alumno de prueba no tiene notas 10–12.
- **Por qué importa:** el número es la información principal (D004); baja visión.
- **Evidencia:** salida del repro; `.qa/dqa/out/axe-profesor.json`.
- **Repro:** `node .qa/repro/8-contraste-pildora-nota-alumnos.mjs <base>` → `FAIL 6 pildoras …`.
- **Corrección sugerida:** volver a la tinta por contraste de D236 (`gradeInk`) al menos entre 8 y 13, u oscurecer el fondo en ese tramo (como D286 con los extremos).
- **Tipo:** decisión de diseño (choca con D347, elección de César; la regla AA no negociable gana).

### [Medio] 5 · Ideal del profe en oscuro: enlace subrayado 3,56:1
- **Dónde:** `/profe/tareas/[id]/ideal` · enlace `text-small-b text-accent-ink underline` (13 px) sobre `#59462c`.
- **Condición:** oscuro (el claro pasa).
- **Evidencia:** `.qa/dqa/shots/repro12-ideal-oscuro.png`.
- **Repro:** `node .qa/repro/12-ideal-profe-contraste-oscuro.mjs <base>` → `FAIL … 3.56`.
- **Corrección sugerida:** fondo con token que dé ≥ 4,5:1 con `accent-ink` en oscuro, o texto `--text`.
- **Tipo:** implementación.

### [Medio] 6 · Ranking: nombre accesible sin el texto visible (35 nodos) y pestaña de avatar con `aria-controls` inválido
- **Dónde:** `/ranking`, `/profe/ranking[/5c]` (botones del podio/filas `rounded-pod-step` y el avatar «Tu perfil»); `/perfil` (pestaña `adventurer-neutral` apunta a un panel no montado).
- **Condición:** todos los anchos, temas y acentos. axe `label-content-name-mismatch` (WCAG 2.5.3) y `aria-valid-attr-value`.
- **Por qué importa:** el control por voz («clic Elsa Soto») no encuentra el botón; referencia ARIA rota.
- **Repro:** `10-ranking-podio-etiqueta-nombre.mjs` → `FAIL 36 nodos`; `11-perfil-aria-controls-invalido.mjs` → `FAIL #radix-…-trigger-adventurer-neutral`.
- **Corrección sugerida:** `aria-label` que empiece por el texto visible («Elsa Soto, puesto 1, 32,5 puntos»); en `/perfil` montar los paneles inactivos (`forceMount`/`hidden`) o quitar `aria-controls`.
- **Tipo:** implementación.

### [Bajo] 7 · Ranking: nombres con elipsis también a 1024 px
`/ranking`, `/ranking/equipos`, `/profe/ranking/**` truncan «Raquel Figueroa», «Armando Osorio» (115 > 59) a 320, 360, 390 **y 1024**. Es la corrección aceptada de v1 (repro 1 PASS), pero a 1024 hay sitio de sobra. Evidencia `.qa/dqa/shots/estudiante-ranking-w320.png`, `.qa/dqa/out/anchos-estudiante.json`. Tipo: decisión de diseño.

### [Bajo] 8 · Alturas desiguales de tarjetas en una misma fila
`/profe/equipos/5a` (3 columnas, 1440): 594/699/687 y 627/639/684 px; `/equipo`: 337 vs 342; `/profe`: 291 vs 296 (no se estiran). `/tareas`, `/notas`, `/profe/tareas`, `/profe/alumnos`: sin filas de varias tarjetas. Si D216 no pide masonry, alinear con `items-stretch`. Tipo: decisión de diseño.

### [Bajo] 9 · Copy con género fijo en la vista del integrante
«Las respuestas aparecen aquí cuando **él** las envíe» con una capitana (`/tareas/qa-partes` como integrante). Usar «cuando las envíe» o el nombre. Tipo: implementación (copy provisional).

### [Bajo] 10 · `RespuestaEnlace` parte la URL en cualquier punto
`break-all` (D470): 9 líneas a 320 y 4 a 1440, sin desbordar. Es lo diseñado; se anota porque parte palabras dentro de la URL. Tipo: decisión de diseño.

## Pendientes concretos (resultado)

- **Reparto capitán/integrante a 320 px:** limpio. `scrollWidth` 320 en capitán, integrante y portador de parte `tomada`; tarjetas por pregunta apiladas, Select a ancho completo, URL larga envuelta, Aceptar/Devolver visibles (`.qa/dqa/shots/estudiante-tareas-qa-partes-w320.png`, `integrante-partes-w320.png`, `tomada-w320.png`).
- **Candado de pregunta asignada a otro:** presente en capitán («Asignada a Paola Padilla: aún no te la entrega», «Jimena Pérez te la entregó: acéptala o devuélvela en Reparto») y en integrante («Solo Jimena puede responder»); ícono + texto, sobrevive a forced-colors.
- **Aviso de parte `tomada`:** al integrante («Raquel decidió responder las preguntas que te había asignado…», 320 limpio) y al capitán (chip «La respondes tú en su lugar» con ícono). Ver Alto 2 por el chip a texto 200 %.
- **«La respondo yo»:** el diálogo abre con foco en «Cancelar»; con Escape el foco vuelve al botón disparador (teclado real).
- **Ideal a 320 px:** `/profe/tareas/[id]/ideal` limpio a 11 anchos. Vista del alumno: sin verificar.
- **Respuesta de enlace larga:** no desborda en 11 anchos en capitán, Evaluar, detalle de nota ni parte entregada. `ideal-respuesta.tsx:71` sigue sin `break-words`, pero `body` hereda `overflow-wrap: break-word` (globals.css:1527) y la palabra de 65 letras no desbordó en las rutas medidas; no confirmado en la vista del ideal del alumno.
- **Alturas de tarjetas:** ver Bajo 8.

## Sin verificar

- `/tareas/[tarea]/ideal` del alumno: mi siembra no cumplió la vigencia del servidor y responde 404 aun con tarea cerrada; esa vista no se midió (sí la del profe).
- Daltonismo y grises: no re-corrí `vision.mjs`; v1 estaba limpio. Los chips nuevos de partes llevan ícono + palabra (código y capturas).
- Zoom 400 %: cubierto por el barrido de 320; zoom 200 % a 1280 y texto 200 % en laptop no re-corridos.
- Selección y scrollbar: iguales a COLORS.md (selección 22 % claro y 40 % oscuro; thumb y track medidos en ambos temas); ratio thumb/track no calculado.
- Alto contraste de las rutas del profe: solo capturas del barrido, sin revisión caso por caso; Windows real no probado.
- Imágenes subidas (B2 no disponible en QA local): respuestas de imagen, miniaturas, ideal con imagen.
- Pantallas de estado (500, offline, mantenimiento), favicon y OG no re-corridas en v2 (la 404 de ruta desconocida responde 404 y limpia a 11 anchos; `/recuperar/*` limpio). `/crear-contrasena` requiere token: no auditada.
- Contenido extremo: solo una palabra de 65 letras y un enlace largo; no 50 ítems ni +30 % de texto.
- Foco al h1 en un 500 real; transiciones de acordeón y pestañas con movimiento normal (con reduce nada anima; sin reduce solo spinner, En vivo y confeti/VS del ranking).

## Coherencia del sistema

- Valores arbitrarios: solo logo (`top-[10%]` y similares), `min-w-[min(--spacing(N),100%)]` (patrón de v1) y `rounded-[inherit]`; cero hex o px en `className`. Los `style` en línea son `gradeColor`, degradado de leyenda, `scaleX` de progreso y OG.
- Interacción de tokens: D217 por D301 rompe el contraste (Alto 1); D347 choca con D236 y AA (Medio 4).
- Segmentados a 40 px visibles con área de 44 por `::after` (D215): no cuentan como fallo.
- Íconos todos `lucide-react`.

## Matriz de cobertura

| Ruta | 320–3840 | Texto 200 % 390 | Dark | 4 acentos | axe | Forced | Reduced motion |
|---|---|---|---|---|---|---|---|
| `/` | ✅ | ✅ | ❌ contraste | ❌ | ❌ oscuro | ✅ | ✅ |
| `/notas`, `/notas/[t]` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/tareas`, `/tareas/[t]` individual y enlace | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ |
| `/tareas/[t]` grupal por partes | ✅ | ❌ 507 px | ✅ | — | ⚠️ 1 nodo | ✅ | ✅ |
| `/tareas/[t]/ideal` | ⏳ | ⏳ | ⏳ | — | ⏳ | ⏳ | ⏳ |
| `/equipo`, `/perfil` | ✅ | ✅ | ✅ | ✅ | ⚠️ perfil aria | ✅ | ✅ |
| `/ranking`, `/ranking/equipos` | ⚠️ elipsis | ✅ | ✅ | ✅ | ⚠️ 35 nodos | ✅ | ✅ |
| `/profe`, `/profe/alumnos` | ✅ | ❌ 398/395 | ✅ | ✅ | ❌ píldoras | ✅ | ✅ |
| `/profe/evaluar`, `/evaluar/[e]` | ✅ | ❌ 623 px | ✅ | — | ✅ | ✅ | ✅ |
| `/profe/tareas/**`, `…/ideal` | ✅ | ✅ | ❌ ideal 3,56 | ✅ | ⚠️ | ✅ | ✅ |
| `/profe/equipos`, `puntos`, `premios`, `perfil`, `secciones`, `profesores`, `ranking` | ✅ | ✅ | ✅ | ✅ | ⚠️ ranking y perfil | ✅ | ✅ |
| `/ingresar`, `/recuperar/**`, 404 | ✅ | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| dinámicas inexistentes | ✅ | — | — | — | — | — | ❌ HTTP 200 |

## Orden para frontend-build

1. Alto 1 (tarjeta de puntos oscuro) · 2. Alto 2 (texto 200 %: Evaluar, partes, Panel, Alumnos) · 3. Alto 3 (404 dinámica) · 4. Medio 4 (píldora 10–12, requiere decisión de César) · 5. Medio 6 (etiquetas ranking y aria-controls) · 6. Medio 5 · 7. Bajos 7–10.

Repros (cada uno imprime PASS o FAIL con la medida): `bash .qa/repro/todos.sh http://localhost:<puerto>`. Fallan en main: 2, 7, 8, 9, 10, 11, 12, 13. Pasan: 1, 3, 4, 5, 6. Los repros 8 y 12 y las capturas de partes dependen de los datos sembrados con `node .qa/dqa/datos.mjs` (base `qa_4303`).

## Feedback para el kit

- Prevención · reference/QA-PREVENTION.md · Un token que cambia de significado por tema (`--accent-ink` claro en oscuro) · Al cambiar un token de un tema, buscar todo `bg-<token>` y repasar el par con su texto en los dos temas y los 4 acentos (D217 por D301).
- Prevención · reference/QA-PREVENTION.md · Texto 200 % en rutas nuevas · Chips y botones `inline-flex shrink-0` en una fila llevan `flex-wrap` y `max-w-full`; correr el repro de texto 200 % sobre toda ruta nueva.
- Prevención · reference/QA-PREVENTION.md · Contraste con `text-shadow` · No aceptar texto blanco con sombra sobre fondos claros de una escala continua; medir con axe en el rango completo de datos (notas 1–20), no solo con el seed del usuario de prueba.
- Prevención · reference/STATUS-SCREENS.md · La 404 dentro del shell no repite header ni main; comprobar existencia fuera de Suspense (segunda vez que aparece).
- Herramienta · `qa:local --postgres` no crea cuentas de prueba (sin ruta de sign-up) y `.env.test.local` trae contraseñas de los emuladores: documentar `bun scripts/seed-db.ts` con `DATABASE_URL` de la base QA.
