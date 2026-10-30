# feat/sec-alumnos — W4 (fase 04, ola 3) · PR #27 · 2026-10-30

Pantalla Alumnos del profesor: filtros (sección 5A/5C con recuentos, búsqueda sin tildes por nombre, apellido o cédula
con o sin puntos, contador `<output>`), tabla §2.15 y diálogo Editar (4 campos de nombre, base 10–20 paso 0,5, motivo
solo si la base cambió, errores al enviar con foco al primer inválido). Lógica pura en `lib/alumnos.ts` (17 pruebas),
datos en `lib/demo/alumnos.ts`. D106–D109. Sin bloque en `globals.css`.

- Verificado: typecheck, lint, test (333), build; HTML generado (un `<h1>`, `<main>`, región de la tabla, «Editar a …»); grep limpio. a11y por código.
- No verificado: visual, foco real del diálogo, 4 acentos × tema (QA final). No se leyó `lib/apariencia.ts` (portales heredan tema del documento según el brief).
- Visto de paso: el seed trae base 20 para todos; `lib/perfil.ts` no expone formateador de cédula sin prefijo (`cedulaPuntos` evitaría el `replace`).
