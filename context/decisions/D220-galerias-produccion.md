# D220 · Infra · Las galerías /secciones, /componentes y /tokens responden 404 en producción, como /estados · Implemented

**Decision:** cada galería tiene un `layout.tsx` que llama a `notFound()` si `galeriaVisible(process.env)` es falso (`lib/galerias.ts`: `NODE_ENV=development` o `VERCEL_ENV=preview`). La regla es la de D162, que pasa a ser de todas las galerías; `galeriaEstadosVisible` queda como alias. Se ocultan en vez de borrarse porque siguen sirviendo para revisar en desarrollo y en cada vista previa.
**Why:** el QA de la versión 1 (D-A4) las encontró públicas en `krea-hazel.vercel.app` con 200 y datos del seed (nombres de alumnos y notas). `robots` y `noindex` las sacaban de los buscadores, pero cualquiera con la dirección las veía.
