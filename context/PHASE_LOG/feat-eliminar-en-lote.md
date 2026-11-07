# feat/eliminar-en-lote (W22, ola 4) — PR #98

- **Pedidos 49 y 51.** Variante `ghost-danger` de Button, aplicada a todos los botones de eliminar sin fondo salvo `image-upload.tsx`, y a «Cerrar sesión» del Perfil. En Alumnos, Eliminar junto a Editar. Eliminar en lote en Alumnos y en Profesores (en Profesores solo el admin, sin casilla propia).
- **Servidor:** `eliminarAlumnos`, `resumenEliminarAlumnos` y `eliminarProfesores`. Reutilizan `borrarUnAlumno` y `borrarUnProfesor`, aceptan hasta 25 cédulas por llamada, son idempotentes, devuelven el resultado de cada cédula y terminan con `refresh()`.
- **Piezas nuevas:** `lib/lote.ts` (puro, con tests), `components/ui/checkbox.tsx` y `components/sections/shared/eliminar-en-lote.tsx`.
- **Decisiones:** D297–D300. Filas de checklist 159 (textos del lote) y 160 (textos del resumen de alumnos).
- **Verificado:** typecheck, lint y suite completa (1070 pass). Contraste de `ghost-danger` comprobado en tests.
- **No verificado:** navegador ni emuladores (sin servidor en esta tanda).
