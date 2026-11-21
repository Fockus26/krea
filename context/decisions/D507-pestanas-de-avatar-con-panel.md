# D507 · Components · La cuadrícula de avatares es el `TabsContent` de las pestañas de estilo · Implemented

**Decision:** `AvatarPicker` mete el selector de avatares dentro de `<TabsContent value={pestana} tabIndex={-1}>`, así el `aria-controls` de la pestaña activa apunta a un panel real. Además, el copy del aviso de capitán sin «él/ella» (D-B3; fila 276).
**Why:** las pestañas no tenían panel: `aria-controls` hacia un id inexistente (axe `aria-valid-attr-value`, QA v2 D-M3). El género del capitán no se conoce (D075): «cuando él las envíe» salía con una capitana.
**Discarded alternative:** quitar `aria-controls` a mano: Radix lo pone siempre; un panel real es el patrón WAI-ARIA.
