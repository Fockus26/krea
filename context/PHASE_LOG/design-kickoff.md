# design/kickoff — Kickoff, prototipo y brief (2026-10-25)

**Hecho**
- Scaffold con `new-project.ps1 -NoVersion` (Next.js + bun + Biome + scripts del kit).
- `context/` completo, decisiones D001–D012, `CLAUDE.md` (8 KB).
- `scripts/import-excel.py` → `data/seed/{alumnos,grupos,tarea-identidad-marca}.json`
  (69 alumnos, 12 equipos, 12 evaluaciones; la hoja "Sheet1" no se importa).
- Logo vectorizado (potrace) → `public/brand/krea-logo.svg`, dos capas por variables CSS.
- Prototipo `design/prototype/` (vanilla): 22 rutas, estudiante y profesor, ranking en vivo
  entre pestañas (BroadcastChannel), constructor de tareas con suma = 20, evaluación en
  pasos de 0,5, ajustes con motivo, avatares DiceBear, 4 acentos × claro/oscuro/sistema.
- `design/BRIEF-krea.md` para Claude Design.

**Verificado**
- axe-core (wcag2a/aa/21aa) sin violaciones en 22 pantallas (estudiante oscuro/verde,
  profesor claro/rojo); sin scroll horizontal a 375 px.
- Logo comparado contra el PNG original en el navegador.
- Ranking: la simulación reordena con FLIP, anuncia el cambio por `aria-live`, marca ▲/▼.

**No verificado**
- 320 px, zoom 400 %, Safari iOS.
- Ortografía de las preguntas del Excel ("Como", "valeores"): se importan tal cual; el brief
  las muestra corregidas.

**Hallazgos**
- Excel: "Ajuste Capitán −1" en 5C-G1/G4/G6 sin significado claro (checklist #10).
