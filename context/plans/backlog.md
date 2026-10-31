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
