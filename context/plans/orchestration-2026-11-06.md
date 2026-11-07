# Orquestación 2026-11-06 — brief compartido para los workers

> Tanda independiente (44 pedidos de César tras la versión 1). Plan de olas y decisiones de
> César: `C:\Users\Cesar\Documents\Work\krea\context\plans\batch-2026-11-06.md`.
> Prompts: `C:\Users\Cesar\Documents\Work\krea\context\plans\orchestration-2026-11-06-prompts.md`.

> **Todo worker** lee esto antes de empezar. Carpeta principal del repo:
> `C:\Users\Cesar\Documents\Work\krea` (ahí viven los archivos locales: `context/CURRENT_PHASE.md`,
> `context/CONTENT_CHECKLIST.md`, `context/PHASE_LOG/`, `context/plans/`). Su `context/` es
> `C:\Users\Cesar\Documents\Work\krea\context`: siempre esa ruta absoluta. **Ojo:** la carpeta
> principal está en una rama vieja (`design/handoff`): para el código y para
> `context/decisions/` lee **tu slot** (que está sobre `origin/main`), no la carpeta principal.
>
> **Datos del proyecto:** runner de tests `bun:test` (`tests/unit/`; reglas en `tests/rules/`
> con `bun run test:rules`, emuladores con Java) · sin entorno DOM (`happy-dom`/`jsdom` no
> están): la lógica se prueba pura en `lib/`, la UI se revisa por código · linter `bunx biome
> check <archivos>` · referencia del kit en `~/.claude/kit-reference/` · Next 16.4 con
> `cacheComponents: true` (lee `node_modules/next/dist/docs/` antes de usar una API de Next:
> no es el Next que conoces) · Firebase Admin para toda escritura (D175) · imágenes en
> Backblaze B2 (`lib/almacen/`, D194), no Firebase Storage.

## Unidades y orden

| # | Rama | Qué | Ola |
|---|---|---|---|
| W1 | `feat/profes-admin` | Admin de profes, cuentas con contraseña temporal, profe no edita a otro profe (1, 2, 4) | 1 |
| W2 | `fix/contraste-y-foco` | Selección con acento, tinta de la píldora, foco del input, rojo oscuro (21, 22, 23, 29) | 1 |
| W3 | `fix/textos-y-layout` | Login, salir, avatar, cards del Panel, bottom nav al final (24, 26, 34, 35, 38) | 1 |
| W4 | `feat/tareas-eliminar` | Eliminar tarea y sus notas + detalles de la lista y el constructor (6, 30, 32, 33, 44-tareas) | 1 |
| W5 | `feat/imagen-pegar-arrastrar` | Subida de imagen: pegar, arrastrar, explorar (28) | 1 |
| W6 | `feat/grupal-integrantes` | Integrantes ven preguntas y notas de la grupal (9) | 1 |
| W7 | `perf/cache-rutas` | Volver a una ruta sin recargar (14) | 1 |
| W8 | `feat/alumnos-filtros` | Alumnos filtrable por URL: Panel y «Ver notas» llegan filtrados (12, 13) | 1 |
| W9–W13 | ver `batch-2026-11-06.md` | | 2 |
| W14–W16 | ver `batch-2026-11-06.md` | | 3 |

Slot y puerto los asigna `wt take` al lanzar; el mensaje que lanza a cada worker los repite.

## Números reservados

| Unidad | Decisiones | Filas `CONTENT_CHECKLIST` |
|---|---|---|
| W1 | D231–D235 | 137–138 |
| W2 | D236–D238 | — |
| W3 | D239–D241 | 139 |
| W4 | D242–D245 | — |
| W5 | D246–D247 | — |
| W6 | D248–D249 | 141 |
| W7 | D250–D251 | — |
| W8 | D252–D254 | 140 |
| W9 | D255–D259 | 142–144 |
| W10 | D260–D262 | 145 |
| W11 | D263–D266 | 146–147 |
| W12 | D267–D271 | 148–149 |
| W13 | D272–D274 | 150–153 |
| W14 | D275–D277 | 154 |
| W15 | D278–D282 | — |
| W16 | D283–D284 | — |
| W2 (ronda 2) | D285 | — |
| W4 (extra) | — | 155 |
| Libres para extras | D286–D290 | 156–160 |

Fuera de tu rango, nada. Una fila de checklist no la editas tú (regla 3): la describes en tu informe.

## Formas compartidas (fijas: no las improvises)

- **`usuarios.admin`** (W1): `admin: z.boolean().optional()` en `zUsuario` (ausente = false) y
  `admin?: boolean` en `Claims` (`claimsDe` lo copia). Solo un profesor puede ser admin.
- **`usuarios.debeCambiarPassword`** (W1): `z.boolean().optional()`; `true` al crear una cuenta
  con contraseña temporal; se borra al cambiarla.
- **Creación de cuentas** (W1 la crea, W12 la reutiliza en la ola 2): `lib/cuentas.ts`
  (`import "server-only"`), `crearCuenta(entrada): Promise<{ passwordTemporal: string }>`
  que crea el usuario de Auth (`emailInterno(cedula)`), `usuarios/{cedula}`, `privados/{cedula}`
  y los claims en una sola operación coherente; `eliminarCuenta(cedula)`. La contraseña temporal
  se genera con `crypto` (12+ caracteres legibles, sin ambiguos 0/O/1/l) y nunca se guarda ni se loguea.
- **URL de Alumnos** (W8 la define; W9, W10 y W12 la usan): `/profe/alumnos?seccion=5A|5C`
  `&estado=evaluados|raspados|pendientes` `&tarea=<tareaId>` `&alumno=<cédula>` (abre la ficha
  de ese alumno). Helper puro `rutaAlumnos(filtros)` en `lib/alumnos.ts`.

## Decisiones de César para esta tanda

Las de `batch-2026-11-06.md` › «Decisiones de César». Además:
- **Sin dev server ni QA** (memoria de César): verificas por código, tests y typecheck. Sin
  capturas: en el PR «Capturas: no disponibles — sin servidor por decisión de César».
- **Sin build local** (CI y Vercel lo corren): la regla 13 de abajo es typecheck + lint + tests.
- **Base real:** nunca la tocas. Lo que haya que hacer en producción (crear el admin, un
  script) queda escrito como acción manual para César con el comando exacto.

## Simular el backend

No hay script compartido de mocks. Las pruebas con Auth/Firestore van contra los emuladores
(`bun run test:rules`, Java instalado; proyecto `demo-krea`). Nada del `.qa/` de otro slot.

## Reglas de la tanda (encima de `CLAUDE.md`)

1. **Lee solo** `CLAUDE.md`, lo que cita tu prompt (rutas, líneas, decisiones con
   `cat context/decisions/D0NN-*.md` en tu slot) y, si tocas una tecnología de su línea
   `Tech refs`, ese archivo. El resto, con `grep`.
2. **Slot y rama:** trabajas SOLO en la ruta de tu slot (`C:\Users\Cesar\Documents\Work\krea-wt\wtN`),
   que ya tiene tu rama creada desde `origin/main`, `node_modules` y los `.env*`. No crees ni
   borres worktrees, no corras `wt`, no cambies de rama.
3. **Archivos locales compartidos:** no edites `CURRENT_PHASE.md` ni `CONTENT_CHECKLIST.md`.
   Escribe `C:\Users\Cesar\Documents\Work\krea\context\PHASE_LOG\<tu-rama-con-guiones>.md`; si no
   puedes escribir ahí, entrégalo entero en tu informe.
4. **Decisiones:** un archivo por decisión, `context/decisions/D0NN-<tema>.md` **en tu slot**
   (va en git), con los IDs de tu rango y el encabezado de una línea (formato en
   `context/decisions/README.md`). Si cambias una decisión vieja, la nueva dice «Reemplaza a D0NN».
5. **Sin versionado:** ningún changeset, ni `version`, ni CHANGELOG.
6. **Servidor:** no autorizado (ver arriba).
7. **Navegador:** no se usa en esta tanda.
8. **Datos reales:** `.env` apunta a producción (`krea-d22f7`). No inicies sesión, no crees
   cuentas, no escribas datos. El «Cómo probar» de tu PR dice qué flujo y qué rol, para el QA final.
9. **Tests:** `bun run test:related` mientras trabajas. Antes del PR la suite entera **sola**:
   `mkdir -p .qa && bun run test > .qa/test.log 2>&1` en segundo plano, luego lees el resumen.
   Si tocaste `firebase/firestore.rules` o algo con emuladores: `bun run test:rules`. Un test
   que vence solo en la suite con otros slots ocupados es carga: córrelo solo y dilo.
10. **Archivos:** con Write/Edit; lo que vayas a editar, léelo con **Read** (lo visto con `cat` no cuenta y el primer Edit falla). Toda Server Action nueva que escriba llama `refresh()` al terminar (guardián `tests/unit/cache-rutas.test.ts`, #81). Nada de heredoc largo, `node -e` con comillas, ni Python en
    modo texto (CRLF). Si tocaste un archivo por shell, léelo antes de editarlo.
11. **Esperas y búsquedas:** `sleep` está bloqueado; lo que tarde > 2 min va en segundo plano.
    `grep` siempre con rutas (`app/`, `lib/`, `components/`), nunca en la raíz.
12. **Commit al cerrar cada etapa** (datos, UI, docs) y un `wip:` cada ~20 min en etapas
    largas, con dos líneas en `.qa/progress.md` (hecho / sigue). Al retomar: `git status`,
    `.qa/progress.md`, y sigues.
13. **Verificación mínima antes del PR:** `bun run typecheck`, `bun run lint` (sin errores
    nuevos), `bun run test`; si tocaste UI, la skill `a11y` por revisión de código (contraste
    calculado de los pares que tocas en los 4 acentos × claro/oscuro, teclado, foco, 320 px por
    clases, reduced motion). Sin build local.
14. **Capturas:** no (sin servidor).
15. **Sin poder preguntar:** dato que falta → opción conservadora + «Decisión tomada /
    alternativa» en el PR. No te bloquees.
16. **Arregla la clase, en la primera pasada:** si lo que arreglas tiene la misma forma en otro
    sitio, búscalo con `grep` en `app/ components/ lib/` y arréglalo ahora. Lo que veas después
    del PR va al informe como «visto de paso». **Prevenir lo que QA siempre encuentra:** campos
    de texto `z.string().trim().min(1)`; submit `disabled` mientras vuela + servidor idempotente;
    `flex-wrap` en filas de botones; foco al primer inválido; confirmación antes de borrar;
    `exigirSesion(rol)` en cada acción, nunca el uid del body; texto a 200 % sin cortes.
17. **Copy nuevo = provisional:** marcado `PLACEHOLDER`/`PROVISIONAL (fila N)` en el código y
    tu fila reservada descrita en el informe. Español es-VE, sin lorem.
18. **Cierre:** commits Conventional (solo tus archivos, `git add <rutas>`, nunca `-A`) con la
    descripción en español, push de tu rama, `gh pr create --base main --body-file .qa/pr-body.md`
    con la plantilla `.github/pull_request_template.md` (PR en español; cuerpo escrito con
    Write). Slot limpio al final (`git status` vacío). **Nunca** `gh pr merge`, push a `main`,
    force-push ni amend de lo empujado. El cuerpo termina con
    `🤖 Generated with [Claude Code](https://claude.com/claude-code)` y los commits con
    `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
19. **Informe final** (breve): URL del PR, slot, verificado / no verificado, decisiones
    abiertas, acciones manuales, filas de checklist, visto de paso, PHASE_LOG si no pudiste
    escribirlo, y «Kit feedback» si algo del kit te hizo tropezar.
