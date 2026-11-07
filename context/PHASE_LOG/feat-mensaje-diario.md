## Qué cambia

- Panel: saludo con el nombre del profe de la sesión, «Buenos días, profe César» (`nombreSaludoProfe`, sin nombre queda «profe»).
- Mis notas: la leyenda de colores muestra una marca en el promedio del alumno y la etiqueta «Tú: 15,5» (también en el `aria-label` de la barra). Sin notas evaluadas, sin marca.
- Inicio del estudiante: tarjeta «Mensaje del día» según la banda del promedio y el día (Caracas).
- Nuevo `lib/mensaje-diario.ts`, `posicionEnEscala`, `promedioNotas`, `promedioDelAlumno`; la galería `/secciones` pasa datos de ejemplo.

## Por qué

Pedidos 25, 36 y 37 de César: «En la bienvenida, "profe César"», «En la leyenda de colores, que se vea dónde está el alumno», «Un mensaje diario según la nota».

## Cómo probarlo

1. Profesor: entrar al Panel y leer el saludo (usa su primer nombre).
2. Estudiante con notas evaluadas: Mis notas, marca «Tú» sobre la barra y a 320 px / zoom 200 %; estudiante sin notas, sin marca.
3. Estudiante: Inicio, «Mensaje del día»; recargar no lo cambia, al día siguiente sí.

## Capturas

Capturas: no disponibles — sin servidor por decisión de César.

## Verificación

- **Hecho:** typecheck, lint y suite completa (939 pass); tests puros de saludo, `posicionEnEscala` (1 → 0 %, 10 → `MARCA_10_PCT`, 20 → 100 %), promedio, bandas y mensaje determinista por fecha. Revisión por código de a11y: el marcador es texto + forma, no solo color; etiqueta con `whitespace-nowrap` alineada al borde cerca de 0/100 %.
- **No verificado:** render real (sin servidor/navegador), contraste calculado sobre los 4 acentos (la etiqueta usa `text-text` sobre `surface-2`, tokens ya medidos).

## Decisiones

- D272 saludo con nombre; D273 marcador «Tú» (promedio = media de notas evaluadas, redondeada a la décima; no existía uno previo, se creó); D274 mensaje del día (día leído tras `datosAlumno()`, nunca en prerender).
- Decisión tomada / alternativa: bandas 10–13,5 y 14–16,5 como pidió el brief; el hueco 13,5–14 va a la banda 14+ no, a «media» (< 14). Alternativa: bandas con corte en 13,5.

## Acciones manuales / orden de despliegue

Ninguna. Filas de checklist 150–153 (copy PROVISIONAL): 150 título «Mensaje del día» y «Tú», 151 mensajes sin notas y raspado, 152 mensajes 10–16,5, 153 mensajes 17–20.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
