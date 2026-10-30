# D063 · Components · Ruta activa por prop `pathname` en cada componente y envoltorios cliente `Route*` con `usePathname()` · Implemented

**Decisión:** `SideNav`, `TopBar`, `BottomNav` y `MenuSheet` reciben `pathname` por prop y no leen el router. `components/layout/route-nav.tsx` (cliente) exporta `RouteSideNav`, `RouteTopBar` y `RouteBottomNav`, que leen `usePathname()` y se enchufan en los slots de `AppShell` desde un layout. El prop de rol se llama `rol` (no `role`) para no chocar con la regla `useValidAriaRole` de Biome. `AppShell` no se tocó: sus `<nav aria-label="Principal">` lateral e inferior no coexisten (uno está `display: none` según el breakpoint).
**Why:** `/componentes` muestra cada estado activo sin navegar; el componente queda probado por props y el router solo vive en el envoltorio.
**Alternativa descartada:** `usePathname()` dentro de cada componente — obliga a cliente en todos y no permite mostrar estados activos distintos en una misma página.
