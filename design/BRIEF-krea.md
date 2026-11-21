# Brief de diseño — KREA

Eres un diseñador de producto senior. Vas a diseñar la app web completa (portal con dos roles)
del proyecto descrito abajo y, además, vas a entregar un documento de handoff para
desarrollo (sección 9 de este brief) que un desarrollador frontend usará para implementarlo
sin volver a consultarte. Todo el copy de la app está en español de Venezuela.

## 1. El proyecto

**Qué es:** KREA es el portal de notas de la "Escuela Creativa" de un liceo venezolano
(5.º año, secciones A y C, 69 estudiantes en 12 equipos). Reemplaza un Excel: los estudiantes
ven sus notas con el desglose de cada pregunta, su equipo y un ranking en vivo; los profesores
crean tareas-formulario, evalúan con rúbrica, ajustan puntos por conducta y gestionan equipos.
**Tipo:** dashboard/app con dos roles (estudiante y profesor).
**Audiencia:**
- Estudiantes de 15 a 17 años, casi siempre desde el teléfono (gama media-baja, datos
  limitados). Quieren saber su nota, por qué la sacaron, en qué puesto van y qué gana su equipo.
- Profesores (2–3), desde laptop. Quieren evaluar rápido, ajustar puntos y ordenar equipos.
**Acción principal:** estudiante → abrir una nota y entender pregunta por pregunta cómo se
evaluó. Profesor → evaluar una entrega en menos de un minuto.
**Idioma / mercado:** español, Venezuela (es-VE). Decimales con coma: `18,5`. Fechas `dd/mm/aaaa`.

### Reglas de negocio que el diseño debe expresar
- **Nota** de 0 a 20 (pasos de 0,5). Menos de 10 = "raspado" (reprobado).
- **Base de evaluación por alumno:** por conducta, a algunos alumnos se les evalúa sobre 15, 12,
  etc. (cualquier valor entre 10 y 20; nunca menos de 10). Nota final = puntaje sobre 20 × base / 20.
  Se muestra como un chip "Base 15" junto a la nota.
- **Color de la nota:** degradado continuo, no por rangos: 1 = rojo intenso, 10 = amarillo
  intenso, 20 = verde intenso (valores exactos en la sección 4). Siempre como **fondo** de una
  píldora con el número encima en #111111; nunca como color de texto y nunca sin el número.
- **Nota pendiente** (no entregó o no se evaluó): píldora neutra con borde punteado, texto "Pendiente".
- **Tarea = formulario:** título, tipo (individual o grupal), fecha, y preguntas con formato
  de respuesta (texto o imagen) y valor en puntos. **La suma de valores debe ser exactamente
  20** para poder publicarla (el constructor muestra un medidor "14 / 20").
- **Evaluar:** por cada pregunta el profesor elige el puntaje de 0 al valor en pasos de 0,5
  (si vale 4: 0 · 0,5 · 1 · 1,5 · 2 · 2,5 · 3 · 3,5 · 4) y puede escribir un comentario
  opcional (qué mejorar o una felicitación) que el estudiante ve debajo de su respuesta.
- **Puntos de ranking ≠ nota:** una nota ≥ 10 aporta esos mismos puntos (10 a 20); < 10
  aporta 0. Los profesores suman o restan puntos a un alumno o a un equipo, **siempre con un
  motivo** de una lista: No estuvo en clase (−2), No prestó atención (−1), Falta de respeto
  (−3), Uso del celular (−1), Participación destacada (+2), Ayudó a un compañero (+1), Trabajo
  extra (+2), Otro (con explicación escrita). Esos ajustes nunca tocan la nota.
- **Equipos:** cada uno tiene logo (lo sube el profesor), integrantes y un **capitán**, que es
  el único que puede enviar la tarea grupal; los demás la ven en solo lectura con el aviso
  "La entrega <nombre>, capitán de tu equipo".
- **Premios:** cada tarea grupal puede tener un premio (ej. "Salida al cine con todo pago",
  "Cuenta Canva Pro por 3 meses") para el equipo con mejor nota.
- **Ranking en vivo** por sección, en dos pestañas: Estudiantes y Equipos. Cuando un profesor
  cambia una nota o unos puntos, las filas cambian de puesto **con animación** en las pantallas
  de todos. Animación "chévere" para el top 10, mejor para el top 3 (podio + celebración), y
  una animación "grave" para los 5 últimos (zona de riesgo).
- **Login:** cédula (solo números, 7–9 dígitos) + contraseña asignada por los profesores.
  "Olvidé mi contraseña" envía un enlace al correo registrado.
- **Perfil:** nombres y apellidos (primer y segundo) son de solo lectura para el estudiante
  (solo el profesor los edita). Avatar con DiceBear: 4 estilos (adventurer-neutral,
  fun-emoji, bottts-neutral, notionists-neutral), 8 opciones visibles por estilo y un botón
  **dado** que genera 8 nuevas al azar.
- **Apariencia elegible por el estudiante:** uno de 4 colores de acento + claro / oscuro / sistema.

## 2. Personalidad visual

**Dirección elegida:** cálida y lúdica.
**Debe transmitir:** cercanía, energía, juego limpio (la evaluación se entiende), orgullo de equipo.
**NO debe parecerse a:** un sistema administrativo escolar gris; un videojuego infantil lleno
de mascotas; una red social ruidosa.

**Referencias:**
- Duolingo — específicamente la celebración y el feedback inmediato (ligas, rachas), sin su
  densidad de mascotas.
- Kahoot — el podio y la sensación de cambio de puestos en vivo.
- Linear — la claridad de las tablas densas para el panel del profesor.

## 3. Restricciones de marca

**Logo:** disponible (adjunto como SVG). Es la palabra "Krea" manuscrita con un trazo
continuo, el texto "Escuela Creativa" en una geométrica fina y unas gotas que salen de la
"a". Es **un solo SVG de dos capas** que se colorea por código: letras = color de acento,
gotas = color "splash" del acento (tabla de la sección 4). No redibujarlo.
**Colores obligatorios:** los 4 acentos #EE0400 (rojo), #115445 (verde), #734AD1 (morado),
#295AC3 (azul, por defecto). El usuario elige uno; todo el diseño tiene que funcionar con
los 4 en claro y en oscuro.
**Tipografía obligatoria:** ninguna — propuesta en la sección 4 (puedes mejorarla).
**Icono / isotipo:** diseñarlo derivado del logo (la "K" o la "a" con sus gotas), sección 7.
**Favicon, apple touch icon e imagen Open Graph:** diseñarlos (sección 7).
**Otro:** los equipos tienen logos propios hechos por los alumnos (cualquier estilo, a
veces fotos de baja calidad): el contenedor del logo debe verse bien con cualquier imagen y
tener un respaldo (inicial del equipo sobre un color) cuando no hay logo.

## 4. Sistema visual de partida

### Paleta — acentos (elegibles)
| Acento | Claro: `accent` (botones; texto blanco encima) | Claro: `accent-ink` (texto sobre fondo) | Oscuro: `accent` (texto #14121A encima) | `splash` (gotas del logo, decorativo) |
|---|---|---|---|---|
| Azul (default) | #295AC3 — 6.28:1 | #295AC3 — 5.75:1 sobre #F6F4FA | #7AA2F7 — 7.37:1 | #00E5F5 |
| Rojo | #EE0400 — 4.51:1 | #C80300 — 5.55:1 sobre #F6F4FA | #FF6B5E — 6.64:1 | #FFC23D |
| Verde | #115445 — 8.83:1 | #115445 — 8.09:1 | #4FC4A6 — 8.64:1 | #A0F25A |
| Morado | #734AD1 — 5.79:1 | #734AD1 — 5.30:1 | #A98BF0 — 6.75:1 | #FF8AD8 |

### Paleta — neutros y estados
| Rol | Claro | Oscuro | Uso |
|---|---|---|---|
| primary | acento elegido | tinte oscuro del acento | CTAs, links activos, tab activo |
| secondary | #FFC23D (texto #221D2B, 11.2:1) | #FFC23D | premios, chip "Capitán" |
| background | #F6F4FA | #14121A | fondo de la app |
| surface | #FFFFFF | #1E1B26 | tarjetas, paneles, tablas |
| text primary | #221D2B (15.05:1) | #F4F1F8 (16.6:1) | |
| text secondary | #5E5869 (6.26:1) | #ABA5B8 (7.78:1) | metadatos |
| success / warning / error | #157A3B / #9A5B00 / #C80300 | #5BD68A / #FFC23D / #FF6B5E | siempre con icono o texto |
| border / divider | #E6E2EE (decorativo) · borde de input #8C8697 (3.52:1) | #2E2A38 · input #8A8496 | |
| selección (fondo / texto) | #E4DCF7 / #221D2B (12.4:1) | #3B3350 / #F4F1F8 (11.0:1) | distinto del foco y de los links |
| scrollbar (thumb / track) | #7A7486 / #ECE9F2 (3.6:1) | #6E687A / #1E1B26 (3.3:1) | discreta |

### Escala de color de notas (degradado continuo, HSL)
- 1 → 10: tono 0° → 52°, saturación 100 %, luminosidad 52 % → 48 %.
- 10 → 20: tono 52° → 140°, saturación 100 % → 70 %, luminosidad 48 % → 34 %.
- Puntos de control: 1 #FF0A0A · 5 #F55E00 · 8 #F5A500 · 10 #F5D400 · 12 #BDE007 ·
  15 #57C110 · 18 #17A51C · 20 #1A9342. Texto encima: #111111 en negrita (peor caso 4.76:1).
- Igual en claro y en oscuro.

**Modo oscuro:** sí, obligatorio (más "sistema", que sigue al teléfono).

### Tipografía
- **Títulos y cifras:** Poppins — 600/700; cifras con `tabular-nums`.
- **Cuerpo:** Nunito Sans — 400/600/700.
- **Escala:** display 48/56/64 px (nota grande) · h1 26/32/38 · h2 21/24/28 · h3 18/19/21 ·
  body 16/16/17 · small 13/13/14 · eyebrow 12 px mayúsculas +0.08em (móvil / tablet / 1920+).

### Espaciado y forma
- Unidad base: 4px — todo espaciado es múltiplo.
- Radios: 10px inputs y chips / 16px tarjetas y botones / 24px modales, tarjeta de nota y podio / píldoras y avatares redondos.
- Sombras: suaves, solo para elevación real (tarjeta, popover, fila del ranking en movimiento, modal).
- Movimiento: 150 ms rápido, 250 ms normal, 600 ms cambio de puesto, 1200 ms celebración;
  curva base `cubic-bezier(.2,.8,.2,1)` y rebote `cubic-bezier(.34,1.56,.64,1)`.

## 5. Restricciones no negociables

Aplican a **todo** lo que diseñes. Un diseño que las rompe no se puede implementar.

- **Contraste WCAG 2.1 AA.** Texto normal ≥ 4.5:1, texto grande (≥24px o ≥19px negrita) ≥ 3:1,
  bordes de inputs e iconos informativos ≥ 3:1. Revisa cada par en los **4 acentos × claro y
  oscuro** y anota el ratio.
- **Ningún estado se comunica solo con color.** Raspado, pendiente, entregada, capitán, zona
  de riesgo, seleccionado: siempre color + icono, texto o forma.
- **Sin scroll horizontal a 320px.** Las tablas del profesor pueden desplazarse dentro de su
  contenedor, nunca la página.
- **Estados de foco visibles y diseñados**, no el contorno por defecto ni su ausencia.
- **Movimiento reducido:** con `prefers-reduced-motion` no hay confeti, temblores ni
  deslizamientos; los cambios de puesto se anuncian por texto ("Elsa subió al puesto 2").
- **Se implementa con Tailwind + shadcn/ui (Radix).** Usa la escala de espaciado de Tailwind.
  Puedes proponer tratamientos visuales propios: el componente se escribe a la medida.
- **El acento es una variable**: ningún componente puede depender de que el acento sea azul.
- **Breakpoints objetivo:** 360 · 768 · 1024 · 1440 · 1920.
- Animaciones solo con `transform` y `opacity` (teléfonos de gama baja).

## 6. Páginas y secciones

Navegación del estudiante: barra inferior en móvil (Inicio · Notas · Ranking · Equipo ·
Perfil) y barra lateral desde 1024 px (agrega Tareas). Navegación del profesor: Panel ·
Evaluar · Tareas · Alumnos · Equipos · Puntos · Ranking · Premios (en móvil, barra inferior
con Panel · Evaluar · Alumnos · Puntos · Ranking).

### Iniciar sesión (`/ingresar`)
| # | Sección | Propósito | Contenido | CTA |
|---|---|---|---|---|
| 1 | Tarjeta de login | Entrar en 10 segundos | Logo, "¡Hola de nuevo!", cédula, contraseña | "Entrar" · "Olvidé mi contraseña" |

### Olvidé mi contraseña (`/recuperar`) y confirmación
| # | Sección | Propósito | Contenido | CTA |
|---|---|---|---|---|
| 1 | Formulario | Pedir el enlace | Cédula | "Enviar enlace" · "Volver a entrar" |
| 2 | Confirmación | Saber qué pasó | "Revisa tu correo", correo enmascarado (y••••@gmail.com), vence en 1 hora, revisar spam, qué hacer sin acceso al correo | "Volver a entrar" |
| 3 | Nueva contraseña (desde el enlace) | Crearla | Nueva + repetir, mínimo 8 caracteres | "Guardar contraseña" |

### Inicio del estudiante (`/`)
| # | Sección | Propósito | Contenido | CTA |
|---|---|---|---|---|
| 1 | Saludo | Contexto | "¡Hola, Raquel!", sección 5A | — |
| 2 | Tarjeta de puntos | Orgullo / motivación | Puntos totales (37,5), puesto (#1 de 35) | "Ver ranking" |
| 3 | Mis notas | Ver la nota en 3 segundos | Nota individual y grupal (píldoras), chip de base si aplica | toca → detalle |
| 4 | Por entregar | No olvidar tareas | Lista: título, tipo, fecha, premio, estado | toca → entregar |
| 5 | Mi equipo | Pertenencia | Logo, nombre, integrantes, capitán | "Ver equipo" |

### Mis notas (`/notas`)
| # | Sección | Propósito | Contenido | CTA |
|---|---|---|---|---|
| 1 | Leyenda de la escala | Entender los colores | Barra 1 → 10 → 20, "menos de 10 es raspado" | — |
| 2 | Lista de notas | Ver todas | Tarea, tipo, fecha, píldora | toca → detalle |

### Detalle de nota (`/notas/[tarea]`)
| # | Sección | Propósito | Contenido | CTA |
|---|---|---|---|---|
| 1 | Resumen | La nota y su cálculo | Nota grande, puntaje 18,5 / 20, base (ej. "Base 15 → 18,5 × 15 / 20"), puntos que aporta al ranking | — |
| 2 | Preguntas (×n) | Cómo se evaluó cada una | Pregunta, puntos obtenidos / valor (ej. 3,5 / 4), barra, respuesta del alumno (texto o imagen), comentario del profesor si existe | — |

### Tareas y entrega (`/tareas`, `/tareas/[tarea]`)
| # | Sección | Propósito | Contenido | CTA |
|---|---|---|---|---|
| 1 | Encabezado | Qué piden | Título, tipo, fecha, 20 pts, premio si es grupal | — |
| 2 | Aviso de capitán | Saber quién entrega | Solo para no capitanes en tareas grupales | — |
| 3 | Preguntas | Responder | Texto (área) o imagen (subida con vista previa), valor de cada una | "Entregar tarea" |
| 4 | Entregada | Confirmación | Fecha, quién la envió | — |

### Mi equipo (`/equipo`)
| # | Sección | Propósito | Contenido | CTA |
|---|---|---|---|---|
| 1 | Cabecera | Identidad | Logo grande, nombre, tema, puesto y puntos del equipo | — |
| 2 | Integrantes | Quiénes somos | Avatares, nombres, chip "Capitán", "(tú)" | — |
| 3 | Notas y premios del equipo | Logros | Tareas grupales, píldoras, premios ganados | — |

### Ranking (`/ranking`)
| # | Sección | Propósito | Contenido | CTA |
|---|---|---|---|---|
| 1 | Encabezado | Contexto | "En vivo" con indicador, cómo se calculan los puntos | — |
| 2 | Pestañas | Cambiar de vista | Estudiantes · Equipos (y sección 5A/5C para el profesor) | — |
| 3 | Podio | Top 3 | Avatares/logos, nombres, puntos, escalones 2-1-3, corona en el 1.º | — |
| 4 | Lista 4–N | Posiciones | Puesto, avatar, nombre, puntos; top 10 destacado; fila propia resaltada ("tú"); indicador ▲2 / ▼1 al cambiar | — |
| 5 | Zona de riesgo | Los 5 últimos | Separador con icono, filas apagadas | — |

### Perfil (`/perfil`)
| # | Sección | Propósito | Contenido | CTA |
|---|---|---|---|---|
| 1 | Tarjeta de identidad | Quién soy | Avatar, nombre completo, C.I., sección, base si aplica | — |
| 2 | Tus datos | Ver datos (solo lectura) | Nombres y apellidos bloqueados + "Solo tu profe puede cambiarlos" | — |
| 3 | Avatar | Personalizar | 4 pestañas de estilo, cuadrícula de 8, botón dado "Otros 8" | elegir |
| 4 | Apariencia | Personalizar | 4 círculos de acento, Claro/Oscuro/Sistema | — |
| 5 | Seguridad | Cuenta | Cambiar contraseña, cerrar sesión | — |

### Panel del profesor (`/profe`)
| # | Sección | Propósito | Contenido | CTA |
|---|---|---|---|---|
| 1 | Métricas | Estado de un vistazo | Por evaluar, evaluados x/69, raspados | toca → lista |
| 2 | Por evaluar | Siguiente tarea | Cola de entregas | "Evaluar" |
| 3 | Últimos ajustes | Trazabilidad | Lista de ajustes con motivo | "Nuevo ajuste" |

### Evaluar entrega (`/profe/evaluar/...`)
| # | Sección | Propósito | Contenido | CTA |
|---|---|---|---|---|
| 1 | Cabecera | Quién y qué | Alumno, tarea, sección, base, fecha de entrega | — |
| 2 | Medidor fijo | Total en vivo | Puntaje x / 20 y nota resultante (píldora) | — |
| 3 | Preguntas (×n) | Evaluar | Pregunta, valor, respuesta (texto o imagen ampliable), botones de puntaje en pasos de 0,5, comentario opcional | — |
| 4 | Acción | Seguir rápido | Deshabilitado hasta puntuar todo | "Guardar nota y seguir" (pasa a la siguiente entrega) |

### Alumnos (`/profe/alumnos`)
| # | Sección | Propósito | Contenido | CTA |
|---|---|---|---|---|
| 1 | Filtros | Encontrar | Sección 5A/5C, búsqueda por nombre o cédula | — |
| 2 | Tabla | Ver y editar | Alumno, cédula, equipo, base, nota individual, puntos | "Editar" → diálogo: nombres, apellidos, base (10–20) + motivo |

### Equipos (`/profe/equipos`)
| # | Sección | Propósito | Contenido | CTA |
|---|---|---|---|---|
| 1 | Tarjetas de equipo | Organizar | Logo (subir/cambiar), nombre, puntos, selector de capitán, integrantes con "mover a…" | — |
| 2 | Sin equipo | Asignar | Alumnos sin equipo | "Asignar…" |

### Tareas del profesor y constructor (`/profe/tareas`, `/profe/tareas/nueva`)
| # | Sección | Propósito | Contenido | CTA |
|---|---|---|---|---|
| 1 | Lista | Ver tareas | Título, tipo, nº de preguntas, premio, estado (borrador/abierta/evaluada) | "Nueva tarea" |
| 2 | Datos | Configurar | Título, tipo, fecha, premio (solo grupal) | — |
| 3 | Medidor de suma (fijo) | Llegar a 20 | "14 / 20 · faltan 6", "te pasaste por 2", "suma exacta" | — |
| 4 | Preguntas (×n) | Construir | Enunciado, formato (Texto / Imagen), valor, eliminar | "Agregar pregunta" |
| 5 | Publicar | — | Deshabilitado si la suma ≠ 20 | "Publicar tarea" |

### Ajustes de puntos (`/profe/puntos`)
| # | Sección | Propósito | Contenido | CTA |
|---|---|---|---|---|
| 1 | Formulario | Ajustar | Alumno/Equipo, sección, a quién, motivo (obligatorio; propone el valor), puntos (±, pasos de 0,5), detalle (obligatorio en "Otro") | "Aplicar ajuste" |
| 2 | Historial | Trazabilidad | +/− valor, a quién, motivo, detalle, fecha | — |

### Premios (`/profe/premios`)
| # | Sección | Propósito | Contenido | CTA |
|---|---|---|---|---|
| 1 | Lista | Ver premios | Premio, tarea, estado "En juego" o "Ganó <equipo>" | — |

## 7. Estados y casos que también hay que diseñar

- [x] Estados vacíos (sin tareas pendientes, sin equipo, sin notas, búsqueda sin resultados, sin ajustes)
- [x] Estados de carga (skeleton por sección, no un spinner global)
- [x] **Pantallas de estado**, como una familia visual (cabecera mínima con logo, etiqueta,
      título con la voz de la marca, una línea sobre lo que pasó, acciones):
  - [x] **404** — con sesión: "Ir al inicio" + "Mis notas" (estudiante) / "Evaluar" (profesor) ·
        sin sesión: "Ir al inicio" + "Iniciar sesión"
  - [x] **500 con código** (visible y copiable para soporte; "Reintentar" + "Ir al inicio") y **500 sin código**
  - [x] **Sin conexión** (qué revisar, que las notas ya cargadas se siguen viendo, "Reintentar")
  - [ ] Mantenimiento — no aplica en v1
- [x] Error dentro de una pantalla (entrega rechazada, fallo de red al guardar una nota)
- [x] Formularios: reposo, foco, lleno, error con mensaje, éxito, deshabilitado, enviando
- [x] Botones: reposo, hover, foco, activo, cargando, deshabilitado
- [x] Navegación abierta en móvil
- [x] Color de selección de texto y scrollbar, en claro y oscuro
- [x] Icono derivado del logo: legible a 16 px, SVG para fondo claro y oscuro, apple touch
      icon 180×180 con fondo opaco, maskable
- [x] Plantilla de imagen Open Graph 1200×630
- [x] Con sesión vs. sin sesión (dos roles: estudiante y profesor)
- [x] **Plantilla de correo** — una sola: **Restablecer contraseña** (asunto y preheader
      incluidos). Base: cabecera con logo, título, texto, botón + el enlace como texto
      debajo, pie con por qué lo reciben y un contacto. Restricciones del medio: máximo 600 px
      y una columna; tipografía que funcione con `Arial, Helvetica, sans-serif` (Gmail y
      Outlook no cargan fuentes web); entendible con imágenes bloqueadas; el logo se lee si
      el cliente invierte a oscuro; botón HTML ≥ 44 px de alto; contraste AA.
- [x] Contenido extremo: un nombre de 40 caracteres ("Noemí Bárbara Guzmán Rojas"),
      una pregunta de 3 líneas, un equipo de 1 integrante y de 7, una tarea de 1 y de 10 preguntas,
      un ranking de 35 alumnos con empates
- [x] **Momentos del ranking:** subir de puesto (top 10), entrar al podio (celebración),
      caer a la zona de riesgo (animación "grave": tono apagado, temblor corto), empate,
      y la versión con movimiento reducido
- [x] **Selector de avatar:** dado girando, cargando 8 opciones, error de red al cargar avatares
- [x] **Acentos:** las pantallas Inicio, Detalle de nota y Ranking en los 4 acentos × claro/oscuro

## 8. Contenido

**Contenido real disponible:** los 69 estudiantes (nombres completos, cédulas, sección), los
12 equipos con capitán y tema (Barbería, Repostería, Ropa, Mascotas, Celulares, Comida Rápida,
Veterinaria, Tienda de celulares, Cafetería), la tarea "Identidad de marca" con sus 8
preguntas y los puntajes reales de 12 alumnos. Ejemplos reales para los mockups:
- Raquel Leticia Figueroa Montes · 5A · capitana de "5A-G2 Repostería" · individual 18,5 · grupal 19
- Elsa Elena Soto Ochoa · 5A · "5A-G6 Comida Rápida" · individual 18,5 · grupal 14
- Juana de los Alejandra Montero Córdoba · 5A · "5A-G4 Mascotas" · individual 8 (raspada) · grupal 15
- Preguntas de "Identidad de marca" (valor): ¿Cómo se llama la marca? (1) · ¿Por qué nació
  esta marca? (1) · ¿Qué producto o servicio vende? (3) · ¿Cuál es el cliente ideal? (3) ·
  ¿Cuál es la personalidad de la marca? (2) · ¿Qué problema resuelven? (4) · ¿Cuál es el
  elemento diferenciador? (4) · ¿Cuáles son los 3 valores principales? (2)
**Pendiente:** respuestas reales de los alumnos, logos de los equipos, premios definitivos,
nombres de los profesores.

Para lo pendiente, usa texto realista en español de Venezuela con el largo que tendrá el
contenido final — **nunca lorem ipsum**.

---

## 9. Deliverable — MANDATORY

Deliver **two things**. The second is as important as the first.

### 9.1 The design

Every page of section 6 at desktop 1440 · mobile 390, with the states of section 7.

### 9.2 `HANDOFF.md` — the handoff document for development

A self-contained Markdown document, written for a senior frontend developer who **did not
see the design with you and cannot ask you anything**. Whatever is not here, they will have
to invent — and that is where the design drifts.

Exact structure:

**1. Tokens** — a complete table of final values, with token name, value and use: colors
(light and dark, with the verified contrast ratio of each pair used, including selection
and scrollbar), type scale (size / line height / weight / tracking per role: display,
h1-h6, body, small, caption), spacing, radii, shadows, animation durations and curves,
z-index.

**2. Components** — one by one, and for each:
   - Name, and if it maps to a shadcn/ui component, which one
   - Anatomy (which parts make it up)
   - Variants and sizes
   - **Every** state: rest, hover, focus, active, disabled, loading, error
   - Concrete measurements: padding, height, gap, icon size, border width
   - Responsive behavior
   - Accessibility notes: role, expected accessible name, keyboard behavior

**3. Sections** — one by one, in section 6's order, and for each:
   - Layout structure (grid or flex, columns, gaps, max width)
   - Which components it uses
   - Vertical spacing before and after
   - **How it reorders or collapses at each breakpoint** (explicit, not "it is responsive")
   - Content: what is real text and what is a placeholder

**4. Global grid and layout** — container max width, number of columns and gutters per
breakpoint, side padding per breakpoint, vertical rhythm between sections.

**5. Assets** — a list of everything to export or obtain: images (with dimensions and
format), icons (with the set they come from), illustrations, the logo in its variants, and
the brand assets: source icon (SVG), favicon, apple touch icon 180×180, maskable icon and
the Open Graph image template 1200×630 (which text it carries and which area is safe when
cropped).

**5b. Status screens** — for each variant in section 7: layout, copy, actions, what changes
between variants (with/without session, with/without a code, with/without a time) and how
it looks on mobile.

**5c. Emails** (if section 7 asks for them) — the base template (widths, colors with hex and
ratio, text sizes, padding, the button with its measurements, the fallback font stack) and,
for each email: subject, preheader, full copy, which variable data it carries (name, link,
code, order summary), the action and how it looks at 600 px, at 360 px, without images and
with inverted colors.

**6. Motion** — what animates, with which duration and curve, and what turns off under
`prefers-reduced-motion`. At least, how each of these opens, closes or switches:
accordion/FAQ, tabs and the active nav link indicator, select/dropdown, dialog/sheet, and
the scroll of in-page anchor links (smooth, and how far below the sticky header it lands).

**7. Implementation order** — the recommended sequence to build it, from tokens to base
components to sections to pages, with the dependencies between steps marked.

**8. Decisions and traps** — the design decisions you took and why (so the developer does
not "fix" them by accident), plus what is easy to implement wrong: what must look identical
between sections, which spacing is intentional even if it looks inconsistent, what must not
become a shared component even if it looks like another one.

**9. Open questions** — what you could not decide for lack of information, with your
recommendation for each.

Format of the whole handoff: concrete values, never adjectives. "24px", not "generous
spacing". "#1E293B on #F8FAFC, ratio 14.8:1", not "dark gray on light gray".
