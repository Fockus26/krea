# fix/ranking-estrecho · PR #72 · 2026-11-06

**Qué:** fila del ranking como @container; < 20rem el chip/delta va junto al subtítulo. Tarjeta de equipo: cabecera y filas de integrantes envuelven (D226).
**Repro:** `1-ranking-nombre-recortado` FAIL main (5 nombres 27 px) / PASS; /profe/equipos 200 %: 6 → 0. Anchos 320–3840 sin scroll, recortes solo bajan; axe 0.
