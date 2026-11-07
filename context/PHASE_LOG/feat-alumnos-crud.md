# feat/alumnos-crud — W12 (tanda 2026-11-06, ola 2)

**Pedido 3 de César:** que los profes creen, editen y eliminen alumnos, equipos y capitanes.

## Hecho
- Agregar alumno (`/profe/alumnos`): `crearCuenta` + contraseña temporal una vez + ficha del alumno nuevo; equipo opcional y ranking en una transacción (D267).
- Eliminar alumno desde su ficha: recuento en el servidor antes de confirmar; Auth primero; entregas individuales, ajustes, historial, perfil, privados y ranking en una transacción; grupales intactas; imágenes de B2 después (D268). Capitán eliminado: el cargo pasa al siguiente (D269).
- Equipos: «Nuevo equipo», «Editar» (nombre, tema) y «Eliminar» (solo vacío, sin entregas grupales ni ajustes; si no, el diálogo dice por qué) (D270, D271).
- `PasswordTemporalDialog` pasa a `components/sections/shared/`; botones ocupados de Profesores y Perfil con `loading` (D285).

## Verificado
- Emuladores: `tests/rules/alumnos-crud.test.ts` 13/13; suite de reglas completa 79/79 (con puertos propios del slot; `firestore.test.ts` aparte con los puertos por defecto).
- `bun run test` 943/943 · `bun run typecheck` · `bun run lint` limpios.

## No verificado
- Nada en navegador (sin servidor por decisión de César): flujo de UI, foco tras eliminar, 320 px y texto a 200 % revisados por código.

## Copy provisional
- Fila 148: textos de «Agregar alumno» (ayudas, errores, aviso «sin equipo»).
- Fila 149: textos de eliminar alumno (recuento, capitanía, grupales) y de los diálogos de equipos.
