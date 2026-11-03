# D183 · QA · Las cuentas de prueba de qa-local son cédulas del seed del emulador · Implemented

**Decision:** en `.env.test.local`, `ESTUDIANTE_EMAIL_TEST` / `PROFESOR_EMAIL_TEST` llevan una **cédula** del seed (p. ej. 33272397, capitana de 5A-G2; 10000000, profe de prueba); `scripts/qa-local.ts` no crea esas cuentas (ya las crea `seed-emulator.ts` con uid = cédula y claims) y solo les pone la contraseña del archivo. Correos normales siguen el camino del kit.
**Why:** las reglas y la sesión exigen uid = cédula y claims `rol/seccion/equipoId`; una cuenta con uid aleatorio y el claim `role` del kit no tendría acceso a nada.
**Discarded alternative:** que qa-local cree perfiles y claims propios — duplica el seed.
