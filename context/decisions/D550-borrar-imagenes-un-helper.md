# D550 · Data · `borrarImagenes` es un solo helper en `lib/almacen/`; recibe el almacén y la acción para el registro · Implemented

**Decision:** `lib/almacen/borrar-imagenes.ts` exporta `borrarImagenes(almacen | null, claves, accion)`: sin claves no hace nada; sin almacén configurado o con borrados fallidos solo registra `[accion] …` y nunca lanza (las imágenes quedan huérfanas, D229). Lo usan `eliminarAlumno`, `eliminarEntrega`, `eliminarEquipo` y `eliminarTarea`, pasando `almacenB2()`.
**Why:** las cuatro copias eran idénticas salvo la etiqueta del registro (la de alumnos, además, la envolvía en un `.catch` que no hacía falta). Recibir el almacén (en vez de llamar a `almacenB2()`) permite probarla con uno falso (`tests/unit/borrar-imagenes.test.ts`).
**Discarded alternative:** que el helper llame a `almacenB2()` él mismo: ata la prueba al entorno `B2_*`.
