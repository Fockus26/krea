# Tanda 2026-11-14 — brief y prompts de la ola 4 (Z1, Z2 — experimentales)

Brief común: main @ 445c1c4. Los dos son **experimentales** («para ver qué tal», César): alcance
mínimo que se pueda probar, nada de pulido extra. Modo `pr` (push a tu rama, PR a main, nunca merge
ni auto-merge). Sin versionado (no changesets). Sin dev server ni QA (QA al final): verifica por
código + pruebas; **a11y manual** (sin axe ni servidor). **La máquina se satura con dos workers**:
corre solo las pruebas de tus archivos (`bun test <archivo> --timeout 30000` cuando toquen
`tests/db`) y, una vez, `bun run typecheck` y `bun run lint` (en segundo plano si pasan de 2 min); la
suite entera la corre el **CI de GitHub**: tras abrir el PR, `gh pr checks <n> --watch` en segundo
plano, y arregla lo que falle hasta dejarlo verde. No corras `bun run build`. No hay entorno DOM de
pruebas: lógica pura y capa de datos sobre PGlite (como `tests/db/*`; `tests/db/base.ts` aplica las
migraciones de `drizzle/`).
Carpeta principal (para leer `context/` local): `C:\Users\Cesar\Documents\Work\krea`. No edites
`CURRENT_PHASE.md` ni `CONTENT_CHECKLIST.md`: deja tus filas y tu PHASE_LOG en el informe. Copy en
español (es-VE, decimales con coma), todo PROVISIONAL con su fila; cero contenido inventado más allá
del copy de interfaz. Reglas de CLAUDE.md (tokens, WCAG AA, 320 px sin scroll, estado nunca solo por
color, 4 acentos × claro/oscuro: usa solo tokens y componentes que ya existen, sin color nuevo).
Decisión visual nueva: la conservadora, con su alternativa en el PR. Commits y PR en español. Cada
decisión = un archivo en `context/decisions/`, solo dentro de tu rango de D. AGENTS.md: este Next
tiene cambios que rompen; lee la guía en `node_modules/next/dist/docs/` antes de usar una API de
Next que no esté ya en el archivo que tocas. Migraciones: se escriben (`drizzle-kit generate`, mira
el script de `package.json`), **no se aplican** (las aplica César en `krea_preview` y `krea` por
`ssh kit-vps`). Docker: no. Servicios en puertos fijos: no.

Windows: busca con ruta acotada o `git grep`; edita con Edit/Write (nada que deje CRLF) y lee con
Read el tramo que vas a editar. Los archivos **nuevos** dentro de tu zona son tuyos, igual que sus
pruebas en `tests/`.

**Trampas ya conocidas:**
- `tests/unit/cache-rutas.test.ts` exige un `refresh()` (o revalidación) dentro de **cada**
  `export async function` de `lib/acciones/`.
- `tokens.test.ts` prohíbe hex en `app/` y `components/`, también en comentarios.
- Estados de tarea: `borrador | abierta | evaluada`; «cerrada» = ya no está `abierta`.
- La nota final depende de la base del alumno (10–20, D006): «de 20» en esta ola significa
  **puntaje 20 de 20** (todas las preguntas al máximo), no la nota final.

**Formas compartidas y dueños de archivos (no toques los de la otra unidad):**
- Las dos añaden **una tabla nueva** a `lib/db/schema.ts`: **Z2 la pone justo después de `partes`**;
  **Z1 al final del archivo**. Cada una define sus tipos zod en su propio archivo nuevo de `lib/`:
  nadie toca `lib/modelo.ts`.
- **Migraciones:** las dos generan una `drizzle/0005_*`. Es un choque conocido y aceptado: **se
  mergea Z1 primero**; después el orquestador le pide a Z2 que mezcle `origin/main` y regenere la
  suya como `0006`. Z2: no intentes adivinar la de Z1.
- **Nadie toca** `lib/data/devolver-entrega.ts`, `lib/data/partes.ts`, `tests/db/partes.test.ts`
  (PR #150 abierto), `lib/data/tareas.ts`, `lib/data/equipos.ts`, `lib/ranking-datos.ts`,
  `lib/grades.ts`. Por eso **no hay borrado en cascada**: cada unidad tolera al leer que su fila
  apunte a una entrega o tarea que ya no existe (queda en su informe como pendiente de limpieza).
- **Z1:** `components/sections/evaluar/review-form.tsx`, `components/krea/question-card-review.tsx`
  (solo un hueco opcional nuevo), `app/(profesor)/profe/evaluar/[entrega]/page.tsx`,
  `.env.example`, `package.json` + `bun.lock`, y sus archivos nuevos.
- **Z2:** `components/sections/tareas-profe/task-submissions.tsx`,
  `app/(profesor)/profe/tareas/[id]/**`, `lib/tareas-profe-entregas.ts`,
  `app/(estudiante)/tareas/[tarea]/**`, `components/sections/tareas/*`, `lib/vistas-estudiante.ts`
  (solo lo que haga falta para el enlace), y sus archivos nuevos.

**Informe final** (lo primero: el enlace del PR y el estado del CI): decisiones tomadas con su
alternativa, filas del checklist (texto completo), PHASE_LOG, acciones manuales para César, «Tokens
que faltan», «Kit feedback».

**Orden de merge:** #150 (fix de costura) → Z1 → Z2 (tras regenerar su migración).

---

## Z1 — % orientativo de IA en un texto (pedido E1)

Rama `feat/ia-estimacion-texto` · D425–D429 · filas 231–234 · opus · medium.

**Lo que pidió César:** «% de probabilidad de IA en un texto de una entrega». Respuestas de la ronda
(2026-11-14): usar la **API de Claude** (tiene saldo en Claude Console) con **un modelo barato**
(Haiku); **no devuelve explicación, solo la estimación**: «x % de probabilidad de uso de IA»; se
pide con un **botón en Evaluar**, lo ve **solo el profe**, el resultado **se guarda** y se muestra
como **orientativo**.

**Antes de escribir código de la API: invoca la skill `claude-api`** (ids de modelo, SDK, salida
estructurada). Modelo: el Haiku vigente (`claude-haiku-5-5`), en una constante.

**Dónde:**
- Evaluar pinta cada pregunta con `QuestionCardReview` en
  `components/sections/evaluar/review-form.tsx:320` (props en
  `components/krea/question-card-review.tsx:14–31`). La página es
  `app/(profesor)/profe/evaluar/[entrega]/page.tsx` (carga la entrega en `:86`).
- Acciones del profe: patrón de `lib/acciones/devolver-entrega.ts` (`exigirSesion("profesor")`,
  zod, `baseDeDatos()`, `registrar`, `refresh()`); datos sin `server-only` en `lib/data/` para
  probarlos en PGlite (patrón `lib/data/partes.ts`).
- `.env.example:32–53` para el formato de las variables.

**Enfoque decidido:**
1. **Tabla `analisis_ia`** (al final de `lib/db/schema.ts`, migración generada): `entrega_id` +
   `pregunta_id` (PK compuesta), `porcentaje integer` (0–100), `huella text` (SHA-256 del texto
   analizado), `modelo text`, `autor_id text`, `analizado_en` (`ms`). Un análisis por respuesta: se
   sobrescribe.
2. **Lógica pura** `lib/ia-texto.ts`: mínimo de palabras para analizar (decide el número, p. ej. 40,
   y regístralo en una decisión), huella, validar/recortar el porcentaje a entero 0–100, textos de
   la UI. Un análisis cuya `huella` no coincide con el texto actual (el alumno editó, D395) está
   **desactualizado**: no se muestra como vigente y se ofrece analizar de nuevo.
3. **Cliente** `lib/ia/…` (server-only): recibe **solo el texto** (nunca nombre, cédula, tarea ni
   sección), recortado a un máximo razonable; el texto del alumno va como **dato** delimitado, con
   instrucción de sistema de ignorar cualquier instrucción dentro de él; salida estructurada con un
   único entero; `max_tokens` chico; sin explicación. La clave sale de `ANTHROPIC_API_KEY`
   (añádela vacía a `.env.example`); **nunca en el código ni en logs**. Inyectable para las pruebas
   (ninguna prueba llama a la red).
4. **Server Action** `analizarTextoIA({ entregaId, preguntaId })`: solo profesor; lee el texto de la
   respuesta **en el servidor** (nunca lo acepta del cliente); errores con copy propio: sin
   configurar, texto muy corto, no es de texto, fallo del servicio. Guarda y `refresh()`.
5. **UI**: en cada pregunta **de texto** de Evaluar, un botón «Analizar» (nombre accesible con el
   número de pregunta) y, con resultado, el porcentaje **siempre con la palabra «orientativo»** y
   una ayuda breve de que no es prueba de nada (texto, no solo color; **no** uses `gradeColor` ni
   colores de nota: un `Badge` neutro existente). Estado de carga con texto. Si
   `ANTHROPIC_API_KEY` no está, la función **no aparece** (la página se entera en el servidor: sin
   exponer la clave ni su existencia más que como booleano). Pasa el hueco a `QuestionCardReview`
   como prop opcional nueva (un `ReactNode`), sin cambiar lo demás.
6. Nunca visible para el alumno: nada de esto entra en vistas o datos de `(estudiante)`.

**Pruebas:** unitarias de `lib/ia-texto.ts` (mínimo, huella, recorte, desactualizado) y de la
construcción de la petición con un cliente falso (no viaja nada más que el texto; una respuesta
fuera de rango o no numérica es error, no un número inventado); PGlite para guardar/leer/sobrescribir.

**Límites aceptados (dilo en el PR):** un modelo de lenguaje no es un detector; en textos cortos en
español el número es una impresión. Sin borrado en cascada (ver brief).

**Acción manual para César (en el informe, en PowerShell):** crear la clave en Claude Console y
ponerla como `ANTHROPIC_API_KEY` en Vercel (Preview y Production); aplicar la migración en
`krea_preview` y `krea` por `ssh kit-vps`.

---

## Z2 — Entrega ideal de una tarea (pedido E2)

Rama `feat/entrega-ideal` · D430–D435 · filas 235–240 · opus · medium.

**Lo que pidió César:** «mostrar una “entrega ideal” de una tarea (la de 20) con notas de por qué».
Respuestas de la ronda (2026-11-14): «se podría elegir la tarea de alguno de los alumnos, el cual se
le mostrará **el avatar y el nombre, sin pedir permiso**, o en caso de no haber una tarea elegible
**nosotros presentaremos la tarea ideal como nosotros responderíamos** a cada una de las
respuestas»; **el profe elige** entre las de 20 **y escribe** las notas del porqué (una general y,
si quiere, una por pregunta); los alumnos la ven **solo con la tarea cerrada**; una ideal por tarea.

**Dónde:**
- Lista de entregas de una tarea (profe): `app/(profesor)/profe/tareas/[id]/entregas/page.tsx`
  (`:51–54`), `components/sections/tareas-profe/task-submissions.tsx` (menú «Más acciones» por
  fila, `:62`), datos en `lib/tareas-profe-entregas.ts`.
- Tarea del alumno: `app/(estudiante)/tareas/[tarea]/page.tsx` (estado `cerrada` en `:207`; el
  estado sale de `lib/vistas-estudiante.ts:1061`). Las respuestas se pintan con
  `QuestionCardDetail` (`components/krea/question-card-detail.tsx`) y las imágenes con
  `urlsFirmadas` (`lib/datos/imagenes.ts:17`) + `respuestaFirmada` (`lib/question.ts:103`).
- Avatar y nombre: como ya los pinta la app para alumnos y equipos (búscalo en
  `components/krea/`); no inventes otro.
- Acciones del profe: patrón de `lib/acciones/devolver-entrega.ts`; datos sin `server-only` en
  `lib/data/` (patrón `lib/data/partes.ts`).

**Enfoque decidido:**
1. **Tabla `ideales`** (en `lib/db/schema.ts`, justo después de `partes`; migración generada):
   `tarea_id` (PK), `entrega_id text` nullable, `respuestas jsonb` nullable, `nota text` (porqué
   general, obligatoria), `notas jsonb` (`Record<preguntaId, string>`, opcionales), `autor_id`,
   `actualizado_en` (`ms`). Exactamente una de dos formas: **de un alumno** (`entrega_id`) o
   **del profe** (`respuestas`: un texto por pregunta — también en las preguntas de formato imagen,
   sin subir archivos; anótalo como límite).
2. **Elegible** = entrega de esa tarea `evaluada` con **puntaje 20 de 20** (ver trampas del brief).
   Lógica pura en `lib/ideal.ts` (elegibilidad, validación, vigencia, textos).
3. **Profe**: en la lista de entregas, las filas elegibles suman al menú «Marcar como entrega
   ideal»; y la página muestra el estado de la ideal (ninguna / de quién / del profe) con «Editar» y
   «Quitar». El formulario (porqué general + uno opcional por pregunta, y las respuestas del profe
   si no parte de una entrega) va en una página nueva `app/(profesor)/profe/tareas/[id]/ideal/`.
   Se puede preparar con la tarea abierta; los alumnos no la ven hasta que cierre. Al marcar la de
   un alumno, el diálogo avisa que **se mostrará con su nombre y avatar a toda la sección**.
4. **Alumno**: con la tarea **no `abierta`** y una ideal vigente, la página de la tarea muestra un
   enlace «Ver la entrega ideal» (en cualquiera de sus estados cerrados, también si entregó) a una
   página nueva `app/(estudiante)/tareas/[tarea]/ideal/`: autor con avatar y nombre (alumno; en
   grupal, el equipo) o «Respuesta de tus profesores»; por pregunta, enunciado, respuesta y la nota
   del porqué; arriba el porqué general. **No** se muestran la nota, la base, el puntaje ni los
   comentarios de la evaluación del autor.
5. **Autorización en el servidor** de la página y de las URLs firmadas: sesión de estudiante cuya
   sección está en `tarea.secciones`, tarea no `abierta`, ideal vigente; si no, `notFound()`. Con la
   tarea abierta, ninguna ruta ni dato del alumno deja ver la ideal.
6. **Vigencia al leer** (sin cascada): si `entrega_id` apunta a una entrega que ya no existe o dejó
   de ser elegible (eliminada, devuelta, corregida a menos de 20), para el alumno **no hay ideal** y
   el profe ve un aviso para elegir otra. Si la tarea ya no existe, la fila queda huérfana (pendiente
   de limpieza en el informe).

**Pruebas:** unitarias de `lib/ideal.ts` (elegible, una sola forma, vigencia, quién puede verla
según estado de la tarea y sección) y PGlite para guardar/reemplazar/quitar y la lectura del alumno
(abierta → nada; cerrada → la ve; otra sección → nada; entrega ya no elegible → nada).

**Migración:** saldrá como `0005_*` y chocará con la de Z1: es lo esperado (ver brief). Deja la tuya
generada y el CI verde; el orquestador te avisará para regenerarla como `0006` tras el merge de Z1.

**Acción manual para César (en el informe):** aplicar la migración en `krea_preview` y `krea` por
`ssh kit-vps` antes del deploy.
