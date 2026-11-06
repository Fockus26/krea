# D223 · SEO · `/ingresar` extiende la Open Graph del layout y tiene su `opengraph-image` · Implemented

**Decision:** `OPEN_GRAPH_BASE` (type, locale, siteName) y `TWITTER_BASE` (card) viven en `lib/site.ts`. El layout y `/ingresar` los extienden con `...`. `app/(auth)/ingresar/opengraph-image.tsx` reexporta la imagen del sitio, porque Next solo pone la imagen de archivo en el `openGraph` del segmento donde está el archivo. Una página que define su propio `openGraph` necesita su archivo.
**Why:** QA de la versión 1 (D-M2): la fusión de metadata es superficial. `/ingresar`, la única página indexable (D023), salía sin `og:image`, `og:type`, `og:locale`, `og:site_name` y con `twitter:card=summary`. El enlace se compartía sin la tarjeta de marca.
