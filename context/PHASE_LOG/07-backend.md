# Fase 07 — Backend · resumen del cierre (2026-11-05, sesión cloud)

Plan: `context/plans/phase-07-backend.md` · decisión de cierre: D211 · sin servidor y sin QA hasta
el final (César, 2026-10-29 / 2026-11-03).

## Unidades

| Unit | PR | Merge |
|---|---|---|
| W1 modelo de datos, reglas y emuladores (D174–D177) | #48 | 27bd040 |
| W2 login, sesión, protección y salir (D180–D183) | #49 | f3a8d6d |
| W4 lecturas del estudiante, ranking en vivo, Perfil (D189–D193) | #50 | f775ec3 |
| W3 recuperar contraseña con Brevo (D185–D188) | #51 | 1b22d77 |
| W5 entregas: borrador local, enviar, imágenes en B2 (D194–D197) | #52 | 94ae747 |
| W6 tareas del profe: constructor, publicar, cerrar, premios (D199–D202) | #53 | 7082686 |
| W7 evaluar, ajustes de puntos y Panel con Firestore (D204–D208) | #54 | 73df0ea |
| W8 alumnos y equipos (claims, logo B2), errores y 404/500 con sesión, cierre (D209, D210, D212, D213, D211) | PR de W8 | — |

## W8 en detalle

- Alumnos reales: editar nombres, base con historial (motivo + autor) y email de recuperación en
  una transacción con el ranking (D209). Equipos reales: mover, quitar, capitán con claims +
  revocación (D210); logo en B2 con firma de bytes, borrar el anterior, firmado solo donde se ve
  (D212). Ranking del profe en vivo (antes demo). D171 enchufado y 404/500 con sesión real (D213).
- Verificado: `test:rules` (52 pruebas, 7 archivos; nuevas en `tests/rules/alumnos-equipos.test.ts`:
  mover → perfil/capitán/ranking/claims/tokens, quitar, equipo vacío, otra sección, capitán, base
  con historial y puntos recalculados, email, logo), `test` (748), build, typecheck, lint.
- No verificado: nada en navegador (sin servidor); subida real a B2 (host bloqueado).

## Pendiente que pasa a la fase 09 (QA)

Ver CURRENT_PHASE «Blocked» (lista de QA pendientes W2–W8).
