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
| 2 | `feat/ui-formularios` · Label, Input, Textarea, Select, campo con ayuda/error/éxito, contraseña con ojo, cédula, `NumberStepper` (§2.2) · `components/ui/{input,textarea,select,label,field,…}.tsx`, `app/componentes/_familias/formularios.tsx` | 1 | pendiente |
| 2 | `feat/ui-overlays` · Dialog, Sheet (hoja inferior), DropdownMenu, Toaster/Sonner (§2.13, §2.14 toast, §6) · `components/ui/{dialog,sheet,dropdown-menu,sonner}.tsx`, `_familias/overlays.tsx` | 1 | pendiente |
| 2 | `feat/ui-chips-tabs` · Badge/chips (todas las variantes + estados de tarea/entrega), `GradePill` (§2.3), Tabs de línea, segmentado (Tabs `tablist` y ToggleGroup `radiogroup`, `seg-block`) (§2.4, §2.6) · `components/ui/{badge,tabs,toggle-group}.tsx`, `components/krea/grade-pill.tsx`, `_familias/chips.tsx` | 1 | pendiente |
| 2 | `feat/ui-contenedores` · Card (`hero`, `flat`, lista interna), Alert, Skeleton, Table con contenedor desplazable, `EmptyState` (§2.8, §2.14, §2.15) · `components/ui/{card,alert,skeleton,table,separator}.tsx`, `components/krea/empty-state.tsx`, `_familias/contenedores.tsx` | 1 | pendiente |
| 2 | `feat/ui-identidad` · Avatar (tamaños, anillo "tú", pila +n, DiceBear D010), `TeamLogo` (respaldo 6 colores como tokens), Logo/Isotipo con acento (§2.5) · `components/ui/avatar.tsx`, `components/krea/{team-logo,logo}.tsx`, `lib/dicebear.ts`, tokens en `globals.css` (bloque propio), `_familias/identidad.tsx` | 1 | pendiente |
| 3 | `feat/ui-ranking` · `RankRow` (top 10, propia, 11–30, zona de riesgo, delta, empate), `Podium` (estudiantes y equipos) (§2.9–2.10) · `components/krea/{rank-row,podium,rank-delta}.tsx`, `_familias/ranking.tsx` | 2 (avatar, logo, badge) | pendiente |
| 3 | `feat/ui-evaluacion` · `ScorePicker` (≤6 botones / >6 stepper + atajos), `SumMeter`, total en vivo, barra por pregunta (§2.11–2.12) · `components/krea/{score-picker,sum-meter,live-total,question-bar}.tsx`, `_familias/evaluacion.tsx` | 2 (toggle-group, stepper, grade-pill) | pendiente |
| 3 | `feat/ui-preguntas` · cabecera compartida + `QuestionCard` detalle/responder/evaluar **sin unificar cuerpos** (§2.16, §8), `ImageUpload` con compresión en cliente (§2.17); el puntaje de "evaluar" entra como slot (no importa `ScorePicker`) · `components/krea/question-*.tsx`, `components/krea/image-upload.tsx`, `lib/image.ts`, `_familias/preguntas.tsx` | 2 (textarea, badge, alert, button) | pendiente |
| 3 | `feat/ui-navegacion` · contenido de la navegación §2.7: ítems por rol (lucide), lateral con tarjeta de usuario, topbar, barra inferior, hoja Menú del profe; se enchufa en los slots de `AppShell` · `components/layout/{side-nav,top-bar,bottom-nav,menu-sheet,user-card}.tsx`, `lib/nav.ts`, `components/layout/AppShell.tsx` (solo si hace falta), `_familias/navegacion.tsx` | 2 (avatar, sheet, badge) | pendiente |

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

Pool: hoy wt1/wt2. La ola 2 necesita 5 slots → `wt init -Count 5` al inicio de esa sesión (o 2 tandas de slots).

## Ola actual: 2 (la ola 1 cerró con #9, main @ fec1d1a)

- Brief y prompts: `context/plans/orchestration-2026-10-29-f03.md` / `…-f03-prompts.md`
- Ola 1: PR #9 W1 ui-base — mergeado (main @ fec1d1a); wt1 liberado
- QA: no aplica (decisión de César)

## Cierres

| Ola | PRs | QA | Pasa a la siguiente | Datos sin borrar |
|---|---|---|---|---|
| 1 | #9 | no aplica (César: QA solo al final) | notas de "Para la ola 2" | ninguno |

## Cierre de la fase (después de la ola 3, lo hace el orquestador)

- `grep -rnE '\[[0-9]+px\]|\[#[0-9a-fA-F]{3,8}\]' components/` limpio.
- `/componentes` con todas las familias y estados; `COMPONENTS_INVENTORY.md` completo.
- Revisión `a11y` por código de los widgets compuestos (patrones WAI-ARIA) y de las transiciones con reduced motion.

## Prompt de inicio de la siguiente ola

```
/orchestrate ola 2 de la fase 03. Plan: context/plans/phase-03-componentes.md
```
