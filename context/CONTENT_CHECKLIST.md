# Content Checklist — KREA

> Todo el contenido real que hoy es placeholder. Ningún agente lo inventa como final.

| # | What is missing | Where (file/component) | Flagged by | Phase | Status |
|---|---|---|---|---|---|
| 1 | Isotipo (la "K" con gotas), favicon, apple touch icon, imagen OG | `public/brand/` | project-kickoff | Claude Design | Done en diseño: la "a" con gotas, `design/assets/brand/` (OG: plantilla en HANDOFF §5) |
| 2 | Logos de cada equipo (los sube el profesor) | Storage `equipos/<id>/logo` | project-kickoff | Fase 07 | Pending |
| 3 | Email real de cada estudiante y profesor (para restablecer contraseña) | `usuarios.email` | project-kickoff | Fase 07 | Pending |
| 4 | Contraseñas iniciales asignadas por los profesores | seed de Auth | project-kickoff | Fase 07 | Pending |
| 5 | Nombres de los profesores y qué secciones dicta cada uno | `profesores` | project-kickoff | Fase 07 | Pending |
| 6 | Nombre de los equipos de 5C que no tienen tema (G1, G2) | `data/seed/grupos.json` | import-excel | Fase 07 | Pending |
| 7 | Catálogo final de motivos de ajuste y valor sugerido de cada uno | D007 | project-kickoff | Fase 07 | Pending (propuesta en D007) |
| 8 | Premios reales por tarea grupal (cine, Canva Pro…) | `premios` | project-kickoff | Fase 07 | Pending |
| 9 | Respuestas reales de la tarea "Identidad de marca" (el Excel solo trae puntajes) | `entregas` | import-excel | Fase 07 | Pending |
| 10 | Significado de "Ajuste Capitán −1" en el Excel (5C-G1, G4, G6) | `grupos.ajusteCapitan` | import-excel | Fase 07 | Pending |
| 11 | Dominio y remitente del correo | Vercel / Firebase | project-kickoff | Fase 07 | Pending |
| 12 | Tareas de ejemplo del diseño ("Presentación de la marca", "Logo y paleta del emprendimiento", "Moodboard de la marca", "Plan de redes sociales") y sus preguntas | lienzo / `design/canvas/` | design | Fase 05 | Pending (placeholder) |
| 13 | Respuestas de ejemplo en Detalle de nota, Entrega y Evaluar (Brasa Express, repostería) | `design/canvas/` | design | Fase 05 | Pending (placeholder) |
| 14 | Correo de contacto del liceo para el pie del correo y remitente | HANDOFF §5c | design | Fase 07 | Pending |
| 15 | Copy del pie de créditos de avatares DiceBear (CC BY 4.0) | Perfil | design | Fase 05 | Pending (propuesta en HANDOFF §9 #12) |
| 16 | Copy provisional de la portada `app/page.tsx` ("KREA", "Portal de notas de la Escuela Creativa", "Ver tokens") y de `/tokens` | `app/page.tsx`, `app/tokens/` | frontend (W1, PR #6) | Fase 05 | Pending (placeholder) |
| 17 | Alto de línea 20 px de botón lg y píldoras sm/lg tomado de `krea.css` (no está en HANDOFF §1.4); `alert-*` en oscuro sin medir | `app/globals.css` | frontend (W1, PR #6) | Fase 09 | Pending (confirmar con diseño) |
| 19 | Texto del skip link "Saltar al contenido" | `app/layout.tsx` | frontend (W1, PR #7) | Fase 09 | Pending (placeholder) |
| 20 | `aria-label="Principal"` de los `<nav>` del `AppShell` | `components/layout/AppShell.tsx` | frontend (W1, PR #7) | Fase 04 | Pending (placeholder) |
| 21 | Dominio final del portal (`NEXT_PUBLIC_SITE_URL` en Vercel) | `lib/site.ts` | frontend (W2, PR #8) | Fase 07 | Pending (acción de César) |
| 22 | Descripción de `metadata` "Portal de la Escuela Creativa · 5.º año" | `app/layout.tsx` | frontend (W2, PR #8) | Fase 09 | Pending (placeholder) |
