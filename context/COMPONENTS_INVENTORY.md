# Components Inventory — KREA

> Which components already exist, where they live, and what uses them. Check this table
> before creating a new component — one may already solve the same thing.

| Component | Path | Used in | Phase that closed it | Notes |
|---|---|---|---|---|
| Card (default/hero/flat) + CardHeader, CardTitle (`level`), CardDescription | `components/ui/card.tsx` | /componentes | F03 ola 2 (#10) | oscuro: borde sin sombra (`dark:`) |
| CardList / CardListItem | `components/ui/card.tsx` | /componentes | F03 ola 2 (#10) | `asChild` para fila enlace |
| Alert | `components/ui/alert.tsx` | /componentes | F03 ola 2 (#10) | info/ok/warn/err; rol en `lib/alert.ts` |
| Skeleton | `components/ui/skeleton.tsx` | /componentes | F03 ola 2 (#10) | `aria-hidden`, `animate-skeleton` |
| Table | `components/ui/table.tsx` | /componentes | F03 ola 2 (#10) | región nombrada (`label`), sticky, `numeric`, pista < 1024 |
| Separator | `components/ui/separator.tsx` | /componentes | F03 ola 2 (#10) | decorativo por defecto |
| EmptyState | `components/krea/empty-state.tsx` | /componentes | F03 ola 2 (#10) | `headingLevel` configurable |
| Badge | `components/ui/badge.tsx` | /componentes | F03 ola 2 (#11) | 9 variantes, `asChild` |
| StatusBadge / CaptainBadge | `components/krea/status-badge.tsx` | /componentes | F03 ola 2 (#11) | mapa puro de estados de tarea y entrega |
| GradePill | `components/krea/grade-pill.tsx` (lógica `lib/grade-pill.ts`) | /componentes | F03 ola 2 (#11) | sm/md/lg/xl, Raspado, Pendiente, Base, modo tabla |
| Tabs | `components/ui/tabs.tsx` | /componentes | F03 ola 2 (#11) | variantes line y segmented (+block) |
| ToggleGroup | `components/ui/toggle-group.tsx` | /componentes | F03 ola 2 (#11) | radiogroup, `block`; `Toggle` suelto en `toggle.tsx` sin uso |
| Avatar | `components/ui/avatar.tsx` | /componentes | F03 ola 2 (#12) | Radix; 8 tamaños, `ring`, `AVATAR_SIZES` |
| UserAvatar | `components/krea/user-avatar.tsx` | /componentes | F03 ola 2 (#12) | DiceBear (`lib/dicebear.ts`) + iniciales |
| AvatarStack | `components/krea/avatar-stack.tsx` | /componentes | F03 ola 2 (#12) | máx. 5, +n con texto accesible |
| TeamLogo | `components/krea/team-logo.tsx` | /componentes | F03 ola 2 (#12) | respaldo por hash → `--team-N` |
| Logo / Isotipo | `components/krea/logo.tsx` | /componentes | F03 ola 2 (#12) | máscara CSS, sigue el acento |
| Label | `components/ui/label.tsx` | Field | F03 ola 2 (#13) | 14/20 700 |
| Input | `components/ui/input.tsx` | /componentes | F03 ola 2 (#13) | `leading`/`trailing`/`success`, estados por atributo |
| Textarea | `components/ui/textarea.tsx` | /componentes | F03 ola 2 (#13) | `compact`, `counter` |
| Select | `components/ui/select.tsx` | /componentes | F03 ola 2 (#13) | popper, `animate-pop-*`, `z-popover`; portal sin tema del escenario |
| Field | `components/ui/field.tsx` | /componentes | F03 ola 2 (#13) | id y ARIA por contexto, `announce` |
| PasswordInput | `components/krea/password-input.tsx` | /componentes | F03 ola 2 (#13) | `autoComplete` obligatorio |
| CedulaInput | `components/krea/cedula-input.tsx` | /componentes | F03 ola 2 (#13) | `lib/cedula.ts` |
| NumberStepper | `components/krea/number-stepper.tsx` | /componentes | F03 ola 2 (#13) | `lib/stepper.ts`; lo reutiliza ScorePicker (ola 3) |
| Dialog | `components/ui/dialog.tsx` | /componentes | F03 ola 2 (#14) | §2.13; < 768 arriba a 96; `overlayClasses` compartido (D037) |
| Sheet | `components/ui/sheet.tsx` | /componentes | F03 ola 2 (#14) | solo `side="bottom"` (D036); asa decorativa; zona segura |
| DropdownMenu | `components/ui/dropdown-menu.tsx` | /componentes | F03 ola 2 (#14) | 240 px; `variant="destructive"`; casilla, radio y submenú |
| Toaster | `components/ui/sonner.tsx` | /componentes | F03 ola 2 (#14) | Sonner `unstyled` + tokens; montaje global en fase 05 (D035) |
| PortalScope | `components/ui/portal-scope.tsx` | dialog, sheet, dropdown-menu | F03 ola 2 (#14) | portales heredan tema y acento del contenedor (D034) |

<!-- One row per reusable component. Do not list single-section components that are not
     reused — those go in SECTION_INVENTORY.md as part of that section. -->
