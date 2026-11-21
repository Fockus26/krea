# QA de versión 2 — KREA (QA final)

`main @ b9f51c9` · 2026-11-21 · Postgres local en Docker (`qa_4302`, `qa_4303`), seed ficticio, claves de terceros neutralizadas.
Punto de partida del próximo QA: `git diff --name-only b9f51c9..origin/main`.

Informes: [`qa-version-2-functional.md`](qa-version-2-functional.md) · [`qa-version-2-design.md`](qa-version-2-design.md).
Repros: `qa-version-2/funcional/` (`node --env-file=.env.test.local <script> <url>`, con `lib.mjs` y el lanzador `server.mjs`) ·
`qa-version-2/diseno/` (`bash todos.sh <base>`; datos con `datos.mjs`). Cada arreglo se cierra con su repro: FAIL en main, PASS en la rama.

## Hallazgos (0 críticos · 4 altos · 6 medios · 6 bajos)

| ID | Sev. | Qué | Repro | Dónde / unidad |
|---|---|---|---|---|
| F-A1 | Alto | Bloqueo de 5 fallos por cuenta saltable (login urlencoded; ráfaga paralela) | `funcional/v2-01` | `app/api/auth/[...all]/route.ts:41-56` · backend |
| D-A1 | Alto | Inicio en oscuro: tarjeta de puntos blanco sobre acento claro 2,51:1 (4 acentos) | `diseno/7` | `points-card.tsx:41` (D217 × D301) |
| D-A2 | Alto | Texto 200 % a 390 px: desborde en /profe/evaluar/[e], /tareas/[t] grupal, /profe, /profe/alumnos (clase: `inline-flex shrink-0` sin wrap) | `diseno/13` | clase completa |
| D-A3 | Alto | 404 dinámica responde 200 y se pinta dentro del shell (dos `main#contenido`) | `diseno/2`, `diseno/9` | revisar D225 |
| F-M1 | Medio | Ranking expone la cédula de todos los compañeros (clave de datos) | `funcional/v2-02` | **decisión de César** (D388) |
| F-M2 | Medio | Tarea evaluada dice «Pendiente · vale N» por pregunta | `funcional/v2-03` | `app/(estudiante)/tareas/[tarea]/page.tsx:208` |
| F-M3 | Medio | Foco a `<body>` al cerrar diálogos Eliminar/Devolver en Evaluar | `funcional/v2-04` | `acciones-entrega.tsx:228-241` |
| D-M1 | Medio | Píldora de nota 10–12 (blanco con sombra) 3,6–3,84:1 | `diseno/8` | **decisión de César** (D347 vs AA) |
| D-M2 | Medio | Ideal del profe en oscuro: enlace 3,56:1 | `diseno/12` | — |
| D-M3 | Medio | aria-label sin el texto visible en ranking (35 nodos); `aria-controls` inválido en /perfil | `diseno/10`, `diseno/11` | — |
| F-B1 | Bajo | Reenvío de grupal por partes pisa la respuesta aceptada | `funcional/v2-05` | **decisión de César** (D463/D419) |
| F-B2 | Bajo | Opciones de ajuste: último en guardar gana sin aviso | `funcional/v2-06` | — |
| D-B1..4 | Bajo | Elipsis en ranking a 1024 px · alturas desiguales de tarjetas · «él» fijo en vista del integrante · URL de enlace se parte en cualquier punto (D470, diseñado) | — | backlog |

## Limpio

Regresiones de v1 (salvo la 404) · auth y permisos por rol · tareas (suma 20, pasos 0,5, hora, vencidas, prórroga/reabrir) · enlaces solo http/https y sin href peligroso · Evaluar (rangos, `editada`, presencia, cola en vivo, devolver, bases) · grupal por partes (capitán, `partes-pendientes`, `tomada`, D248, reparto en vivo, candado) · D007 · ranking en vivo, premios con empate, cambio de equipo · borrador, cola offline, XSS · 320–3840 sin scroll en ~40 rutas · reduced motion · cero valores mágicos · partes y enlace a 320 px.

## Sin verificar

Brevo, B2 e IA reales · caducidad real de enlace y sesión · iPhone real y push · vista del alumno de `/tareas/[t]/ideal` · daltonismo (no re-corrido) · pantallas 500/offline/mantenimiento, favicon y OG · `/crear-contrasena` · alto contraste del profe caso por caso · carga: 30 logins simultáneos dieron 12 × 500 (pool de 5) en máquina saturada → medir en preview.

## Acciones para César

1. F-M1: ¿id opaco por alumno en el ranking o se queda la cédula?
2. D-M1: ¿la píldora de nota cumple AA (cambiar D347) o se acepta?
3. F-B1: (a) el servidor impone lo aceptado también al editar · (b) marcar «cambiada por el capitán» · (c) dejarlo.
4. Probar Brevo, B2 e IA en el preview; opcional prueba de carga de logins.

## Entorno

`qa:local --postgres` no sirve en KREA: crea cuentas por sign-up (apagado) y por email (aquí cédula), no carga el seed y **deja pasar las claves reales de `.env.local`** (B2, Brevo, Anthropic). Se usó `--db-only` + `scripts/seed-db.ts` + `server.mjs`, que vacía esas claves.
