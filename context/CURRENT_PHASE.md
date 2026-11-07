# Current Phase — KREA

> **A board, not a diary.** ≤ 60 lines / 4 KB. Local file: backed up with
> `bun run context:backup` (branch `context-state`).

## Now

**Phase:** 09 — QA final · **cerrada** (2026-11-06, #62–#76, D220–D230) · resumen: `PHASE_LOG/09-qa.md`
Fases 01–09 cerradas · **Track:** Product · main @ 8f818b8 · versión 1 entregada. Próximo QA de versión: `git diff --name-only d50568b..origin/main` (`plans/qa-version-1.md`).
**Build local suprimido** (César, 2026-11-05): lo corren CI y Vercel. **QA con sesión:** `qa:local` y `.env.test.local`; nunca pedirle a César que inicie sesión.

**Tanda 2026-11-06** (45 pedidos, 4 olas: la 4 es W18 offline, pedido 45 del 2026-11-07): `plans/batch-2026-11-06.md` · ola 1 mergeada (#78–#85) · **ola 2 de 3: 6 PRs abiertos (#86–#91)**, esperan revisión y merge de César (sin QA por memoria). Visuales elegidos: cinta de precaución + VS, podio que brilla + confeti, Puntos en una columna, píldora con extremos oscuros (W17).

| Unit | Branch | Status |
|---|---|---|
| W9 ranking celebración (10, 15–20) | `feat/ranking-celebracion` | PR #89 (wt1) · destello del podio con `--surface` (en oscuro puede verse flojo) |
| W10 Puntos formulario (11, 27) | `feat/puntos-formulario` | PR #88 (wt2) · equipo enlaza a su lista de sección |
| W11 premios (7, 8) | `feat/premios` | PR #90 (wt3) · clave B2 debe escribir y borrar en `premios/` |
| W12 alumnos CRUD (3) | `feat/alumnos-crud` | PR #91 (wt4) · el capitán borrado pasa al siguiente integrante (D269) |
| W13 mensaje diario (25, 36, 37) | `feat/mensaje-diario` | PR #86 (wt5) · bandas cortadas en 14 y 17 |
| W17 píldora extremos (22) | `fix/pildora-extremos` | PR #87 (wt6) · salto leve de luminosidad en 1,6 y 19,1 (alternativa: tinta #000) |

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
- Vercel: confirmar las `B2_*` (Production y Preview) y bucket privado; el código solo lee `B2_*` (D194), no `AWS_*`; la clave necesita **lectura**, escritura y borrado (el HEAD de D229).
- Brevo: `BREVO_API_KEY` y `BREVO_SENDER_EMAIL` en Vercel; probar recuperar con 38291460.
- Emails reales de los estudiantes (checklist #3): ya se cargan desde Alumnos → Editar (D209).
- Confirmar indexación solo `/ingresar` (D023) y metadata (fila 22) · `NEXT_PUBLIC_SITE_URL` con dominio (fila 21).

## Next

- Lanzamiento: contenido real (CONTENT_CHECKLIST filas 2–11, 14, 21, 64) y acciones de César de arriba.
- Pendientes chicos: capitán movido tras una entrega (D221) · Editar alumno «el último gana».

## Phases

| # | Phase | Status |
|---|---|---|
| 01–07 | Tokens · Layout · Components · Sections · Pages · States · Backend | closed |
| 08 | Responsive and polish | closed (2026-11-05) |
| 09 | Final QA | closed (2026-11-06) |
