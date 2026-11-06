# QA de diseño — versión 1 (fase 09) — 2026-11-05/06

`main @ d50568b` · slot `C:/Users/Cesar/Documents/Work/krea-wt/wt3`

**Entorno:** Chromium 156 headless (Playwright 1.64, node) · `next dev` en :4303 sobre los emuladores Firebase de functional-qa (`qa:local --no-reset`) · cuentas de prueba alumno 33272397 y profesor 10000000 · **verificado en navegador: sí**.
**Resultado:** 0 críticos · 3 altos (+1 alto ya conocido: galerías públicas) · 4 medios · 3 bajos.

**Incidencias del entorno (no son hallazgos de la app):**
- El `node_modules` de wt3 estaba desfasado (29-oct, sin `firebase-admin` ni `gcp-metadata`): `qa:local` fallaba en el seed y el servidor daba 500. Se corrigió con `bun install --frozen-lockfile` (sin tocar código ni lockfile). Prevención para el pool: comprobar la huella de `node_modules` contra `bun.lock` al asignar un slot.
- Los emuladores de functional-qa cayeron dos veces; se esperó y se reutilizaron. La sesión del alumno se revocó varias veces mientras functional-qa probaba W4 (cambio de contraseña): `ir()` del barrido detecta la caída a `/ingresar` y vuelve a entrar; los resultados se validaron con la ruta final.
- El Chromium completo no arranca en esta máquina (`spawn UNKNOWN`); el texto al 200 % se midió con CDP `Page.setFontSizes` (32 px), que escala `rem` **y** las media queries en `rem`, igual que el ajuste real del navegador.
- `scripts/qa/paginas.mjs` y `segmentado.mjs` no se corrieron: necesitan `bun run build` (build local suprimido).

## Resumen

El sistema está sólido: **axe 0 violaciones** en todas las rutas (alumno, profesor, públicas) en claro y oscuro y en los **4 acentos × 2 temas**; sin scroll horizontal de 320 a 3840; zoom 400 % y altura corta limpios (D218); daltonismo y escala de grises sin pérdida (la nota siempre lleva número, Raspado lleva chip con ícono, Pendiente borde punteado: D004 cumplido); reduced motion apaga todo; selección y scrollbar con sus tokens. Lo que más importa: **(1)** con el texto del sistema al 200 % en el móvil se pierden controles de la barra superior y la nota se sale de su tarjeta; **(2)** en alto contraste de Windows desaparece el logo y no se ve qué opción está activa en ningún segmentado; **(3)** las rutas dinámicas inexistentes muestran la 404 con HTTP 200.

## Hallazgos

### [Alto] 1 · Texto del sistema al 200 % en móvil: la barra superior, las pestañas y la nota se salen de la pantalla
- **Dónde:** todas las rutas del alumno y del profesor por debajo de `lg`. `components/layout/bottom-nav.tsx:26` (`h-8 w-14` en rem por ítem: 5 × 112 px), `components/sections/ranking/ranking-header.tsx:19` (chip En vivo), `components/layout/top-bar.tsx` (avatar «Tu perfil» / botón «Menú»), `components/sections/notas/grade-summary.tsx:52` y `components/sections/equipo/team-hero.tsx:39` y `components/sections/evaluar/review-header.tsx:101` (`min-w-55`), `components/sections/perfil/profile-identity.tsx:43` (`min-w-50`), `GradePill xl`.
- **Condición:** 390 × 844 con la fuente del navegador en 32 px (ajuste de texto del sistema al 200 %).
- **Qué pasa:** `scrollWidth` 401–623 px > 390 en las 11 rutas del alumno y 16 del profesor. En `/ranking` el avatar «Tu perfil» y el chip «En vivo» quedan fuera (x 439–527), la pestaña «Equipos» cortada; en `/notas/[tarea]` la píldora 18,5 desborda la tarjeta; en el profe el botón «Menú» queda fuera (x 256–453). A 1280 con el mismo ajuste (pasa a la vista móvil por los breakpoints en rem) todo queda limpio.
- **Por qué importa:** la audiencia principal es estudiante en móvil; quien sube el texto del sistema pierde el acceso al perfil/menú sin scroll horizontal (WCAG 1.4.4).
- **Evidencia:** `wt3/.qa/dqa/shots/repro3-ranking.png`, `repro3-notas-identidad-de-marca.png`, `repro3-perfil.png`; `wt3/.qa/dqa/out/texto-estudiante.log`, `vision-profesor.log`.
- **Repro:** `node .qa/repro/3-texto-200-movil.mjs http://localhost:4303` → hoy `FAIL / 422>390 | /notas 401>390 | /ranking 570>390 | /perfil 478>390 | /notas/identidad-de-marca 520>390`.
- **Corrección sugerida:** medidas de contenedor que no escalen con el texto o que cedan: `min-w-0` + `flex-wrap` en los `min-w-55/50`, la píldora xl con `max-w-full`, el ítem de la barra inferior con `w-full max-w-14`, y la barra superior que envuelva o esconda el chip En vivo cuando no cabe (container query).
- **Tipo:** implementación.

### [Alto] 2 · Alto contraste (forced-colors): el logo KREA desaparece
- **Dónde:** todas las pantallas (barra superior, lateral, login, estados). `components/krea/logo.tsx:57-61` (capas `krea-mask-ink` / `krea-mask-splash` = máscara CSS + `background-color`), y el `Isotipo` (`logo.tsx:99-101`).
- **Condición:** `forced-colors: active` (Windows alto contraste), cualquier ancho.
- **Qué pasa:** el fondo de las 4 capas se fuerza a `Canvas` (rgb 255,255,255 = fondo) y el logo no se ve.
- **Por qué importa:** quien usa alto contraste no ve la marca ni el ancla visual de la cabecera (el nombre accesible sí se mantiene).
- **Evidencia:** `wt3/.qa/dqa/shots/repro4-forced-ingresar.png`, `estudiante-perfil-forced.png`, `estudiante-notas-forced.png`, `profesor-profe-alumnos-forced.png` (lateral sin logo).
- **Repro:** `node .qa/repro/4-forced-colors-logo.mjs <base>` → `FAIL 4/4 capas del logo = fondo rgb(255, 255, 255) (forced-color-adjust auto)`.
- **Corrección sugerida:** en las capas, `forced-colors:bg-[CanvasText]` (o `forced-color-adjust: none` en el contenedor del logo).
- **Tipo:** implementación.

### [Alto] 3 · Alto contraste: en los segmentados no se distingue la opción activa
- **Dónde:** `components/ui/toggle-group.tsx:117` (`data-[state=on]:bg-surface … shadow-1`), `components/ui/tabs.tsx:88` (segmented), `components/sections/ranking/segmented-links.tsx`. Visto en `/notas` (Todas/Individuales/Grupales), `/ranking` (Estudiantes/Equipos), `/perfil` (Claro/Oscuro/Sistema, pestañas y opciones de avatar) y en el profesor: `/profe` (Ambas/5A/5C), `/profe/alumnos` (5A · 35 / 5C · 34), `/profe/tareas/nueva` (Individual/Grupal, Texto/Imagen).
- **Condición:** `forced-colors: active`.
- **Qué pasa:** la activa tiene fondo `Canvas` y las inactivas transparente sobre `Canvas`; la sombra se elimina; mismo peso de letra. Las tres opciones son idénticas. Los círculos de acento también desaparecen (queda solo el ✓ del elegido).
- **Por qué importa:** el estado seleccionado queda solo en el color de fondo, que alto contraste anula (DESIGN_RULES: ningún estado solo por color).
- **Evidencia:** `wt3/.qa/dqa/shots/repro5-ranking.png`, `repro5-notas.png`, `repro5-perfil.png`, `profesor-profe-alumnos-forced.png`, `profesor-profe-tareas-nueva-forced.png` (barrido del profe: `node .qa/dqa/profe-pref.mjs <base>`).
- **Repro:** `node .qa/repro/5-forced-colors-segmentado.mjs <base>` → `FAIL activo indistinguible: /notas «Todas» = «Individuales» | /perfil «Aventurero» = «Emoji» | /perfil «Sistema» = «Claro» | /ranking «Estudiantes» = «Equipos»`.
- **Corrección sugerida:** en el estado activo, `forced-colors:outline-2 forced-colors:outline-[Highlight]` (o borde `Highlight`) en ToggleGroup, Tabs segmented y SegmentedLinks; para los acentos, borde `CanvasText` en el círculo.
- **Tipo:** implementación.

### [Alto · conocido] Galerías internas públicas con datos reales del seed
- **Dónde:** `/secciones/**`, `/componentes`, `/tokens` (sin control de entorno); `/estados` sí se oculta en producción (`galeriaEstadosVisible`, `app/estados/page.tsx:140`).
- **Qué pasa:** sin sesión responden 200 en :4303 (`/tokens`, `/secciones/alumnos`, `/secciones/notas` medidos; `noindex`). Por código, en producción solo `/estados` da 404. No pude medir la URL de producción (no hay despliegue registrado en GitHub).
- **Ya está en:** backlog (F07 W2, alta), D181 «Open», CURRENT_PHASE «Next». Se reporta para que no se cierre la versión sin resolverlo.

### [Medio] 4 · Tareas, entregas y equipos inexistentes muestran la 404 con HTTP 200
- **Dónde:** `app/(estudiante)/notas/[tarea]/page.tsx:39`, `app/(estudiante)/tareas/[tarea]/page.tsx:49`, `app/(profesor)/profe/tareas/[id]/page.tsx:45`, `app/(profesor)/profe/evaluar/[entrega]/page.tsx:60`, `app/(profesor)/profe/equipos/[seccion]/page.tsx:25`. Cada ruta tiene `loading.tsx`: el `notFound()` llega después de que la respuesta ya salió en streaming con 200.
- **Condición:** con sesión, cualquier ancho. Una ruta raíz inventada sí da 404.
- **Qué pasa:** la pantalla «Esta página se fue de recreo» se pinta bien, pero el estado HTTP es 200; además el `<head>` lleva 2–3 `<meta name="robots">` duplicados.
- **Por qué importa:** STATUS-SCREENS exige el estado real (monitoreo, enlaces rotos de tareas despublicadas). Impacto bajo en SEO (rutas con sesión y `noindex`).
- **Evidencia:** `wt3/.qa/dqa/shots/repro2-estudiante-notas-tarea-que-no-existe.png`, `repro2-profesor-profe-equipos-5z.png`.
- **Repro:** `node .qa/repro/2-404-dinamico-http-200.mjs <base>` → `FAIL estudiante /notas/tarea-que-no-existe HTTP 200 | estudiante /tareas/tarea-que-no-existe HTTP 200 | profesor /profe/tareas/no-existe HTTP 200 | profesor /profe/evaluar/no-existe__00000000 HTTP 200` (y `/profe/equipos/5z` 200). Medido en `next dev`; confirmar en el preview de Vercel.
- **Corrección sugerida:** resolver la existencia antes del límite de Suspense (en `generateMetadata` o en un `layout` del segmento dinámico, que no está envuelto por `loading.tsx`) o validar el id con `generateStaticParams`/`dynamicParams`. Decisión de implementación de Next 16: leer `node_modules/next/dist/docs` sobre `notFound` y streaming.
- **Tipo:** implementación.

### [Medio] 5 · `/ingresar` se comparte sin imagen: la metadata de la página borra la OG del layout
- **Dónde:** `app/(auth)/ingresar/page.tsx:15-16` (`openGraph` y `twitter` propios) frente a `app/layout.tsx:33-44`.
- **Qué pasa:** el HTML de `/ingresar` solo trae `og:title`, `og:description`, `twitter:card=summary`. Se pierden `og:image` (la imagen `/opengraph-image` existe y responde 200, `shots/og.png`), `og:type`, `og:locale es_VE`, `og:site_name` y `summary_large_image` (la fusión de metadata es superficial).
- **Por qué importa:** es la única página indexable (D023) y la que se comparte por WhatsApp: el enlace sale sin la tarjeta de marca.
- **Repro:** `curl -s <base>/ingresar | grep -oE "<meta (property|name)=\"(og|twitter):[^\"]*\""` → falta `og:image`.
- **Corrección sugerida:** en la página, extender en lugar de reemplazar (`openGraph: { ...openGraphBase, title, description }`, exportando la base desde `lib/site.ts`), igual con `twitter`.
- **Tipo:** implementación.

### [Medio] 6 · Ranking a 320 px: con chip «Empate» el nombre queda en una letra
- **Dónde:** `/ranking`, `/ranking/equipos`, `/profe/ranking/**` · `components/krea/rank-row.tsx:108` (`truncate` sin otra vía) + chip `Empate` (`:119-122`).
- **Condición:** 320 px (a 360 ya pasa).
- **Qué pasa:** el nombre mide 27 px de los 90–116 que necesita: «Á…», «Y…», «Ei…», «W…», «5A-G5 Ce…». El handoff permite elipsis en el ranking, pero aquí no queda nada legible.
- **Por qué importa:** el alumno no puede saber con quién está empatado en el teléfono más pequeño.
- **Evidencia:** `wt3/.qa/dqa/shots/repro1-320-ranking.png`, `estudiante-ranking-equipos-w320.png`.
- **Repro:** `node .qa/repro/1-ranking-nombre-recortado.mjs <base>` → `FAIL 5 nombres < 64px: 320 /ranking «Ángel Pernia» 27px de 90 (con Empate) | … | 320 /ranking/equipos «5A-G5 Celulares» 27px de 116 (con Empate)`.
- **Corrección sugerida:** por debajo de 360, el chip «Empate» baja a la línea del subtítulo (o pasa a un «=» con `aria-label`), y el nombre gana el ancho.
- **Tipo:** implementación.

### [Medio] 7 · Foco con Tab en móvil: el elemento enfocado queda debajo de la barra inferior
- **Dónde:** `/perfil` (pestañas de avatar «Aventurero…», segmentado de tema), y en la primera pasada `/` y `/notas` (enlaces de la lista de notas) · 390 × 844. Falta `scroll-padding-bottom` en el documento para la barra inferior fija.
- **Qué pasa:** tras 900 ms (fin del scroll suave), el foco queda debajo de la barra inferior: «Aventurero» 100 % tapado (y 796–840, barra desde 772), «Sistema» 100 % (y 804–844); en la primera pasada «Identidad de marca» en `/` quedó al 71 %. Depende de dónde cae el elemento al hacer scroll: no pasa siempre, pero pasa en cada ruta larga.
- **Por qué importa:** quien navega con teclado o switch en móvil/tablet no ve dónde está el foco (2.4.7; 2.4.11 en WCAG 2.2).
- **Evidencia:** `wt3/.qa/dqa/shots/repro6-perfil.png` (foco en «Aventurero», oculto bajo la barra).
- **Repro:** `node .qa/repro/6-foco-tapado-barra.mjs <base>` → hoy `FAIL 4: /perfil button «Aventurero» 100% bajo barra (y 796-840) | /perfil button «Sistema» 100% bajo barra (y 804-844)` (excluye «Saltar al contenido», que va encima de la barra a propósito).
- **Corrección sugerida:** `html { scroll-padding-bottom: calc(var(--h-bnav) + env(safe-area-inset-bottom) + 1rem) }` por debajo de `lg` (y `scroll-padding-top` = topbar), sin tocar `bajo:` (D218).
- **Tipo:** implementación.

### [Bajo] 8 · Título de la barra superior cortado a 320 junto a «Guardar borrador»
- `/profe/tareas/nueva` muestra «Nueva t…» (78 px) en `components/layout/top-bar.tsx:68`; el `<h1>` repite el texto debajo, así que no se pierde información. `shots/profesor-profe-tareas-nueva-w320.png`.

### [Bajo] 9 · Archivos de la plantilla de Next publicados
- `public/next.svg`, `vercel.svg`, `file.svg`, `globe.svg`, `window.svg` responden 200 y nadie los usa (grep vacío). Señalar, no borrar sin César.

### [Bajo] 10 · `<meta name="robots">` duplicado en la 404 de rutas dinámicas
- 2–3 etiquetas con valores distintos (`noindex, nofollow` / `noindex`). Se arregla junto con el 4.

## Lo que pasó limpio (verificado)

- **axe** (wcag2a/aa, 21a/aa): 0 violaciones en 11 rutas del alumno, 17 del profesor y 5 públicas, claro y oscuro; y en rojo/verde/morado/azul × claro/oscuro sobre `/`, `/notas`, `/ranking`, `/perfil`, `/equipo`, `/profe`, `/profe/alumnos`, `/profe/ranking`, `/profe/tareas/nueva`, `/ingresar` y la 404 (`out/axe-*.json`).
- **Anchos 320–3840:** sin scroll horizontal en ninguna ruta; a ≥ 2560 el contenido queda centrado con el contenedor del handoff.
- **Zoom 400 % (320 × 200), 200 % (640 × 400), iPhone SE 375 × 667, apaisado 844 × 390:** sin scroll horizontal ni fijos más altos que la pantalla; con `bajo:` (D218) solo queda la barra de acción.
- **Texto 200 % en laptop (1280):** limpio en todas las rutas del alumno y del profesor.
- **Daltonismo** (acromatopsia también en `/profe`, `/profe/alumnos`, `/profe/evaluar`, `/profe/tareas/nueva`, `/profe/ranking`: `shots/profesor-*-gris.png`; las cuatro matrices) en `/`, `/notas`, `/notas/[tarea]`, `/ranking`, `/equipo`, `/tareas`, `/perfil`: nota con número, Raspado con chip e ícono, Pendiente con borde punteado y reloj, zona de riesgo con ícono y texto, Empate con chip. D004 cumplido.
- **Reduced motion:** nada anima (ni el punto «En vivo» ni el spinner) y el scroll pasa a `auto`. Sin la preferencia: diálogo con `k-fade-in` 250 ms y transiciones de 150 ms.
- **Selección y scrollbar:** iguales a COLORS.md en claro y oscuro.
- **Sin conexión:** banner con hora y Reintentar (`aria-live=polite`) y toast «Volviste a estar en línea» (`shots/offline-banner-inicio.png`).
- **Pantallas de estado** (`/estados`, 11 variantes × 390/1440 × claro/oscuro): misma familia, sin desbordes; 500 con y sin código; errores con `role=alert`; cargas con `role=status`.
- **Marca:** favicon SVG con variante oscura (`shots/favicon-dark.png`), `favicon.ico`, `apple-icon` 180, manifest 192/512/maskable, `theme-color` por esquema, OG 1200 × 630 fiel a la plantilla (`shots/og.png`).
- **Sin audio ni video:** no hay `<video>` ni `<audio>`.

## Sin verificar

- Foco que vuelve al disparador al cerrar diálogos; foco al `<h1>` en un 500 real (solo la galería).
- Acordeón «¿Cómo se calculan…?» y anclas del índice de preguntas (mi selector no encontró disparador).
- Contenido extremo inyectado (40 caracteres sin espacios, 50 ítems, +30 % de texto): no corrido; los títulos largos y `<script>` del seed de functional-qa se escapan y envuelven bien.
- URL de producción: sin despliegue registrado; las galerías se juzgan por el código.

## Coherencia del sistema

- Valores arbitrarios: solo `calc()`/`dvh`/`env()` de layout, `aspect-[1779/981]` del logo, porcentajes del isotipo y `tracking-[0.06em]` de la cabecera de tabla (D044). Cero hex en `className`; los `style` en línea son `gradeColor()` y anchos dinámicos.
- Íconos: todos `lucide-react`, trazo 2; 16/20/24 y 14 donde el HANDOFF §2.3 lo pide.
- Animaciones: solo `transform`/`opacity`; con reduced motion, duración 0.
- Ninguna regla `@media (forced-colors)` en `globals.css`: causa común de los hallazgos 2 y 3.

## Matriz de cobertura

| Ruta | 320 | 360 | 768 | 1024 | 1440 | 1920 | 2560 | 3840 | Zoom 400 % | Texto 200 % | Dark | Acentos | CVD | Alto contraste |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `/ingresar`, `/recuperar/**` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ | — | ❌ logo |
| `/` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ móvil | ✅ | ✅ | ✅ | ❌ logo |
| `/notas`, `/notas/[tarea]` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ móvil | ✅ | ✅ | ✅ | ❌ segmentado |
| `/tareas`, `/tareas/[tarea]` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ móvil | ✅ | — | ✅ | ⚠️ logo |
| `/equipo` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ móvil | ✅ | ✅ | ✅ | ⚠️ logo |
| `/ranking`, `/ranking/equipos` | ⚠️ nombres | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ móvil | ✅ | ✅ | ✅ | ❌ segmentado |
| `/perfil` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ móvil | ✅ | ✅ | ✅ | ❌ segmentado |
| `/profe`, `/profe/alumnos` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ móvil | ✅ | ✅ | ✅ | ❌ segmentado, logo |
| `/profe/evaluar/[entrega]` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ móvil | ✅ | — | ✅ | ⚠️ logo |
| `/profe/tareas/**` | ⚠️ título | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ móvil | ✅ | ✅ | ✅ | ❌ segmentado |
| `/profe/equipos/**`, `puntos`, `premios`, `perfil` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ móvil | ✅ | — | ⏳ | ⏳ |
| `/profe/ranking/**` | ⚠️ nombres | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ móvil | ✅ | ✅ | ✅ | ⚠️ logo |
| 404 / 500 / sin conexión | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | ✅ | ✅ | — | ⚠️ logo |

✅ limpio · ⚠️ menor o mismo hallazgo · ❌ hallazgo · ⏳ sin verificar · — no aplica. Texto 200 % en laptop: ✅ en todas.

## Orden para frontend-build

1. Alto 1 (texto 200 % móvil) · 2. Alto 3 (segmentados en alto contraste) · 3. Alto 2 (logo en alto contraste) · 4. Galerías (conocido) · 5. Medio 7 (foco bajo la barra) · 6. Medio 6 (ranking 320) · 7. Medio 5 (OG) · 8. Medio 4 (404 con 200) · 9. Bajos.

Repros: `bash .qa/repro/todos.sh http://localhost:<puerto>` en el slot (cada uno imprime `PASS` o `FAIL <medida>`). Barrido: `.qa/dqa/` (`anchos`, `axe`, `vision`, `prefs`, `estados`).

## Feedback para el kit

- Prevención · reference/QA-PREVENTION.md · §6 «Alto contraste» (nueva) · Todo estado seleccionado (segmentado, tab, opción) y todo dibujo con `background-color` + máscara (logo, íconos de color) lleva variante `forced-colors:` (borde u outline `Highlight`, fondo `CanvasText`).
- Prevención · reference/QA-PREVENTION.md · §4 · Texto al 200 % en 390 px con el ajuste real (CDP `Page.setFontSizes`, que mueve también los breakpoints en rem): nada de `min-w-*`/`w-*` en rem en filas que no envuelven; ítems de barras fijas con `max-w`. Inyectar `html{font-size:200%}` da falsos positivos.
- Prevención · reference/QA-PREVENTION.md · §5 · Con barra inferior fija, `scroll-padding-bottom`/`-top` del documento igual a su alto, para que el foco con Tab no quede tapado.
- Prevención · reference/STATUS-SCREENS.md · `notFound()` en una ruta con `loading.tsx` responde 200: comprobar la existencia fuera del límite de Suspense.
- Prevención · stack Next (SEO) · `openGraph`/`twitter` de una página reemplazan los del layout: extender una base compartida.
- Herramienta · `reference/scripts/design-qa.ts` › `browserWithFont` (Chromium completo) falla en Windows con `spawn UNKNOWN`; CDP `Page.setFontSizes` sirve en el headless shell. El pool debería comprobar `node_modules` contra `bun.lock` al dar un slot.
