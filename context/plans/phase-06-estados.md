# Fase 06 — Estados · plan de olas

> Escrito el 2026-11-03 (sesión cloud). Fase: `phases/06-STATES.md` · Handoff §2.14 (vacío, skeleton, avisos), §5b
> (pantallas de estado), §6 (movimiento del skeleton). La guía del kit `reference/STATUS-SCREENS.md` no está en el repo
> ni se pudo clonar el kit desde la nube (repo privado fuera de alcance): se sigue `phases/06-STATES.md` + el handoff.
> **Sin QA hasta el final** (César, 2026-10-29). **Sin servidor** (César, 2026-11-03): typecheck, lint, test, build y
> `check:paginas`. Sin versionado. Sin datos reales (fase 07). En la nube las unidades van una tras otra (PR → CI → squash).

## Olas

| Ola | Unidad · qué | Estado |
|---|---|---|
| 1 | W1 `feat/estados-pantallas` · `StatusScreen`; 404 raíz (3 variantes, D160), `error.tsx` (500 con/sin código + sin conexión por la red), `global-error.tsx`, galería `/estados` (D162). Sin mantenimiento (D163) | cerrada (#44) |
| 1 | W2 `feat/estados-sin-conexion` · banner «Sin conexión. Ves tus notas de las …» (§5b: 12 px bajo la topbar, #221D2B/#F4F1F8, WifiOff #FFC23D, «Reintentar», `z-offline`) en los dos shells + toast «Volviste a estar en línea» 3 s; variante en la galería. La hora de los datos en caché llega en la fase 07 (Firestore offline): hasta entonces la del último render en línea | cerrada (#45) |
| 2 | W3 `feat/estados-carga` · `loading.tsx` por ruta con skeletons de cada sección (§2.14: `aria-busy` + `aria-label` «Cargando …», pulso 1400 ms, estático con reduced motion) | cerrada (#46) |
| 2 | W4 `feat/estados-vacios-errores` · barrido: cada lista con su vacío (§Vacíos, lienzo Vacios.dc.html), errores al guardar en pantalla (Alert `role="alert"` + qué hacer), estados de formulario y anuncios `aria-live`; cierre de la fase (criterios de `phases/06-STATES.md`) | cerrada (#47) |

## Números reservados (contra `origin/main`: última decisión D159, última fila 112)

| Unidad | Decisiones | Filas |
|---|---|---|
| W1 | D160–D163 | 113–114 |
| W2 | D164–D166 | 115–116 |
| W3 | D167–D169 | 117–118 |
| W4 | D170–D174 | 119–121 |

## Para las siguientes (lo deja W1)

- Las pantallas de estado viven en la raíz (D161): no añadir `error.tsx`/`not-found.tsx` por grupo (meterían el shell).
- `useEnLinea()` (`components/krea/use-en-linea.ts`) es el hook de red para el banner de W2.
- Tokens en `app/globals.css`, bloque «Pantallas de estado».
