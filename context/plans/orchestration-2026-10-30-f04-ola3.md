# Orquestación del 2026-10-30 (fase 04, ola 3) — brief compartido para los workers

> Fase 04 — plan: `context/plans/phase-04-secciones.md` · olas 1–2 cerradas (#20–#26, main @ 0265599) · **ola 3 en curso** (W1–W4, en local con el pool)

> **Todo worker** lee esto antes de empezar, y después la sección **"Reglas de la tanda"** de
> `context/plans/orchestration-2026-10-29-f03.md` (carpeta principal): siguen valiendo las 23 reglas, con los cambios de
> abajo. Su prompt trae solo lo específico de su unidad.
> Carpeta principal del repo: `C:\Users\Cesar\Documents\Work\krea` (solo lectura para ti; **no** está en `main`, está
> en `design/handoff`: lee código y archivos versionados **en tu slot**, nunca en la carpeta principal; de la carpeta
> principal solo lees `context/plans/` y `context/*_INVENTORY.md`, que son locales).

## Unidades

| # | Rama | Qué | Slot / puerto |
|---|---|---|---|
| W1 | `feat/sec-ranking` | Ranking estudiantes/equipos: encabezado (+ variante profesor 5A/5C), podio, lista 4–N, zona de riesgo, aside «Cómo se calculan» + «Últimos movimientos», `details` móvil | lo dice el mensaje que te lanza |
| W2 | `feat/sec-profe-panel` | Panel del profesor: saludo por hora + segmentado 5A·5C·Ambas, métricas `g3`, Por evaluar, Últimos ajustes | ídem |
| W3 | `feat/sec-evaluar` | Evaluar entrega: cabecera, medidor fijo (móvil barra / escritorio aside), preguntas con `ScorePicker` en `QuestionCardReview`, acción + atajos + toast; `GradePill` lg 88×64 y `NumberStepper` con `value: null` | ídem |
| W4 | `feat/sec-alumnos` | Alumnos: filtros (sección, búsqueda sin tildes, contador), tabla, diálogo Editar con base y motivo | ídem |

Las cuatro corren en paralelo sobre `main` @ 0265599 y cada una toca **solo** su carpeta `components/sections/<pantalla>/`,
su `lib/<pantalla>.ts` (+ prueba), su `lib/demo/<pantalla>.ts` y su `app/secciones/<pantalla>/…`, más lo que su prompt
liste. Los componentes de `components/ui/`, `components/krea/`, `components/layout/` y `components/sections/shared/` se
usan, no se editan (**excepción: W3** con `GradePill`, `NumberStepper` y sus `lib/`). Si uno tiene un defecto que te
bloquea, rodéalo en tu archivo y repórtalo como "visto de paso".

## Archivos compartidos: ancla fija por unidad (para que los cuatro PRs mezclen sin conflicto)

- **`app/secciones/page.tsx` (`PANTALLAS`)**, una sola entrada por unidad:
  - W1: entre la entrada de Entrega (`/secciones/tareas/capitan`) y la de Mi equipo.
  - W2: tras la de Perfil (última). W3 y W4: **también** tras Perfil, en el orden Panel · Evaluar · Alumnos. Esas tres
    chocan en la misma línea: es esperado. Si al final tu PR tiene conflicto ahí, el orquestador te pedirá mezclar
    `origin/main` y dejar las tres líneas en ese orden; no hagas nada antes.
- **`app/globals.css`**, un bloque propio `/* ---------- Sección <pantalla> (HANDOFF §3; lienzo <X>.dc.html; Dnnn) ---------- */`
  **solo si te falta un token**, cada uno en su ancla:
  - W1: justo **antes** de `/* ---------- Base ---------- */` (tras el bloque "Ranking: movimiento").
  - W2: justo **antes** de `/* ---------- Sección Ingresar y recuperar`.
  - W3: justo **antes** de `/* ---------- Sección Tareas y entrega`.
  - W4: al **final** del archivo (tras el bloque Perfil).
- **`lib/utils.ts`** (registro de `shadow`/`radius` en tailwind-merge): solo W3 puede tocarlo. Los demás no crean sombras
  ni radios nuevos; si hace falta, entrégalo como "token pendiente" en el reporte.
- Nadie toca `package.json`, `bun.lock`, `app/secciones/_vista/*`, `lib/demo/seed.ts`, `lib/demo/usuarios.ts` ni las
  secciones de las olas 1–2 (las reutilizas por import).

## Formas compartidas (fijadas aquí; no improvises otra)

- **Cola "Por evaluar"** (W2 la muestra, W3 la recorre). Datos del lienzo (`Panel.dc.html`, `Evaluar.dc.html`): **7
  entregas** (4 individuales · 3 grupales). La 1.ª: equipo **5A-G2 Repostería**, tarea "Logo y paleta del emprendimiento",
  grupal, entregó **Raquel Figueroa (capitana)** el 25/10/2026 4:12 p. m.; la 2.ª: **Mateo Paredes**, "Identidad de marca",
  individual. Las demás las eliges del seed (5A/5C), con tareas de `lib/demo/tareas.ts`. Cada unidad guarda su propia
  copia en **su** `lib/demo/<pantalla>.ts` (W2 solo las filas que pinta; W3 la cola completa) con estos dos primeros
  iguales; la fase 07 cambia la fuente de las dos. Tipos: W3 exporta `DemoEntrega`; W2 no lo importa (corren a la vez).
- **Ajustes de puntos** (W2 los muestra en «Últimos ajustes»; la ola 4 `feat/sec-puntos` los reutilizará): W2 crea
  `lib/demo/ajustes.ts` con
  `export type DemoAjuste = { id: string; destino: { tipo: "alumno"; cedula: string } | { tipo: "equipo"; id: string }; valor: number; motivo: string; fecha: string /* ISO */ }`
  y `export const AJUSTES: readonly DemoAjuste[]` con los 4 del lienzo (Mateo Paredes +2 "Participación destacada"
  25/10 10:15 a. m.; Pablo Escobar −1 "Uso del celular" 25/10 9:40 a. m.; Equipo 5A-G3 Ropa +1 "Ayudó a un
  compañero" 24/10 11:05 a. m.; Equipo 5C-G1 "Otro: …" del lienzo). Los signos exactos, del lienzo. Placeholders (§8).
- **Rutas de la fase 05** que se escriben en enlaces y en `Vista ruta=`: `/ranking`, `/profe`, `/profe/evaluar`,
  `/profe/evaluar/[entrega]`, `/profe/alumnos`, `/profe/puntos`, `/profe/tareas`. Un enlace a una pantalla que aún no
  existe es válido (es la ruta final).

## Cambios a las reglas de la tanda de 2026-10-29

- **Regla 4 (inventario):** la fila que entregas es de `context/SECTION_INVENTORY.md` (columnas: Section · Path · Page(s)
  · Phase that closed it · Status · Notes). Si añades o cambias un componente de `components/krea/` (solo W3), además su
  fila de `COMPONENTS_INVENTORY.md`.
- **Regla 11 (tokens):** según las anclas de arriba. Nunca `[Npx]` ni `[#hex]`; escala de Tailwind basada en tokens o
  `color-mix` de tokens.
- **Patrón de sección (D066, D069, D072):** componente de presentación por props en `components/sections/<pantalla>/`;
  textos y lógica derivada en `lib/<pantalla>.ts` con pruebas; props de ejemplo en `lib/demo/<pantalla>.ts`; vista en
  `app/secciones/<pantalla>/…` dentro de `Vista` (`app/secciones/_vista/vista.tsx`) con `robots: { index: false }`.
  Variantes de una vista = `/secciones/<pantalla>/[estado]` con `generateStaticParams` y `Estados` (patrón:
  `app/secciones/equipo/[estado]/page.tsx`). **`searchParams`, `new Date()` o `Date.now()` en el servidor rompen el
  prerender con `cacheComponents`**: lo que dependa de la hora o del cliente se calcula en `lib/` como función pura que
  recibe el valor, y la vista pasa uno fijo.
- **Next 16:** un archivo `"use client"` no exporta constantes que use un componente de servidor: constantes y mapas en `lib/`.
- **Tema y acento en `/secciones`:** el selector de la vista (`_vista/apariencia.tsx`) los pone en el documento, así que
  los portales de Radix (Dialog, Select, Sheet) ya los heredan: no hace falta `PortalScope` aquí (D034 es para el
  `Escenario` de `/componentes`). Compruébalo leyendo `lib/apariencia.ts` antes de afirmarlo en el PR.
- **Toasts:** el `<Toaster />` global se monta en la fase 05 (D035). Si tu vista necesita ver uno (W3), monta uno local
  en **tu** página de vista y dilo en la decisión.
- Verifica en `node_modules` antes de afirmar qué hace una librería (Radix, Sonner, lucide).
- Antes de `gh pr create`, confirma que el Write de `.qa/pr-body.md` funcionó (el slot puede traer uno viejo).
- Verificación sin servidor (lo dejó la ola 1): `bun run build` y buscar en `.next/server/app/secciones/<pantalla>…html`
  un solo `<h1>`, un `<main>` y los textos esperados.

## Números reservados (contra `origin/main`: última decisión D090, última fila del checklist 73)

| Unidad | IDs de decisión | Filas de `CONTENT_CHECKLIST` | Modelo · esfuerzo | Docker |
|---|---|---|---|---|
| W1 | D094–D097 | 74–76 | sonnet · medium | no |
| W2 | D098–D101 | 77–79 | sonnet · medium | no |
| W3 | D102–D105 | 80–82 | opus · medium | no |
| W4 | D106–D109 | 83–85 | sonnet · medium | no |

## Decisiones de César (iguales que las olas 1–2)

Sin QA, sin dev server, sin Playwright y sin capturas hasta el final del proyecto; verificación = typecheck, lint, test,
build y revisión por código (a11y por código). Sin versionado: ningún changeset. Sin datos reales: no se toca Firebase.
Modo `pr`: César revisa y mergea; nunca `gh pr merge`.

## Simular el backend

No aplica: secciones de presentación con props y datos de `lib/demo/`; nada lee Firestore ni Storage (fase 07).
