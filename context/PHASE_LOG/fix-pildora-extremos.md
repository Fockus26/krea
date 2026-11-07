## Qué cambia

- `gradeColor` oscurece solo los extremos de la escala: rojo de las notas 1–3 y verde de las 17–20 (curva cuadrática de 4 puntos de luminosidad HSL más un salto de 4 puntos en la nota 1,6 y la 19,1). Del 3 al 17 la escala no cambia.
- `gradeInk` elige solo: tinta clara en 1–1,5 y 19,5–20; oscura en el resto.
- Tests: tabla de `gradeColor` actualizada; `contraste-tokens` recorre 1–20 a cada décima (≥ 4,5:1 con la tinta elegida) y comprueba que los extremos usan la clara.
- Decisiones D286 y D287. No hay otros usos de `gradeColor` con texto oscuro fijo (barra, leyenda y ranking salen solos).

## Por qué

Pedido 22: «El texto de la píldora de nota siempre es oscuro y en algunas notas no se lee: debe ser claro donde haga falta (mantener 4.5:1)». Decisión de César (ola 2): oscurecer los extremos hasta que ahí el blanco pase 4,5:1.

## Cómo probarlo

1. Como alumno o profesor, ver notas 1, 1,5, 2, 19, 19,5 y 20 (Notas, Ranking › reglas, leyenda): número blanco en los extremos, oscuro en el resto, sin salto visible.

## Capturas

Capturas: no disponibles — sin servidor por decisión de César.

## Verificación

- **Hecho:** typecheck, lint y suite completa (934 pass, 0 fail). Contraste medido: mínimo 4,64:1 en toda la escala a pasos de 0,1; nota 1 con blanco 5,04:1, nota 20 con blanco 6,11:1.
- **No verificado:** aspecto en pantalla (sin servidor); a11y por cálculo, no por axe.

## Decisiones

- **Decisión tomada:** con #111111 y #FFFFFF hay una franja de luminancia (0,183–0,200) donde ninguna tinta llega a 4,5:1 (máx. 4,34:1). Una curva solo continua deja décimas como 18,9 bajo 4,5:1, así que lleva un salto de 4 puntos de luminosidad (casi invisible) en la nota 1,6 y la 19,1. **Alternativa:** tinta oscura #000000 (curva 100 % continua), pero cambia el token `--grade-ink`; si César lo prefiere, otro PR.
- `design/HANDOFF.md` §1.3 queda desactualizado en las notas 1 y 18–20 (no se edita).

## Acciones manuales / orden de despliegue

Ninguna.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
