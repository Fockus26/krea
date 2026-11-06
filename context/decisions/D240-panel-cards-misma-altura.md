# D240 · Layout · «Por evaluar» y «Últimos ajustes» miden lo mismo en fila · Implemented

**Decision:** en `panel-view` la grilla `g-home` lleva `lg:items-stretch!` (anula el `align-items: start` de la utilidad solo ahí, sin afectar Inicio ni Equipo) y las dos `Card` van con `h-full`. Apiladas (< lg) conservan su altura natural.

**Why:** pedido de César (punto 26): con listas de largo distinto las cards quedaban desparejas.
