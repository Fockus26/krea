# Git State — KREA

> The source of truth for "how and where is this unit delivered?". The `git-flow` skill reads
> it before creating any branch. **Never infer the base from `git branch --show-current`.**

## Mode

**`pr`**

| Mode | When | Closing a unit |
|---|---|---|
| `pr` | There is a remote and a protected `main` (the normal case once the repo is on GitHub) | commit(s) on the branch → push of the branch → `gh pr create` → **César reviews and merges** (squash) |
| `local` | No remote, or César prefers it | approval pause → commit → `--no-ff` merge into the base → push only if base ≠ `main` |

In `pr` mode the branches' status is `gh pr list`.

## Base branch of the next unit

`main`

## Active parent branch (`local` mode only, big blocks)

`none`
