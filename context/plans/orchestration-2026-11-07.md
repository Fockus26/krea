# Orquestación 2026-11-07 — brief compartido para los workers

> Plan y decisiones de César: `C:\Users\Cesar\Documents\Work\krea\context\plans\batch-2026-11-07.md`.
> Prompts: `C:\Users\Cesar\Documents\Work\krea\context\plans\orchestration-2026-11-07-prompts.md`.

> **Todo worker** lee esto antes de empezar. Carpeta principal: `C:\Users\Cesar\Documents\Work\krea`
> (archivos locales: `context/CURRENT_PHASE.md`, `context/CONTENT_CHECKLIST.md`,
> `context/PHASE_LOG/`, `context/plans/`). Código y `context/decisions/`: lee **tu slot**.
>
> **Datos del proyecto:** `bun:test` (`tests/unit/`; reglas en `tests/rules/` con
> `bun run test:rules`, emuladores con Java) · sin entorno DOM: la lógica se prueba pura en `lib/`,
> la UI se revisa por código · lint `bunx biome check <archivos>` · referencia del kit en
> `~/.claude/kit-reference/` · Next 16.4 con `cacheComponents: true` (lee
> `node_modules/next/dist/docs/` antes de usar una API de Next) · Firebase Admin para toda
> escritura (D175) · imágenes en Backblaze B2 (`lib/almacen/`, D194).

## Unidades

| # | Rama | Qué | Ola | Modelo |
|---|---|---|---|---|
| X1 | `fix/eliminar-equipo-con-entregas` | Eliminar equipo con entregas, integrantes y ajustes (54) | 1 | opus · medium |
| X2 | `feat/lote-rango-shift` | Shift+clic selecciona el rango (55) | 1 | sonnet · medium |
| X3 | `fix/ranking-vacio` | Estado vacío del ranking (57) | 1 | sonnet · low |
| X4 | `feat/vista-lista-tareas-equipos` | Vista lista + eliminar en lote en Tareas y Equipos (56) | 2 | opus · medium |
| X5 | `feat/secciones-anios` | Años y secciones administrables (58) | 3 | opus · high |

## Números reservados

| Unidad | Decisiones | Filas `CONTENT_CHECKLIST` |
|---|---|---|
| X1 | D307–D309 | 163 (159 ya estaba usada) |
| X2 | D310–D311 | — |
| X3 | D312 | 160 |
| X4 | D313–D316 | 164–165 |
| X5 | D317–D326 | 166, 168–170 |
| X2 (extra, ayuda Shift) | — | 167 |

Fuera de tu rango, nada. Una fila de checklist no la editas tú: la describes en tu informe.

## Formas compartidas (fijas)

- **`entregas.titularNombre`** (X1): `z.string().min(1).optional()` en `zEntrega`. Lo escribe la
  eliminación de un equipo en cada entrega grupal suya, con el nombre del equipo en ese momento.
  Quien muestre el nombre de una entrega grupal usa: equipo vivo → su nombre; si no,
  `titularNombre`; si no, `TITULAR_DESCONOCIDO`.
- **Selección por rango** (X2, la usa X4 en la ola 2): helper puro en `lib/lote.ts`
  `alternarRango(seleccion: ReadonlySet<string>, ids: readonly string[], ancla: string | null, id: string, marcar: boolean): Set<string>`
  (los `ids` en el orden visible; sin ancla o ancla fuera de la lista = `alternarUno`). El ancla
  es el último id clicado sin Shift.

## Decisiones de César para esta tanda

Las de `batch-2026-11-07.md`. Además:
- **Sin dev server ni QA**: verificas por código, tests y typecheck. En el PR «Capturas: no
  disponibles — sin servidor por decisión de César».
- **Sin build local** (CI y Vercel lo corren).
- **Base real:** nunca la tocas. Lo de producción queda como acción manual para César.

## Simular el backend

Sin script compartido de mocks. Las pruebas con Auth/Firestore van contra los emuladores
(`bun run test:rules`, Java; proyecto `demo-krea`).

## Reglas de la tanda (encima de `CLAUDE.md`)

1. **Lee solo** `CLAUDE.md`, lo que cita tu prompt y, si tocas una tecnología de `Tech refs`,
   ese archivo. El resto, con `grep`.
2. **Slot y rama:** trabajas SOLO en tu slot (`C:\Users\Cesar\Documents\Work\krea-wt\wtN`), que ya
   tiene tu rama desde `origin/main`, `node_modules` y los `.env*`. No crees ni borres worktrees,
   no corras `wt`, no cambies de rama.
3. **Archivos locales compartidos:** no edites `CURRENT_PHASE.md` ni `CONTENT_CHECKLIST.md`.
   Escribe `C:\Users\Cesar\Documents\Work\krea\context\PHASE_LOG\<tu-rama-con-guiones>.md`; si no
   puedes, entrégalo en tu informe.
4. **Decisiones:** un archivo por decisión, `context/decisions/D0NN-<tema>.md` en tu slot, con
   los IDs de tu rango y el encabezado de una línea (formato en `context/decisions/README.md`).
   Si cambias una vieja: «Reemplaza a D0NN» (y en la vieja, su estado).
5. **Sin versionado:** ningún changeset, ni `version`, ni CHANGELOG.
6. **Servidor y navegador:** no se usan.
7. **Datos reales:** `.env` apunta a producción. No inicies sesión ni escribas datos. El «Cómo
   probar» de tu PR dice qué flujo y qué rol, para el QA final.
8. **Tests:** `bun run test:related` mientras trabajas. Antes del PR la suite entera sola:
   `mkdir -p .qa && bun run test > .qa/test.log 2>&1` en segundo plano, luego el resumen. Si
   tocaste `firebase/firestore.rules` o algo con emuladores: `bun run test:rules`.
9. **Archivos:** con Write/Edit; léelo con **Read** antes de editar. Toda Server Action nueva que
   escriba llama `refresh()` al terminar (guardián `tests/unit/cache-rutas.test.ts`). Nada de
   heredoc largo ni `node -e` con comillas.
10. **Esperas:** `sleep` bloqueado; lo que tarde > 2 min va en segundo plano. `grep` con rutas
    (`app/`, `lib/`, `components/`), nunca en la raíz.
11. **Commit al cerrar cada etapa** y un `wip:` cada ~20 min en etapas largas, con dos líneas en
    `.qa/progress.md` (hecho / sigue).
12. **Verificación antes del PR:** `bun run typecheck`, `bun run lint`, `bun run test`; si tocaste
    UI, la skill `a11y` por revisión de código (contraste de los pares que tocas en 4 acentos ×
    claro/oscuro, teclado, foco, 320 px, reduced motion). Sin build local.
13. **Sin poder preguntar:** dato que falta → opción conservadora + «Decisión tomada /
    alternativa» en el PR.
14. **Arregla la clase en la primera pasada** (`grep` en `app/ components/ lib/`). Lo que veas
    después va al informe como «visto de paso». Prevenir: `z.string().trim().min(1)`; submit
    `disabled` mientras vuela + servidor idempotente; `flex-wrap` en filas de botones; foco al
    primer inválido; confirmación antes de borrar; `exigirSesion(rol)` en cada acción.
15. **PR:** modo `pr` (skill `git-flow`): push a tu rama y `gh pr create` en español, cuerpo con
    Qué / Por qué / Cómo probar / Decisión tomada / Kit feedback. Nunca merge.

## Ola 3 — X5 partido en dos (secuencial)

X5 se parte en **X5a `feat/secciones-datos`** (catálogo, gestión y pantalla) y **X5b
`feat/secciones-dinamicas`** (todo lo que hoy lista 5A/5C pasa a leer el catálogo). X5b se lanza
cuando X5a esté mergeado (toca los mismos tipos; en paralelo chocarían).

| # | Rama | Qué | Modelo | Decisiones | Filas |
|---|---|---|---|---|---|
| X5a | `feat/secciones-datos` | Catálogo Año › secciones + CRUD (solo vacío) + pantalla `/profe/secciones` | opus · high | D317–D321 | 166 |
| X5b | `feat/secciones-dinamicas` | Rutas, selectores, filtros, tareas, panel, puntos, alumnos, loaders con el catálogo | opus · high | D322–D326 | 168–170 |

### Formas compartidas de X5 (fijas; X5a las crea, X5b las usa)

- **Código de sección** = número de año + letra: `"5A"`. `SeccionId = string` (deja de ser unión).
  `zSeccion = z.string().regex(/^[1-9][A-Z]$/, "Sección inválida")` en `lib/modelo.ts` (reemplaza
  `z.enum(SECCIONES)`). `zLetra = z.string().regex(/^[A-Z]$/)`, `zNumeroAnio = z.number().int().min(1).max(9)`.
  `SECCIONES` **desaparece** de `lib/modelo.ts` en X5b; en X5a queda como `@deprecated` con los
  mismos valores para que el resto compile sin cambios.
- **Catálogo**: un solo documento `config/secciones` (`COL.config = "config"`, id `"secciones"`):
  `zCatalogoSecciones = z.object({ anios: z.array(zAnio).max(9), actualizadoEn: zInstante })`,
  `zAnio = z.object({ numero: zNumeroAnio, letras: z.array(zLetra).min(0).max(26) })` (números sin
  repetir, letras sin repetir; se guarda ordenado). Documento **ausente** = `CATALOGO_INICIAL`
  (`[{ numero: 5, letras: ["A", "C"] }]`, lo que hay hoy en producción); la primera escritura lo
  materializa. Documento presente con `anios: []` = sin secciones (no resucita el inicial).
- **Puro, `lib/secciones.ts`** (sin Firebase; tests en `tests/unit/secciones.test.ts`):
  `type CatalogoSecciones = ReadonlyArray<{ numero: number; letras: readonly string[] }>`;
  `CATALOGO_INICIAL`; `codigoSeccion(numero, letra): string`; `partesSeccion(codigo): { numero; letra } | null`;
  `esCodigoSeccion(v: unknown): v is string`; `seccionesDe(catalogo): string[]` (planas, ordenadas
  por año y letra); `nombreAnio(n) → "5.º año"`; `slugSeccion("5A") → "5a"`;
  `seccionDeSlug(slug, catalogo) → string | null` (solo si existe en el catálogo);
  `listaSecciones(codigos) → "4B, 5A y 5C"` (ordenadas; una sola → "5A"); `ordenarSecciones(codigos)`.
- **Lectura, `lib/datos/secciones.ts`** (server-only): `catalogoSecciones = cache(async (): Promise<CatalogoSecciones>)`
  detrás de `exigirSesion("profesor")`; documento ausente → `CATALOGO_INICIAL`; inválido → log +
  `CATALOGO_INICIAL` (como `parsear`).
- **Uso**: `type UsoSeccion = { alumnos: number; profesores: number; equipos: number; tareas: number; entregas: number; ajustes: number }`;
  puro `seccionVacia(uso): boolean` (todo 0) y `usoTexto(uso) → "Tiene 12 alumnos, 3 equipos y 2 tareas"`.
- **Reglas**: `match /config/{doc} { allow read: if esProfe(); allow write: if false; }`. El estudiante
  no lee el catálogo (su sección viene en el claim, que ya es texto).
