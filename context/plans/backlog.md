# Backlog — KREA

| Fecha | Origen | Qué | Prioridad |
|---|---|---|---|
| 2026-10-29 | W1 f03 (visto de paso) | `/tokens` muestra el título "Tokens · KREA · KREA": `app/tokens/page.tsx` pone `title: "Tokens · KREA"` y la plantilla del layout añade " · KREA". Arreglo: `title: "Tokens"` | Low |
| 2026-10-30 | W7 f03 (visto de paso, #17) | El reset de Tailwind quita `list-style` de `ol/ul`: Safari/VoiceOver puede no anunciar las listas; Biome prohíbe `role="list"`. Decidir globalmente (a11y del cierre de fase o fase 08) | Medium |
| 2026-10-30 | W7 f03 (visto de paso, #17) | `cn` no fusiona utilidades de tipografía propias con las de Tailwind (`text-xs!` en el chip Empate): registrar el grupo en `lib/utils.ts` | Low |
- (F04 ola 3, W4) `lib/perfil.ts`: exponer `cedulaPuntos` (cédula con puntos sin prefijo «C.I.») y usarlo en Alumnos en lugar del `replace`. Baja.
- (F04 ola 3, W1) Chip «En vivo» del ranking en la `TopBar` móvil (HANDOFF §3 Ranking): `TopBar` no lo admite. Fase 05. Media.
- (F04 ola 3, W1) Seed 5C sin notas evaluadas: el ranking de 5C sale todo empatado en 0 y en riesgo. ¿Datos de ejemplo para 5C o se espera a datos reales? Baja.
- (F04 ola 3, W3) X «Salir de la evaluación» en la `TopBar` móvil de Evaluar (hoy volver + «Entrega 1 de 7»). Fase 05. Media.
- (F04 ola 3, W3) Toast en móvil (a 88 px) se superpone a la `ActionBar` (72 px + alto): coordinar el offset del Toaster global (D035) con `ActionBar`. Fase 05. Media.
- (F04 ola 3, W3) `<kbd>` de los atajos de Evaluar sin estilo (no definido en lienzo ni handoff). Baja.
- (F04 ola 4, W2) Ids de tareas de `lib/demo/evaluar.ts` `COLA` (`logo-y-paleta-emprendimiento`, `plan-de-ventas`) no casan con `TAREAS` (`logo-y-paleta` «Logo y paleta de la marca»): «Evaluar n» no sale en esas tareas de la lista del profe. Alinear al unificar datos (fase 05/07). Y `TAREAS.estado` es el del alumno: el profe necesita su propio estado por tarea.
- (F04 ola 4, W2) Constructor en móvil: quitar la barra inferior y poner «Guardar borrador» en la topbar (`Vista`/`TopBar` no lo admiten hoy) — fase 05.
- (F04 ola 4, W3) `NumberStepper` para rangos con signo: desde `null` el primer +/− parte de `min` (−20); `aria-valuetext` no personalizable («2», no «más 2 puntos») y negativo con «-» en vez de «−». Propuesta: props `formatValueText` / `signed`. Puntos lo rodea hoy por fuera.
- (F04 ola 4, W3) `Alert`: ícono fijo por variante y `role="alert"` en err; Puntos usa `alertVariants` sobre un span para TrendingUp + `role="status"`. Valorar prop `icon` y `role`.
- (F04 ola 4, W3) Combobox de Puntos: `aria-controls` apunta a un listbox no montado mientras está cerrado (portal): confirmar con axe en el QA final.
- (F05 ola 1, W2) Contraste de la tarjeta de puntos de Inicio: axe marca el desglose (13 px) y el chip translúcido sobre `--accent` + círculos `--splash` a 4,1:1 y 4,26:1 (pasa en azul claro). Decisión de diseño de la fase 04: escalar a César. **Hecho:** D217, #59.
- (F05 ola 1, W2) Avatar de la topbar sin imagen (DiceBear no carga) muestra «YD» y axe marca `label-content-name-mismatch` contra «Tu perfil». Baja.
- (F05 ola 1, W2) Constructor a 320 px: con volver + «Guardar borrador» el título «Nueva tarea» se trunca a ~78 px. Baja (fase 08).
- (F05 ola 1, W2) Ranking móvil: el lienzo quita el avatar/Menú junto al chip «En vivo»; hoy se quedan (Menú solo ícono). Confirmar con César. Baja.

- (F05 ola 2, media) `/tareas/[tarea]` evaluadas: sin respuestas ni fecha de entrega reales (fila 103); el «no capitán» solo se ve en `/secciones/tareas` hasta la fase 07.
- (F05 ola 2, baja) Detalle de nota: solo «Identidad de marca» tiene detalle (D136, fila 100).
- (F07 W2, **alta**) Galerías `/secciones`, `/componentes`, `/estados` públicas con nombres y notas reales del seed (D181). Bloquearlas (proxy) o pasarlas a datos ficticios antes de dar la URL a nadie.
- (tanda 11-06 W6, media) Grupal enviada por alguien que ya no está en el equipo: `entregaVista` deja `quien = null` y sale el texto del Excel «se cargó con la nota, sin el registro del envío» (engañoso).
- (tanda 11-06 W6, baja) Integrante que entró al equipo tras la entrega: ve «las respuestas aparecen cuando él las envíe» aunque ya se envió.
- (tanda 11-06 W6, decisión de César) Borrador grupal compartido en Firestore para que los integrantes vean las respuestas antes del envío (hoy solo en localStorage del capitán, D196/D249).
- (tanda 11-06 W1, baja) `sincronizarClaims` (`lib/firebase/equipos.ts`) mezcla claims viejas con las del perfil: una marca quitada solo del perfil seguiría en las claims.
- (tanda 11-06 W1, baja) `CedulaInput` fija `autoComplete="username"`: en «Nuevo profesor» el navegador puede sugerir la cédula del admin.

- (tanda 11-06, W10) `autoGrow` del Textarea en los otros campos libres: `question-card-answer`, `question-card-review`, `edit-student-dialog`, `question-editor`.
- (tanda 11-06, W11) El alumno no ve en ningún lado que ganó un premio individual (calcularlo en el servidor con las notas de la sección).
- (tanda 11-06, W11) Galerías `lib/demo/entrega.ts:123`, `evaluar.ts:412`, `tareas-profe.ts:138` siguen filtrando el premio a solo grupal.
- (tanda 11-06, W12) `task-builder.tsx:466` y `teacher-task-list.tsx:211` usan `disabled`+`aria-busy` a mano en vez de `loading` (D285).
- (tanda 11-06, W12) `tests/rules/firestore.test.ts` tiene el puerto 8080 fijo.
- (tanda 11-06, W14) `EditStudentDialog` al guardar cierra con `setAbierto(false)` sin `onAbierto`: la URL conserva `?alumno=` tras guardar.
- (tanda 11-06, W16) Con la hoja del calendario abierta el botón «Elegir fecha» dice `aria-expanded=false`; D116 y el docblock de `TaskBuilder` aún dicen «sin calendario».
- (tanda 11-06, W15) Sin FLIP en «Sin equipo» ni tableros de equipos/premios (cuadrículas; `useFlip` solo mide en vertical); alumno eliminado sin salida animada.
- **Offline: deshabilitar sin red las acciones que no se encolan** (evaluar, puntos, alumnos, profes…), con «Sin conexión» en el botón. Hoy las cubre el banner global y el error «No se pudo conectar». Propuesta de W18 (#99), después de que #98 esté en main (toca sus archivos). Decisión de César 2026-11-07: «el resto muestra Sin conexión y no deja enviar».
- **`image-upload.tsx` zona de arrastre** (`ZONE`, ~líneas 112 y 243): ícono + texto de dos líneas con `items-center`; debería usar `icono-linea` (D304). Visto de paso por W23 (#100). Baja.
- (tanda 11-07 X5b, visto de paso, Low) `decidirPremio`: `zDecidirPremio.seccion` no comprueba que la sección esté entre las de la tarea.
- tests/unit/formularios-post.test.ts recorre app/ y components/ síncrono con timeout de 5 s: frágil con carga (visto en X2, 2026-11-12).
- (2026-11-14, V2) Cédulas ajenas que aún ve un alumno: `/api/ranking/[seccion]` indexa `alumnos` por cédula (`lib/modelo.ts:511`, `lib/ranking-en-vivo.ts:92,103`), `lib/vistas-estudiante.ts:518,630` (`id: m.cedula`), `capitanId` en equipos del ranking en vivo. Media: decidir con César si se oculta.
