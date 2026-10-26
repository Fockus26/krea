# D011 · Components · Ranking en vivo por sección con animaciones top 10, top 3 y peores 5 · Pending

**Decision:** dos pestañas (Estudiantes · Equipos) por sección. Firestore `onSnapshot` actualiza; la lista reordena con FLIP (600 ms). Top 3: podio con confeti al entrar al puesto. Top 4–10: borde brillante animado. Peores 5: zona "en riesgo" con tono apagado, icono y un temblor leve al caer. El alumno ve su fila resaltada ("Tú"). Con reduced motion: sin movimiento, anuncio por texto.
**Why:** pedido de César ("animación chévere top 10, mejor top 3, grave peores 5").
