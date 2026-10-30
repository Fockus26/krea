# Prompts por unidad — orquestación 2026-10-29 (fase 02, ola 1)

Brief compartido: `C:\Users\Cesar\Documents\Work\krea\context\plans\orchestration-2026-10-29-f02.md`

---

## W1 — `feat/layout-base`

Eres el worker **W1**. Rama: `feat/layout-base`. Slot y puerto: los del mensaje que te lanza.
Decisiones: rango **D019–D021**. Filas de CONTENT_CHECKLIST: **19–20**.
Modelo · esfuerzo: **sonnet · medium**. Docker: **no**. Dependencias nuevas: **ninguna**.

Primero lee el brief compartido (arriba). Decisiones previas que te limitan:
D001 (acento variable por `data-accent`), D015 (tema/acento en localStorage + anti-parpadeo),
D016 (capas de tokens CSS), D017 (utilidades de tipografía y capas) — `cat context/decisions/D0NN-*.md` de cada una.

### Qué pide César
> "/orchestrate fase 02" — fase `phases/02-LAYOUT-BASE.md`: contenedor y anchos máximos por breakpoint
> (HANDOFF §4), grilla global, ritmo vertical, smooth scroll solo con movimiento permitido +
> `scroll-margin-top` igual al alto del header sticky, header/footer estructurales, skip link a `main`,
> landmarks `<header>`, `<nav>`, `<main>`, `<footer>`.

Lo leo como el **esqueleto** de la app, sin el contenido de la navegación (ítems, íconos, tarjeta de usuario
y hoja Menú son HANDOFF §7 paso 5 y llegan con las fases 03–04 cuando existan Avatar/Sheet/lucide).

### Dónde está
- `design/HANDOFF.md:365-381` — §4 grilla y layout global (tabla de anchos, padding, gutter, nav, contenedor; ritmo vertical; 72 px + safe-area al final en <1024; barra de acción).
- `design/HANDOFF.md:205-211` — §2.7 navegación: lateral 248/264 sticky 100vh ≥1024; topbar 56/64 sticky `--bg` 92 % + borde inferior <1024; barra inferior 72 px + `env(safe-area-inset-bottom)` <1024.
- `design/canvas/krea.css:139-184` — referencia exacta: `.side`, `.wrap`/`.wrap-wide`/`.wrap-narrow`, `.topbar`, `.bnav`, `.g2/.g3/.g4/.g-home/.g-side` y sus cortes (768/1024/1440/1920). Ojo: el lienzo usa container queries; aquí van **media queries** de Tailwind (`md`, `lg`, `xl`, `3xl`, HANDOFF §4 última viñeta).
- `app/globals.css` (≈604 líneas): tokens de la fase 01; `--z-topbar` en :267 y `@utility z-*` en :364-390; bloque "Base" al final (:569+) con selection/scrollbar/focus **ya hechos — no los rehagas**. `--breakpoint-3xl` en :336.
- `app/layout.tsx:33-37` — `<html>`/`<body>`; tú tocas solo el JSX de `<body>` (y la clase de `<html>` para smooth scroll). Los exports `metadata`/`viewport` son de W2: no los toques.
- `app/page.tsx` y `app/tokens/page.tsx:144` — hoy cada página pinta su propio `<main>`.

### Enfoque decidido
- **Utilidades de layout** en `app/globals.css`, en un bloque nuevo "Layout" (`@utility`): contenedor estudiante (1120 → 1280 desde 3xl), profe (1280 → 1440 desde 3xl), lectura (760); padding lateral 16/24/32/40 y padding vertical del contenido 16-32 / 24-48 / 32-64 / 40-80 por `md`/`lg`/`xl`; gap entre secciones 24 → 32 desde `md`; grillas `g2/g3/g4/g-home/g-side` (nombres a tu criterio, coherentes con D017). Los px del handoff pasan a tokens/rem; nada de valores sueltos en componentes.
- **Tokens de alto** que falten (topbar 56/64, barra inferior 72, lateral 248/264): añádelos al bloque de tokens con comentario de origen (`HANDOFF §2.7`).
- **Smooth scroll:** `scroll-behavior: smooth` solo dentro de `@media (prefers-reduced-motion: no-preference)` en `html`; `scroll-margin-top` en `:target`/`[id]` = alto de la topbar (<1024) y 0 + respiro ≥1024 (la lateral no tapa nada) — decide y documenta.
- **Skip link** en el root layout, primer foco del documento, visible al enfocarse, a `#contenido`. Copy: "Saltar al contenido" (provisional, fila 19).
- **`components/layout/AppShell.tsx`** (server component): props `role: "estudiante" | "profesor"` y `width?: "default" | "lectura"`, más slots (`sidebar`, `topbar`, `bottomNav`, `children`). Renderiza `<aside>`/`<nav>` lateral solo ≥lg, `<header>` topbar sticky y `<nav>` barra inferior sticky solo <lg, y un único `<main id="contenido" tabIndex={-1}>` con el contenedor del rol. Los `<nav>` llevan `aria-label` ("Principal"…) y los slots vacíos no pintan landmarks vacíos. Reserva 72 px + safe-area al final del contenido en <lg. Sin `<footer>` visual (la app no tiene pie en el diseño): explica en el PR que el landmark footer no aplica a esta app, salvo que encuentres uno en el lienzo.
- **Un solo `<main>`:** adapta `app/page.tsx` y `app/tokens/page.tsx` para que no anidan `<main>` si los envuelves; si no los envuelves con el shell, que conserven el suyo con `id="contenido"`. Lo que elijas, que el skip link funcione en ambas.
- Las pantallas de estado (HANDOFF §5b, sin barras de navegación) **no** son de esta unidad.

### Trampas conocidas
- `100vh` en la lateral: usa `100dvh` con fallback si lo ves necesario; la barra inferior respeta `env(safe-area-inset-bottom)` (requiere `viewport-fit=cover`, que es del export `viewport` de W2 — no lo pongas tú; anótalo en el PR como dependencia).
- La topbar usa `--bg` al 92 %: `color-mix(in oklab, var(--bg) 92%, transparent)` o el derivado que ya exista en D016 — no un hex.
- En oscuro las superficies pierden sombra y ganan borde (HANDOFF §8): la barra inferior tiene sombra `0 -4px 16px …` solo en claro.
- Sin scroll horizontal a 320: el contenedor `min-w-0`, nada de anchos fijos en móvil.
- `sr-only` dentro de contenedores con scroll necesita `position: relative` en el contenedor (HANDOFF §8).

### Cómo verificar
- typecheck, lint, test, build. Sin servidor ni navegador.
- Revisión por código: un único `<main>` por ruta, skip link primero en el DOM, `aria-label` en cada `<nav>`, cortes 768/1024/1440/1920 iguales a la tabla §4, smooth scroll envuelto en reduced-motion.
- Si añades lógica pura (p. ej. mapa rol → ancho), prueba unitaria en `tests/unit/`.

### Cierre
Changeset: ninguno. En el PR, "Decisión tomada / alternativa" para: `scroll-margin-top` ≥1024, si `page.tsx`/`tokens` usan el shell, landmark footer. Acciones manuales: ninguna. Reporte final como dice el brief.

---

## W2 — `feat/marca-seo`

Eres el worker **W2**. Rama: `feat/marca-seo`. Slot y puerto: los del mensaje que te lanza.
Decisiones: rango **D022–D024**. Filas de CONTENT_CHECKLIST: **21–22**.
Modelo · esfuerzo: **sonnet · medium**. Docker: **no**. Dependencias: puedes usar `bunx png-to-ico` (sin añadirlo a `package.json`) para generar `favicon.ico`; nada más.

Primero lee el brief compartido (arriba). Corre la skill **`seo`** en modo *init* y síguela, con lo que aquí se decide.
Decisiones previas que te limitan: D002 (logo SVG de dos capas), D005 (Poppins + Nunito Sans), D008 (login por cédula) — `cat context/decisions/D0NN-*.md` de cada una.

### Qué pide César
> "/orchestrate fase 02" — fase `phases/02-LAYOUT-BASE.md`: "Brand assets from the seo init: favicon,
> icon.svg, apple-icon.png, manifest and default OG" + cierre "`seo` skill run in init mode: base metadata,
> robots.ts, sitemap.ts, favicons, default OG".

### Dónde está
- `design/HANDOFF.md:383-403` — §5 assets: favicon (svg con `prefers-color-scheme` + png 16/32 → `favicon.ico` 16/32/48), apple 180 opaco #295AC3, PWA 192/512/maskable, `manifest.ts` (`theme_color` #295AC3, `background_color` #F6F4FA, `standalone`, "KREA"/"KREA"), y la **plantilla OG 1200×630** completa (coordenadas, colores, textos, zona segura).
- `design/HANDOFF.md` §8 — "Favicon, apple touch, maskable y OG siempre en azul" (el SO no conoce el acento): aquí los hex #295AC3 están permitidos.
- `design/assets/brand/` — `favicon.svg`, `favicon-16.png`, `favicon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `isotipo*.svg`, `maskable.svg`. Cópialos a donde Next los sirve (`app/icon.svg`, `app/apple-icon.png`, `app/favicon.ico`, `public/` para los del manifest); no los redibujes.
- `public/brand/krea-logo.svg` — logo para la OG (300 px, azul).
- `app/layout.tsx:19-22` — export `metadata` provisional ("Título provisional; metadata/SEO completos son de la fase 02"). Tú tocas solo los exports `metadata` y `viewport` y sus imports; el JSX de `<body>` es de W1.
- `app/favicon.ico` — el de create-next-app: lo **reemplazas**.
- `public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` — restos de la plantilla: señálalos en el PR, no los borres.

### Enfoque decidido
- **Dominio pendiente** (PROJECT_CONTEXT: "Domain: PENDING"): `lib/site.ts` con la URL base desde `NEXT_PUBLIC_SITE_URL`, con respaldo `VERCEL_PROJECT_PRODUCTION_URL` y luego `http://localhost:3000`; `metadataBase` la usa. Añade `NEXT_PUBLIC_SITE_URL=` a `.env.example` (sin valor real) si el archivo existe; si no, dilo en el PR. Fila 21: dominio final.
- **Indexación (portal privado con login):** decisión conservadora del orquestador, provisional hasta que César diga otra cosa — se indexa solo `/ingresar`; `robots.ts` permite `/ingresar` y bloquea el resto; `sitemap.ts` lista solo `/ingresar`; las páginas con sesión llevarán `robots: { index: false }` cuando existan (déjalo escrito en la decisión). Regístralo como decisión en tu rango y menciónalo en "Decisiones abiertas".
- **Metadata base:** `title` con plantilla (`%s · KREA`, default "KREA — Escuela Creativa"), `description` = la bajada de la OG ("Portal de la Escuela Creativa · 5.º año") o una frase del mismo tono marcada provisional (fila 22), `applicationName`, `openGraph` (`locale: "es_VE"`, `siteName`), `twitter: summary_large_image`. `viewport`: `themeColor` claro #295AC3 / oscuro según §1 (si el handoff no lo da para oscuro, usa el `--bg` oscuro de `globals.css` y dilo), `colorScheme: "light dark"`, **`viewportFit: "cover"`** (lo necesita la barra inferior de W1 para `safe-area-inset-bottom`).
- **OG:** `app/opengraph-image.tsx` con `ImageResponse` siguiendo la plantilla §5 al pie de la letra. Fuentes Poppins 700 / Nunito Sans 600 para la imagen: lee la guía de `ImageResponse` en `node_modules/next/dist/docs/` y elige cómo cargarlas (TTF en el repo vs fetch); explica la elección. `alt` de la imagen = el título.
- **Manifest:** `app/manifest.ts` con los valores de §5 e íconos 192/512/maskable.

### Trampas conocidas
- No hay OG por página en v1 (§5): una sola imagen por defecto.
- `apple-icon.png` debe ser opaco y sin esquinas (ya viene así; no lo proceses).
- El favicon SVG ya trae su `@media (prefers-color-scheme: dark)`: cópialo tal cual a `app/icon.svg`.
- No metas `#295AC3` en ningún componente: solo en manifest/viewport/OG (HANDOFF §8).
- El build genera la OG estática: si falla por la fuente, el build lo dirá — revísalo.

### Cómo verificar
- typecheck, lint, test, build. En la salida del build deben aparecer `/icon.svg`, `/apple-icon.png`, `/manifest.webmanifest`, `/opengraph-image`, `/robots.txt`, `/sitemap.xml`.
- Prueba unitaria de `lib/site.ts` (resolución de la URL con y sin variables) en `tests/unit/`.
- Si puedes sin servidor, inspecciona el `.next` generado (p. ej. `robots.txt`, `sitemap.xml` estáticos) y pega su contenido en el PR.

### Cierre
Changeset: ninguno. En el PR, "Decisión tomada / alternativa" para: indexación solo `/ingresar`, carga de fuentes de la OG, `themeColor` oscuro, URL base. Acciones manuales: dominio final en Vercel (`NEXT_PUBLIC_SITE_URL`). Reporte final como dice el brief.
