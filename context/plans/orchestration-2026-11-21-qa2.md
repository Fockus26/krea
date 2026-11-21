# Ola de arreglos del QA de versión 2 (2026-11-21) — brief común (R1–R6)

> Hallazgos: `context/plans/qa-version-2.md` (resumen) y los informes
> `qa-version-2-functional.md` / `qa-version-2-design.md`. Repros: `context/plans/qa-version-2/funcional/`
> y `.../diseno/`. Prompts: `context/plans/orchestration-2026-11-21-qa2-prompts.md` (tu sección `## Rn`).
> Carpeta principal: `C:\Users\Cesar\Documents\Work\krea` (su `context/` con ruta absoluta). main @ b9f51c9.

## Unidades

| # | Rama | Hallazgos | Modelo | Servidor |
|---|---|---|---|---|
| R1 | `fix/login-bloqueo` | F-A1 | opus · high | no |
| R2 | `fix/id-opaco` | F-M1 (+ clase: cédulas ajenas en payloads de alumno) | opus · high | no |
| R3 | `fix/contraste-oscuro` | D-A1, D-M1 (solo notas 10–12), D-M2 | sonnet · medium | sí |
| R4 | `fix/texto-200-rutas` | D-A2 (clase), D-B1, D-B2 | sonnet · medium | sí |
| R5 | `fix/a11y-estados` | D-A3, F-M2, F-M3, D-M3, D-B3 | sonnet · medium | sí |
| R6 | `fix/concurrencia-datos` | F-B1 (opción a), F-B2 | opus · medium | no |

D-B4 (la URL de `RespuestaEnlace` se parte en cualquier punto) no se toca: es D470, diseñado.

## Números reservados

| Unidad | Decisiones | Filas CONTENT_CHECKLIST | Migración |
|---|---|---|---|
| R1 | D491–D492 | 275 | no |
| R2 | D493–D496 | — | no (id derivado, ver prompt) |
| R3 | D497–D500 | — | no |
| R4 | D501–D503 | — | no |
| R5 | D504–D507 | 276–279 | no |
| R6 | D508–D511 | 280–282 | `drizzle/0008_*` solo si F-B2 la necesita |

Rangos cerrados; si al mezclar `origin/main` un ID ya existe, toma el siguiente libre y dilo.

## Decisiones de César (2026-11-21)

- **F-M1:** la cédula de otros alumnos se reemplaza por un **id opaco**.
- **D-M1:** la píldora de nota cumple AA **solo en las notas 10–12** (las que fallan); el resto
  sigue blanco con sombra (D347).
- **F-B1:** opción (a): el servidor impone lo aceptado **también al editar/reenviar**.

## Zonas compartidas

- R4 es transversal (clases de `flex-wrap`/`min-w-0`): toca solo clases de layout. R3 toca solo
  color/tokens; R5 estructura y aria. Si coincides en un archivo con otro, cambia solo tu línea.
  Orden de merge: R1, R2, R6, R3, R5, **R4 al final** (mezcla `origin/main` antes).
- R2 y R6 pueden coincidir en `lib/vistas-estudiante.ts`: R2 solo los ids que salen al cliente;
  R6 solo `lib/data/entregas.ts` y la lógica de envío.

## Reglas de la tanda

Las 17 reglas de `C:\Users\Cesar\Documents\Work\krea\context\plans\orchestration-2026-11-20.md`
› «Reglas de la tanda», valen tal cual, con estos cambios:

- **Regla 6 (servidor):** las unidades marcadas «sí» arriba **sí** levantan un servidor local para
  correr sus repros (FAIL en main, PASS en la rama) y medir. Cómo:
  1. Base: `bun run qa:local -- --port <P> --postgres --db-only` (Docker Desktop corre; crea
     `qa_<P>` en el contenedor compartido — no lo pares ni lo reinicies) y luego
     `bun scripts/seed-db.ts` contra esa base (lee cómo lo apunta). **No** uses `qa:local` sin
     `--db-only`: deja pasar las claves reales de `.env.local`.
  2. Servidor: copia `context/plans/qa-version-2/funcional/server.mjs` a tu `.qa/`, cambia el
     `qa_4302` por `qa_<P>` y córrelo con `node .qa/server.mjs <P>` (vacía B2, Brevo, Anthropic,
     Firebase). Nunca la base real ni el VPS.
  3. Puerto: el de tu slot; si está ocupado por otro proceso (otro proyecto usa 4302), usa
     `43<9N>` (wt3 → 4393). No mates procesos ajenos.
  4. Repros de diseño: `context/plans/qa-version-2/diseno/` (datos con `datos.mjs`); funcionales:
     `.../funcional/` con `lib.mjs`. Cópialos a tu `.qa/repro/`, ajusta base/puerto. Adjunta
     salida FAIL (main, con `bash scripts/run-on-main.sh` si existe, si no un worktree temporal
     no: corre el repro antes de tu primer cambio) y PASS al PR.
  5. Para tu servidor al terminar. Playwright con `node`.
- Las unidades «no» verifican con pruebas (`tests/unit`, `tests/db` sobre PGlite): la prueba que
  reproduce el hallazgo falla antes del arreglo y pasa después (dilo en el PR). El repro HTTP lo
  corre el orquestador al cerrar la ola.
- Cuentas de prueba: las del seed (ficticias). No escribas cédulas ni nombres reales; no abras
  `data/privado/`.
- **Clase completa** (regla 11) con guarda medida: R4 deja el repro de texto 200 % versionado en
  `scripts/qa/` y lo corre sobre todas las rutas.
