# Current Phase — KREA

> **A board, not a diary.** ≤ 60 lines / 4 KB. Local file: backed up with
> `bun run context:backup` (branch `context-state`).

## Now

**Phase:** 08 — Responsive y pulido · **cerrada** (2026-11-05, #56–#61, D214–D219) · resumen: `PHASE_LOG/08-responsive-pulido.md`
Fases 01–08 cerradas · **Track:** Product · main @ d50568b · **fase 09 — QA final**: QA hecho (2026-11-06) → `plans/qa-version-1.md` (0 críticos · 5 altos · 6 medios · 7 bajos). Sigue: arreglos por severidad, uno por PR.
**Build local suprimido** (César, 2026-11-05): lo corren CI y Vercel, y el agente comprueba el preview. **QA con sesión:** `qa:local` y `.env.test.local` (alumno y profesor de prueba), nunca pedirle a César que inicie sesión.

| Unit | Branch | Status |
|---|---|---|
| Fases 05–07 | #35–#55 | merged |
| Fase 08 (D214–D219) | #56–#61 | merged (d50568b) |
| Fase 09 · QA de versión | wt2 / wt3 | hecho · arreglos pendientes |

## Blocked (actions for César or external)

**QA pendiente para la fase 09** (functional-qa contra emuladores + axe, teclado, 320 px):
- W2 login/sesión/salir · W3 envío real por Brevo con 38291460 (api.brevo.com bloqueado), enlace → /recuperar/nueva → aviso y sesiones revocadas.
- W4 ranking en vivo en dos navegadores, cambio de contraseña.
- W5 subida real a B2 (host bloqueado), enviar individual/grupal (capitán / no), borrador tras recargar.
- W6 borrador a medias, publicar (suma 20), editar con/sin entregas, cerrar, empate de premio.
- W7 evaluar la cola, corregir, «Deshacer», ajuste + anulación en el ranking y en el detalle del alumno. `evaluar/[entrega]` y `tareas/[id]` sin visitar en la fase 08 (el seed no trae entregas pendientes).
- W8 editar alumno, mover/quitar/capitán, logo real en B2.
- Ya hecho en la fase 08, con sesión: 320–3840 px, altura corta, contraste por tema y acento, foco con Tab, 404 con cada sesión.

**Decisiones de César:**
- **F-A2 (alto):** alumno movido tras una grupal cuenta doble: regla (a) nota con el equipo que entregó · (b) pasa al nuevo si no está evaluada · (c) bloquear el cambio con grupales abiertas.
- Alumnos en móvil: «Desliza la tabla…» queda a unos 3400 px de la parte superior, debajo de la tabla (HANDOFF §2.15).
- Cambiar a un alumno de **sección** (W7/W8): no hay acción; ¿hace falta? y sus ajustes viejos ¿siguen en la sección vieja? (fila 134).
- El alumno no ve su historial de base en ninguna pantalla (D108 dice «el alumno lo verá»): ¿dónde?
- Galerías `/secciones`, `/componentes`, `/estados` públicas con datos reales del seed (D181), y con scroll horizontal en móvil.
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
- Fase 09: bloquear o borrar `/secciones`, `/componentes`, `/tokens` (y `/estados` 404 en producción).

## Phases

| # | Phase | Status |
|---|---|---|
| 01–07 | Tokens · Layout · Components · Sections · Pages · States · Backend | closed |
| 08 | Responsive and polish | closed (2026-11-05) |
| 09 | Final QA | in progress |
