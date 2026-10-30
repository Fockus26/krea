# Cierre de la fase 03 — 2026-10-30 (sesión cloud)

- Ola 3 mergeada: #15 navegación, #16 preguntas, #17 ranking, #18 evaluación. El worker del cierre no llegó a lanzarse: lo hizo la sesión cloud.
- Tokens nuevos (`app/globals.css`): `--w-score-max`, `--r-grade-xl` (`rounded-grade-xl`), `--r-iso` (`rounded-iso`), `--scrim`/`--scrim-chip`/`--on-scrim` (+ `--color-*`), `--container-seg` (`@max-seg`), roles `text-callout` 15/22, `text-nav` 15/20 600, `text-nav-sm` 12/16 600, `text-score` Poppins 700 15/20.
- z-index: `--z-popover` 40 → 55 (sobre `--z-overlay` 50, bajo `--z-toast` 60): un Select o menú dentro de un Dialog ya no queda detrás.
- Componentes que aproximaban: Alert, QuestionCardDetail/Review, Sonner, NavItemLink, BottomNav, QuestionHeader, ScorePicker, Logo, GradePill, Dialog/Sheet, ImageUpload, Tabs/ToggleGroup (`@max-[25rem]` → `@max-seg`).
- `grep -rnE '\[[0-9]+px\]|\[#hex\]' components/` limpio. Quedan porcentajes geométricos del isotipo en `logo.tsx` (proporciones de la máscara, no valores de diseño).
- D037 → Implemented.
- Pasa a la fase 04 (`phase-04-secciones.md`): GradePill 88×64, NumberStepper `null`, ScorePicker en QuestionCardReview, Select en portal con acento, Toaster único (fase 05), perfil del profe (fase 05).
