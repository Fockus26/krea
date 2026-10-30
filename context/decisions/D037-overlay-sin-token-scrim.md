# D037 · Tokens · Overlay de diálogo y hoja = `bg-text/55 dark:bg-bg/55` hasta que exista `--scrim` · Pending

**Decision:** el overlay `rgb(20 18 26 / .55)` del handoff (§2.13, `krea.css` `.ov`) no tiene token y esta unidad no podía editar `globals.css`. Se usa la tinta más oscura de cada tema al 55 %: claro `--text` #221D2B (aproximado), oscuro `--bg` #14121A (exacto). Está en `overlayClasses` de `components/ui/dialog.tsx`, que comparte la hoja. **Pendiente (cierre de fase):** añadir `--scrim: rgb(20 18 26 / 0.55)` (igual en los dos temas) con su `--color-scrim` y cambiar la clase a `bg-scrim`.
**Why:** cero valores mágicos en `components/`; la diferencia en claro (34 29 43 frente a 20 18 26, bajo un 55 % de opacidad) no se distingue.
**Discarded alternative:** `bg-[rgb(20_18_26/0.55)]` — valor mágico en el componente. `--grade-ink` (#111) — color con otro significado.
