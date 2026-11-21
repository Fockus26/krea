# D497 · Colors · La tarjeta de puntos de Inicio rellena con --accent en oscuro · Implemented

**Decision:** `points-card.tsx` usa `bg-accent-ink dark:bg-accent`: claro igual que antes (D217); oscuro rellena con `--accent`, el tono que D301 ya oscurece para texto blanco (el del botón primario). Sin color nuevo.
**Why:** QA versión 2 D-A1: en oscuro `--accent-ink` es el tono claro para texto (D301) y el blanco encima daba 2,15–2,79:1. Con `--accent` el blanco da 4,66–4,72:1 en los 4 acentos; en claro, 5,79–8,83:1. La prueba `contraste-tokens.test.ts` fija los pares.
**Discarded alternative:** texto oscuro sobre `--accent-ink` en oscuro (rompe la identidad de la tarjeta, que es blanca sobre color).
