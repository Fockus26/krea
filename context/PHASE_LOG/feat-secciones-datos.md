# feat/secciones-datos (X5a, tanda 2026-11-07, ola 3)

- Catálogo `config/secciones` (D317): `SeccionId = string`, `zSeccion` regex año + letra, `zLetra`, `zNumeroAnio`, `zAnio`, `zCatalogoSecciones`; ausente = `CATALOGO_INICIAL` (5.º con A y C). `SECCIONES` queda `@deprecated`.
- Puro en `lib/secciones.ts` (códigos, slugs, `listaSecciones`, transformar catálogo, `UsoSeccion`, `usoPorSeccion`, `filasSecciones`, textos); loader `lib/datos/secciones.ts`; transacción `lib/firebase/secciones.ts`; acciones admin `lib/acciones/secciones.ts`.
- Renombrar/eliminar solo vacío (D318), comprobado de nuevo en la transacción; borra `ranking/{codigo}`.
- Pantalla `/profe/secciones` «Años y secciones», solo admin (D319), un diálogo único.
- `decisionesPremio` como registro (D320); casts transitorios en las vistas 5A/5C (D321).
- Reglas: `config/{doc}` solo lectura del profe. Seed del emulador escribe `config/secciones`.
- Copy provisional: fila 166 — la describe el informe.
- Verificado: typecheck, lint, tests puros, test:rules, a11y por código. Sin servidor, sin capturas, sin build local.
