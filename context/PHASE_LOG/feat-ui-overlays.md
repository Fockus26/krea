# feat/ui-overlays — W3 (fase 03, ola 2)

2026-10-30 · PR #14 · Dialog, Sheet (solo hoja inferior, D036) y DropdownMenu tematizados con §2.13 y D027; Toaster propio sobre Sonner (`unstyled` + tokens, sin next-themes); `PortalScope`/`usePortalContainer` para que los portales hereden `data-theme`/`data-accent` del escenario (D034) + familia overlays · D034–D037 · typecheck/lint/test (83)/build OK · sin QA visual.

Pendientes: token `--scrim` (D037; hoy `bg-text/55 dark:bg-bg/55`), `<Toaster />` global sin `id` en el AppShell en fase 05 (D035), z-index `--z-popover` (40) < `--z-overlay` (50): menú/select dentro de un diálogo quedaría detrás. Íconos del toast en color de texto (posible `--toast-ok/err`).
