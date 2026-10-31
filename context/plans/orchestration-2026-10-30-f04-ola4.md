# Orquestación del 2026-10-30 (fase 04, ola 4) — brief compartido para los workers

> Fase 04 — plan: `context/plans/phase-04-secciones.md` · olas 1–3 cerradas (#20–#30, main @ 6b53b74) · **ola 4 en curso** (W1–W4, en local con el pool) · última ola de la fase

> **Todo worker** lee esto antes de empezar, y después la sección **"Reglas de la tanda"** de
> `context/plans/orchestration-2026-10-29-f03.md` (carpeta principal): siguen valiendo las 23 reglas, con los cambios de
> abajo y los del brief de la ola 3 (`orchestration-2026-10-30-f04-ola3.md`, «Cambios a las reglas»), que **también valen
> aquí** salvo las anclas, que son las de este archivo.
> Carpeta principal del repo: `C:\Users\Cesar\Documents\Work\krea` (solo lectura para ti; **no** está en `main`, está
> en `design/handoff`: lee código y archivos versionados **en tu slot**, nunca en la carpeta principal; de la carpeta
> principal solo lees `context/plans/` y `context/*_INVENTORY.md`, que son locales).

## Unidades

| # | Rama | Qué | Slot / puerto |
|---|---|---|---|
| W1 | `feat/sec-equipos-profe` | Equipos del profesor: encabezado + sección, `g3` de tarjetas (logo + subir/cambiar, capitán, integrantes, mover), Sin equipo | lo dice el mensaje que te lanza |
| W2 | `feat/sec-tareas-profe` | Tareas del profesor (lista con segmentado de estado) + constructor (Datos, Preguntas, `SumMeter`, publicar/borrador, eliminar con Deshacer) | ídem |
| W3 | `feat/sec-puntos` | Ajustes de puntos: formulario (destino, sección, combobox, motivos fijos, stepper con signo, detalle, vista previa) + historial con filtrar y anular | ídem |
| W4 | `feat/sec-premios` | Premios: `g3` de tarjetas ganado / en juego / por definir, empate con menú | ídem |

Las cuatro corren en paralelo sobre `main` @ 6b53b74 y cada una toca **solo** su carpeta `components/sections/<pantalla>/`,
su `lib/<pantalla>.ts` (+ prueba), su `lib/demo/<pantalla>.ts` y su `app/secciones/<pantalla>/…`, más lo que su prompt
liste. Carpetas: W1 `equipos-profe`, W2 `tareas-profe`, W3 `puntos`, W4 `premios` (en `components/sections/`,
`app/secciones/` y como nombre de `lib/` y `lib/demo/`). Los componentes de `components/ui/`, `components/krea/`,
`components/layout/` y `components/sections/shared/` se usan, no se editan (**excepciones:** W3 **añade**
`components/ui/popover.tsx`; nadie más lo toca). Si uno tiene un defecto que te bloquea, rodéalo en tu archivo y
repórtalo como "visto de paso".

## Archivos compartidos: ancla fija por unidad (cada una distinta, con al menos una entrada sin tocar entre medias)

- **`app/secciones/page.tsx` (`PANTALLAS`)**, una sola entrada por unidad, sin reformatear las vecinas:
  - W1 (Equipos): al **final** de la lista, tras la entrada de Alumnos (`/secciones/alumnos`).
  - W2 (Tareas del profesor): entre la de Evaluar (`/secciones/evaluar/grupal`) y la de Alumnos.
  - W3 (Puntos): entre la del Panel (`/secciones/profe/manana`) y la de Evaluar.
  - W4 (Premios): entre la de Ranking (`/secciones/ranking/estudiantes`) y la de Mi equipo.
  Si W2 necesita dos entradas (lista y constructor), las dos van juntas en su ancla.
- **`app/globals.css`**, un bloque propio `/* ---------- Sección <pantalla> (HANDOFF §3; lienzo <X>.dc.html; Dnnn) ---------- */`
  **solo si te falta un token**, cada uno en su ancla:
  - W1: justo **antes** de `/* ---------- Base ---------- */` (tras el bloque "Ranking: movimiento").
  - W2: justo **antes** de `/* ---------- Sección Ingresar y recuperar`.
  - W3: justo **antes** de `/* ---------- Sección Perfil`.
  - W4: al **final** del archivo (tras el bloque Perfil).
- **`lib/utils.ts`** (registro de `shadow`/`radius` en tailwind-merge): nadie lo toca. No crees sombras ni radios nuevos;
  si hace falta, entrégalo como "token pendiente" en el reporte.
- **`lib/demo/ajustes.ts`**: solo W3 (puede **añadir** campos opcionales y filas; no cambia los 4 primeros ni rompe al Panel).
- Nadie toca `package.json`, `bun.lock`, `app/secciones/_vista/*`, `lib/demo/seed.ts`, `lib/demo/usuarios.ts`,
  `lib/demo/tareas.ts`, `lib/image.ts` ni las secciones de las olas 1–3 (las reutilizas por import).

## Formas compartidas (fijadas aquí; no improvises otra)

- **Tareas del profesor** (W2 las lista, W4 lee sus premios). Fuente común = `TAREAS` de `lib/demo/tareas.ts`
  (las 4 que ya ven los estudiantes; **no la edites**). Lo que el lienzo añade y `TAREAS` no tiene (el borrador «Plan de
  redes sociales», grupal, 10 preguntas, suma 14 / 20, sin fecha, premio por definir; avances «3 de 12 equipos
  entregaron», «12 de 69 evaluadas») va en la copia propia de cada unidad: W2 en `lib/demo/tareas-profe.ts`, W4 en
  `lib/demo/premios.ts`, con el **mismo** id `"plan-redes"` y el mismo título para el borrador. Los títulos de las tareas
  son los de `TAREAS` (no los del lienzo, que usa otros): así Premios, Tareas, Mi equipo y Notas dicen lo mismo.
  Placeholders (§8), cada uno en su fila.
- **Rutas de la fase 05** en enlaces y en `Vista ruta=`: `/profe/equipos`, `/profe/tareas`, `/profe/tareas/nueva`,
  `/profe/tareas/[id]`, `/profe/puntos`, `/profe/premios`, `/profe/evaluar`, `/profe/alumnos`. «Agregar premio» (W4) enlaza
  a `/profe/tareas/plan-redes` (editar el borrador); «Nuevo ajuste» del Panel ya enlaza a `/profe/puntos`.
- **Puntos actuales**: `puntosAlumno`, `puntosDeEquipo`, `rankingAlumnos`, `rankingEquipos` de `lib/demo/seed.ts` (W1 para
  el chip «#1 · 19 pts», W3 para el combobox y la vista previa). No recalcules el ranking: `rankCompetition` de `lib/ranking.ts`.

## Cambios a las reglas (además de los del brief de la ola 3)

- **Pantallas del profesor:** `Vista rol="profesor"`; en móvil Tareas, Equipos y Premios están en la hoja «Menú» de la
  topbar (ya lo hace `lib/nav.ts`: compruébalo, no lo cambies). El constructor (W2) va **sin barra inferior** en móvil
  (HANDOFF §8): si `Vista` no lo admite, no edites `_vista/`: dilo en el PR como pendiente de la fase 05 y monta la
  `ActionBar` como lo admita hoy.
- **Menús y selects:** `components/ui/dropdown-menu.tsx` y `select.tsx` existen; en `/secciones` heredan tema y acento del
  documento (no hace falta `PortalScope`). Un menú de fila lleva nombre accesible con el objeto («Mover a Yeilin Duarte a
  otro equipo», «Opciones del ajuste de Jorge Quintero»).
- **Estado de la vista previa:** las acciones (mover, capitán, publicar, aplicar, anular, elegir ganador) cambian estado
  local del cliente y lo dicen con un toast o un `role="status"`; nada se guarda. Si necesitas ver un toast, monta un
  `<Toaster />` local en el `layout.tsx` de **tu** carpeta de vista, como `app/secciones/evaluar/layout.tsx` (D105).
- **Lecciones de la ola 3:** un segmentado que cambia de ruta = enlaces con `aria-current` (D095, `components/sections/ranking/segmented-links.tsx`
  — impórtalo, no lo copies); un filtro local = `ToggleGroup` + `<output>` de frase estable (D099); tarjeta enlace sin
  botones dentro (D100).
- Antes de `gh pr create`, confirma que el Write de `.qa/pr-body.md` funcionó (el slot puede traer uno viejo).

## Números reservados (contra `origin/main`: última decisión D109, última fila del checklist 85)

| Unidad | IDs de decisión | Filas de `CONTENT_CHECKLIST` | Modelo · esfuerzo | Docker |
|---|---|---|---|---|
| W1 | D110–D113 | 86–88 | sonnet · medium | no |
| W2 | D114–D117 | 89–91 | opus · medium | no |
| W3 | D118–D121 | 92–94 | opus · medium | no |
| W4 | D122–D125 | 95–97 | sonnet · medium | no |

## Decisiones de César (iguales que las olas 1–3)

Sin QA, sin dev server, sin Playwright y sin capturas hasta el final del proyecto; verificación = typecheck, lint, test,
build y revisión por código (a11y por código). Sin versionado: ningún changeset. Sin datos reales: no se toca Firebase.
Modo `pr`: César revisa y mergea; nunca `gh pr merge`.

## Decisiones del orquestador (conservadoras; cada worker las explica en su PR con la alternativa)

- W3: el combobox «¿A quién?» se hace con `Popover` de `radix-ui` (ya es dependencia) + patrón ARIA combobox propio; sin
  `cmdk` ni dependencias nuevas.
- W2: sin el interruptor de entrega tardía (HANDOFF §9 #10): no está en §3 ni en el lienzo → backlog.
- W4: el empate muestra el chip «Empate: G2 y G5» y el menú de la tarjeta ofrece lo que recomienda §9 #3 («Dar el premio a
  …» por cada equipo empatado + «Compartir el premio»), en estado local. Qué ve el estudiante con empate sigue abierto (D086).

## Simular el backend

No aplica: secciones de presentación con props y datos de `lib/demo/`; nada lee Firestore ni Storage (fase 07).
