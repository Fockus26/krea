# Fase 03 — Componentes · plan de olas

> Escrito por `orchestrate` el 2026-10-29. Cada ola corre en **su propia sesión**.
> Carpeta principal: `C:\Users\Cesar\Documents\Work\krea` · Fase: `phases/03-COMPONENTS.md` · Handoff §2 (y §6 movimiento, §8 trampas)
> **Sin QA hasta el final del proyecto** (César, 2026-10-29): ninguna ola lanza `wave-qa`, ni servidor, ni capturas.
> Sin versionado: ningún PR lleva changeset.

Punto de partida (`origin/main` @ f37f6f6): **shadcn no está inicializado** (sin `components.json`, sin `lib/utils.ts`,
sin `radix-ui`/`lucide-react`/`cva`); no existe `components/ui/`; no hay variante `dark:` de Tailwind (el tema es
`data-theme` + `prefers-color-scheme`, D015/D016); no hay token para el texto sobre `--error` (#FFF / #14121A).
No hay entorno DOM de pruebas (`happy-dom`/`jsdom`): las pruebas son de lógica pura.

## Olas

| Ola | Unidades (rama · qué · archivos) | Depende de | Estado |
|---|---|---|---|
| 1 | `feat/ui-base` · shadcn init (Radix) + **todas** las dependencias de la fase + archivos crudos de shadcn que usarán las olas 2–3, `cn`, variante `dark:`, bloque de movimiento compartido (keyframes/utilidades §6), token texto-sobre-error, `Button` + `Spinner` completos (§2.1), página `/componentes` con un archivo por familia (stubs) · `components.json`, `package.json`, `bun.lock`, `lib/utils.ts`, `app/globals.css`, `components/ui/*` (crudos), `components/ui/button.tsx`, `components/ui/spinner.tsx`, `app/componentes/**` | — | cerrada (#9) |
| 2 | `feat/ui-formularios` · Label, Input, Textarea, Select, campo con ayuda/error/éxito, contraseña con ojo, cédula, `NumberStepper` (§2.2) · `components/ui/{input,textarea,select,label,field,…}.tsx`, `app/componentes/_familias/formularios.tsx` | 1 | cerrada (#13) ||
| 2 | `feat/ui-overlays` · Dialog, Sheet (hoja inferior), DropdownMenu, Toaster/Sonner (§2.13, §2.14 toast, §6) · `components/ui/{dialog,sheet,dropdown-menu,sonner}.tsx`, `_familias/overlays.tsx` | 1 | cerrada (#14) ||
| 2 | `feat/ui-chips-tabs` · Badge/chips (todas las variantes + estados de tarea/entrega), `GradePill` (§2.3), Tabs de línea, segmentado (Tabs `tablist` y ToggleGroup `radiogroup`, `seg-block`) (§2.4, §2.6) · `components/ui/{badge,tabs,toggle-group}.tsx`, `components/krea/grade-pill.tsx`, `_familias/chips.tsx` | 1 | cerrada (#11) ||
| 2 | `feat/ui-contenedores` · Card (`hero`, `flat`, lista interna), Alert, Skeleton, Table con contenedor desplazable, `EmptyState` (§2.8, §2.14, §2.15) · `components/ui/{card,alert,skeleton,table,separator}.tsx`, `components/krea/empty-state.tsx`, `_familias/contenedores.tsx` | 1 | cerrada (#10) ||
| 2 | `feat/ui-identidad` · Avatar (tamaños, anillo "tú", pila +n, DiceBear D010), `TeamLogo` (respaldo 6 colores como tokens), Logo/Isotipo con acento (§2.5) · `components/ui/avatar.tsx`, `components/krea/{team-logo,logo}.tsx`, `lib/dicebear.ts`, tokens en `globals.css` (bloque propio), `_familias/identidad.tsx` | 1 | cerrada (#12) ||
| 3 | `feat/ui-ranking` · `RankRow` (top 10, propia, 11–30, zona de riesgo, delta, empate), `Podium` (estudiantes y equipos) (§2.9–2.10) · `components/krea/{rank-row,podium,rank-delta}.tsx`, `_familias/ranking.tsx` | 2 (avatar, logo, badge) | PR #17 (wt1) |
| 3 | `feat/ui-evaluacion` · `ScorePicker` (≤6 botones / >6 stepper + atajos), `SumMeter`, total en vivo (§2.11–2.12; la barra por pregunta pasó a preguntas) · `components/krea/{score-picker,sum-meter,live-total}.tsx`, `_familias/evaluacion.tsx` | 2 (toggle-group, stepper, grade-pill) | PR #18 (wt2) |
| 3 | `feat/ui-preguntas` · cabecera compartida + `QuestionCard` detalle/responder/evaluar **sin unificar cuerpos** (§2.16, §8), `QuestionBar` (§2.11, movida desde evaluación), `ImageUpload` con compresión en cliente (§2.17); el puntaje de "evaluar" entra como slot (no importa `ScorePicker`) · `components/krea/question-*.tsx`, `components/krea/image-upload.tsx`, `lib/image.ts`, `_familias/preguntas.tsx` | 2 (textarea, badge, alert, button) | PR #16 (wt3) |
| 3 | `feat/ui-navegacion` · contenido de la navegación §2.7: ítems por rol (lucide), lateral con tarjeta de usuario, topbar, barra inferior, hoja Menú del profe; se enchufa en los slots de `AppShell` · `components/layout/{side-nav,top-bar,bottom-nav,menu-sheet,user-card}.tsx`, `lib/nav.ts`, `components/layout/AppShell.tsx` (solo si hace falta), `_familias/navegacion.tsx` | 2 (avatar, sheet, badge) | PR #15 (wt4) |

Reglas de reparto:
- **Dependencias solo en la ola 1.** Las olas 2–3 no tocan `package.json`/`bun.lock`; si algo falta de verdad, lo añaden y lo dicen en el PR.
- **`app/globals.css`:** la ola 1 deja el bloque de movimiento compartido; en ola 2 solo `feat/ui-identidad` añade tokens (colores de respaldo de `TeamLogo`) en un bloque nuevo propio. Cualquier otro CSS de familia va en clases Tailwind del componente.
- **Página de referencia:** `app/componentes/page.tsx` importa un archivo por familia (`app/componentes/_familias/<familia>.tsx`); cada unidad edita **solo** el suyo.
- **`COMPONENTS_INVENTORY.md`** es local: los workers entregan sus filas en el reporte y el orquestador las copia.
- Los componentes propios van en `components/krea/` (los de shadcn en `components/ui/`); lo decide y documenta la ola 1.

## Para la ola 2 (lo dejó W1, PR #9)

- Leer D025 (shadcn sin alias, `cn` extendido), D026 (`dark:`), D027 (nombres de utilidades de movimiento y tokens nuevos), D028 (Button), D029 (carpetas y `/componentes` con `Escenario`).
- Los primitivos crudos traen `[3px]`, `[96px]`, `rounded-[min(...)]` y clases sin token (`bg-primary`, `animate-in`, `data-open:`): cada familia los limpia al tematizar.
- Si alguna unidad corre `shadcn add`: el CLI v4 escribe `from "cn"` y añade los paquetes `cn`/`shadcn`/`tw-animate-css` y toca `globals.css`/`layout.tsx` → cambiar a `@/lib/utils`, `bun remove`, revertir.
- Textos en inglés de los crudos ("Close"…): fila 24 del checklist, los traduce su familia.
- Antes de `gh pr create`, confirmar que el Write de `.qa/pr-body.md` funcionó (el slot puede traer uno viejo).
- Movimiento ya disponible: además de §6, `animate-live`, `animate-shake`, `animate-pop`, `animate-accordion-in`. `k-glow` y FLIP quedan para `feat/ui-ranking`.

## Números reservados por ola (contra `origin/main`: última decisión D024, última fila 22)

| Ola | Decisiones | Filas `CONTENT_CHECKLIST` | Reparto |
|---|---|---|---|
| 1 | D025–D029 | 23–25 | W1 entero |
| 2 | D030–D049 | 26–40 | 4 IDs y 3 filas por unidad, en el orden de la tabla |
| 3 | D050–D065 | 41–52 | 4 IDs y 3 filas por unidad, en el orden de la tabla |

Pool: 5 slots (wt1–wt5) desde la ola 2; la ola 3 usa 4.

## Para la ola 3 (lo dejó la ola 2, PRs #10–#14)

- Leer solo las decisiones que use cada unidad: D030–D033 (Field, Input `leading`/`trailing`, **API de `NumberStepper`** para ScorePicker), D034 (`PortalScope`: portales con tema/acento del escenario), D036 (Sheet solo `bottom`), D038 (ToggleGroup radiogroup: roles nativos de Radix + no deseleccionar), D040 (API de `GradePill`, `--grade-ink`), D041 (variantes de Badge, `StatusBadge`), D046–D049 (Avatar `size`/`ring`, `UserAvatar`, `AvatarStack`, `TeamLogo` por hash, `Logo`/`Isotipo` por máscara, utilidades `cq-*`).
- **Next 16:** un archivo `"use client"` no puede exportar constantes que use un componente de servidor (rompe el prerender, no el typecheck): constantes en `lib/`.
- **Tokens:** si una unidad no puede tocar `globals.css` y le falta un token, lo entrega en el reporte (no lo aproxima en silencio); el orquestador los añade al cierre de la fase.
- z-index: `--z-popover` (40) < `--z-overlay` (50). Si `feat/ui-navegacion` mete un menú dentro de la hoja, lo verá: tomar nota, no arreglarlo en esa unidad.
- Medidas impares sin token: escala fraccionaria de Tailwind v4 (`px-3.25`), nunca `[Npx]`.
- Trampas de prompt: verificar en `node_modules` antes de afirmar qué hace una librería (la de Radix ToggleGroup era falsa).

## Ola actual: 3 (la ola 2 cerró con #10–#14, main @ 5a3a1b2)

- **PRs abiertos** (2026-10-30): #15 navegación (wt4), #16 preguntas (wt3), #17 ranking (wt1), #18 evaluación (wt2); esperan la revisión de César. Tras el merge: `wt free` de wt1–wt4 y el cierre de la fase (lista abajo). Brief y prompts: `context/plans/orchestration-2026-10-30-f03-ola3*.md`

- Ola 1: #9 · Ola 2: #10 contenedores, #11 chips-tabs, #12 identidad, #13 formularios, #14 overlays — mergeados; wt1–wt5 libres (pool de 5)
- QA: no aplica (decisión de César)

## Cierres

| Ola | PRs | QA | Pasa a la siguiente | Datos sin borrar |
|---|---|---|---|---|
| 1 | #9 | no aplica (César: QA solo al final) | notas de "Para la ola 2" | ninguno |
| 2 | #10–#14 | no aplica (César: QA solo al final) | notas de "Para la ola 3"; tokens y z-index al cierre de la fase | ninguno |

## Cierre de la fase (después de la ola 3, lo hace el orquestador)

- `grep -rnE '\[[0-9]+px\]|\[#[0-9a-fA-F]{3,8}\]' components/` limpio.
- Tokens que la ola 2 dejó sin crear (no podían tocar `globals.css`): rol tipográfico 15/22 (Alert, #10: `text-[0.9375rem] leading-[1.375rem]`), `--r-grade-xl` 28 px (GradePill, #11: `rounded-[1.75rem]` en `lib/grade-pill.ts`), `--scrim` rgb(20 18 26/.55) + `--color-scrim` (#14, D037: `overlayClasses` de `dialog.tsx` → `bg-scrim`).
- Tokens de la ola 3: texto de ítem de nav 15/20 600 (#15, `text-[0.9375rem] leading-5`) y etiqueta de barra inferior 12/16 600 (#15).
- Tokens de la ola 3 (#16): `--on-scrim` (chip de nombre/peso sobre la miniatura: hoy `text-white` sobre `bg-grade-ink/70`, lienzo rgb(17 17 17/.7) + #FFF); rol 15/22 en respuesta y comentario (mismo que Alert); el visor usa el `--scrim` de D037.
- Tokens de la ola 3 (#18): `text-score` Poppins 700 15/20, `--w-score-max` 1,5 px, tamaño de `GradePill` 88×64 / 32 para la tarjeta Total en vivo (+ opción de no pintar el chip Raspado).
- `NumberStepper` (#13): admitir `value: null` y `aria-labelledby` (W8 lo rodeó con 0 + «Sin puntuar» y un `fieldset`).
- Integrar `ScorePicker` (#18) en `QuestionCardReview` vía su `titleId` cuando ambos estén en main (fase 05).
- Perfil del profesor: el handoff no lo define; la tarjeta de usuario del profe enlaza a `/perfil` (#15, preguntar en fase 05).
- z-index: `--z-popover` (40) < `--z-overlay` (50): un menú o Select abierto dentro de un Dialog queda detrás (#14, afecta a #13).
- Fase 05: un solo `<Toaster />` sin `id` en el AppShell (D035).
- `SelectContent` (#13) sale por portal fuera del `Escenario`: aplicarle el mismo arreglo de tema/acento en portales que W3 deje para overlays.
- Revisar con teclado real: flechas del `ToggleGroup` (D038, bandera + `click()` en `onFocus`).
- Archivos sin uso señalados: `components/ui/toggle.tsx` (#11).
- `/componentes` con todas las familias y estados; `COMPONENTS_INVENTORY.md` completo.
- Revisión `a11y` por código de los widgets compuestos (patrones WAI-ARIA) y de las transiciones con reduced motion.

## Prompt de inicio de la siguiente ola

```
/orchestrate ola 3 de la fase 03. Plan: context/plans/phase-03-componentes.md
```
