# D394 · Data · Metadatos `appleWebApp` en el layout raíz · Implemented

**Decisión:** `app/layout.tsx` declara `appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: "default" }` (Next los emite como `apple-mobile-web-app-capable`, `apple-mobile-web-app-title` y `apple-mobile-web-app-status-bar-style`). Así, al agregarla a inicio, iOS la abre a pantalla completa y con el nombre «KREA». El ícono sigue siendo `app/apple-icon.png` (V3 lo dueña) y el manifest no cambia.
**Why:** sin esos metadatos iOS toma el título de la página y puede abrirla como pestaña de Safari.
**Alternativa:** `statusBarStyle: "black-translucent"` pone el contenido bajo la barra de estado y exige compensar con `safe-area-inset-top` en todas las pantallas; `default` es el conservador.
