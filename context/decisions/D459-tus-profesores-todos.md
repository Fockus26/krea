# D459 · UI · «Tus profesores» muestra a todos los profes de la sección, con o sin contacto · Implemented

**Decision:** `contactosDeProfes` ya no filtra por teléfono o correo: salen todos los profes de la sección del alumno (y los de `seccion` null, D323). `tarjetasProfes` marca `sinContacto` al que no tiene dato válido, lo ordena después de los que sí tienen y luego por nombre; su tarjeta dice «Sin datos de contacto» (PROVISIONAL, fila 264) y no lleva botones. La cédula sigue sin salir del servidor (D380, D388, D389). Reemplaza en parte a D380 («no sale si ninguno lo cargó»).
**Why:** César: «El estudiante no puede visualizar a los profesores». Con el filtro, un profe que no cargó contacto era invisible aunque el alumno quisiera saber quién le da clase.
**Discarded alternative:** mostrar solo a los que cargaron contacto (D380) y un aviso vacío; deja al alumno sin saber quiénes son sus profes.
