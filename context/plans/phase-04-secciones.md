# Fase 04 — Secciones · plan de olas

> Escrito por `orchestrate` el 2026-10-30 (sesión cloud). Cada ola corre en **su propia sesión**.
> Fase: `phases/04-SECTIONS.md` · Handoff §3 (layout por pantalla), §4 (grilla), §8 (trampas)
> **Sin QA hasta el final del proyecto** (César, 2026-10-29): ninguna ola lanza `wave-qa`, ni servidor, ni capturas.
> Sin versionado: ningún PR lleva changeset. Sin datos reales: no se toca Firebase (eso es la fase 07).
> **En sesión cloud** no hay pool: las unidades de la ola van una tras otra, cada una con PR → CI verde → squash (`cloud-session` §2).

Punto de partida (`origin/main` tras el cierre de la fase 03): todos los componentes del handoff §2 existen
(`COMPONENTS_INVENTORY.md`), con las utilidades de layout `page-pad`, `page-stack`, `g2`, `g3`, `g4`, `g-home`,
`g-side` y los contenedores por rol. **No existen:** `ActionBar`, `GradeRow`, encabezado de página, datos de
ejemplo tipados ni una ruta para ver secciones. No hay entorno DOM de pruebas: las pruebas son de lógica pura.

## Cómo se construye una sección (lo fija W1, D066)

- Cada sección es un componente de presentación en `components/sections/<pantalla>/<seccion>.tsx`: recibe **props**
  (nada de Firestore; la fase 07 cambia la fuente, no el componente). La lógica derivada (textos dinámicos,
  ordenaciones, filtros) va en `lib/` con pruebas.
- Los datos de ejemplo salen de `data/seed/` (reales: nombres, cédulas, secciones, equipos, notas, puntajes de
  "Identidad de marca") y de `lib/demo/` (placeholders del handoff §8, marcados y con fila en el checklist).
- Vista previa: `app/secciones/<pantalla>/page.tsx` (no indexada) monta la pantalla completa dentro de `AppShell`
  con su navegación y los datos de ejemplo. La fase 05 crea la ruta real reutilizando las mismas secciones.
- Breakpoints del handoff §3/§4 tal cual: por debajo de 1024 una columna en el orden del DOM; el handoff ya dice qué
  se oculta en móvil (feed del ranking) — no se oculta nada más.

## Olas

| Ola | Unidades (rama · qué · archivos) | Depende de | Estado |
|---|---|---|---|
| 1 | `feat/sec-base` · `lib/demo/` (datos de ejemplo tipados desde el seed + placeholders), `PageHeader` (eyebrow, h1, ayuda, acciones), `GradeRow` (fila de nota compartida Inicio/Mis notas/Mi equipo, §8), `ActionBar` (§4), índice `/secciones` · `lib/demo/*`, `components/sections/shared/*`, `app/secciones/{layout,page}.tsx` | fase 03 | cerrada (#20) |
| 1 | `feat/sec-ingresar` · Ingresar, Recuperar, Enviado, Nueva (+ panel de marca ≥ 1024, errores de servidor como estados) · `components/sections/auth/*`, `lib/auth-copy.ts`, `app/secciones/ingresar/[estado]/page.tsx` | W1 | cerrada (#21) |
| 1 | `feat/sec-inicio` · Saludo, Tarjeta de puntos, Mis notas, Por entregar, Mi equipo (`g-home` ≥ 1024) · `components/sections/inicio/*`, `lib/inicio.ts`, `app/secciones/inicio/page.tsx` | W1 | cerrada (#22) |
| 2 | `feat/sec-notas` · Mis notas (leyenda + lista con segmentado) y Detalle de nota (resumen con base + preguntas) | ola 1 (`GradeRow`) | cerrada (#23) |
| 2 | `feat/sec-tareas` · `/tareas` (Por entregar / Entregadas) y entrega (encabezado, premio, aviso de capitán, preguntas, barra de acción, diálogo, Entregada) | ola 1 (`ActionBar`) | cerrada (#24) |
| 2 | `feat/sec-equipo` · Mi equipo (cabecera, integrantes, notas y premios, vacío) | ola 1 | cerrada (#25) |
| 2 | `feat/sec-perfil` · Perfil (identidad, datos, avatar, apariencia, seguridad) | ola 1 | cerrada (#26) |
| 3 | `feat/sec-ranking` · Ranking estudiantes/equipos (encabezado, podio, lista, zona de riesgo, aside «Cómo se calculan» + «Últimos movimientos») | ola 1 | cerrada (#28) |
| 3 | `feat/sec-profe-panel` · Panel del profesor (saludo por hora, métricas `g3`, Por evaluar, Últimos ajustes) | ola 1 | cerrada (#29) |
| 3 | `feat/sec-evaluar` · Evaluar entrega (cabecera, medidor fijo, preguntas con `ScorePicker` en `QuestionCardReview`, acción) + `GradePill` 88×64 de Total en vivo + `NumberStepper` con `value: null` | ola 1 (`ActionBar`) | cerrada (#30) |
| 3 | `feat/sec-alumnos` · Alumnos (filtros, búsqueda sin tildes, tabla, diálogo Editar con base y motivo) | ola 1 | cerrada (#27) |
| 4 | `feat/sec-equipos-profe` · Equipos del profesor (tarjetas, capitán, mover, Sin equipo, subir logo) | ola 3 | pendiente |
| 4 | `feat/sec-tareas-profe` · Lista de tareas y constructor (Datos, Preguntas, suma = 20, publicar) | ola 3 | pendiente |
| 4 | `feat/sec-puntos` · Ajustes de puntos (formulario con motivos fijos, vista previa, historial con anular) | ola 3 | pendiente |
| 4 | `feat/sec-premios` · Premios (ganado / en juego / por definir, empate) | ola 3 | pendiente |

Reglas de reparto:
- **Cada unidad toca solo su carpeta** `components/sections/<pantalla>/`, su `lib/<pantalla>.ts` y su
  `app/secciones/<pantalla>/page.tsx`. `app/secciones/page.tsx` (índice) lo edita cada unidad añadiendo **una línea**
  a la lista (en la nube van en serie: no hay choque).
- Componentes de `components/ui/`, `components/krea/` y `components/layout/` se usan, no se editan; si uno necesita
  una prop nueva, la unidad la añade de forma retrocompatible y la documenta (la excepción planificada es
  `feat/sec-evaluar` con `GradePill` y `NumberStepper`).
- Tokens: una unidad que necesite uno lo añade en `app/globals.css` en un bloque propio con su comentario
  (`/* ---------- Sección <pantalla> (HANDOFF §3) ---------- */`). Nunca `[Npx]` ni `[#hex]`.
- `SECTION_INVENTORY.md` y `CONTENT_CHECKLIST.md` son locales: cada unidad añade sus filas al cerrar.
- `seo`: las secciones no son páginas indexables (todo el portal es privado salvo `/ingresar`, D023); se corre en modo
  página en la fase 05.

## Números reservados (contra `origin/main`: última decisión D065, última fila del checklist 52)

| Ola | Decisiones | Filas `CONTENT_CHECKLIST` | Reparto |
|---|---|---|---|
| 1 | D066–D077 | 53–61 | 4 IDs y 3 filas por unidad, en el orden de la tabla |
| 2 | D078–D093 | 62–73 | ídem |
| 3 | D094–D109 | 74–85 | ídem |
| 4 | D110–D125 | 86–97 | ídem |

## Lo que dejó la fase 03 para esta fase

- `feat/sec-evaluar`: `GradePill` 88×64 / fuente 32 para la tarjeta Total en vivo (+ opción de no pintar el chip
  Raspado); `NumberStepper` con `value: null` y `aria-labelledby` (hoy rodeado con 0 + «Sin puntuar» y `fieldset`);
  `ScorePicker` dentro de `QuestionCardReview` vía su `titleId`.
- Perfil del profesor: el handoff no lo define; la tarjeta de usuario del profe enlaza a `/perfil` (preguntar en fase 05).
- Fase 05: un solo `<Toaster />` sin `id` en el AppShell (D035).
- `SelectContent` sale por portal fuera del `Escenario`: aplicarle el arreglo de tema/acento de `PortalScope` (D034)
  en la primera sección que use un `Select` dentro de una vista previa con otro acento (`feat/sec-alumnos` o
  `feat/sec-tareas-profe`).
- Revisar con teclado real (fase 09): flechas del `ToggleGroup` (D038).
- Archivo sin uso: `components/ui/toggle.tsx` (#11) — señalado, no se borra.

## Ola actual: 4 (la ola 3 cerró con #27–#30; la 2 con #23–#26; la 1 con #20–#22)

- En local con el pool (como la ola 3): brief + prompts en `context/plans/orchestration-<fecha>-f04-ola4*.md`, workers en paralelo, César mergea. En la nube: unidades en serie.
- QA: no aplica (decisión de César)

## Para la ola 2 (lo dejó la ola 1)

- Leer D066 (secciones por props + `/secciones/<pantalla>` con `Vista`), D067 (`ActionBar`), D068 (`GradeRow`, ahora con `detalle`), D069 (datos de ejemplo: `lib/demo/`), D072 (variantes de una vista = `/secciones/<pantalla>/[estado]` con `generateStaticParams`: **`searchParams` rompe el prerender con `cacheComponents`**), D075 (género del capitán por prop).
- Datos listos en `lib/demo/`: `alumnoPorCedula`, `equipoDe`, `integrantes` (capitán primero), `puntosAlumno`, `rankingAlumnos/Equipos`, `notasDe` (orden de Mis notas), `porEntregar`, `TAREA_IDENTIDAD` (puntajes por pregunta reales; Heymi Sierra para Detalle). `lib/fecha.ts` `formatFecha`.
- Patrón de una sección: componente en `components/sections/<pantalla>/`, textos/lógica en `lib/<pantalla>.ts` con pruebas, props de ejemplo en `lib/demo/<pantalla>.ts`, vista en `app/secciones/<pantalla>/page.tsx` + una línea en `PANTALLAS` de `app/secciones/page.tsx`.
- `Card` no tiene `asChild`: el `h2` va en `CardTitle level={2}` dentro de `CardHeader`. Vacíos: copy del lienzo `design/canvas/Vacios.dc.html`.
- Chips con texto largo (premios): `h-auto min-h-7 py-1 whitespace-normal` para que envuelvan a 320.
- Verificación sin servidor: `bun run build` y buscar en `.next/server/app/secciones/<pantalla>.html` (un `<h1>`, un `<main>`, textos).

## Para la ola 3 (lo dejó la ola 2)

- Leer D078 (`width="lectura"` = 760 alineado al inicio), D082 (borrador local, `ActionBar` + diálogo), D086 (premio solo con ganador único), D090 (`ToggleGroup` como radiogroup visual; `lib/apariencia.ts`).
- Compartidas nuevas: `components/sections/shared/back-link.tsx` (migas ≥ 1024 en pantallas de detalle). `PendingTasks` de Inicio se reutiliza en /tareas.
- Tokens por sección al final de `app/globals.css` (bloques Tareas y Perfil). Toda sombra o radio propio nuevo que conviva con `shadow-1`/`rounded-md` en un `cn` se registra en `lib/utils.ts` (`shadow`/`radius` de tailwind-merge), si no gana el que el CSS ponga último.
- `GradePill` sigue pintando el chip Raspado al lado de la píldora: la opción de ocultarlo es de `feat/sec-evaluar` (Detalle, D080, la aprovecharía).
- Enunciados del seed sin tildes (fila 64): la vista usa los del lienzo en `lib/demo/notas.ts`; Evaluar puede reutilizar `ENUNCIADOS_LIENZO` si lo exporta.

## Para la ola 4 (lo dejó la ola 3)

- Leer D095 (segmentados que cambian de ruta = enlaces con `aria-current`, no radiogroup), D099 (filtro local con `ToggleGroup` + `<output>` de frase estable), D100 (tarjetas enlace), D101 (`DemoAjuste` en `lib/demo/ajustes.ts`: **`feat/sec-puntos` lo reutiliza**, no crea otro), D102 (`GradePill` `size="total"` y `raspado` chip/icono/ninguno), D103 (`NumberStepper` `value: number | null`, `aria-labelledby`), D104–D105 (Evaluar: `LiveTotal`, Ctrl+Enter, toast con Deshacer y Toaster local en `app/secciones/evaluar/layout.tsx`), D106–D109 (Alumnos: búsqueda sin tildes en `lib/alumnos.ts`, un `Dialog` por fila, motivo condicional).
- Datos nuevos: `lib/demo/evaluar.ts` (`COLA` de 7 `DemoEntrega`), `lib/demo/panel.ts`, `lib/demo/alumnos.ts` (69 alumnos; base 15 de Jailyn placeholder), `lib/demo/ranking.ts`. `lib/ranking-vista.ts` para el ranking de equipos (Premios/Equipos pueden reutilizar subtítulo «n integrantes · capitán»).
- `feat/sec-tareas-profe`: el medidor del constructor es `SumMeter` (no `LiveTotal`, §8 no unificar); `NumberStepper` ya admite `null` para valores sin poner. Un `Select` en `/secciones` hereda tema/acento del documento (no hace falta `PortalScope`).
- `feat/sec-puntos`: «Nuevo ajuste» del Panel enlaza a `/profe/puntos`; motivos fijos y vista previa «Eso no cambia tu nota» (D007).
- **Choques en paralelo:** la línea de `PANTALLAS` en `app/secciones/page.tsx` chocó en 3 de 4 PRs (tres unidades tras la misma línea). En la ola 4, dar a cada unidad un ancla distinta o resolverlo al mergear (2 min por PR). Las anclas distintas de `globals.css` funcionaron.
- Seed de 5C sin notas evaluadas: ranking 5C todo empatado en 0 (backlog). Topbar móvil sin chip «En vivo» ni X de Evaluar (backlog, fase 05).

## Cierres

| Ola | PRs | QA | Pasa a la siguiente | Datos sin borrar |
|---|---|---|---|---|
| 1 | #20 base, #21 ingresar, #22 inicio (+ #19 cierre de la fase 03) | no aplica (César: QA solo al final) | notas de «Para la ola 2»; D075 pendiente de César | ninguno |
| 2 | #23 notas, #24 tareas, #25 equipo, #26 perfil | no aplica (César: QA solo al final) | notas de «Para la ola 3»; filas 64, 67, 69, 73 esperan a César | ninguno |
| 3 | #27 alumnos, #28 ranking, #29 panel, #30 evaluar (local, pool wt1–wt4) | no aplica (César: QA solo al final) | notas de «Para la ola 4»; backlog: 5C sin notas, topbar móvil (En vivo, X), toast sobre `ActionBar` | ninguno |

## Prompt de inicio de la siguiente ola

```
/orchestrate ola 4 de la fase 04. Plan: context/plans/phase-04-secciones.md
```
