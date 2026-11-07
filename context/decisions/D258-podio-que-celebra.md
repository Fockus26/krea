# D258 · Ranking · El podio celebra: destello, corona que se balancea, rebote y confeti una vez por sesión · Implemented

**Decision:** `Podium` suma destello diagonal por escalón (`brillo-podio`, `opacity`/`translate`, escalonado 700 ms), corona con `animate-balanceo` y rebote de avatares (`animate-pop`, corre al montar, no en cada `onSnapshot`). `PodioConfeti` (cliente, sin librería) lanza 30 piezas con `transform`/`opacity` en colores del acento durante ~2,6 s, `aria-hidden`, `absolute` (sin saltos de layout), **una vez por sesión y por vista** (`sessionStorage` en try/catch, `lib/ranking-celebracion.ts`) y no se monta con reduced motion. Tokens: `--d-brillo`, `--d-balanceo`, `--d-confeti`.
**Why:** pedido de César (19).
**Discarded alternative:** confeti en cada visita o librería externa: cansa y pesa.
