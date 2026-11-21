# Prompts de la orquestación del 2026-10-29 (fase 01, ola 1)

## W1 — `feat/tokens`

Eres el worker **W1**. Rama: `feat/tokens`. Slot y puerto: los del mensaje que te lanza (`wt take`; el puerto no se usa: sin servidor). Decisiones: rango **D015–D017**, un archivo `context/decisions/D0NN-<tema>.md` por cada una. Filas de CONTENT_CHECKLIST: **16–17**.
Modelo · esfuerzo: **sonnet · medium**. Docker: **no**.

Primero lee el brief compartido: `C:\Users\Cesar\Documents\Work\krea\context\plans\orchestration-2026-10-29.md`.
Decisiones previas que te limitan: D001 (acento elegible, 4 colores + claro/oscuro/sistema), D004 (color de nota = fondo, número #111111), D005 (Poppins + Nunito Sans) — `cat context/decisions/D00N-*.md` de cada una.

### Lo que pide César
> "Desarrolla la app" — empezando por la fase 01 (Tokens): llevar el sistema de valores del handoff al código para que ningún componente necesite un valor suelto.

### Dónde está
- `design/HANDOFF.md:18-153` — §1 completo: acentos (1.1), neutros y estados + tintes de chips/avisos/toast (1.2), tipografía por rol y breakpoint (1.4), espaciado, radios, sombras, z-index, movimiento (1.5). §1.3 (`gradeColor`) **no** es tuyo: lo hace W2 en `lib/`.
- `design/canvas/krea.css:5-89` — la hoja exacta de tokens y tipografía del lienzo (si texto y CSS discrepan, manda el CSS). Ojo: el lienzo usa `data-theme="oscuro"`; en código va `data-theme="dark"` como dice HANDOFF §1.
- `app/globals.css` — hoy es la plantilla de create-next-app (se reemplaza entero).
- `app/layout.tsx` — Geist + `lang="en"` de plantilla: pasa a Poppins 600/700 + Nunito Sans 400/600/700 con `next/font/google`, `display: "swap"`, subsets `latin` + `latin-ext`, `lang="es-VE"`. No toques más del layout (contenedor, landmarks, metadata/SEO son de la fase 02), salvo el título provisional "KREA".
- `phases/01-TOKENS.md` — criterios de cierre de la fase.
- `context/COLORS.md`, `context/TYPOGRAPHY.md`, `context/DESIGN_TOKENS.md` — se actualizan con lo implementado (nombres reales de variables y clases de Tailwind).

### Enfoque decidido
- Variables en `:root` (claro), `[data-theme="dark"]` (oscuro) y `[data-accent="rojo|verde|morado"]` (azul = por defecto, sin atributo o `data-accent="azul"`), más las combinaciones oscuro × acento. "Sistema" = sin `data-theme` + `@media (prefers-color-scheme: dark)` sobre `:root:not([data-theme="light"])` aplicando los valores oscuros (sin duplicar a mano: agrupa selectores).
- `--accent-soft`, `--accent-soft-2`, `--accent-hover` y los tintes de chips/avisos con `color-mix(in srgb, …)` como en HANDOFF §1.1–1.2 (12/22 % claro, 16/28 % oscuro; chips ok/warn 10 % claro y 14 % oscuro — §8: no 14 % en claro).
- Expuestas a Tailwind v4 con `@theme inline` (`--color-accent: var(--accent)`, `--color-surface-2`, `--color-grade-ink`, `--radius-sm/md/lg`, `--shadow-1..3`, `--font-heading`, `--font-body`, `--ease-krea`, etc.). Escala de espaciado base 4 px (la de Tailwind por defecto ya es 4 px: no la redefinas, documenta que `1…20` son los pasos). Duraciones `--d-fast/normal/rank/celebrate` y curvas `--ease`/`--bounce`. z-index como variables con nombre (`--z-sticky`, `--z-topbar`, `--z-overlay`, `--z-toast`…).
- Tipografía: utilidades por rol (`text-display`, `text-h1`… `text-eyebrow`) con tamaño/alto de línea por breakpoint (<768, ≥768, ≥1920) y tracking de §1.4; cifras `tabular-nums` (clase utilitaria `nums`). Usa `@utility` de Tailwind v4.
- `::selection` con `--sel-bg/--sel-text`; scrollbar con `scrollbar-color` + `::-webkit-scrollbar` 10 px, thumb radio 999 px.
- Script anti-parpadeo inline en `<head>` (antes de pintar) que lee `localStorage` (`krea-theme`: light|dark|system, `krea-accent`: azul|rojo|verde|morado) y pone `data-theme`/`data-accent` en `<html>`; con `suppressHydrationWarning` en `<html>`. Envuelto en try/catch. Revisa en `node_modules/next/dist/docs/` cómo se inyecta un script inline en este Next 16 (no adivines la API). Registra las claves como decisión D015.
- Página de referencia `app/tokens/page.tsx` (server component, `robots: { index: false }`): muestras de todos los colores con su nombre, los 4 acentos × claro/oscuro (cada muestra con su propio `data-theme`/`data-accent` local), la escala tipográfica, radios, sombras y duraciones. Sin interactividad obligatoria; sin componentes shadcn (aún no existen).
- **Cero valores mágicos:** los hex viven solo en `globals.css`. Ningún `#295AC3` fuera de ahí.

### Trampas conocidas
- En oscuro las tarjetas pierden sombra y ganan borde 1 px `--divider` (§1.5): deja `--shadow-1` oscuro como en la tabla y documenta la regla; el borde lo aplica el componente Card en la fase 03.
- `--grade-ink` es #111111 en ambos temas (no se invierte).
- El toast invierte colores en oscuro (§1.2): tokens `--toast-bg/--toast-text`.
- Texto normal sobre `--accent-soft-2` va en `--text`, no en el acento (§8). Documéntalo en COLORS.md.
- Las fuentes de Google con `next/font` se descargan en el build: si el build no tiene red, dilo en el reporte; no cambies a fuentes locales sin decirlo.
- Hay un bloque en `AGENTS.md` que `next dev` re-agrega; no lo toques.

### Cómo verificar
- `bun run typecheck`, `bun run lint`, `bun run build` en verde.
- Prueba unitaria `tests/unit/tokens.test.ts` que lea `app/globals.css` y compruebe que existen todas las variables de HANDOFF §1.1–1.2 en claro y oscuro, y que no hay hex fuera de `globals.css` en `app/` (`grep`).
- Revisión de código a11y: contrastes ya medidos en el handoff; `prefers-reduced-motion` neutraliza las duraciones (`--d-*: 0ms` o equivalente documentado).
- Sin servidor ni capturas: dilo en el PR (revisión visual en el QA final).

### Cierre
Changeset: ninguno. En el PR, "Decisión tomada / alternativa" para: nombres de las claves de `localStorage`, nombres de las utilidades de tipografía, cómo se expone el z-index. Acciones manuales: ninguna. Reporte final como dice el brief.

---

## W2 — `feat/utilidades-nota`

Eres el worker **W2**. Rama: `feat/utilidades-nota`. Slot y puerto: los del mensaje que te lanza (`wt take`; sin servidor). Decisiones: **D013** y **D014** (contenido fijado abajo, escríbelas tú) y **D018** si necesitas otra. Fila de CONTENT_CHECKLIST: **18**.
Modelo · esfuerzo: **sonnet · medium**. Docker: **no**.

Primero lee el brief compartido: `C:\Users\Cesar\Documents\Work\krea\context\plans\orchestration-2026-10-29.md`.
Decisiones previas que te limitan: D003 (nota `null` = Pendiente, nunca 0), D004 (tareas suman 20, pasos de 0,5, `gradeColor` HSL continuo), D006 (base 10–20, nota = puntaje × base / 20), D007 (puntos de ranking: nota ≥ 10 aporta sus puntos, < 10 aporta 0) — `cat context/decisions/D00N-*.md` de cada una.

### Lo que pide César
> "Desarrolla la app" — paso 2 del orden de implementación del handoff: las utilidades de nota, ranking y máscaras, con pruebas.

### Dónde está
- `design/HANDOFF.md:86-105` — §1.3 `gradeColor(n)`: fórmula HSL y tabla de hex para snapshot (enteros y pasos de 0,5).
- `design/HANDOFF.md:480` — lista de utilidades: `gradeColor(n)`, `formatNota` (coma, 1 decimal máx.), `notaFinal(puntaje, base)`, `puntosRanking(nota)`, `rankCompetition(list)`, `maskEmail`, `maskCedula`.
- `design/HANDOFF.md:494-505` — §8: puntos del equipo (G2 19 · G3 18 · G1 17 · G5 17 · G4 15 · G6 14 con el seed), empates 1-2-2-4 con orden alfabético por primer apellido, chip "Empate" solo en top 10, zona de riesgo = 5 últimos **incluyendo empatados en el borde**.
- `design/HANDOFF.md:285` — `maskEmail`: primera letra + 4 puntos (`•`) + `@dominio` → `y••••@gmail.com`.
- `design/HANDOFF.md:435` — `maskCedula`: 2 primeros + 3 puntos + 3 últimos → `45•••896`.
- `data/seed/alumnos.json`, `data/seed/grupos.json`, `data/seed/tarea-identidad-marca.json` — datos reales para pruebas de ranking (apellidos "Primero Segundo").
- `tests/unit/` — vacío; la suite es `bun test ./tests/unit`.

### Enfoque decidido
- Módulos puros en `lib/` (p. ej. `lib/grades.ts`, `lib/ranking.ts`, `lib/mask.ts`), sin dependencias de React ni Firebase, tipados estrictos, exportados con nombres del handoff.
- `gradeColor(n: number): string` devuelve el hex (o `hsl()`; elige y documenta) — debe dar exactamente los hex de la tabla §1.3 al convertir. `n < 1` → 1. Solo para notas numéricas: `null` no tiene color (D003).
- `formatNota(n: number | null)`: coma decimal, 1 decimal máx. (`18,5`, `14`, `13,9`); `null` → `"Pendiente"`.
- `notaFinal(puntaje, base)`: `puntaje × base / 20`, **redondeado a 1 decimal, mitad hacia arriba** (decisión de César: 13,875 → 13,9). Cuidado con el punto flotante (usa aritmética entera o un épsilon; prueba 13,875, 12,25, 0,05). `puntaje null` → `null`. Valida base 10–20 en pasos de 0,5.
- `puntosRanking(nota)`: `null` o < 10 → 0; si no, la nota.
- `rankCompetition(list)`: recibe `{ id, puntos, primerApellido, … }`, ordena por puntos desc, puestos de competencia (1-2-2-4), dentro del empate orden alfabético por primer apellido (`localeCompare` con `"es"`, sensible a tildes como en español), y devuelve por fila `{ puesto, empate: boolean, enRiesgo: boolean }` (riesgo = 5 últimos puestos incluyendo empatados en el borde). Si `empate` solo se muestra en top 10 es lógica de UI: devuelve el dato, y añade un helper o documenta.
- Helper `primerApellido(apellidos: string)` (primera palabra).
- **D013** (escríbela): `# D013 · Grading · Nota final con base redondeada a 1 decimal, mitad hacia arriba · Implemented` — Decisión de César 2026-10-29; alternativa descartada: a 0,5.
- **D014** (escríbela): `# D014 · Grading · La base del alumno no aplica a notas grupales (provisional) · Pending` — Decisión provisional de César 2026-10-29: la nota grupal es igual para todos; queda por confirmar si pasa a "por integrante" (`notaGrupal × suBase / 20`, recomendación del handoff §9 #2). No cambia las utilidades: `notaFinal` se usa o no según el caller (fase 07).

### Trampas conocidas
- `Pendiente ≠ 0` (D003): ninguna función convierte `null` en 0 salvo `puntosRanking`, que da 0 puntos (no una nota 0).
- Los puntos del equipo son la suma de sus notas grupales ≥ 10 + ajustes del equipo, **no** la suma de los puntos de sus integrantes (§8). Si escribes `puntosEquipo`, pruébalo con el seed y los valores esperados de §8 (sin ajustes). Si el seed no permite derivarlos, dilo en el reporte en vez de forzar la prueba.
- Los hex de control del brief (5 → #F55E00, 8 → #F5A500) no salen de la fórmula: manda la fórmula y la tabla del handoff.
- `tsconfig.json`: revisa el alias de rutas (`@/…`) antes de importar.

### Cómo verificar
- Pruebas en `tests/unit/` con `bun test`: tabla completa de §1.3 (enteros y pasos de 0,5), `formatNota`, `notaFinal` con los casos de redondeo, `rankCompetition` con empates (1-2-2-4), orden por apellido con tildes, zona de riesgo con empate en el borde (> 5 filas), máscaras.
- `bun run typecheck`, `bun run lint`, `bun run build`.

### Cierre
Changeset: ninguno. En el PR, "Decisión tomada / alternativa" para: forma de retorno de `gradeColor` (hex vs `hsl()`), forma de retorno de `rankCompetition`. Acciones manuales: ninguna. Reporte final como dice el brief.
