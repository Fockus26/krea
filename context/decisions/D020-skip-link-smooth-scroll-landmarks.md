# D020 · Layout · Skip link a `#contenido`, smooth scroll solo con movimiento permitido y `scroll-margin-top` por breakpoint · Implemented

**Decision:** el layout raíz pinta primero "Saltar al contenido" (`skip-link`, fuera de pantalla hasta recibir foco) hacia `#contenido`; todo `<main>` lleva `id="contenido"` y `tabIndex={-1}`. `scroll-behavior: smooth` va en `html` solo dentro de `prefers-reduced-motion: no-preference`, con `data-scroll-behavior="smooth"` en `<html>` para que Next 16 lo desactive en las transiciones de ruta. `[id]` usa `scroll-margin-top: var(--scroll-offset)`: topbar + 1rem en < 1024 y solo 1rem en ≥ 1024 (la lateral no tapa nada). La app no tiene `<footer>` visual: el landmark no aplica.
**Why:** HANDOFF §4 y WCAG 2.4.1 y 2.3.3; en ≥ 1024 no hay header sticky que compensar.
**Discarded alternative:** `scroll-margin-top` 0 en ≥ 1024 — el ancla quedaría pegada al borde superior.
