@AGENTS.md

# KREA

Portal de notas de la Escuela Creativa del liceo: estudiantes ven notas detalladas, equipo y ranking en vivo; profesores crean tareas, evalúan y ajustan puntos.

**Type:** app (dos roles: estudiante y profesor) · **Client:** liceo (5.º año, secciones A y C)
**Phase track:** Product · **Git mode:** pr (see `context/GIT_STATE.md`)
**Kit:** web-agent-kit, version in `.kit-version` (updated with `/kit-update`) ·
**Deployment:** Vercel · preview per PR (ver `context/PROJECT_CONTEXT.md`)

**Language:** talk to César in Spanish — questions, reports, PR titles and bodies, commit
descriptions. Site copy in Spanish (es-VE, decimales con coma). Code and comments: like the code around them.

---

## What to read — by levels, not everything

**Always:** this file + `context/CURRENT_PHASE.md` (one screen: what is open and what blocks).

**Per task** — only the row that applies:

| If the task… | Also read |
|---|---|
| touches UI (component, section, page, styles) | `context/DESIGN_RULES.md`, and `COLORS.md` / `DESIGN_TOKENS.md` / `TYPOGRAPHY.md` only if it touches color, spacing or type |
| implements something from the design | that piece's part of `design/HANDOFF.md` (not the whole handoff) |
| touches data, auth, payments or API | `context/PROJECT_CONTEXT.md` › Stack and services |
| opens or closes a unit | `git-flow` skill + `context/GIT_STATE.md` |
| arrives with an orchestrator prompt | **only** what the prompt cites: it already brings paths, lines and decisions |

**Search, don't read:** `decisions/` (one file per decision), `CONTENT_CHECKLIST.md`,
inventories, `PHASE_LOG/`. `grep` for the word or the ID and open only what comes up:

```bash
grep -rhi "^# D.*modal\|^# D.*ranking" context/decisions/   # already decided? Don't re-litigate it
```

**The kit's `reference/…`** = `~/.claude/kit-reference/…` (or `.claude/kit-reference/…`).
**Tech refs:** firebase → its `tech/<name>.md` when the task touches it; only these.

---

## Stack

- Next.js (App Router) + strict **TypeScript**
- **Component library:** shadcn/ui · **Styling:** Tailwind — only one
- **bun** for everything — never npm, yarn or pnpm
- Firebase: Firestore (ranking en vivo con `onSnapshot`) · Auth (cédula → email interno, D008) · Storage · sin pagos
- Seed: `data/seed/` (`scripts/import-excel.py`) · prototipo: `design/prototype/`

```bash
bun run build
bun run typecheck            # Next: next typegen && tsc --noEmit · Astro: astro check
bun run lint
bun run test:related         # while working: only the affected tests
bun run test                 # before the PR: the whole suite
bun run shots                # PR screenshots (node + Playwright, see scripts/)
bun run shots:publish        # uploads them to the pr-shots branch; markdown in .pr-shots/README.md
bun run context:backup       # local context/ → branch context-state (restore: context:restore)
```

**Dev server:** César starts it. Exceptions: the QA agents (`wave-qa`, `functional-qa`),
and the workers if César authorizes it for a batch (each on its port). Build, typecheck, lint and tests run without asking.

**QA against a local database:** `bun run qa:local -- --port <p>` starts the Firebase
emulators (Java, no Docker), creates the `.env.test.local` accounts
(`EMAIL_TEST`/`PASSWORD_TEST`, `ADMIN_…`, `<ROLE>_…`) and starts the server on it. Never the
real database. Without it: `--offline` (guest only).

**Playwright runs with `node`, not `bun`** (hangs on Windows); scripts in `.qa/`.

**Model per task:** before each, `Modelo recomendado: <model · effort>` (kit
`TOKEN-ECONOMY.md` §12; risk → `opus`); subagents get both in `Agent(...)`.

---

## How work is done here

One unit at a time (a component, a section, a screen, a flow, a bounded fix): something
reviewable in two minutes. One unit = one branch = one PR.

```
[git-flow: open]  →  implement  →  test:related  →  [a11y]  →  [seo if it applies]
   →  build + typecheck + lint + test  →  screenshots (if the UI changed)
   →  prune and back up context/  →  [git-flow: close → PR (or pause + local merge)]
```

- **`pr` mode:** on your branch you may commit and push without asking — César's approval is
  the PR review. **Never** push to `main`, never `gh pr merge`, never auto-merge.
- **Cloud session:** `cloud-session` skill at start and close (overrides the rules above).
- **`local` mode:** nothing gets committed without César's explicit approval (`git-flow` pause).
- **Version:** **no versioning** (no `version`, CHANGELOG or Changesets, on purpose): no PR
  carries a changeset.
- Nothing destructive: no `reset --hard`, no `push --force`, no history rewriting, no
  deleting branches.

### What goes in the repo and what is local

In git: `.kit-version`, `firebase/` (rules, indexes, functions), `data/seed/` and the fixed documents
of `context/`: PROJECT_CONTEXT, DESIGN_RULES, COLORS, DESIGN_TOKENS, TYPOGRAPHY, decisions/.
Local (gitignored): CURRENT_PHASE, CONTENT_CHECKLIST, KIT_FEEDBACK, GIT_STATE, inventories, PHASE_LOG/,
plans/ — backed up to `context-state` with `bun run context:backup`. `.env.local` is
pulled from Vercel, never hand-edited (`vercel env pull`; kit `reference/DEPLOY.md` §2c).
Pool slots and worktrees get the `.env*` files but **not** the local `context/`: read it in
the main folder (first line of `git worktree list`); if you cannot write there, return the
`context/` changes in your report.

### Quality gates

| Skill / agent | When |
|---|---|
| `a11y` | Whenever UI is touched, before asking for review |
| `seo` | Repo init · closing a section with content · closing a page |
| `git-flow` | When opening and closing each unit |
| `orchestrate` | A list arrives, or a phase is done in waves (one wave per session) |
| `wave-qa` | `orchestrate`, after a wave with risk flows |
| `functional-qa` | A risk flow closes (auth, data, payments) · version QA |
| `design-qa` | Only the version QA (phase 09 / release PR) |

---

## Non-negotiable rules

- **Zero magic values.** Every color, spacing, radius and size comes from the tokens.
- **Zero secrets in the code.** Environment variables, `.env.example` without real values.
- **Zero invented content.** Flagged placeholder + row in `context/CONTENT_CHECKLIST.md`.
- **Zero lorem ipsum.** A realistic placeholder, in Spanish, with the final text's length.
- **WCAG 2.1 AA** minimum: 4.5:1 text, visible focus, no state only by color, no horizontal
  scroll at 320 px.
- **The project's library before reimplementing** a primitive.
- **Acento = variable** (`--accent`…): revisar 4 acentos × claro/oscuro (D001).
- **Nota ≠ puntos:** los ajustes de conducta mueven puntos del ranking, nunca la nota; todo ajuste lleva motivo (D007).
- **Color de nota = `gradeColor(n)`** como fondo de píldora + número visible (D004). Nota `null` = Pendiente (D003).
- Tareas suman exactamente 20; evaluación en pasos de 0,5 (D004). Base de evaluación por alumno 10–20 (D006).

## When to stop and ask

- A handoff value is missing → ask, do not estimate it from the mockup.
- New visual decision → 3 options with real advantage and disadvantage, and wait.
  (A background worker cannot wait: it picks the conservative one and explains it in the PR.)
- Accessibility rule broken → the rule wins, escalate.
- Problem in closed code → report it, do not fix it in this unit.
- Unused file → point it out, do not delete it.

## Kit feedback

Corrección de César, pedido repetido o hueco del kit → fila en `context/KIT_FEEDBACK.md`
(o +1 en "Times"), sin preguntar. Se envía con `/kit-feedback`.

---

## Project context

**Audience:** estudiantes 15–17 años (móvil) y profesores (laptop) · **Main action:** entender la nota pregunta a pregunta / evaluar una entrega en < 1 min · **Tone:** cálido, lúdico, enérgico, justo · **Language:** español (Venezuela)

**Particulars:**
- Animaciones solo `transform`/`opacity`; reduced motion → texto.
- Nombres/apellidos del alumno: solo lectura para él, editables por el profesor.
- El capitán es el único que envía la tarea grupal (D012).
