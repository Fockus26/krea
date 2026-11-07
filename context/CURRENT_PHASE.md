# Current Phase — KREA

> **A board, not a diary.** ≤ 60 lines / 4 KB. Local file: backed up with
> `bun run context:backup` (branch `context-state`).

## Now

**Phase:** 09 — QA final · **cerrada** (2026-11-06, #62–#76, D220–D230) · resumen: `PHASE_LOG/09-qa.md`
Fases 01–09 cerradas · **Track:** Product · main @ 8f818b8 · versión 1 entregada. Próximo QA de versión: `git diff --name-only d50568b..origin/main` (`plans/qa-version-1.md`).
**Build local suprimido** (César, 2026-11-05): lo corren CI y Vercel. **QA con sesión:** `qa:local` y `.env.test.local`; nunca pedirle a César que inicie sesión.

**Tanda 2026-11-06** (53 pedidos, 5 olas): `plans/batch-2026-11-06.md` · olas 1–3 **cerradas** (#78–#95, main @ 761805f; sin QA por memoria) · **ola 4 de 5 lanzada** (2026-11-07): W18 `feat/offline` wt1 · W20 `fix/foto-premio` wt2 · W22 `feat/eliminar-en-lote` wt3 · W24 `fix/contraste-acentos` wt4 (mergear W22 antes que W18) · luego ola 5: W23 `fix/icono-texto` (pedido 48).

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
- Vercel: confirmar las `B2_*` (Production y Preview) y bucket privado; el código solo lee `B2_*` (D194), no `AWS_*`; la clave necesita **lectura**, escritura y borrado (el HEAD de D229), también en `premios/` (fotos de premio, #90).
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
