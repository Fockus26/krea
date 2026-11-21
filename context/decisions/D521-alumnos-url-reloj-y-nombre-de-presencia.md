# D521 · UI · Editar alumno: URL limpia al guardar, motivo con autoGrow, presencia con reloj y nombre corto · Implemented

**Decision:** tras guardar, `EditStudentDialog` llama `onAbierto(cedula, false)` (la URL pierde `?alumno=`); el motivo usa `autoGrow`; `usePresencia` incluye `tic` en las dependencias del `useMemo` (las entradas caducan por reloj sin esperar al sondeo); `/api/presencia` guarda `nombrePresencia(yo)` (D277: primer nombre + primer apellido) en vez de nombres + apellidos.
**Why:** cierres que dejaban la URL vieja, una entrada que no caducaba hasta el siguiente sondeo y un nombre que no seguía D277.
**Discarded alternative:** —
