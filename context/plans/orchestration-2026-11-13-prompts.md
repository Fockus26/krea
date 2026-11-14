# Tanda 2026-11-13 — prompts (una ola, U1–U3)

Brief común: main @ dc9b40c. Modo `pr` (push a tu rama, PR a main, nunca merge). Sin versionado (no
changesets). Sin dev server ni QA (memoria de César: QA al final): verifica por código + `bun run
test:related` + `bun run typecheck` + `bun run lint` + `bun run test`. No corras `bun run build`
(lo corren CI y Vercel). No hay entorno DOM de pruebas (sin happy-dom/jsdom): prueba la lógica pura
(y la capa de datos sobre PGlite, como `tests/` ya hace con `lib/data/*`).
Carpeta principal (para leer `context/` local): `C:\Users\Cesar\Documents\Work\krea`. No edites
`CURRENT_PHASE.md` ni `CONTENT_CHECKLIST.md`: deja tus filas y tu PHASE_LOG en el informe. Copy en
español (es-VE, decimales con coma). Reglas de CLAUDE.md (tokens, WCAG AA, 320 px sin scroll,
acento × claro/oscuro con pares de contraste calculados en el informe si añades color). Skill
`a11y` antes del PR. Decisión visual nueva: elige la conservadora y explica la alternativa en el PR.
Commits y PR en español. Cada decisión = un archivo en `context/decisions/` (van en git).
Si te falta un token, usa el más cercano y lístalo en «Tokens que faltan» del informe.

Las tres unidades no comparten archivos. U1: Ajustes de puntos (`lib/puntos.ts`,
`lib/ajustes-datos.ts`, `components/sections/puntos/*`, Puntos del profe). U2: Perfil (ambos roles)
+ esquema `usuarios`. U3: `components/layout/side-nav.tsx`, `components/krea/rank-row.tsx` (y otros
badges con alto forzado), `components/sections/profe-panel/*`, `components/sections/premios/*`.
No toques los archivos de las otras.

## U1 — Ajustes de puntos: opciones fijas editables con su puntaje, sin «Otro»

Rama `feat/opciones-ajuste` · D375–D377 · filas CONTENT_CHECKLIST 191–193 · `opus` · medium (dato guardado + concurrencia entre profes) · Docker no · servicios en puertos fijos no.

César: «ya hay unas opciones fijas y la opción de otro te permite agregar otra opción fija. No quiero
que sea así. Quiero poder agregar y quitar las opciones fijas, actualizarlas también y asignarles a
esas opciones el puntaje que va a tener predeterminado. Entonces, en este caso, se quitaría el otro,
ya que se puede siempre crear nuevas opciones fijas.»
Decidió: **una lista común para todos los profesores; cualquier profe la crea, edita y borra.**

Estado verificado:
- Catálogo fijo en código: `lib/puntos.ts:14-55` (`MotivoId` unión literal, `MOTIVOS` 8 entradas con
  «Otro» `valor: null`, `MOTIVO_OTRO`, `motivoPorId`, `esMotivoId`, `valorPropuesto` `:57-60`,
  `chipMotivo(null)` → «± escribe» `:70-77`, `DETALLE_VACIO` `:253`, `MOTIVOS_FILTRO`).
- Validación: `lib/ajustes-datos.ts:35` `MOTIVO_IDS` → `z.enum` en `zAplicarAjuste:42`; «Otro» exige
  nota en `armarAjuste` (`:96+`) y el error `"detalle"` (`:72`). La etiqueta se guarda en el ajuste
  (`motivo: motivoPorId(...).etiqueta`, `:110`): tabla `ajustes` (`lib/db/schema.ts:222-243`) tiene
  `motivoId` y `motivo` texto → **borrar o renombrar una opción no rompe el historial**.
- Formulario: `components/sections/puntos/adjustment-form.tsx` (radios de `MOTIVOS` `:237-263`, D119),
  historial `adjustment-history.tsx:40,174` (filtro con `MOTIVOS_FILTRO`, D121). Página
  `app/(profesor)/profe/puntos/page.tsx`. Acción `lib/acciones/ajustes.ts`, datos `lib/data/ajustes.ts`.
- Demo: `lib/demo/puntos.ts:18,124`, `lib/demo/ajustes.ts:13,47` (formato `Otro: "…"`, D101 — se
  conserva para leer datos viejos: `lib/puntos.ts:317-332`).
- Comentario en `lib/modelo.ts:471` (`motivoId`: «Id del catálogo… o `anulacion` / `importado`»).
- Pruebas que vigilan: `tests/unit/puntos.test.ts:66-97,206` (lista exacta de MOTIVOS, «Otro», 9
  filtros, DETALLE_VACIO). Actualízalas.
- Patrón a copiar para guardar un catálogo: `config/secciones` → fila `config` (`schema.ts:295`, jsonb
  `datos`), `lib/data/secciones.ts` (lee con `for("update")` dentro de la transacción; fila ausente =
  `CATALOGO_INICIAL`), `lib/datos/secciones.ts` (lectura de la app), `lib/secciones.ts` (puro),
  `lib/acciones/secciones.ts`. **Sin migración**: la fila `config` con id nuevo (p. ej.
  `DOC_MOTIVOS = "motivos"` en `lib/modelo.ts`, junto a `DOC_SECCIONES`).

Enfoque decidido:
- Catálogo `{ id, etiqueta, valor }[]` en `config/motivos`; ausente = los 7 motivos actuales sin «Otro»
  (mismos ids y valores). `valor`: número ≠ 0, ±20, pasos de 0,5 (reutiliza `zAjuste.shape.valor` /
  `STEP_DEFAULT`). `etiqueta`: recortada, 1–40 caracteres, única sin distinguir mayúsculas/acentos
  (`normalizar`). Ids nuevos generados en servidor (uuid corto o slug + sufijo), nunca `anulacion` /
  `importado` / `otro`.
- Operaciones: crear, editar (etiqueta y valor), borrar. Cualquier profe (`exigirProfesor`/lo que
  usen las acciones de ajustes; **no** `exigirAdmin`). Transacción con la fila bloqueada, como
  secciones. Mínimo 1 opción (no dejar la lista vacía). Función pura `aplicarOperacionMotivos`
  probada (crear/editar/borrar, duplicado, último, valor fuera de rango).
- `MotivoId` pasa a `string`; `zAplicarAjuste.motivoId` = id que **exista en el catálogo leído en la
  misma transacción** del ajuste (si la opción se borró mientras el profe tenía el formulario abierto
  → error nuevo con toast «Esa opción ya no existe. Recarga la página.»). La etiqueta guardada sale
  del catálogo, nunca del body. El **valor** sigue siendo el que el profe deja en el stepper (la
  opción solo lo propone, D103).
- Sin «Otro»: se elimina del catálogo, de `chipMotivo` (rama `null`), `DETALLE_VACIO`, el error
  `"detalle"` y el «± escribe». El detalle queda **opcional** siempre. Los ajustes viejos con
  `motivoId: "otro"` se siguen mostrando con su etiqueta guardada.
- Filtro del historial: opciones del catálogo actual + etiquetas que aparezcan en el historial y ya
  no estén (para filtrar ajustes de opciones borradas) + «Anulación».
- UI (en Puntos, junto al fieldset de motivos): botón secundario sm «Editar opciones» → diálogo con la
  lista (etiqueta + chip de valor con signo en texto, botones Editar/Borrar con `aria-label` que
  nombra la opción) y un formulario «Nueva opción» (campo etiqueta + `NumberStepper` como el de
  Puntos). Borrar pide confirmación. Toasts con el Toaster global. Al cerrar, el formulario de ajuste
  se refresca (`router.refresh()` o estado). Usa los primitivos de shadcn del proyecto.
  Decisión visual nueva → conservadora y alternativa en el PR.
- Copy nuevo con placeholder marcado en filas 191–193.

Verificación: pruebas puras del catálogo y de `armarAjuste`; prueba PGlite de la capa de datos
(crear/editar/borrar + ajuste con id borrado → error) si `tests/` ya tiene la de secciones como
modelo. Informe: decisiones D375–D377, filas, PHASE_LOG.

## U2 — Contacto opcional del profesor (WhatsApp y correo) visible para los alumnos

Rama `feat/contacto-profesor` · D378–D380 · filas 194–196 · `opus` · medium (migración + dato
personal visible a otros) · Docker no · servicios en puertos fijos no.

César: «Vamos a agregar contacto para los profesores para que los estudiantes se puedan contactar
con ellos, es opcional y los modos de contacto serían por teléfono el cual lleva al whatsapp, y el
gmail». Decidió: **el alumno lo ve en su Perfil, en una tarjeta «Tus profesores»; el profe lo llena
en su propio Perfil.**

Estado verificado:
- `usuarios` (`lib/db/schema.ts:112-141`) no tiene teléfono ni correo de contacto. `emailRecuperacion`
  es **privado** (recuperar contraseña): no lo reutilices ni lo muestres.
- Migraciones en `drizzle/` (última `0002_tarea_hora_entrega.sql`); `bun run db:generate`. Mira cómo
  se hizo la 0002 (`git show 7a1b9c2 --stat`) y repítelo. **No la apliques a ninguna base**: César la
  aplica (acción manual en el informe, con el comando).
- Perfil del profe: `app/(profesor)/profe/perfil/page.tsx` (`ProfileDataEditable` + avatar +
  apariencia + seguridad); acción `lib/acciones/perfil.ts:195` `guardarMisDatos` (nombres/apellidos).
  Perfil del alumno: `app/(estudiante)/perfil/page.tsx` (componentes en `components/sections/perfil/`).
  Datos de la sesión: `lib/datos/profesor.ts` (`profesorActual`), `lib/datos/estudiante.ts`.
  Directorio de profes (admin): `components/sections/profesores/*`, `lib/datos/profesores.ts` — no lo
  cambies salvo que la lectura de «Tus profesores» quepa ahí; elige y explica.

Enfoque decidido:
- Columnas nullable `telefono` y `email_contacto` en `usuarios` (migración 0003, aditiva).
- Teléfono: el profe escribe el venezolano (`0412-1234567`, `0412 123 4567`, `+58 412…`); función pura
  que normaliza a E.164 sin `+` (`58412…`) y valida (operadoras móviles 0412/0414/0424/0416/0426/0422
  — verifica la lista y explícala) y otra que lo formatea para mostrar (`0412-123 45 67` o el formato
  que elijas, conservador). Enlace `https://wa.me/<digitos>`. Correo: `z.email()`, cualquier dominio
  (César dijo «gmail» como ejemplo), enlace `mailto:`. Ambos opcionales; vaciar = borrar.
- Profe: tarjeta «Contacto para tus alumnos» en su Perfil con los dos campos, ayuda «Opcional. Tus
  alumnos lo verán en su Perfil.» y Guardar (Server Action nueva o extendiendo `guardarMisDatos`;
  valida en servidor con la misma función pura).
- Alumno: tarjeta «Tus profesores» en su Perfil (después de los datos) con cada profe que cargó al
  menos un dato: avatar + nombre corto, botones/enlaces «WhatsApp» y «Correo» con `aria-label` que
  nombra al profe; enlace externo de WhatsApp con `target="_blank" rel="noopener noreferrer"` y
  aviso accesible de nueva pestaña. Sin profes con contacto → la tarjeta no se muestra. La consulta
  solo devuelve nombre, avatar, teléfono y correo de contacto (nunca cédula ni `emailRecuperacion`).
- Copy con placeholder marcado en filas 194–196.

Verificación: pruebas puras de normalizar/validar/formatear teléfono y de la selección de profes con
contacto; typecheck con el esquema nuevo. Informe: la migración y el comando para aplicarla
(`krea_preview` y `krea`), decisiones D378–D380, filas, PHASE_LOG.

## U3 — Ajustes visuales: contador de Evaluar, alturas del Panel, tarjeta de premio por definir

Rama `fix/alturas-y-contador` · D381–D383 · fila 197 (solo si hay copy nuevo) · `sonnet` · medium · Docker no · servicios en puertos fijos no.

César:
1. «En el botón evaluar donde aparecen los números por evaluar el texto no está alineado con
   align-items center, supongo que esto se debe repetir en alguna otra parte del código que muestre
   así, soluciónalo».
2. «El card por evaluar y últimos ajustes tienen la misma altura, a pesar de que por evaluar tiene
   varios estudiantes, esto solo aplicaba cuando no había estudiantes». Decidió: **con alumnos en
   «Por evaluar», cada tarjeta con su altura; la misma altura solo cuando «Por evaluar» está vacía.**
3. «Cuando el card de premios sea como el de la imagen [por definir: ícono, «Premio por definir»,
   tarea · secciones, botón «Agregar premio» pegado arriba] el botón debería de estar abajo como el
   premio que sí está definido para que de ese modo todos tengan una misma altura teniendo en cuenta
   una descripción de 2 líneas».

Estado verificado:
1. Badge del contador: `components/layout/side-nav.tsx:48` `<Badge variant="acc" className="h-5.5 px-2
   text-xs">`. La variante (`components/ui/badge.tsx:13-14`, `chip`) centra con
   `py-[calc((--spacing(7)-1lh)/2)]` calculado para 28 px; al forzar `h-5.5` (22 px) el padding sigue
   siendo el de 28 → el número queda bajo. Mismo patrón en `components/krea/rank-row.tsx:85`
   (`h-5.5 px-2 text-xs!`). Barre la clase: `grep -rn "<Badge" components app | grep "h-"` y cualquier
   chip con alto forzado distinto de 28 (la variante `tu` ya calcula su propio padding con 5.5: úsala
   de modelo). Arreglo preferido: que el padding vertical siga al alto (p. ej. `py-0 items-center` o
   el calc con el alto real) en cada uso, o una variante/tamaño `sm` en `badge.tsx` si son ≥ 2 usos
   — elige y explica. Verifica midiendo con cuentas (alto − 1lh)/2, no a ojo.
2. `components/sections/profe-panel/panel-view.tsx:103` `g-home … lg:items-stretch!` y `h-full` en
   `pending-reviews.tsx:49` y `recent-adjustments.tsx:34` (D240). `g-home` (`app/globals.css:976-984`)
   ya trae `align-items: start` en ≥ 64rem. Cambio: el estiramiento solo cuando `entregas.length === 0`
   (vacío de «Por evaluar»); con filas, altura natural. Nueva decisión que **sustituye** D240 (márcala
   «Superseded by D38x» en D240).
3. `components/sections/premios/prize-card-teacher.tsx:231-260`: botón con `self-start` al final de la
   `Card`; la tarjeta por definir no tiene fila de estado (chip + meta), así que el botón sube.
   Grilla en `prizes-board.tsx`. Cambio: la `Card` ocupa toda la celda (`h-full`, flex columna) y el
   botón va abajo (`mt-auto`) en **todos** los estados; la tarjeta por definir reserva el alto de la
   fila de estado con meta de 2 líneas (chip 28 + 2 líneas de `text-small`) para que, sola en su
   fila, mida lo mismo que una definida sin foto. Usa tokens (no px sueltos); si hace falta un alto
   que no existe, el más cercano + «Tokens que faltan». Revisa también la tarjeta del alumno si
   comparte grilla (`grep -rn "prize-card" components`), sin cambiar su diseño.

Verificación: sin DOM de pruebas → revisión de código + cuentas en el informe (alturas en px de cada
caso). typecheck/lint/test. Informe: decisiones D381–D383, PHASE_LOG.
