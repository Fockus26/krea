# Current Phase — KREA

> **A board, not a diary.** ≤ 60 lines / 4 KB. Local file: backed up with
> `bun run context:backup` (branch `context-state`).

## Now

**Phase:** 08 — Responsive y pulido · **cerrada** (2026-11-05, #56–#61, D214–D219) · resumen: `PHASE_LOG/08-responsive-pulido.md`
Fases 01–08 cerradas · **Track:** Product · main @ d50568b · **fase 09 — QA final**: QA hecho (2026-11-06) → `plans/qa-version-1.md` (0 críticos · 6 altos · 6 medios · 7 bajos). Altos mergeados (#62–#66). Medios: PRs #67–#73. Sigue: bajos y cierre.
**Build local suprimido** (César, 2026-11-05): lo corren CI y Vercel, y el agente comprueba el preview. **QA con sesión:** `qa:local` y `.env.test.local` (alumno y profesor de prueba), nunca pedirle a César que inicie sesión.

| Unit | Branch | Status |
|---|---|---|
| Fase 08 (D214–D219) | #56–#61 | merged (d50568b) |
| Fase 09 · QA de versión | wt2 / wt3 | hecho · arreglos pendientes |
| Altos F-A1 · D-A2/A3 · D-A1 · D-A4 | #62–#65 | merged · repros en prod: galerías PASS, `method="post"` en el HTML |
| F-A2 grupal al cambiar de equipo (regla a, D221) | #66 `fix/grupal-cambio-equipo` | PR abierto · emulador FAIL main / PASS rama |
| F-M2+F-B1 validación con espacios | #67 `fix/validacion-espacios` | PR abierto · repros 8 y 10 PASS en la rama |
| D-M4 foco bajo la barra inferior (D222) | #68 `fix/scroll-padding` | PR abierto · repro 6 FAIL main / PASS rama |
| D-M2 OG de /ingresar (D223) | #69 `fix/og-ingresar` | PR abierto · preview con og:image |
| F-M1 corrección pisa otra pestaña (D224) | #70 `fix/evaluacion-version` | PR abierto · repro 7b FAIL main / PASS rama |
| D-M1 404 dinámica 200 aceptada (D225) | #71 `docs/not-found-200-aceptado` | PR abierto (solo decisión) |
| D-M3 + D-A1b filas estrechas (D226) | #72 `fix/ranking-estrecho` | PR abierto · repro 1 FAIL main / PASS rama |
| D-A1b botones con texto grande (D227) | #73 `fix/botones-texto-grande` | PR abierto · /perfil y tareas/nueva sin desborde |

## Blocked (actions for César or external)

QA de versión hecho (2026-11-06): lo no verificado está en `plans/qa-version-1.md` › Sin verificar.

**Decisiones de César:**
- **Capitán movido tras una entrega** (#66): en `/tareas/<id>` ve la entrega vieja y no puede enviar la del equipo nuevo (ya pasaba antes).
- Alumnos en móvil: «Desliza la tabla…» queda a unos 3400 px de la parte superior, debajo de la tabla (HANDOFF §2.15).
- Cambiar a un alumno de **sección** (W7/W8): no hay acción; ¿hace falta? y sus ajustes viejos ¿siguen en la sección vieja? (fila 134).
- El alumno no ve su historial de base en ninguna pantalla (D108 dice «el alumno lo verá»): ¿dónde?
- Perfil en la hoja Menú del profe (fila 97) y avatar/Menú junto a «En vivo» en Ranking móvil.
- Género del capitán (D075) · tildes de «Identidad de marca» (fila 64) · empates de premio (D086, D123–D124, fila 96).
- Seed de 5C sin notas evaluadas (ranking 5C empatado en 0) · HANDOFF §9 #3–#12 al llegar a su fase.
- Copy provisional de la fase 07: filas 121–136 del checklist.

**Acciones manuales:**
- **Rotar la clave de la cuenta de servicio** de `krea-d22f7` (se pegó en el chat). Faltan las cuentas de los demás profesores.
- Vercel: confirmar las `B2_*` (Production y Preview) y bucket privado; el código solo lee `B2_*` (D194), no `AWS_*`.
- Emails reales de los estudiantes (checklist #3): ya se cargan desde Alumnos → Editar (D209).
- Confirmar indexación solo `/ingresar` (D023) y metadata (fila 22) · `NEXT_PUBLIC_SITE_URL` con dominio (fila 21).

## Next

- **Fase 09 — QA final** (`phases/09-QA-FINAL.md`): la lista de arriba, más `design-qa` y `functional-qa`.
- Fase 09: bajos como decisiones (F-B2–B4, D-B1–B3) · cierre de fase (CONTENT_CHECKLIST, PHASE_LOG/09-qa.md, /kit-feedback, resumen de entrega).

## Phases

| # | Phase | Status |
|---|---|---|
| 01–07 | Tokens · Layout · Components · Sections · Pages · States · Backend | closed |
| 08 | Responsive and polish | closed (2026-11-05) |
| 09 | Final QA | in progress |
