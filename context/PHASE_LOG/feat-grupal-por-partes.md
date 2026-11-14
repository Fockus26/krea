# feat/grupal-por-partes — 2026-11-14 · ola 3 · X2

Grupal por partes (pedido 2), PR #149 (CI verde), D416–D424, filas 223–230 (231 libre).
Tabla `partes` + `entregas.sin_parte` (migración `drizzle/0004_grupal_por_partes.sql`, pendiente en
krea_preview y krea ANTES del deploy). Lógica pura `lib/partes.ts`, datos `lib/data/partes.ts`,
acciones `lib/acciones/partes.ts`; el envío calcula `sinParte` y Evaluar lo premarca «No participó».
UI: `reparto-panel.tsx`, `partes-integrante.tsx`, `estado-parte.tsx`. Solo en línea, botón
«Actualizar», sin sondeo. Sin QA en navegador ni axe (QA final).
Pendientes: avisos push al capitán; imágenes de partes al eliminar un equipo quedan en B2; estados
del reparto en la galería `app/secciones/tareas`.
