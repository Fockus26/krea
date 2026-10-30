# F04 W2 — Ingresar y recuperar (cloud, 2026-10-30)

- `components/sections/auth/`: AuthLayout (+ panel de marca), AuthHeading, VolverLink, LoginForm, RecoverForm, RecoverSent (cuenta regresiva 60 s), NewPasswordForm (en vivo + vencido), `focusPrimerInvalido`.
- `lib/auth.ts` (mínimo 8, textos, cuenta m:ss) con pruebas. Tokens: `--w-auth-brand`, `grid-cols-auth`, `text-claim`.
- Copy final del lienzo `design/canvas/Ingresar.dc.html`; lo que el lienzo no define, fila 56.
- Vista: `/secciones/ingresar/[estado]` (D072: `searchParams` rompe el prerender con cacheComponents).
- Decisiones D070–D072 (D073 libre). Filas 56–57 (58 libre).
- Para la fase 05: las rutas reales `/ingresar`, `/recuperar`, `/recuperar/enviado`, `/recuperar/nueva` usan estas secciones; `onSubmit`/`error`/`pending` se conectan en la fase 07 (D008).
