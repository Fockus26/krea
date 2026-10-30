# D072 · Sections · Estados de una vista previa = una ruta estática por estado (`/secciones/<pantalla>/[estado]`) · Implemented

**Decision:** una pantalla con variantes (Ingresar: login, credenciales, bloqueado, recuperar, enviado, nueva, vencido) se previsualiza en `app/secciones/<pantalla>/[estado]/page.tsx` con `generateStaticParams` y `notFound()` para lo desconocido; la barra `Estados` (`app/secciones/_vista/estados.tsx`) enlaza `<base>/<estado>` con `aria-current`.
**Why:** con `cacheComponents: true` leer `searchParams` en la página rompe el prerender ("uncached or runtime data during prerendering"); una ruta por estado queda estática y enlazable.
**Discarded alternative:** `?estado=` con `<Suspense>` — la página pasa a dinámica solo por andamiaje interno.
