## Qué cambia

- Zona de riesgo: estudiantes 5 últimos, **equipos solo el último** (`rankCompetition(lista, zona)`); el separador dice solo «Zona de riesgo».
- Cinta de precaución animada (rayas con `translateX`, ícono de alerta que tiembla) y **duelo «VS»** entre empatados dentro de la zona.
- Podio que celebra: destello por escalón, corona que se balancea, rebote de avatares y confeti **una vez por sesión y vista**.
- Se quita el rótulo «En vivo» (chip, prop `enVivo` de la topbar, CSS huérfano). El ranking sigue en vivo.
- «Menor de 10 suma 0» centrado con su chip.
- Clic en un alumno: el profe va a `rutaAlumnos({ alumno, seccion })`; el estudiante ve una tarjeta de solo lectura (avatar, nombre, equipo, puesto, puntos; nunca notas).

## Por qué

Pedidos de César 10, 15, 16, 17, 18, 19 y 20 de la tanda 2026-11-06.

## Cómo probarlo

1. Estudiante, `/ranking`: ver cinta, VS si hay empate en la zona, confeti al entrar (una vez por sesión), clic/Enter en un compañero abre la tarjeta; la fila propia también.
2. Estudiante, `/ranking/equipos`: solo el último equipo en riesgo.
3. Profe, `/profe/ranking`: clic en un alumno abre su ficha en Alumnos.
4. Con «reducir movimiento»: todo quieto y sin confeti.

## Capturas

Capturas: no disponibles — sin servidor por decisión de César.

## Verificación

- **Hecho:** typecheck, lint y suite completa (939 tests) en verde; tests nuevos de zona por vista, VS y confeti; revisión de a11y por código (nombre accesible en enlace/botón, diálogo con título, reduced motion, VS con contraste ≥ 6:1 en los dos temas).
- **No verificado:** render real (4 acentos × claro/oscuro, 320 px), sin servidor ni navegador.

## Decisiones

D255 (zona por vista), D256 (separador y VS), D257 (cinta y sin «En vivo»; reemplaza la parte del chip de D128), D258 (podio que celebra), D259 (clic en un alumno).
Decisión tomada / alternativa: el destello del podio usa `--surface` como brillo; alternativa, un token propio si en oscuro se ve flojo.

## Acciones manuales / orden de despliegue

Ninguna. Copy nuevo PROVISIONAL (filas 142–144): tarjeta del compañero («Puesto n», «Empate», «Sin equipo»).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
