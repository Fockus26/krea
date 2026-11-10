# Tanda 2026-11-10 — prompts (una ola, Z1–Z2)

Brief común: main @ 082c913. Modo `pr` (push a tu rama, PR a main, nunca merge). Sin versionado (no
changesets). Sin dev server ni QA (memoria de César: QA al final): verifica por código + `bun run
test:related` + `bun run typecheck` + `bun run lint` + `bun run test`. No corras `bun run build`
(lo corren CI y Vercel). Carpeta principal (para leer `context/` local):
`C:\Users\Cesar\Documents\Work\krea`. No edites `CURRENT_PHASE.md` ni `CONTENT_CHECKLIST.md`:
deja tus filas y tu PHASE_LOG en el informe. Copy en español (es-VE). Reglas de CLAUDE.md (tokens,
WCAG AA, 320 px sin scroll, acento × claro/oscuro). Skill `a11y` antes del PR. Decisión visual
nueva: elige la conservadora y explica la alternativa en el PR. Commits y PR en español.

Las otras unidades de la tanda (las hace el orquestador): import de alumnos (`scripts/`) y el
skeleton del Panel (`components/estados/cargas.tsx`). No toques esos archivos.

## Z1 — Años y secciones: años colapsables, 1–6, A–F

Rama `feat/secciones-colapsables` · D348–D351 · filas CONTENT_CHECKLIST 176–177 · `sonnet` · medium · Docker no · servicios en puertos fijos no.

César: «Que en 5° año, donde se muestran las secciones sea un colapsable así como en faq de los
años y al expandir se muestren las secciones. En los años en lugar de 1 a 9 será 1 a 6 y las
secciones de la "a" a la "f"».

Código:
- Pantalla: `components/sections/secciones/secciones-directory.tsx` (una `Card` por año con sus
  secciones dentro) y `seccion-dialogs.tsx` (diálogos de agregar/editar año y sección).
- Patrón FAQ existente a reutilizar (mismo aspecto y comportamiento): `components/sections/ranking/ranking-how-to.tsx`
  / `ranking-rules.tsx`. Usa ese mismo mecanismo (no inventes otro primitivo). Cada año = un
  colapsable; el encabezado muestra nombre del año + resumen (n secciones) y sus acciones
  (editar/eliminar año) siguen accesibles sin que el clic del botón alterne el colapsable.
  Por defecto: cerrados. Estado abierto/cerrado no comunicado solo por color (aria-expanded + icono).
  Tras agregar una sección a un año, ese año queda abierto (el foco no se pierde: D318).
- Límites: `lib/secciones.ts:35-43` (`ANIO_MAX = 9`, `LETRAS` A–Z, `RE_CODIGO`/`RE_SLUG` `[1-9]`,
  `[A-Z]`), `lib/secciones.ts:351` (años libres), `lib/secciones.ts:362` (letras libres),
  `lib/modelo.ts:65` (`zSeccion` `^[1-9][A-Z]$`) y `lib/modelo.ts:68-69` (`zNumeroAnio` max 9).
  Pasa a años 1–6 y letras A–F. Centraliza: el regex y zod deben salir de las constantes
  (`ANIO_MAX`, `LETRAS`), no repetir números. Datos guardados: solo existen 5A y 5C (caben).
- Pruebas: busca las que fijan 9 o la Z (`grep -rn "ANIO_MAX\|LETRAS\|9[A-Z]\|\"Z\"" tests lib`)
  y actualízalas; añade casos frontera (6 ok, 7 rechazado; F ok, G rechazado).
- Copy nuevo (si hay, p. ej. texto del resumen o aviso «máximo 6.º año») → filas 176–177.

## Z2 — Nueva tarea: fecha de entrega con hora + selector de secciones

Rama `feat/tarea-hora-entrega` · D352–D356 · filas 178–180 · `opus` · high (cambia el modelo de datos) · Docker no · servicios en puertos fijos no.

César: «En las tareas la fecha de entrega también tendrá para elegir la hora, me gustaría que
mejoraras el diseño y layout en la parte de agregar tarea en donde se seleccionan las secciones».

Código:
- Constructor: `components/sections/tareas-profe/task-builder.tsx:620-650` (Field de fecha con
  `DatePicker` de `components/krea/date-picker.tsx`, y `TaskSections` en una `g2` junto a
  «Grupal o individual»). `validarTarea(tarea, hoy, fechaGuardada)` (`:186`, `:313`).
- Modelo: `lib/modelo.ts:252-253` y `:301` — `fechaEntrega: zDia.nullable()` (día civil ISO).
  `fechaEntrega` aparece en 7 archivos (`grep -rln fechaEntrega lib components app`): tabla del
  profe, vista del alumno, `delivered-tasks`, `task-delivered`, `/profe/tareas/[id]`, push.
  Esquema Drizzle en `lib/db/schema` + `lib/data/filas.ts`.
- Enfoque decidido: campo nuevo `horaEntrega` `"HH:MM"` (24 h, zod `^([01]\d|2[0-3]):[0-5]\d$`),
  nullable; `null` = fin del día (23:59), así lo existente no cambia de comportamiento. Zona:
  America/Caracas (la del liceo); el vencimiento = día + hora en esa zona. Migración Drizzle
  aditiva (columna nullable) en `drizzle/`; **no la apliques** a ninguna base: déjala escrita y
  di en el PR el comando para César. Producción no tiene tareas hoy.
- Control de hora: con los primitivos del proyecto (`components/ui/select.tsx` o `input` con
  `type="time"` estilizado con tokens): elige el más accesible a teclado y en móvil, y explícalo.
  Al lado del DatePicker en ≥ md, debajo en móvil; un solo `Field` con etiqueta «Fecha y hora de
  entrega» o dos con `fieldset`/`legend`. Validación: hoy con hora ya pasada = error (mismo
  mensaje que una fecha pasada, adaptado). Muestra la hora donde hoy se muestra la fecha de
  entrega (formato es-VE 12 h con «a. m./p. m.», p. ej. «12 nov · 3:30 p. m.»), sin hora si es `null`.
- Selector de secciones (`TaskSections`): rediséñalo para que sea claro y escaneable: grupo por
  año con su título, secciones como chips/toggles grandes (≥ 44 px) en fila que envuelve, acción
  «Todas» por año, contador «n elegidas», estado elegido no solo por color (check + borde), y
  error visible. Que tenga su propia fila de ancho completo (no apretado en `g2`). Conserva el
  contrato `onCambio(codigo, marcada)` y `disabled`. Revisa 4 acentos × claro/oscuro (D001):
  pares de contraste calculados en claro y oscuro en el informe.
- Pruebas: `validarTarea` con hora (pasada/futura/null), formato de fecha+hora, zod de la hora,
  la fila Drizzle ida y vuelta.
