# D068 · Sections · `GradeRow` única para Inicio, Mis notas y Mi equipo · Implemented

**Decision:** `components/sections/shared/grade-row.tsx` sobre `CardListItem asChild` + `Link`: título (tamaño h4, nivel semántico `headingLevel` 3 por defecto), meta con ícono User/Users + "Individual · dd/mm/aaaa", `GradePill lg` con chip Base si la base ≠ 20, chevron, y `chips` opcionales (p. ej. "En juego: {premio}"). Recibe la nota **final** ya calculada; `null` = Pendiente. La fila envuelve (`flex-wrap`, título `basis-48`) para no desbordar a 320.
**Why:** HANDOFF §8: "Debe verse idéntico entre secciones: filas de nota de Inicio, Mis notas y Mi equipo (mismo `GradeRow`)".
**Discarded alternative:** una fila por pantalla — es justo lo que §8 pide evitar.
