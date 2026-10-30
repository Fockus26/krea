# D015 · Tokens · Tema y acento viven en localStorage (`krea-theme`, `krea-accent`) y se aplican con un script inline · Implemented

**Decision:** `krea-theme` = `light` | `dark` | `system` y `krea-accent` = `azul` | `rojo` | `verde` | `morado`. Un script inline en `<head>` (antes del primer pintado, en try/catch) pone `data-theme` (solo `light`/`dark`) y `data-accent` en `<html>`; `system` o sin valor = sin `data-theme` y el CSS sigue `prefers-color-scheme`. `<html>` lleva `suppressHydrationWarning`. Cuando el estudiante tenga sesión, la preferencia se sincronizará con su perfil (fase de ajustes); localStorage es la caché anti-parpadeo.
**Why:** `preventing-flash-before-hydration` de la documentación de Next 16; evita parpadeo sin leer cookies (la raíz sigue estática). Nombres con prefijo `krea-` para no chocar con otras apps en el mismo origen.
**Discarded alternative:** cookie leída en el servidor — vuelve dinámico todo el layout raíz.
