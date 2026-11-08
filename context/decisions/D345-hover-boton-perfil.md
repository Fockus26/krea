# D345 · Components · Botón de perfil (avatar) con hover/active: fondo accent-soft + anillo accent-ink · Implemented

**Decision:** el enlace «Tu perfil» de la barra superior (alumno) muestra `bg-accent-soft` y un anillo de 1 px `accent-ink` al pasar el puntero; `active` usa `bg-accent-soft-2`. Mismo fondo que el hover del botón «Menú» (ghost) del profesor, que ya lo tenía. Sin `motion-reduce` la transición es `transition-colors`; con él, ninguna. El `focus-visible` no cambia.
**Why:** el avatar no daba señal de hover (pedido 64). El anillo evita depender solo del color del fondo; `accent-ink` es el token de texto/borde del acento, con contraste alto en los 4 acentos de ambos temas.
**Discarded alternative:** escalar el avatar (`transform`): se confunde con el estado activo y mueve el layout visual en la barra.
