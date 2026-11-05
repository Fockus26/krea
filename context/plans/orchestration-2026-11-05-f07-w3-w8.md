# Fase 07 · W3–W8 · brief compartido (sesión cloud, 2026-11-05)

> Una unidad tras otra en esta sesión: el worker lleva su unidad hasta un **PR abierto**; el
> orquestador espera CI, hace squash-merge y reinicia la rama antes de la siguiente.
> Plan y números reservados: `context/plans/phase-07-backend.md` (tabla «Unidades» y
> «Números reservados»; lee también «Para las siguientes» de W1 y W2).

## Entorno (no negociable)

- **Carpeta:** `/home/user/krea` · **rama:** `claude/dreamy-babbage-vloz3y` (ya creada desde
  `origin/main`). No cambies de rama, no crees otras, no hagas `push --force` ni `reset --hard`.
- **Sin servidor, solo build** (César, 2026-11-03): no arranques `next dev`/`qa:local`, sin
  capturas (en el PR: «Capturas: no disponibles — sin servidor por decisión de César»).
- **Sin QA hasta el final** (César): el `functional-qa` de la unidad queda como
  `QA pendiente: …` en «Blocked» de `context/CURRENT_PHASE.md` y en el PR.
- **Base real `krea-d22f7`:** ya tiene el seed (69 alumnos + 1 profe + 1 alumno de prueba) y
  cuentas de Auth. **Nunca** la toques desde pruebas ni scripts. Pruebas con Auth/Firestore →
  emuladores (`bun run test:rules`; Java está instalado). Las variables `FIREBASE_*` y
  `NEXT_PUBLIC_FIREBASE_*` existen en el entorno: no las imprimas (`env`, `printenv`, `echo`).
- Red: solo googleapis y gestores de paquetes. Backblaze (`s3.us-east-005.backblazeb2.com`)
  está bloqueado: el código de Storage se prueba con un cliente simulado/inyectado.
- Context7 para APIs de Next (lee `node_modules/next/dist/docs/` si dudas: no es el Next que
  conoces), firebase-admin y la librería que añadas.

## Reglas que ya están decididas (no las re-litigues)

- D175: toda escritura por Server Action con el Admin SDK (`firebaseAdmin()`), zod de
  `lib/modelo.ts`, `ranking/{seccion}` recalculado con `calcularRanking` **en la misma
  transacción**. Reglas: el cliente no escribe nada.
- `exigirSesion(rol)` de `lib/dal.ts` en cada página/acción con datos; nunca el uid del body.
- D007 nota ≠ puntos · D003 `null` = Pendiente · D004 pasos de 0,5, tareas suman 20 · D006
  base 10–20 · D012 solo el capitán envía la grupal · D176/D177 base con historial.
- `cacheComponents` activo: datos de sesión dentro de `<Suspense>`.
- Copy en español (es-VE, decimales con coma), sin lorem; contenido faltante = placeholder
  marcado + fila en `context/CONTENT_CHECKLIST.md` (usa tus filas reservadas).
- Decisiones nuevas: un archivo por decisión en `context/decisions/` con tus números.
  Valor que falta → opción conservativa coherente con lo decidido, y «Decisión tomada /
  alternativa» en el PR.

## Cierre de cada unidad (el worker)

1. `bun run test:related` mientras trabajas; al final `bun run build`, `bun run typecheck`,
   `bun run lint`, `bun run test` y, si tocaste reglas o algo con emuladores,
   `bun run test:rules`. Todo verde.
2. a11y (skill `a11y`) si tocaste UI: revisión de código (sin servidor no hay axe).
3. Actualiza `context/CURRENT_PHASE.md` (fila de tu unidad → «PR abierto», tus QA pendientes)
   y la tabla del plan; `bun run context:backup`.
4. `git add` con rutas (nunca `-A`), commits Conventional en español, `git push -u origin
   claude/dreamy-babbage-vloz3y`.
5. PR contra `main` con `mcp__github__create_pull_request` (owner `fockus26`, repo `krea`;
   cárgala con ToolSearch), con las secciones de `.github/pull_request_template.md` y la línea
   «Sesión cloud: lo mergeo yo con CI verde (decisión de César)». **No lo mergees.**
6. Informe final (formato de `.claude/agents/feature-worker.md` §8).
