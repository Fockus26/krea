# D019 · Layout · Medidas del layout como tokens `--w-*`/`--h-*`/`--page-*` y utilidades `container-*`, `page-pad`, `g2…g-side` · Implemented

**Decision:** las medidas de HANDOFF §2.7 y §4 son variables en `:root` (alto de topbar, barra inferior, ancho de lateral, contenedores por rol, padding y ritmo vertical) que cambian en media queries `md` 48rem, `lg` 64rem, `xl` 90rem y `3xl` 120rem. Las usan utilidades de Tailwind (`container-student|teacher|reading`, `page-pad`, `page-stack`, `g2`, `g3`, `g4`, `g-home`, `g-side`). Se redefine `--breakpoint-xl` a 90rem (1440 px) porque Tailwind trae 1280 y el handoff pide 1440. Media queries en vez de las container queries del lienzo (HANDOFF §4).
**Why:** cero valores mágicos en componentes; un solo lugar para los cortes. Nada usaba `xl:` todavía, así que el cambio no afecta código existente.
**Discarded alternative:** dejar `xl` en 1280 y usar `min-[90rem]:` — repite el valor en cada componente.
