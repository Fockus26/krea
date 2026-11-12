# Tanda 2026-11-12 — prompts (una ola, X1–X3)

Brief común: main @ 202e579. Modo `pr` (push a tu rama, PR a main, nunca merge). Sin versionado (no
changesets). Sin dev server ni QA (memoria de César: QA al final): verifica por código + `bun run
test:related` + `bun run typecheck` + `bun run lint` + `bun run test`. No corras `bun run build`
(lo corren CI y Vercel). No hay entorno DOM de pruebas (sin happy-dom/jsdom): prueba la lógica pura.
Carpeta principal (para leer `context/` local): `C:\Users\Cesar\Documents\Work\krea`. No edites
`CURRENT_PHASE.md` ni `CONTENT_CHECKLIST.md`: deja tus filas y tu PHASE_LOG en el informe. Copy en
español (es-VE, decimales con coma). Reglas de CLAUDE.md (tokens, WCAG AA, 320 px sin scroll,
acento × claro/oscuro con pares de contraste calculados en el informe si añades color). Skill
`a11y` antes del PR. Decisión visual nueva: elige la conservadora y explica la alternativa en el PR.
Commits y PR en español. Cada decisión = un archivo en `context/decisions/` (van en git).

Las tres unidades no comparten archivos. X1: subida de imágenes. X2: evaluación grupal y nota por
integrante. X3: Perfil › Avisos. No toques los archivos de las otras.

## X1 — Subida de imágenes: aceptar fotos pesadas y guardar ≤ 1,5 MB

Rama `feat/imagenes-livianas` · D362–D363 · filas CONTENT_CHECKLIST 181–182 · `sonnet` · medium · Docker no · servicios en puertos fijos no.

César: «los alumnos están subiendo imágenes muy pesadas y esto no es práctico […] considero que no
debe superar los 2mb […] mantenerla a una resolución considerable para que al descargarla se vea de
buena calidad para evaluarla, pero no ocupe tanto espacio». Aprobó la propuesta: aceptar originales
pesados (ya se comprimen) y garantizar que lo guardado pese ≤ 1,5 MB.

Estado verificado:
- `lib/image.ts:9` `IMAGE_MAX_BYTES = 5 MB` rechaza el ORIGINAL antes de comprimir (fotos de celular
  de 4–12 MB fallan aunque comprimidas pesarían < 1 MB). `:11` `IMAGE_MAX_SIDE = 1600`, `:13`
  `IMAGE_QUALITY = 0.8`. `compressImage` en `:91` (createImageBitmap + canvas → JPEG).
- Único punto de entrada: `components/krea/image-upload.tsx:201-208` (`validateImage` → `compressImage`).
  Copy «JPG o PNG, hasta 5 MB» en `:352`.
- Servidor: `lib/almacen/imagen.ts:6` `IMAGEN_SUBIDA_MAX_BYTES = 2,5 MB` (no lo cambies; ≥ 1,5 MB).
- Cola sin conexión guarda el blob ya comprimido (`lib/offline/navegador.ts`, D295): no cambia.
- Galerías con el texto de 5 MB: `app/componentes/_familias/preguntas.tsx:234,282`,
  `app/estados/galeria-errores.tsx:22`, `components/estados/errores.tsx:50`. Actualízalas al nuevo
  máximo. NO toques el logo de equipos (`lib/equipos-profe.ts:235-256`): es otra subida.

Enfoque decidido:
- `IMAGE_MAX_BYTES` → 25 MB (original). Nueva constante `IMAGE_TARGET_BYTES = 1,5 MB` (resultado).
- `compressImage`: tras codificar a 1600 px / 0,8, si el blob > `IMAGE_TARGET_BYTES`, reintenta
  bajando calidad (p. ej. 0,7 → 0,6 → 0,5) y, si aún no cabe, baja el lado (p. ej. 1400 → 1200).
  Saca la escalera a una función pura probada (p. ej. `siguienteIntento(intento)` / lista de pasos)
  para que `bun test` cubra el orden y el tope; `compressImage` solo la recorre. Si tras el último
  paso sigue > objetivo, devuelve el último (el servidor aún acepta hasta 2,5 MB).
- Trampa: una foto de 48 MP en un teléfono modesto puede quedarse sin memoria al decodificar a
  tamaño completo. Usa `createImageBitmap(file, { imageOrientation: "from-image", resizeWidth/
  resizeHeight, resizeQuality: "high" })` cuando sepas las dimensiones (o decodifica una vez y
  reescala en canvas, como hoy) — elige y explica. Conserva la orientación EXIF y el fondo blanco
  para PNG con alfa.
- Mensaje de peso (`validateImage`) con el nuevo máximo; mismo formato es-VE.
- Pruebas: `tests/unit/image.test.ts` — límites 25 MB (justo en el límite ok, +1 B rechazado), la
  escalera de intentos, `formatFileSize` sin cambios.

## X2 — Grupal: marcar «No participó» por integrante al evaluar

Rama `feat/grupal-no-participo` · D364–D367 · filas 183–185 · `opus` · medium (nota guardada, ranking) · Docker no · servicios en puertos fijos no.

César: «Al momento de evaluar grupalmente hay casos en las que un estudiante no participó en esa
tarea grupal y por lo tanto tiene 1». Eligió: el profe marca «No participó» por integrante y ese
alumno queda con **nota 1 fija** en esa tarea (sin base). La nota del equipo y la de los demás no cambian.

Estado verificado:
- Nota por integrante: `lib/ranking-datos.ts:21-27` `notaDeIntegrante(entrega, base)` =
  `notaFinal(puntaje, base)` (D177). Puntos del alumno `:30-45` (`puntosRanking`, que da 0 a nota
  < `NOTA_APROBATORIA` 10, `lib/grades.ts:153`). Puntos del equipo `:51+` = puntaje sin base: NO cambian.
- `NOTA_MIN = 1` en `lib/grades.ts:5`: úsala, no escribas 1.
- Usos de `notaDeIntegrante` a pasar por la nueva regla: `lib/alumnos-datos.ts:243,258,290`,
  `lib/panel-datos.ts:158`, `lib/vistas-estudiante.ts:164,271`. Revisa también `lib/equipo.ts:98`
  (usa `notaFinal(puntaje, a.base)` directo para integrantes) y el detalle `/notas/<id>`
  (`detalleNota` con `autor: "tu equipo"`, D248). `grep -rn "notaFinal(\|notaDeIntegrante" lib app components`.
- Evaluación: `zEvaluacion` en `lib/modelo.ts:362-371` (jsonb `entregas.evaluacion`,
  `lib/db/schema.ts:210`). Acción `lib/acciones/evaluar.ts:25` (`zGuardarEvaluacion`), transacción
  `lib/data/evaluar.ts:24` (`evaluarEnTransaccion`, recalcula `ranking/{seccion}` en la misma
  transacción) y `:79` deshacer (D205, `evaluacionAnterior`). Formulario
  `components/sections/evaluar/review-form.tsx`, página `app/(profesor)/profe/evaluar/[entrega]/page.tsx`
  (`vistaEvaluar`). `entrega.integrantes` es la foto de quién entregó (D221).

Enfoque decidido:
- Dato: campo opcional en `zEvaluacion`, p. ej. `noParticiparon: z.array(zCedula).default([])` (o
  `.optional()`; elige el que no rompa lecturas viejas y explícalo). Va dentro de la evaluación, así
  «deshacer» y la reevaluación lo llevan solos y **no hay migración**. Solo cédulas que estén en
  `entrega.integrantes` y solo en grupales: valídalo en el servidor (rechaza el resto).
- Regla: `notaDeIntegrante(entrega, base, cedula)` → si la cédula está en `noParticiparon`,
  `NOTA_MIN`; si no, lo de hoy. Una sola función fuente; los usos la llaman con la cédula.
- UI del profe (solo grupales): en el formulario de evaluar, bloque «Integrantes» con cada nombre y
  un `Checkbox` «No participó» (Checkbox para selección en lista, D300; la librería del proyecto).
  Texto que explique: «Quien no participó queda con 1 en esta tarea; el equipo conserva su nota».
  Al reevaluar, viene marcado lo guardado. Estado no solo por color. 320 px sin scroll.
- Alumno marcado: en «Mis notas» y en su detalle ve 1 (píldora `gradeColor`, D004) y una línea
  «No participaste en esta entrega del equipo» (copy nuevo → filas 183–185). Ficha del alumno del
  profe y Panel muestran su 1.
- Pruebas: `notaDeIntegrante` (marcado / no marcado / individual ignora), `puntosDeAlumno` (marcado
  aporta 0), `puntosDeEquipoDatos` sin cambio, zod (cédula ajena rechazada, evaluación vieja sin el
  campo se lee), y `evaluarEnTransaccion` si su suite ya existe (`tests/unit/evaluar-datos.test.ts`).

## X3 — Perfil › Avisos: botón «Instalar KREA» (oculto si ya está instalada)

Rama `feat/instalar-pwa` · D368–D370 · filas 186–188 · `sonnet` · medium · Docker no · servicios en puertos fijos no.

César: «quiero facilitar la instalación del pwa, quizás por donde está lo de avisos para permitir
las notificaciones un botón para instalar la app, y si está instalada no mostrar el botón». Eligió:
solo en Perfil › Avisos (sin franja en Inicio).

Estado verificado:
- Tarjeta Avisos: `components/sections/perfil/aviso-tareas.tsx` (123 líneas; D340), montada en
  `app/(estudiante)/perfil/page.tsx:43` (`AvisoTareasConectado`). Su texto de no soportado (`:24`) ya
  explica en iPhone «Compartir › Agregar a inicio». Cliente de push: `lib/push-cliente.ts`.
- Manifest `app/manifest.ts` (`display: "standalone"`), service worker `public/sw.js` con handler
  `fetch` (`:56`): la app es instalable en Chrome/Edge Android y escritorio.
- No existe código de `beforeinstallprompt` ni de `display-mode` en el repo.

Enfoque decidido:
- Hook cliente (p. ej. `lib/instalar-pwa.ts` + hook) con estados: `instalada` (media
  `(display-mode: standalone)` o `navigator.standalone` en iOS) → no se muestra nada;
  `disponible` (llegó `beforeinstallprompt`, guarda el evento con `preventDefault`) → botón
  «Instalar KREA» que llama `prompt()` y espera `userChoice`; `ios` (Safari iPhone/iPad sin
  standalone) → en vez del botón, los pasos «Compartir › Agregar a inicio»; `no-disponible` (otro
  navegador sin evento) → nada. Escucha `appinstalled` para ocultarlo al momento. Decide por
  funciones puras probadas (p. ej. `estadoInstalacion({ standalone, iosStandalone, esIOS, hayEvento })`).
- Trampa de hidratación: todo esto es solo cliente; el primer render (servidor) no muestra el
  botón, y aparece tras montar sin saltar el layout de forma molesta.
- Ubicación: dentro de la tarjeta «Avisos», encima del interruptor (instalar ayuda a que los avisos
  funcionen en iPhone). Botón con la librería del proyecto (`components/ui/button.tsx`), variante
  secundaria, ≥ 44 px, foco visible. Una línea de descripción breve (copy → filas 186–188).
- Pruebas: la función pura de estado (las 4 combinaciones + iPad que se presenta como Mac si la
  detectas así).
