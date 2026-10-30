# feat/ui-preguntas — W9 (fase 03, ola 3) · PR #16 · 2026-10-30

QuestionHeader compartida + QuestionBar (§2.11); QuestionCardDetail / Answer / Review con cuerpos separados (§8; Review
recibe el puntaje como slot `ReactNode` y `titleId` para el ScorePicker); ImageViewer («Ampliar») sobre Dialog; ImageUpload
controlada con validación y compresión en cliente (`lib/image.ts`). Lógica pura en `lib/question.ts` y `lib/image.ts`,
probada. Familia «Preguntas y subida de imagen». D058–D061.

- Verificado: typecheck, lint, test (173), build; grep limpio. a11y por código.
- No verificado: compresión con archivos reales y revisión visual (QA final).
- Tokens pendientes: `--on-scrim` (chip sobre miniatura hoy `text-white` sobre `bg-grade-ink/70`), rol 15/22 (respuesta y comentario), `--scrim` del visor (D037).
- Visto de paso: con «Cambiar imagen» y un archivo inválido, la miniatura anterior deja de verse (lo decide el padre).
