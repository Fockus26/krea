# D125 · Sections · Premios: el empate se decide en estado local, con toast, y el foco pasa al título de la tarjeta · Implemented

**Decision:** `PrizesBoard` guarda las tarjetas en `useState`; al decidir lanza `toast.success` ("Premio para 5A-G2 Repostería" / "Premio compartido: G2 y G5") con `<Toaster />` local en `app/secciones/premios/layout.tsx` (D105). El botón del menú desaparece: `onCloseAutoFocus` del menú lleva el foco al `<h3>` con `tabIndex={-1}`. Nada se guarda (fase 07).
**Why:** brief de la ola 4 y trampa de foco del prompt.
**Discarded alternative:** `role="status"` propio — el toast ya es la región viva; no duplicar.
