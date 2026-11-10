# D349 · Data · Letras de sección de la A a la F (antes A–Z) · Implementado

**Decisión:** `LETRAS` = A–F; `letrasLibres`, `letrasDeTexto`, `zLetra`, `zSeccion` y los regex de código/slug salen de las mismas constantes.
**Por qué:** pedido de César. Un solo sitio (`lib/modelo.ts`: `ANIO_MIN/MAX`, `LETRA_MIN/MAX`, `LETRAS`; `lib/secciones.ts` las reexporta) evita que regex, zod y copy se desfasen.
**Alternativa descartada:** dejar los regex literales `[1-9]`/`[A-Z]` y solo recortar las listas: validaría «9Z» aunque la pantalla no la ofrezca.
