# Current Phase — KREA

> **A board, not a diary.** ≤ 60 lines / 4 KB. Local file: backed up with
> `bun run context:backup` (branch `context-state`).

## Now

**Phase:** 09 — QA final · **cerrada** (2026-11-06, #62–#76, D220–D230) · resumen: `PHASE_LOG/09-qa.md`
Fases 01–09 cerradas · **Track:** Product · main @ 8f818b8 · versión 1 entregada. Próximo QA de versión: `git diff --name-only d50568b..origin/main` (`plans/qa-version-1.md`).
**Build local suprimido** (César, 2026-11-05): lo corren CI y Vercel. **QA con sesión:** `qa:local` y `.env.test.local`; nunca pedirle a César que inicie sesión.

**Tanda 2026-11-06** cerrada (olas 1–5, #78–#101, main @ 0f74ca4).

**Tanda 2026-11-07** (pedidos 54–58) **cerrada**: olas 1–3, #102–#107, D307–D326 · main @ dec92d3 · sin QA de ola (memoria): el flujo de años y secciones (crear 4B y usarla en alumnos, equipos, tareas, puntos y ranking) va al QA final. `plans/batch-2026-11-07.md`.

**Migración al VPS mergeada** (#108, main @ 6847dae). Recuperación por correo OK tras cambiar `BREVO_API_KEY` por una clave API (`xkeysib-`, no SMTP).

**Tanda 2026-11-08** (pedidos 59–64, una ola Y1–Y6, D328–D345, filas 171–175) **cerrada**: #109–#114 + #115 (fix import web-push que rompía el build de prod) · main @ e528d1b, prod READY · sin QA de ola (QA final). Pendiente de César: VAPID en Vercel + migración `0001_push_suscripciones` en `krea_preview`/`krea`; elegir `VARIANTE_CORREO` en `/correos`; ¿botón dorado (secundario) con texto blanco en oscuro?

**Tanda 2026-11-10** (abierta): alumnos importados a prod (69, 12 equipos, sin notas; #123; contraseñas en `.qa/contrasenas-alumnos-2026-11-10.csv`, fuera del backup) · #121 skeleton Panel · #122 años colapsables 1–6/A–F · #124 hora de entrega + selector de secciones (migración 0002 pendiente en krea_preview y krea antes del deploy). `plans/orchestration-2026-11-10-prompts.md`.
**Tarea 1 «Identidad de marca» cargada en prod** (2026-11-10, script `importar-tarea-historica.ts`): 5A+5C, cierra 13/11 17:00, premio «Ir al Cine», 12 alumnos de 5A evaluados sin respuestas. #128 mergeado (ficha con tareas entregadas). Rama `feat/puntaje-final-tarea-1`: quita «Editar respuestas», la ficha abre la entrega solo para ver (`?ver`) y pone el puntaje final de la tarea 1 (`lib/puntaje-final`); el alumno sube sus respuestas sin perder la nota (`faltanRespuestas`).
**Tanda 2026-11-12** (cerrada, main @ d8bfcf2): #130 X1 imágenes original ≤ 25 MB, guardado ≤ 1,5 MB (wt2) · #131 X3 «Instalar KREA» en Perfil › Avisos (wt4) · #132 X2 «No participó» en grupales → nota 1 (wt3). Sin migraciones. QA final: revisar que los no capitanes vean preguntas y respuestas de la grupal (D248). `plans/orchestration-2026-11-12-prompts.md`.
**Tanda 2026-11-13** (cerrada, main @ 56c3105, D375–D383, filas 191–196): #139 U1 opciones de ajuste editables en `config/motivos`, sin «Otro» · #138 U2 contacto del profe (migración 0003, ¿aplicada en krea_preview y krea?) + «Tus profesores» · #137 U3 Badge `size`, Panel estira solo vacío (D382 sustituye D240), premio por definir con botón abajo. QA final: CRUD de opciones con dos profes; ajuste con opción borrada; contacto WhatsApp/correo; alturas medidas. `plans/orchestration-2026-11-13-prompts.md`.
**Tanda 2026-11-14** (abierta, 15 pedidos + 2 experimentales, 4 olas: `plans/batch-2026-11-14.md`): **ola 1 de 4 lanzada** — V1 `feat/evaluar-filtros` · V2 `feat/avatar-sin-cedula` · V3 `feat/icono-k` · V4 `fix/instalar-ios` · V5 `feat/editar-entrega` · V6 `feat/notas-por-tarea` (D384–D401, filas 197–211). Prompts: `plans/orchestration-2026-11-14-prompts.md`. PRs: #140 V4 (CI verde) · #141 V3 ícono K (César elige K o «Krea») · #142 V1 filtros de Evaluar · #143 V6 notas por tarea · #144 V2 avatar sin cédula (SQL de semillas: lo aplica César tras el deploy) · #145 V5 editar entrega. **Ola 1 cerrada**: #140–#145 mergeados, main @ 899a420 (#141 con D402: «krea» ≥ 64 px, «K» ≤ 32 px). Pendiente de César: SQL de semillas (por `ssh kit-vps`, no tiene `psql`). **Ola 2 cerrada**: #146 W2 presencia al evaluar (D408–D410, fila 217) y #147 W1 base por tarea (D403–D407, filas 212–216; `evaluacion.bases`) mergeados, main @ ddb65bc, sin migraciones. Pendiente de César: SQL `scripts/sql/2026-11-14-bases-por-entrega.sql` en krea_preview y krea (hasta entonces no cambiar bases en Editar alumno; D407 Pending); chip «Base» del Perfil (fila 216). QA final: dos profes en la misma entrega (aviso y `cambio`); base por integrante en grupal; corregir conserva la base. Sigue: ola 3 (X1 devolver/eliminar entrega · X2 grupal por partes). QA final: alumno edita mientras el profe evalúa (toast `editada`); edición en cola offline ya evaluada; /perfil con semilla vieja antes del SQL; instalar en iPhone real..

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

- **Migración al VPS** (D327, `plans/migrate-vps.md`): rama `feat/migrate-vps`, PR en **draft** hasta el cutover. Código listo (Postgres + Better Auth, sin Firebase; 1484 pruebas). Bases `krea`, `krea_preview` (migrada), `krea_dev` (migrada + seed). Falta: variables en Vercel, parámetros de hash, `functional-qa` sobre el build y el cutover con César.

- Lanzamiento: contenido real (CONTENT_CHECKLIST filas 2–11, 14, 21, 64) y acciones de César de arriba.
- Pendientes chicos: capitán movido tras una entrega (D221) · Editar alumno «el último gana».

## Phases

| # | Phase | Status |
|---|---|---|
| 01–07 | Tokens · Layout · Components · Sections · Pages · States · Backend | closed |
| 08 | Responsive and polish | closed (2026-11-05) |
| 09 | Final QA | closed (2026-11-06) |
