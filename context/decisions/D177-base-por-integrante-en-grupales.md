# D177 · Grading · La base individual también se aplica a las notas grupales, por integrante · Implemented

**Decision:** decisión de César (2026-11-03); reemplaza la provisional D014. Cada integrante recibe `notaGrupal × su base / 20` (redondeo D013), y eso es lo que suma a sus puntos. Los puntos del **equipo** siguen siendo la nota grupal sin base (HANDOFF §8). Implementado en `notaDeIntegrante` / `puntosDeAlumno` (`lib/ranking-datos.ts`).
**Why:** la base mide la conducta del alumno y debe pesar en todo lo que suma a su nota (recomendación del handoff §9 #2).
**Discarded alternative:** nota grupal igual para todos (D014).
