## Qué hace

Fase 02, W1: esqueleto del layout (sin contenido de navegación; ítems, íconos y tarjeta de usuario llegan en las fases 03–04).

- Tokens de layout en `app/globals.css` (HANDOFF §2.7 y §4): alto de topbar y barra inferior, ancho de lateral, contenedores por rol, padding y ritmo vertical, con sus cortes md/lg/xl/3xl. `--breakpoint-xl` pasa a 90rem (1440) como pide §4.
- Utilidades: `container-student|teacher|reading`, `page-pad`, `page-stack`, `g2/g3/g4/g-home/g-side`, `skip-link`, `h-topbar`, `h-bnav`, `bg-topbar` (`--bg` 92 %), `shadow-bnav` (solo en claro, token por tema).
- Smooth scroll solo con `prefers-reduced-motion: no-preference` + `data-scroll-behavior="smooth"` en `<html>`; `scroll-margin-top` por breakpoint.
- Skip link "Saltar al contenido" como primer elemento del `<body>`, hacia `#contenido`.
- `components/layout/AppShell.tsx` + `lib/layout.ts` (rol → contenedor, con prueba unitaria).
- `app/layout.tsx`: solo el JSX de `<body>` y el atributo de `<html>`. Los exports `metadata`/`viewport` quedan para W2.
- Decisiones D019–D021. Filas de checklist reservadas: 19–20 (abajo).

## Decisión tomada / alternativa

- **`scroll-margin-top` en ≥ 1024:** 1rem de respiro (la lateral no tapa nada). Alternativa: 0.
- **`/` y `/tokens` no usan el shell:** son la portada provisional y una página interna; conservan su `<main id="contenido" tabIndex={-1}>`, así el skip link funciona en ambas y hay un solo `<main>` por ruta. Alternativa: envolverlas con `AppShell`.
- **Landmark `<footer>`:** no aplica; el diseño y el lienzo no tienen pie.
- **Barra inferior en flujo y sticky** (como el lienzo), no fija: reserva sola los 72 px + zona segura. Alternativa: fija con padding extra en `main`.
- **Lateral:** `<nav aria-label="Principal">` envuelve todo el slot. Cuando lleguen logo y tarjeta de usuario (fases 03–04) quizá convenga que el `<nav>` sea solo la lista de ítems.

## Dependencia con W2

La barra inferior usa `env(safe-area-inset-bottom)`, que necesita `viewportFit: "cover"` en el export `viewport` (de W2). Hasta que entre, la zona segura vale 0 y no se rompe nada.

## Verificación

typecheck, lint, tests (52) y build en verde. Comprobado que el CSS compilado contiene las utilidades nuevas. Sin servidor ni navegador (decisión de la tanda): la revisión visual y el a11y en navegador (axe, foco, 320 px) quedan para el QA final. A nivel de código: un solo `<main>` por ruta, skip link primero en el DOM, `aria-label` en cada `<nav>`, slots vacíos sin landmark, cortes 768/1024/1440/1920 iguales a §4.

## Filas de CONTENT_CHECKLIST (no edité el archivo local)

- 19: "Saltar al contenido" (texto del skip link, provisional).
- 20: `aria-label="Principal"` de los `<nav>` del shell (provisional).

Sin changeset (proyecto sin versionado).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
