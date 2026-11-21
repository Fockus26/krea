# feat/correo-variantes — tanda 2026-11-08 Y5

Cuatro presentaciones del correo «Restablecer contraseña» (Tarjeta = la actual, Banda de color,
Minimal, Lúdica) con el acento y el tema que el alumno guardó en el perfil. D341–D344.

- `lib/correo/paleta.ts`: `COLORES_CORREO_POR_ACENTO[tema][acento]` (hex fijos espejo de
  `app/globals.css`), `estiloCorreo(apariencia)` (sin acento → azul; `system`/sin tema → claro con
  media query `prefers-color-scheme: dark`; `dark` → colores oscuros fijos, por Gmail).
- `lib/correo/restablecer.ts`: `VARIANTES_CORREO`, `VARIANTE_CORREO = "tarjeta"` (se sigue enviando
  la actual), `correoRestablecer(datos, variante, opciones)`. Mismo copy y texto plano en las cuatro.
- `DepsRecuperacion.leerNombres` → `leerPerfil` (nombres + apariencia en una consulta, validada con
  `zApariencia`). Flujo de recuperación sin cambios.
- Galería `/correos` (solo dev y vista previa): 4 × 4 acentos × claro/oscuro en iframes.
- Pendiente de César: elegir la variante en la vista previa (`/correos`) y cambiar `VARIANTE_CORREO`.

## Filas de CONTENT_CHECKLIST (para que las añada el orquestador)

| 174 | Correo «Lúdica»: píldora «1 hora» + «para usar el enlace, una sola vez» y el rótulo «Escuela Creativa» bajo el saludo (reordenación del copy de HANDOFF §5c; el resto del copy es el mismo en las cuatro presentaciones) | `lib/correo/restablecer.ts` | tanda 11-08 Y5 | — | Provisional — confirmar con César si elige Lúdica |
| 175 | Galería `/correos`: datos de ejemplo inventados (nombre «Adela», C.I. 12345678, enlace `https://krea.test/recuperar/nueva?…oobCode=codigo-de-ejemplo`) y textos de la galería («Es la que se envía hoy.» / «No se envía: para comparar.») | `app/correos/page.tsx` | tanda 11-08 Y5 | — | Interno (solo dev/preview) |
