# D064 · Components · Menú del profesor: `MenuSheet` con su propio botón "Menú" y hoja inferior (Tareas, Equipos, Premios, divisor, Cerrar sesión) · Implemented

**Decisión:** `MenuSheet` (cliente) incluye el botón (ghost md, ícono + "Menú") y la hoja `Sheet` bottom. Ítems 48 px con el mismo `NavItemLink` de la lateral; cada enlace va envuelto en `SheetClose asChild` para cerrar al navegar. "Cerrar sesión" en `--error` tras `Separator`, con `onSignOut` opcional (la sesión real es de la fase 07). Retorno de foco al botón por el `SheetTrigger` de Radix. Título "Menú" y descripción solo para lectores de pantalla.
**Why:** HANDOFF §2.13; el trigger propio garantiza el retorno de foco sin lógica extra.
**Nota:** un `DropdownMenu` dentro de la hoja quedaría detrás (`--z-popover` 40 < `--z-overlay` 50); no hay ninguno hoy.
