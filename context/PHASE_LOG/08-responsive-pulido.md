# Fase 08 — Responsive y pulido

Hecha el 2026-11-05 en una sesión local. PRs #56–#61 (D214–D219). Cerrada con main @ d50568b: producción comprobada (`/ingresar` y `/recuperar` 200, rutas protegidas → `/ingresar`, inexistente → 404, sin errores en los logs del deployment).

## Unidades

| PR | Qué | Decisión |
|---|---|---|
| #56 | 500 en todas las rutas por `jwks-rsa`/`jose` (`ERR_REQUIRE_ESM`) | D214 |
| #57 | Objetivos táctiles de 44 px por debajo de 1024 | D215 |
| #58 | Equipos del profe a dos columnas hasta 1440 | D216 |
| #59 | Contraste AA en la tarjeta de puntos de Inicio | D217 |
| #60 | Con menos de 480 px de alto solo la acción sigue fija | D218 |
| #61 | Error de `Date.now()` y `uncached data` en rutas con sesión; 404 con sesión desde el cliente | D219 |

## Verificación final

Contra emuladores (`qa:local`, proyecto `demo-krea`) con cuentas de prueba de alumno y profesor, 26 rutas:

- 320, 360, 390, 768, 1024, 1440, 1920, 2560 y 3840 px, y 568×320 y 844×390: sin scroll horizontal, desbordes ni texto cortado.
- 0 objetivos por debajo de 44 px hasta 768. 0 errores de consola, de JavaScript y 5xx.
- axe `color-contrast`: limpio. `target-size`: un aviso en `/profe/equipos/5c`, falso positivo (botón bajo la barra inferior fija al hacer scroll).
- Foco visible con Tab: 695 pulsaciones, solo falla el indicador de desarrollo de Next.
- Padding de `main` y ritmo vertical uniformes por ancho (24 y 32 px).
- Movimiento reducido: sin animaciones corriendo. Sin preferencia: solo `transform` y `opacity`.
- Modo oscuro revisado a ojo en 4 capturas de 20.

## No verificado

- `evaluar/[entrega]` y `tareas/[id]`: el seed no trae entregas pendientes ni enlaces hacia ellas en el recorrido.
- Teléfonos físicos y zoom real del navegador: el 200 y 400 % se aproximan con los anchos.
- Hover: solo se midió `cursor: pointer`, no se comparó el estilo.
- Efecto en producción de D219: no pude leer sus logs ni medí las lecturas ahorradas.
- `encimados` de la medición: revisados por muestra; son contenido bajo barras fijas e indicador de Next.

## Para la fase 09

- Alumnos en móvil: «Desliza la tabla…» queda bajo la tabla, a unos 3400 px de la parte superior. Así lo pide HANDOFF §2.15, pero casi nadie lo verá. Decisión de César.
- `/secciones` y `/componentes` siguen públicas y con scroll horizontal en móvil.
- Toast con poca altura: sin revisar.
- `.env.test.local` creado en la carpeta principal y en wt1 (cuentas solo de emulador). El emulador de Firestore tarda 71 s en frío y Firebase espera 60: si `qa:local` falla al arrancar, reintentar.
