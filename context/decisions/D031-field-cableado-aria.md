# D031 · Components · `Field` cablea id, label, aria-describedby y aria-invalid por contexto; error `role="alert"` · Implemented

**Decision:** `Field` (`components/ui/field.tsx`) genera el id, pone `<Label htmlFor>` y publica un contexto que leen `Input`, `Textarea` y `SelectTrigger` (`useFieldControl`): `id`, `aria-describedby` (ayuda + mensaje) y `aria-invalid`. Lo explícito en el control gana. Error: ícono 16 + texto, `role="alert"`; éxito: `role="status"`; `announce={false}` quita el rol para errores que aparecen mientras se escribe (se leen al reenfocar por `aria-describedby`, sin doble anuncio). Error gana sobre éxito.
**Why:** el mismo cableado en todos los campos sin repetirlo; un contexto sirve también para Select, donde `cloneElement`/`Slot` no llega al trigger.
**Discarded alternative:** `Slot` sobre el hijo (no cubre Select ni controles compuestos).
