## 2026-10-29 · Fase 03 · Ola 1 · W1 feat/ui-base — PR #9
- shadcn init (Radix, radix-nova, lucide) sin capa de alias; revertido todo lo que el CLI escribió en globals.css/layout.tsx; quitados cn/shadcn/tw-animate-css.
- Dependencias de la fase: radix-ui, class-variance-authority, clsx, tailwind-merge, lucide-react, sonner.
- Primitivos crudos para ola 2: input, textarea, select, label, badge, avatar, tabs, toggle, toggle-group, dialog, sheet, dropdown-menu, alert, skeleton, table, card, separator.
- lib/utils.ts: cn con extendTailwindMerge (roles text-*, shadow-*, z-*, duration-*, ease-*, rounded-nav|pill, nums, h-/w- de layout).
- globals.css: @custom-variant dark (D026), --on-error, tokens de movimiento y botón, bloque "Movimiento de componentes" (D027), utilidades shadow-btn-*/translate-y-btn.
- Button (§2.1 completo) y Spinner en components/ui/. /componentes con Escenario (tema × acento) y _familias/: botones completo, 9 stubs.
- Decisiones D025–D029. Checklist filas 23–25.
- Verificado: typecheck, lint, test 79/79, build (/componentes estática). Sin servidor ni capturas (QA final).
- Visto: /tokens con título duplicado "Tokens · KREA · KREA".
