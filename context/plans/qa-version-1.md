# QA de versión 1 — KREA (fase 09)

`main @ d50568b` · 2026-11-05/06 · emuladores `demo-krea`, cuentas de prueba de `.env.test.local`.
Punto de partida del QA de la próxima versión: `git diff --name-only d50568b..origin/main`.

Informes completos: [`qa-version-1-functional.md`](qa-version-1-functional.md) ·
[`qa-version-1-design.md`](qa-version-1-design.md). Repros: `krea-wt/wt2/.qa/repro/` (funcional),
`krea-wt/wt3/.qa/repro/` (diseño). Cada arreglo se cierra con su repro: FAIL en main, PASS en la rama.

## Hallazgos por severidad (0 críticos)

| ID | Sev. | Qué | Repro | Unidad propuesta |
|---|---|---|---|---|
| F-A1 | Alto | Contraseña en la URL si se envía antes de hidratar (`/ingresar`, `/recuperar/nueva`, `/recuperar`) | wt2 `2-…` | `fix/formularios-post` |
| F-A2 | Alto | Alumno movido de equipo tras una grupal cuenta dos veces en el ranking | wt2 `3-…` | `fix/grupal-cambio-equipo` · #66 (regla a, D221) |
| D-A1 | Alto | Texto al 200 % en 390 px → scroll horizontal en todas las rutas | wt3 `3-…` | `fix/texto-200-movil` |
| D-A2/A3 | Alto | Alto contraste: logo invisible y opción activa de segmentados/tabs indistinguible | wt3 `4-…`, `5-…` | `fix/forced-colors` |
| D-A4 | Alto (conocido) | `/secciones`, `/componentes`, `/tokens` públicas con datos del seed | wt5 `d-a4-…` (curl a prod) | `fix/galerias-produccion` · #65 |
| D-A1b | Medio | Resto del 200 %: fila del ranking, `Button` nowrap (/perfil, /profe/tareas/nueva), fila de /profe/equipos | wt4 `3b-…` | #72 (filas) + #73 (botones, D227) |
| F-M1 | Medio | Corrección de nota pisa sin aviso a otra pestaña | wt2 `7-…` | `fix/evaluacion-version` · #70 |
| F-M2 | Medio | Primer nombre vacío con segundo nombre se guarda | wt2 `10-…` | `fix/validacion-espacios` (con F-B1) · #67 |
| D-M1 | Medio | 404 dinámica responde HTTP 200 (+ meta robots duplicado) | wt3 `2-…` | aceptada · D225 · #71 |
| D-M2 | Medio | `/ingresar` pierde og:image y compañía | — | `fix/og-ingresar` · #69 |
| D-M3 | Medio | Ranking 320 px: nombre recortado en filas con «Empate» | wt3 `1-…` | `fix/ranking-estrecho` · #72 (D226) |
| D-M4 | Medio | Foco con Tab tapado por la barra inferior | wt3 `6-…` | `fix/scroll-padding` · #68 |
| F-B1 | Bajo | Contraseña de 8 espacios aceptada | wt2 `8-…` | con F-M2 |
| F-B2 | Bajo | Tarea con fecha 31/12/9999 | wt2 `4-…` | #74 (D228) |
| F-B3 | Bajo | Pregunta de imagen entregada con ruta inventada | wt2 `5-…` | #75 (D229) |
| F-B4 | Bajo | Error de B2 mostrado como «Revisa tu conexión» | wt2 `9-…` | #75 (D229) |
| D-B1..3 | Bajo | Título «Nueva t…» a 320 px · `public/next.svg` sin uso · meta robots duplicado | — | #76 (D230) · D-B3 en D225 |

Sospechas descartadas (PASS en main, quedan como regresión): bucle con sesión revocada (`1-…`), id con `%2F` (`6-…`).

## Limpio

axe 0 violaciones (todas las rutas, 4 acentos × 2 temas) · 320–3840 sin scroll · zoom 400 % · altura corta · daltonismo (D004) · reduced motion · reglas de Firestore/Storage (403) · permisos por rol y capitán · validaciones del servidor (suma 20, pasos 0,5) · doble clic · borrador tras recargar · «Deshacer» · ajuste ≠ nota (D007) · ranking en vivo · cambio de contraseña · recuperar con código del emulador · empate de premio · XSS como texto.

## Sin verificar

- **Necesita a César:** Brevo real, subida real a B2, caducidad de enlace/sesión, bloqueo por intentos.
- Scripts listos sin correr: `ui-builder.mjs`, `ui-alumnos.mjs`, `ui-sesion-vencida.mjs` (wt2/.qa).
- Alto contraste y daltonismo en `/profe/equipos`, puntos, premios y perfil; foco al cerrar diálogos; foco al h1 en 500; anclas del índice de preguntas.
- Producción: OG en la URL desplegada y si las galerías están expuestas.

## Acciones para César

1. F-A2: regla (a) elegida (2026-11-06) → #66. Queda: capitán movido tras una entrega.
2. Brevo: `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`; probar con 38291460.
3. `B2_*` en Production y Preview, bucket privado, clave limitada al bucket.
4. Cuentas de los demás profesores · rotar la clave de la cuenta de servicio.
