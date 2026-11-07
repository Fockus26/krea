# fix/eliminar-equipo-con-entregas — X1 (tanda 2026-11-07)

- Eliminar equipo ya no bloquea (D307, reemplaza a D271): integrantes a «Sin equipo», grupales se quedan con `titularNombre` (D308), ajustes del equipo se borran, ranking sin el equipo; una transacción, tope 500 → `demasiados`; claims tras el commit → `sesiones` (D309).
- Nombre de grupal: `nombreGrupal` (equipo vivo → titularNombre → TITULAR_DESCONOCIDO). Mis notas nombra el equipo de la entrega, no el actual.
- Diálogo: `consecuenciasTexto` con números; sin la variante «no se puede eliminar».
- Tests: unit (consecuencias, texto, nombreGrupal, Mis notas tras eliminar) + emuladores (`tests/rules/alumnos-crud.test.ts`).
- Fila 159 de CONTENT_CHECKLIST: textos del diálogo y errores `demasiados`/`sesiones` (PROVISIONAL, como la 149).
