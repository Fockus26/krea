# D333 · Ingresar · En oscuro la tarjeta usa `--surface-2` + borde `--divider` sin sombra (la sombra solo se ve en claro) · Implemented

**Decision:** `AuthLayout`: en claro `bg-surface` + `shadow-2`; en oscuro `dark:bg-surface-2 dark:border dark:border-divider dark:shadow-none`. Contrastes medidos en oscuro sobre `--surface-2` (#26222f): texto 13,89:1, `--text-2` 6,51:1, borde de campo `--input` 4,31:1.
**Why:** César: la sombra solo se aprecia en modo claro. Eligió superficie más clara + borde sutil.
**Discarded alternative:** sombra más fuerte en oscuro — sigue siendo invisible sobre fondo oscuro.
