# D390 · Copy · «Contacto para tus alumnos»: sin texto de ayuda bajo el teléfono · Implemented

**Decisión:** se quita «Celular venezolano: abre un chat de WhatsApp.» (`AYUDA_TELEFONO`) bajo el campo «Teléfono (WhatsApp)» del Perfil del profe; sin `help`, `Field` ya no pone su id en `aria-describedby`. Quedan la etiqueta, el placeholder «Ej. 0412-1234567» y el error de validación (`TELEFONO_INVALIDO`, que sí dice qué número se espera). Pedido 15 de César, 2026-11-14.
**Why:** la etiqueta ya dice WhatsApp y el placeholder muestra el formato: la ayuda repetía lo mismo. Si el número no vale, el error lo explica.
**Alternativas descartadas:** acortarla (César pidió quitarla).
