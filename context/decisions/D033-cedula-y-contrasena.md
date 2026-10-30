# D033 · Components · Cédula: `lib/cedula.ts` pura (sanea, valida 7–9, pega) y `PasswordInput` con `autoComplete` obligatorio · Implemented

**Decision:** `sanitizeCedula` descarta todo salvo dígitos (máx. 9); `pasteCedula` sanea lo pegado ANTES del `maxlength` (si no, "V-12.345.678" se corta); `validateCedula` devuelve los dos mensajes literales del handoff (no dígito o >9 → "solo números"; <7 o vacía → "Faltan dígitos") o `null`. `CedulaInput` no valida por sí mismo: el llamador pasa el mensaje al `Field`. `PasswordInput`: ojo `Button ghost icon sm` con `aria-pressed` y etiqueta Mostrar/Ocultar; `autoComplete` obligatorio.
**Why:** D008 (login por cédula). Validar fuera del componente deja decidir cuándo mostrar el error (blur, envío).
