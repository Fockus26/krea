# Orquestación del 2026-10-30 (fase 03, ola 3) — brief compartido para los workers

> Fase 03 — plan: `context/plans/phase-03-componentes.md` · olas 1–2 cerradas (#9–#14, main @ 5a3a1b2) · **ola 3 en curso** (W7–W10)

> **Todo worker** lee esto antes de empezar, y después **las secciones "Decisiones de César para esta tanda" y
> "Reglas de la tanda"** de `context/plans/orchestration-2026-10-29-f03.md` (carpeta principal): siguen valiendo
> las 23 reglas, con los cambios de abajo. Su prompt trae solo lo específico de su unidad.
> Carpeta principal del repo: `C:\Users\Cesar\Documents\Work\krea` (solo lectura para ti; **no** está en `main`:
> lee código y archivos versionados en tu slot, nunca en la carpeta principal).

## Unidades

| # | Rama | Qué | Slot / puerto |
|---|---|---|---|
| W7 | `feat/ui-ranking` | `RankRow` (top 10, propia, 11–30, zona de riesgo, empate), `RankDelta`, separador de riesgo, `Podium` estudiantes/equipos, movimiento del ranking (§2.9–2.10, §6) | lo dice el mensaje que te lanza |
| W8 | `feat/ui-evaluacion` | `ScorePicker` (≤ 6 botones / > 6 stepper + atajos, teclas 0–9 y `,`), `SumMeter`, `LiveTotal` (§2.11–2.12) | ídem |
| W9 | `feat/ui-preguntas` | cabecera compartida + `QuestionCard` detalle/responder/evaluar sin unificar cuerpos, `QuestionBar`, visor "Ampliar", `ImageUpload` con compresión en cliente (§2.11 barra, §2.16, §2.17) | ídem |
| W10 | `feat/ui-navegacion` | ítems por rol (`lib/nav.ts`), `SideNav` + `UserCard`, `TopBar`, `BottomNav`, `MenuSheet` del profesor, enchufados en los slots de `AppShell` (§2.7, §2.13 hoja) | ídem |

**Cambio respecto al plan:** la barra por pregunta (`QuestionBar`, §2.11) pasa de W8 a **W9**: solo la usa
`QuestionCard` detalle, y así W9 no depende de W8. W9 recibe el puntaje de "evaluar" como slot (`ReactNode`): no importa
`ScorePicker`.

Las cuatro corren en paralelo sobre `main` @ 5a3a1b2 y cada una toca **solo** los archivos de su prompt. Nadie toca
`package.json`, `bun.lock`, `lib/utils.ts`, `app/componentes/page.tsx`, `_familias/{familia,escenario}.tsx` ni los
componentes de la ola 2 (`components/ui/*`, `components/krea/*` existentes): se usan, no se editan. Si uno de ellos
tiene un defecto que te bloquea, rodéalo en tu archivo y repórtalo como "visto de paso".

## Cambios a las reglas de la tanda de 2026-10-29

- **Regla 11 (tokens):** `app/globals.css` solo lo edita **W7**, en un bloque nuevo propio al final de la sección de
  movimiento (`/* ---------- Ranking: movimiento (HANDOFF §6; D05x) ---------- */`). W8, W9 y W10 **no** lo tocan: si
  les falta un token, usan la clase de Tailwind más cercana basada en tokens existentes (escala fraccionaria `px-3.25`,
  `color-mix` de tokens, nunca `[Npx]` ni `[#hex]`) y lo entregan en el reporte como "token pendiente" con el valor del
  handoff. El orquestador los crea al cierre de la fase.
- **Next 16:** un archivo `"use client"` no exporta constantes que use un componente de servidor (rompe el prerender, no
  el typecheck): constantes y mapas en `lib/`.
- Verifica en `node_modules` antes de afirmar qué hace una librería (Radix, Sonner, lucide): no te fíes de la memoria.
- Antes de `gh pr create`, confirma que el Write de `.qa/pr-body.md` funcionó (el slot puede traer uno viejo).

## Números reservados (contra `origin/main`: última decisión D049, última fila del checklist 40)

| Unidad | IDs de decisión | Filas de `CONTENT_CHECKLIST` | Modelo · esfuerzo | Docker |
|---|---|---|---|---|
| W7 | D050–D053 | 41–43 | sonnet · medium | no |
| W8 | D054–D057 | 44–46 | opus · medium | no |
| W9 | D058–D061 | 47–49 | sonnet · medium | no |
| W10 | D062–D065 | 50–52 | sonnet · medium | no |

## Decisiones de César (iguales que la ola 2)

Sin QA, sin dev server, sin Playwright y sin capturas hasta el final del proyecto; verificación = typecheck, lint, test,
build y revisión por código (a11y por código). Sin versionado: ningún changeset. Sin datos reales: no se toca Firebase.

## Simular el backend

No aplica: componentes de presentación con props; ningún componente lee Firestore ni Storage (eso es la fase 07).
