# fix/formularios-post — F-A1 (QA versión 1)

**Qué:** los 7 `<form onSubmit>` del proyecto declaran `method="post"`. Si se envían antes de
hidratar (móvil lento), el envío nativo ahora es un POST urlencoded al mismo URL: Next lo trata
como petición de página normal (`action-handler.js`: urlencoded sin `Next-Action` → `null`), la
página se vuelve a pintar y nada queda en la query. En `/recuperar/nueva` se conserva el
`oobCode` porque el action por defecto es el URL actual con su query.

**Clase barrida:** login, nueva contraseña, recuperar, cambiar contraseña (perfil), editar
alumno, ajuste de puntos y la galería de formularios. Guardia: `tests/unit/formularios-post.test.ts`
(FAIL en main, PASS en la rama).

**Decisión:** no se deshabilita el botón hasta hidratar — con POST ya no hay fuga, y un botón
deshabilitado sin JS dejaría el formulario muerto sin explicación.

**Verificado en el preview:** los dos formularios envían POST y la URL queda limpia (`oobCode` conservado). FAIL en main: repro del QA + prueba unitaria.
