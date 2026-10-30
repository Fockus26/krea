# Backlog — KREA

| Fecha | Origen | Qué | Prioridad |
|---|---|---|---|
| 2026-10-29 | W1 f03 (visto de paso) | `/tokens` muestra el título "Tokens · KREA · KREA": `app/tokens/page.tsx` pone `title: "Tokens · KREA"` y la plantilla del layout añade " · KREA". Arreglo: `title: "Tokens"` | Low |
| 2026-10-30 | W7 f03 (visto de paso, #17) | El reset de Tailwind quita `list-style` de `ol/ul`: Safari/VoiceOver puede no anunciar las listas; Biome prohíbe `role="list"`. Decidir globalmente (a11y del cierre de fase o fase 08) | Medium |
| 2026-10-30 | W7 f03 (visto de paso, #17) | `cn` no fusiona utilidades de tipografía propias con las de Tailwind (`text-xs!` en el chip Empate): registrar el grupo en `lib/utils.ts` | Low |
