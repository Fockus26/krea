# feat/ui-contenedores — W5 (fase 03, ola 2)

2026-10-29 · PR #10 · Card (default/hero/flat, CardHeader, CardTitle `level`, CardList/CardListItem `asChild`), Alert (info/ok/warn/err, rol por defecto en `lib/alert.ts`), Skeleton, Table (región nombrada desplazable, th sticky, `numeric`, pista < 1024), Separator, EmptyState + familia `/componentes` · D042–D045 · typecheck/lint/test (82)/build OK · sin QA visual.

Pendiente al cerrar la fase: token tipográfico 15/22 (Alert usa `text-[0.9375rem] leading-[1.375rem]`). Quitados del crudo: CardAction, CardFooter, CardContent, TableFooter. Tabla como `<section tabIndex aria-label>` (Biome rechaza `div role=region`). Skeleton de la familia en `<output aria-busy>` con `div` hijos (HTML no estrictamente válido).
