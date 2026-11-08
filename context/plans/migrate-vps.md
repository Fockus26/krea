# Migración Firebase → Postgres del VPS (2026-11-07)

Guía: kit `tech/migrate-firebase-vps.md` + `tech/vps-postgres.md`. Rama `feat/migrate-vps`,
**PR en draft hasta el cutover**. Sin migrar datos: se conservan solo los profesores.

## Inventario

| Firebase | Uso en KREA | En el VPS |
|---|---|---|
| Firestore | 10 colecciones: usuarios, privados, historialBase, equipos, tareas, entregas, ajustes, ranking, config, presencia/{alumno}/editores | Tablas Drizzle (rediseño, decisión propia) |
| Reglas | 129 líneas; todas las escrituras ya van por el servidor (admin), el cliente solo lee | Un check por regla en `lib/data/*`, con test (tests/rules → tests de autorización) |
| Auth | cédula → email interno (D008), rol/sección en custom claims | Better Auth, id = cédula (texto), rol y sección como columnas |
| Storage | Ya está en Backblaze B2 (D194) | Sin cambio |
| Functions | No hay | — |
| `onSnapshot` | Ranking en vivo, podio, presencia de profes en Alumnos | Polling o SSE (pregunta abierta) |
| Emails | Brevo API (recuperar contraseña) | Brevo SMTP desde Better Auth |
| Capa de código | `lib/firebase/*` ≈ 2 260 líneas, 23 archivos importan firebase | `lib/db/` + `lib/data/<entidad>.ts`; grep `firebase` en 0 |

Riesgo: el ranking en vivo es una función central (onSnapshot). Esfuerzo estimado: alto
(varias sesiones), sobre todo por la capa de datos y los tests de autorización.

## Estado (2026-11-07)

Hecho en `feat/migrate-vps` (D327):
- [x] Bases `krea`, `krea_preview`, `krea_dev`; `drizzle.config.ts`, `vps:env`, `vercel.json` fra1.
- [x] Esquema Drizzle + tablas de Better Auth; migración 0000 aplicada a `krea_dev` y `krea_preview`.
- [x] Sesión, login, salir, recuperar, cambiar y crear contraseña con Better Auth.
- [x] `lib/firebase/*` → `lib/data/*`; loaders `lib/datos/*`; acciones. Grep de `firebase` en 0 (salvo `firebase-scrypt`, que verifica los hashes importados).
- [x] Ranking y presencia por sondeo (`/api/ranking/[seccion]`, `/api/presencia`, `lib/sondeo.ts`).
- [x] `tests/rules` → `tests/db` sobre PGlite + pruebas de acceso y de sesión con Better Auth real.
- [x] `scripts/seed-db.ts` (solo `_dev`/local), `scripts/admin-profesor.ts`, `scripts/importar-profesores.ts`.
- [x] Humo contra `krea_dev`: login, sesión, ranking y dos ajustes simultáneos (no se pierde ninguno).

Falta:
- [x] Variables en Vercel (2026-11-08): `DATABASE_URL` (prod `krea`, preview `krea_preview`), `BETTER_AUTH_SECRET` (prod y preview), `BETTER_AUTH_URL` (prod), `FIREBASE_HASH_SIGNER_KEY` y `_SALT_SEPARATOR` (prod; rounds/mem_cost por defecto 8/14), B2_* y BREVO_* copiadas a Preview. Las de Firebase se quedan hasta 30 días después del cutover (rollback).
- [ ] `qa:local --postgres` pide Docker y crea las cuentas por sign-up (aquí desactivado): adaptar para el QA final (KIT_FEEDBACK 77).
- [x] `functional-qa` sobre el preview (2026-11-08): 2 críticos (login 307 por el proxy, rate limit por IP) y 1 bajo (endpoints abiertos) arreglados en 6baf280; falta re-verificar y probar B2/Brevo tras el redeploy, y el correo de recuperación a mano (César).
- [x] Cutover (2026-11-08): `krea` migrada; 5 profesores importados con hash de Firebase (ensayo + real); probar-hash ✓ (César); JSON borrados; PR #108 listo. Falta: merge (César), login en producción, correo de recuperación a mano, Firebase vivo 30 días (hasta 2026-12-08).

## Pasos

1. `kit-db create krea` y `krea_preview`; `scripts/vps-env.ts`, `drizzle.config.ts`, `vercel.json` fra1.
2. Esquema Drizzle + Better Auth (tablas generadas) + migración; `drizzle/seed.sql` sin datos personales.
3. `qa:local --postgres`; reglas → tests de autorización.
4. Reemplazar `lib/firebase/*` por `lib/data/*` entidad a entidad; tiempo real según decisión.
5. Script de copia: solo profesores (+ sus cuentas), ensayo en BD temporal.
6. functional-qa sobre el build real.
7. Cutover con César (§5 de la guía); el proyecto Firebase queda 30 días sin escrituras.
8. Decisión `D-migracion-vps`, PROJECT_CONTEXT § Stack.

## Preguntas abiertas

- Tiempo real: polling vs SSE.
- Contraseñas de profesores: importar hashes (parámetros de hash de la consola) vs nueva contraseña.
- Acciones de César: SMTP de Brevo, `BETTER_AUTH_SECRET`/`URL` y `SMTP_*` en Vercel, permiso para secretos/deploys.
