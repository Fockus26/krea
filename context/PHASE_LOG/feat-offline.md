# feat/offline (W18, ola 4 de la tanda 2026-11-06) — pedido 45

**Rama:** `feat/offline` · **Slot:** wt1 · **Decisiones:** D291–D295 · **Checklist:** 156–158 (descritas en el informe)

## Qué quedó
- `public/sw.js` propio (D291): estáticos de caché; páginas de la red con copia (6 s) y `/sin-conexion` para lo no visitado; nada de RSC, Server Actions, /api ni otros orígenes; páginas por usuario (se vacían al salir o al cambiar de cuenta). Registro solo en producción.
- Cola IndexedDB (D292) solo para la entrega del alumno y guardar/publicar del constructor; drenaje al abrir, `online`, pestaña visible y tras encolar; Web Locks o arriendo en localStorage.
- Servidor idempotente por `opId` (D293): `operaciones/{opId}` en la misma transacción.
- Conflictos (D294): tarea cerrada/evaluada → no se envía, aviso y respuestas conservadas; sin sesión → pendiente + «Entrar».
- Imágenes (D295): Blob comprimido en la cola, subida con `imagenId` determinista, avance parcial guardado, aviso sin espacio.

## Verificación
- `bun run test` (suite), typecheck, lint. Tests nuevos: `tests/unit/offline-cola.test.ts` (18), `tests/unit/offline-sw.test.ts` (4), `tests/rules/operaciones.test.ts` (4, emulador).
- `test:rules` con `emulators:exec` venció a los 60 s (máquina cargada); corrido contra emuladores levantados a mano: operaciones + entregas + tareas 12/12.
- Sin servidor ni navegador (decisión de César): SW y UI revisados por código.

## Pendiente / abierto
- «Todo lo demás que escribe muestra Sin conexión y no deja enviar»: hoy lo cubre el banner global + el error «No se pudo conectar» de cada acción; deshabilitar cada botón offline queda para después de W22 (dueño de muchos de esos archivos).
- TTL de `operaciones.expiraEn` (acción manual de César).
