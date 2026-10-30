# feat/ui-formularios — W2 (fase 03, ola 2)

2026-10-30 · PR #13 · Label, Input (`leading`/`trailing`/`success`, estados por atributo), Textarea (`compact`, `counter`), Select (popper, `z-popover`), Field (ARIA por contexto, `announce`), PasswordInput, CedulaInput (`lib/cedula.ts`), NumberStepper (`lib/stepper.ts`, `role=spinbutton`, `<fieldset>`), `components/ui/control.ts` + familia formularios · D030–D033 · typecheck/lint/test (114)/build OK · sin QA visual.

Notas: halo de foco `ring-3 ring-accent/28`; error con `px-3.25`/`py-2.75`. Textarea deshabilitado sin candado. Cédula vacía → "Faltan dígitos". `formatDecimal` propio (no `formatNota`). El popover de Select sale por portal fuera del `Escenario` (mismo arreglo que W3 para overlays).
