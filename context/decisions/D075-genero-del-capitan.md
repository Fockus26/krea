# D075 · Sections · "Capitán"/"Capitana" sin dato de género: prop `femenino`, por defecto "Capitán" · Pending

**Decision:** el seed no trae género y no se infiere del nombre. `capitanTexto(nombre, esTu, femenino = false)` (lib/inicio.ts) y `CaptainBadge` (D041) reciben el género por prop; las vistas previas usan el valor por defecto ("Capitán: tú" en Inicio, aunque el lienzo diga "Capitana: tú"). **Pendiente:** César decide si se añade un campo (p. ej. `femenino` en el alumno, editable por el profe) o un texto neutro ("Capitanía: tú", "Lidera: tú").
**Why:** adivinar el género por el nombre se equivoca con personas reales; el texto del lienzo es un ejemplo, no una regla.
**Discarded alternative:** inferir por el nombre — descartado; "Capitán/a" — se lee mal.
