## Qué cambia

- Puntos: el formulario va en una columna (Motivo → Puntos → Detalle) a todo el ancho (D262).
- `Textarea` gana `autoGrow` (`field-sizing: content`, mínimo 2 líneas, `max-h-60` con scroll; fallback JS si el navegador no lo soporta). Lo usa solo el Detalle de Puntos.
- Historial: el nombre del destino es un enlace: alumno → su ficha (`rutaAlumnos({ alumno, seccion })`), equipo → `/profe/equipos/<sección>` (D261).
- Historial: las filas «Ajuste del Excel» (`motivoId: "importado"`) ya no se muestran ni cuentan en los filtros; siguen contando en los puntos (D260).

## Por qué

> 11. «En el Historial de Puntos, al tocar el alumno se va a su perfil; quitar "Ajuste del Excel".»
> 27. «En Puntos, el Detalle es un textarea que crece con el texto, y arreglar la disposición.»

## Cómo probarlo

1. Profesor → Puntos: formulario en una columna a 320, 768 y 1280 px; escribir varias líneas en Detalle y ver que crece hasta ~10 líneas y luego hace scroll.
2. Historial: tocar el nombre de un alumno lleva a Alumnos con su ficha abierta; un equipo lleva a Equipos de su sección. Con Tab, el enlace y el menú «Opciones» son dos paradas distintas.
3. Historial: no aparece «Ajuste del Excel»; los puntos del alumno/equipo en Ranking no cambian.

## Capturas

No disponibles — sin servidor por decisión de César.

## Verificación

- **Hecho:** typecheck, lint, suite completa (932 pass); tests nuevos del filtro (importado fuera), de que los puntos siguen contando y del destino del enlace. Revisión por código: label asociado al Detalle y error con `announce={false}` como antes; sin anchos fijos nuevos; el enlace usa foco visible con `outline-focus`.
- **No verificado:** render real (anchos, 200 % de zoom, 4 acentos × claro/oscuro) y el fallback JS de `autoGrow`, por no haber servidor ni DOM de pruebas.

## Decisiones

- D260: ocultar (no borrar) las filas importadas. Alternativa: borrarlas — cambiaría los puntos.
- D261: equipo → lista de equipos de su sección (no hay ruta por equipo). Alternativa: sin enlace.
- D262: una columna + `autoGrow` reutilizable. Otros textarea de texto libre parecidos (respuesta de pregunta, comentario de evaluación, editor de pregunta, Editar alumno) no se tocaron.

## Acciones manuales / orden de despliegue

Ninguna. Checklist fila 145 (reservada): sin copy nuevo; no hace falta fila.

## Checklist

- [x] Typecheck, lint, tests (suite completa) en verde; build lo corre CI
- [x] Sin changeset (el proyecto no versiona)
- [x] UI: WCAG 2.1 AA por revisión de código
- [x] Sin valores mágicos: solo tokens
- [x] Copy nuevo: ninguno
- [x] `decisions/D260–D262` creadas

🤖 Generated with [Claude Code](https://claude.com/claude-code)
