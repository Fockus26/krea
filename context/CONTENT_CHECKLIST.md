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
| 23 | Textos internos de `/componentes` (encabezado, descripciones, "Pendiente — fase 03, ola N", "Ver tokens", spinner "Cargando el ranking") — página interna noindex | `app/componentes/page.tsx`, `app/componentes/_familias/*.tsx` | frontend (W1, PR #9) | Fase 03 | Pending (placeholder) |
| 24 | Textos en inglés de los primitivos crudos de shadcn ("Close" de diálogo y hoja, otros `sr-only`): traducir al tematizar | `components/ui/dialog.tsx`, `components/ui/sheet.tsx` y demás crudos | frontend (W1, PR #9) | Fase 03 ola 2 | Done en ola 2: «Close»→«Cerrar», «Close toast»→«Cerrar aviso», «Notifications»→«Notificaciones» (#14); el resto de crudos no tenía textos visibles |
| 25 | Etiquetas de ejemplo de botones ("Entrar/Entrando…", "Copiar código KR-500-7F3A9C", "Se activa al puntuar las 5."…): solo muestras del diseño | `app/componentes/_familias/botones.tsx` | frontend (W1, PR #9) | Fase 03 | Muestra (del diseño) |
| 35 | Textos de tarjetas de ejemplo, tareas ("Identidad de marca", "Maqueta del empaque", "Presentación del equipo"), fechas y notas de ejemplo | `app/componentes/_familias/contenedores.tsx` | frontend (W5, PR #10) | Fase 03 | Pending (placeholder) |
| 36 | Avisos de ejemplo (Tarea nueva / Entrega enviada / Queda poco tiempo / No se pudo guardar) | `app/componentes/_familias/contenedores.tsx` | frontend (W5, PR #10) | Fase 03 | Pending (placeholder) |
| 37 | Estados vacíos ("Aún no hay notas", "Todavía no tienes equipo", "Ver equipos") y notas de la tabla de ejemplo (nombres y equipos = seed, reales; "Cargando notas" = literal del handoff) | `app/componentes/_familias/contenedores.tsx` | frontend (W5, PR #10) | Fase 03 | Pending (placeholder) |
| 32 | Chips de ejemplo ("Sin equipo", "Aprobada", "En revisión", "Grupal", "Premio") | `app/componentes/_familias/chips.tsx` | frontend (W4, PR #11) | Fase 03 | Pending (placeholder) |
| 33 | Etiquetas de pestañas de línea ("Aventurero", "Emoji", "Robot", "Notion" = estilos D010; "Más estilos", "Otro estilo") y textos de panel de ejemplo | `app/componentes/_familias/chips.tsx` | frontend (W4, PR #11) | Fase 03 | Pending (placeholder) |
| 34 | Opciones de segmentados ("Estudiantes/Equipos", "Claro/Oscuro/Sistema" — "Sistema" supuesto —, "Texto/Imagen", "5.º A/5.º C") y notas/bases de ejemplo (13,9 con base 15…) | `app/componentes/_familias/chips.tsx` | frontend (W4, PR #11) | Fase 03 | Pending (placeholder) |
| 38 | Nombres de estudiantes y seeds de avatar de ejemplo (Jorge Quintero, Ángel Ñáñez…) | `app/componentes/_familias/identidad.tsx` | frontend (W6, PR #12) | Fase 03 | Pending (placeholder) |
| 39 | Temas de equipo de ejemplo (incl. «Ñandú Studio», inventado para probar la tilde) | `app/componentes/_familias/identidad.tsx` | frontend (W6, PR #12) | Fase 03 | Pending (placeholder) |
| 40 | Textos accesibles: «KREA Escuela Creativa», «KREA», «N integrantes más», «Logo del equipo X», «Integrantes (N)» | `components/krea/{logo,avatar-stack,team-logo}.tsx` | frontend (W6, PR #12) | Fase 03 | Pending (placeholder) |
| 26 | Ejemplos de la familia formularios: ayudas, éxitos y errores de demo ("Nombre disponible.", "Sección asignada."…), valores de muestra y opciones del Select ("Elige tu sección", "Sección B (sin acceso)") | `app/componentes/_familias/formularios.tsx` | frontend (W2, PR #13) | Fase 03 | Pending (placeholder) |
| 27 | Placeholders "12345678" (CedulaInput) y "Tu contraseña" (demo de PasswordInput) | `components/krea/cedula-input.tsx`, `formularios.tsx` | frontend (W2, PR #13) | Fase 03 | Pending (placeholder) |
| 28 | Etiquetas "Restar 0,5" / "Sumar 0,5" del stepper (los de contraseña y cédula son del handoff) | `components/krea/number-stepper.tsx` | frontend (W2, PR #13) | Fase 03 | Pending (placeholder) |
| 29 | Textos de diálogos de ejemplo («¿Cómo se calcula tu nota?», «¿Publicar la tarea?» 5.º A vence 14/11/2026, «¿Quitar a Wendoly Ponce del equipo?») y sus cuerpos | `app/componentes/_familias/overlays.tsx` | frontend (W3, PR #14) | Fase 03 | Pending (placeholder) |
| 30 | Hoja «Cuenta» (Mi perfil, Tema y acento, Ayuda, Cerrar sesión) y menús «Mover a…» (5A-G1…G6) y «Ordenar por» | `app/componentes/_familias/overlays.tsx` | frontend (W3, PR #14) | Fase 03 | Pending (placeholder) |
| 31 | Toasts de ejemplo («Nota guardada · 18,5», «No se guardó la nota: sin conexión», «Ajuste aplicado: −2 puntos a 5A-G3 Ropa» + «Deshacer», «Ajuste deshecho») | `app/componentes/_familias/overlays.tsx` | frontend (W3, PR #14) | Fase 03 | Pending (placeholder) |
