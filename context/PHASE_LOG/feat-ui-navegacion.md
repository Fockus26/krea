# feat/ui-navegacion — W10 (fase 03, ola 3) · PR #15

Navegación §2.7 y §2.13 en `components/layout/`: SideNav, UserCard, TopBar, BottomNav, MenuSheet; utilidades puras en
`lib/nav.ts` (6 pruebas: ítems por rol y superficie, `isActive`, contador, etiqueta de rol). Envoltorios `Route*` con
`usePathname`. Familia «Navegación» en `/componentes`. D062–D065. `AppShell` y `globals.css` sin cambios.

- Verificado: typecheck, lint, test (163), build; grep `[Npx]`/`[#hex]` limpio. a11y por código.
- No verificado: nada visual (QA final).
- Abierto: perfil del profesor no definido en el handoff (la tarjeta enlaza a `/perfil`); `onSignOut` y rutas reales en fase 07.
- Tokens pendientes: texto de ítem 15/20/600 (`text-[0.9375rem] leading-5 font-semibold`), etiqueta de barra inferior 12/16/600.
