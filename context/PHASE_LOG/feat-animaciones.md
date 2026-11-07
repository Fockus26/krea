# feat/animaciones (W15, tanda 2026-11-06, ola 3)

Pedidos 39–44 de César. Decisiones D278–D282. Sin checklist reservado.

- **40 · Transición entre páginas (D278):** `<ViewTransition>` de React en 6 `template.tsx` (pestañas de
  estudiante y profe; detalles de notas, tareas, tareas del profe y evaluar). Tipo por enlace de la barra con
  `tiposTransicion` (`lib/transicion.ts`): pestaña a la derecha → entra desde la derecha. No-pestaña → fundido.
  Barras con `view-transition-name` propio, quietas. Tokens `--d-pagina`, `--d-pagina-salida`, `--desliz-pagina`.
- **42/43 · Indicador deslizante (D279, reemplaza a D039):** `components/krea/indicador.tsx` en `Tabs`,
  `ToggleGroup` y `SegmentedLinks` (memoria entre páginas por `label`). `indicador={false}` en dado, avatares y acentos.
- **41 · Buscador (D280):** «Borrar la búsqueda» con opacidad+escala, `inert` sin texto, foco al campo (PROVISIONAL, sin fila).
- **39/44 · FLIP + entrada (D281):** `useFlip({ duracion: "--d-normal", entrada: true })` en tabla de alumnos,
  historial de ajustes e integrantes de equipo. Ranking sin cambios.
- Verificado por código y tests (1018 pass), typecheck y lint. Sin servidor ni navegador: falta ver en real
  la transición y el indicador (QA final).
