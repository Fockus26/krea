# D022 · SEO · URL base desde NEXT_PUBLIC_SITE_URL, luego dominio de Vercel, luego localhost · Implemented

**Decision:** `lib/site.ts` resuelve la URL base con `NEXT_PUBLIC_SITE_URL`; si falta, `https://$VERCEL_PROJECT_PRODUCTION_URL`; si falta, `http://localhost:3000`. `metadataBase`, `robots` y `sitemap` la usan.
**Why:** el dominio final está pendiente (PROJECT_CONTEXT); así los canónicos y la OG quedan correctos en cuanto se fije la variable en Vercel, sin tocar código.
**Discarded alternative:** escribir el dominio en el código (no existe aún).
