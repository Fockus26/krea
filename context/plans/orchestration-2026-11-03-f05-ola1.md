# Orquestación del 2026-11-03 (fase 05, ola 1) — brief compartido para los workers

> Fase 05 — plan: `context/plans/phase-05-paginas.md` (léelo: decisiones de César y «Cómo se monta una página») ·
> **ola 1 de 3** · sesión **cloud**: las unidades van **una tras otra** en la misma carpeta, no en paralelo.
> Después de este brief, lee la sección **«Reglas de la tanda»** de `context/plans/orchestration-2026-10-29-f03.md`:
> siguen valiendo, con los cambios de abajo (que mandan si chocan).

## Unidades (en este orden)

| # | Rama de trabajo | Qué |
|---|---|---|
| W1 | `claude/wizardly-allen-pixhf6` (unidad `fix/segmentado-container`) | Bug de César: selectores de acento y tema colapsados — `@container` solo en modo `block` |
| W2 | ídem, rehecha desde `main` tras mergear W1 (unidad `feat/pag-shell`) | Grupos de rutas y layouts por rol, topbar por ruta, Toaster global, nav del profe, `/` y `/profe`, `check:paginas` |
| W3 | ídem, tras W2 (unidad `feat/pag-auth`) | `/ingresar`, `/recuperar`, `/recuperar/enviado`, `/recuperar/nueva` |

## Cambios a las reglas de la tanda (sesión cloud)

- **Regla 3 (slot):** no hay pool ni `wt`. Trabajas en `/home/user/krea`, en la rama `claude/wizardly-allen-pixhf6`,
  que el orquestador ya dejó sobre `origin/main` actualizado. No cambies de rama ni crees otras.
- **Regla 4 (carpeta principal):** aquí **sí** puedes escribir lo local: deja tu `context/PHASE_LOG/<unidad>.md`
  (p. ej. `PHASE_LOG/feat-pag-shell.md`) y tus filas en `context/PAGE_INVENTORY.md` (solo tus filas). **No** edites
  `CURRENT_PHASE.md`, `CONTENT_CHECKLIST.md` ni `KIT_FEEDBACK.md`: tus filas del checklist y tu kit feedback van en el
  reporte, el orquestador las copia.
- **Regla 7 (servidor):** sin servidor ni navegador sobre la app (César, 2026-11-03: «solo el build»). Se permite
  Playwright con `page.setContent()` sobre HTML propio + el CSS compilado de `.next/static/css/*.css` para **medir**
  (no es un servidor de la app). Sin capturas. El CSS de Turbopack está en `.next/static/chunks/`; el Chromium
  preinstalado se fuerza con `CHROMIUM_PATH=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell`
  (ver `scripts/qa/segmentado.mjs`).
- **Regla 22 (cierre):** `gh` no está autenticado en la nube. Commits Conventional en español, solo tus archivos
  (`git add <rutas>`, nunca `-A`), `git push -u origin claude/wizardly-allen-pixhf6`, y el PR contra `main` con la
  herramienta MCP `mcp__github__create_pull_request` (cárgala con `ToolSearch` «select:mcp__github__create_pull_request»;
  owner `Fockus26`, repo `krea`), con el cuerpo de `.github/pull_request_template.md`. Título del PR en español con el
  nombre de la unidad (`fix(ui): …`, `feat(paginas): …`). En el cuerpo, la línea «Sesión cloud: lo mergea el orquestador
  con CI verde (decisión de César)». **No** mergees, no te suscribas al PR, no esperes al CI: el orquestador lo hace.
  Pie del cuerpo: `🤖 Generated with [Claude Code](https://claude.com/claude-code)`; los commits terminan con la
  atribución que indique tu sesión.
- **Sin modelos en el repo:** ningún identificador de modelo en commits, PR ni código.

## Verificación de páginas sin servidor

- `bun run build` y leer `.next/server/app/<ruta>.html` (rutas en grupos salen sin el grupo: `(estudiante)/page.tsx` →
  `index.html`). Un `<h1>`, un `<main id="contenido">`, `<title>` único, `robots` `noindex` salvo `/ingresar`.
- Desde W2: `bun run check:paginas` (lo crea W2) hace esas comprobaciones en todas las páginas del build y verifica que
  cada `<a href>` interno apunte a una ruta generada. Las unidades siguientes lo corren antes de su PR.

## Formas compartidas (fijadas aquí)

- **Rutas finales** (handoff §3 + decisiones de César): estudiante `/`, `/notas`, `/notas/[tarea]`, `/tareas`,
  `/tareas/[tarea]`, `/equipo`, `/ranking`, `/perfil`; profesor `/profe`, `/profe/evaluar`, `/profe/evaluar/[entrega]`,
  `/profe/tareas`, `/profe/tareas/nueva`, `/profe/tareas/[id]`, `/profe/alumnos`, `/profe/equipos`, `/profe/puntos`,
  `/profe/premios`, `/profe/ranking`, `/profe/perfil`; auth `/ingresar`, `/recuperar`, `/recuperar/enviado`,
  `/recuperar/nueva`. Las que aún no existen se crean en las olas 2–3: un enlace hacia ellas **no** cuenta como roto
  para `check:paginas` si está en esta lista (W2 la deja como constante `RUTAS_PLANIFICADAS` en el script, y la ola 3
  la vacía al cerrar la fase).
- **Usuario actual** hasta la fase 07: `USUARIO_ESTUDIANTE` / `USUARIO_PROFESOR` de `lib/demo/usuarios.ts` (Yeilin Duarte;
  profe placeholder). Nada lee sesión ni cookies.
- **Las vistas `/secciones/*` no se tocan** (sus Toasters locales se quedan: están fuera de los grupos).

## Números reservados (contra `origin/main` @ 7146ff6: última decisión D125, última fila del checklist 94)

| Unidad | IDs de decisión | Filas `CONTENT_CHECKLIST` | Modelo · esfuerzo | Docker |
|---|---|---|---|---|
| W1 | D126–D127 | — | sonnet · medium | no |
| W2 | D128–D133 | 95–97 | opus · high | no |
| W3 | D134–D135 | 98–99 | sonnet · medium | no |

## Decisiones de César (vigentes)

Sin QA hasta el final; sin servidor ni capturas (solo build); sin versionado (ningún changeset); sin datos reales (no se
toca Firebase); ranking del profe en `/profe/ranking`; perfil del profe en `/profe/perfil` (Apariencia + Seguridad);
`/secciones`, `/componentes`, `/tokens` se quedan sin indexar hasta la fase 09.

## Simular el backend

No aplica: páginas con secciones por props y datos de `lib/demo/`; nada lee Firestore ni Storage (fase 07).
