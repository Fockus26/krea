// Lógica y textos de Tareas del profesor y del constructor (fase 04, D114–D117). Funciones puras,
// sin React ni reloj: "hoy" llega por argumento (con `cacheComponents` el servidor no lee
// `Date.now()`). El constructor es un reducer: añadir / eliminar / restaurar preguntas y editar
// campos; la validación y la suma salen de aquí para poder probarlas sin DOM.
import {
  comparaFecha,
  diasEntre,
  FECHA_ENTREGA_MAX_DIAS,
  formatFecha,
} from "@/lib/fecha";
import { NOTA_MAX } from "@/lib/grades";
import { percent, sumMeterInfo } from "@/lib/meters";

/* ---------- Rutas de la fase 05 (brief de la ola 4) ---------- */

export const RUTA_TAREAS = "/profe/tareas";
export const RUTA_NUEVA_TAREA = "/profe/tareas/nueva";
export const RUTA_EVALUAR = "/profe/evaluar";
/** "Ver notas" de una evaluada: el handoff no le da ruta propia; las notas viven en Alumnos (D115). */
export const RUTA_VER_NOTAS = "/profe/alumnos";
export const rutaTarea = (id: string) => `${RUTA_TAREAS}/${id}`;

/* ---------- Lista ---------- */

export type EstadoTareaProfe = "borrador" | "abierta" | "evaluada";
export type TipoTareaProfe = "individual" | "grupal";
export type FiltroEstado = "todas" | EstadoTareaProfe;

/** Avance de una tarea publicada: entregas recibidas o entregas evaluadas. */
export type AvanceTarea =
  | { tipo: "entregas"; hechas: number; total: number }
  | { tipo: "evaluadas"; hechas: number; total: number };

export type TareaProfe = {
  id: string;
  titulo: string;
  tipo: TipoTareaProfe;
  estado: EstadoTareaProfe;
  /** Día civil ISO de entrega; `null` = sin fecha (borrador). */
  fecha: string | null;
  /** Solo grupales; `null` = premio por definir. */
  premio: string | null;
  preguntas: number;
  /** Suma de los valores de las preguntas (tiene que dar 20 para publicar, D004). */
  suma: number;
  avance: AvanceTarea | null;
  /** Entregas en la cola "Por evaluar" de esta tarea. */
  porEvaluar: number;
  /** Lo que se pierde al eliminarla; ausente en la vista previa (no lo sabe). */
  perdida?: PerdidaEliminar;
};

/** Opciones del segmentado de estado, en el orden del lienzo. */
export const FILTROS_ESTADO: ReadonlyArray<readonly [FiltroEstado, string]> = [
  ["todas", "Todas"],
  ["borrador", "Borradores"],
  ["abierta", "Abiertas"],
  ["evaluada", "Evaluadas"],
];

export function esFiltroEstado(valor: string): valor is FiltroEstado {
  return FILTROS_ESTADO.some(([k]) => k === valor);
}

export function filtrarTareas(
  tareas: readonly TareaProfe[],
  filtro: FiltroEstado,
): TareaProfe[] {
  return filtro === "todas"
    ? [...tareas]
    : tareas.filter((t) => t.estado === filtro);
}

/** Frase estable de la región viva del filtro (D099): sin cifras sueltas. PROVISIONAL (fila 89). */
export function filtroFrase(filtro: FiltroEstado): string {
  switch (filtro) {
    case "todas":
      return "Mostrando todas las tareas";
    case "borrador":
      return "Mostrando los borradores";
    case "abierta":
      return "Mostrando las tareas abiertas";
    case "evaluada":
      return "Mostrando las tareas evaluadas";
  }
}

/** Vacío de un filtro sin tareas. PROVISIONAL (fila 89): Vacios.dc.html no lo define. */
export function filtroVacio(filtro: FiltroEstado): string {
  switch (filtro) {
    case "todas":
      return "Todavía no hay tareas";
    case "borrador":
      return "No hay borradores";
    case "abierta":
      return "No hay tareas abiertas";
    case "evaluada":
      return "No hay tareas evaluadas";
  }
}

const ORDEN_ESTADO: Record<EstadoTareaProfe, number> = {
  abierta: 0,
  evaluada: 1,
  borrador: 2,
};

/**
 * Orden del lienzo: abiertas (la que vence antes primero), evaluadas (la más reciente primero) y
 * borradores al final.
 */
export function ordenarTareas(tareas: readonly TareaProfe[]): TareaProfe[] {
  return [...tareas].sort((a, b) => {
    const e = ORDEN_ESTADO[a.estado] - ORDEN_ESTADO[b.estado];
    if (e !== 0) return e;
    if (!a.fecha || !b.fecha) return a.fecha ? -1 : b.fecha ? 1 : 0;
    return a.estado === "evaluada"
      ? comparaFecha(b.fecha, a.fecha)
      : comparaFecha(a.fecha, b.fecha);
  });
}

/** Eyebrow de la lista: "5 tareas · 5A y 5C". */
export function eyebrowTareas(n: number, secciones: string): string {
  return `${n} ${n === 1 ? "tarea" : "tareas"} · ${secciones}`;
}

export function preguntasTexto(n: number): string {
  return `${n} ${n === 1 ? "pregunta" : "preguntas"}`;
}

/** "12 de 69 evaluadas" · "3 de 12 equipos entregaron" · "12 de 12 equipos evaluados". */
export function avanceTexto(avance: AvanceTarea, tipo: TipoTareaProfe): string {
  const base = `${avance.hechas} de ${avance.total}`;
  if (avance.tipo === "entregas") {
    return tipo === "grupal"
      ? `${base} equipos entregaron`
      : `${base} entregaron`;
  }
  return tipo === "grupal" ? `${base} equipos evaluados` : `${base} evaluadas`;
}

/**
 * Meta de la tarjeta: "8 preguntas · vence 30/10/2026 · 12 de 69 evaluadas". Las evaluadas no
 * llevan fecha (lienzo); un borrador sin fecha dice "sin fecha" y, si es grupal sin premio,
 * "premio por definir". Una abierta cuya fecha ya pasó dice "venció" (PROVISIONAL, fila 89).
 */
export function metaTarea(t: TareaProfe, hoy: string): string {
  const partes = [preguntasTexto(t.preguntas)];
  if (t.estado !== "evaluada") {
    if (t.fecha === null) partes.push("sin fecha");
    else
      partes.push(
        `${comparaFecha(t.fecha, hoy) < 0 ? "venció" : "vence"} ${formatFecha(t.fecha)}`,
      );
  }
  if (t.avance && t.estado !== "borrador") {
    partes.push(avanceTexto(t.avance, t.tipo));
  }
  if (t.estado === "borrador" && t.tipo === "grupal" && t.premio === null) {
    partes.push("premio por definir");
  }
  return partes.join(" · ");
}

/** Barra de evaluadas (máx. 320): solo en abiertas con avance de evaluación (lienzo). */
export function barraEvaluadas(t: TareaProfe): number | null {
  if (t.estado !== "abierta" || t.avance?.tipo !== "evaluadas") return null;
  return percent(t.avance.hechas, t.avance.total);
}

/** Chip warn del borrador: "Suma 14 / 20"; `null` si ya suma 20. */
export function sumaChip(t: TareaProfe): string | null {
  if (t.estado !== "borrador") return null;
  const info = sumMeterInfo(t.suma);
  return info.state === "exact" ? null : `Suma ${info.display}`;
}

export function evaluarTexto(n: number): string {
  return `Evaluar ${n}`;
}

/** Nombre accesible de "Evaluar n": incluye la tarea. */
export function evaluarLabel(n: number, titulo: string): string {
  return `Evaluar ${n} ${n === 1 ? "entrega" : "entregas"} de ${titulo}`;
}

/* ---------- Constructor ---------- */

export type SeccionTarea = "5A" | "5C" | "5A y 5C";
export const SECCIONES_TAREA: readonly SeccionTarea[] = ["5A", "5C", "5A y 5C"];

export function esSeccionTarea(valor: string): valor is SeccionTarea {
  return (SECCIONES_TAREA as readonly string[]).includes(valor);
}

export type FormatoPregunta = "texto" | "imagen";

/** Límites de §3: de 1 a 20 preguntas; valor 0,5–20 en pasos de 0,5 (D004). */
export const MIN_PREGUNTAS = 1;
export const MAX_PREGUNTAS = 20;
export const VALOR_MIN = 0.5;
export const VALOR_MAX = NOTA_MAX;
export const VALOR_PASO = 0.5;

export type PreguntaBorrador = {
  id: string;
  enunciado: string;
  formato: FormatoPregunta;
  /** `null` = sin valor todavía (D103): cuenta 0 en la suma. */
  valor: number | null;
};

export type TareaBorrador = {
  titulo: string;
  tipo: TipoTareaProfe;
  /** Lo escrito en el campo, "dd/mm/aaaa" (puede estar a medias). */
  fecha: string;
  seccion: SeccionTarea;
  /**
   * Se conserva al pasar a Individual (el campo solo se oculta, D116): si el profe vuelve a
   * Grupal lo encuentra igual. Al guardar o publicar una individual no se envía (`tareaAGuardar`).
   */
  premio: string;
  preguntas: readonly PreguntaBorrador[];
  /** Contador para los ids de las preguntas nuevas ("q11", "q12"…). */
  siguiente: number;
};

export type DatosBorrador = Partial<
  Omit<TareaBorrador, "preguntas" | "siguiente">
> & {
  /** Las guardadas traen su id (las respuestas de los alumnos van por id, D200). */
  preguntas?: ReadonlyArray<
    Omit<PreguntaBorrador, "id"> & { id?: string | undefined }
  >;
};

export function preguntaVacia(id: string): PreguntaBorrador {
  return { id, enunciado: "", formato: "texto", valor: null };
}

/** Siguiente número libre para "q{n}": no repite el id de una pregunta guardada. */
function siguienteLibre(preguntas: ReadonlyArray<{ id: string }>): number {
  const usados = preguntas.map((p) => Number(/^q(\d+)$/.exec(p.id)?.[1] ?? 0));
  return Math.max(preguntas.length, ...usados) + 1;
}

/** Estado inicial: una tarea nueva (1 pregunta vacía) o un borrador guardado. */
export function crearBorrador(datos: DatosBorrador = {}): TareaBorrador {
  const preguntas = (
    datos.preguntas && datos.preguntas.length > 0
      ? datos.preguntas
      : [{ enunciado: "", formato: "texto" as const, valor: null }]
  ).map(({ id, ...p }, i) => ({ ...p, id: id ?? `q${i + 1}` }));
  return {
    titulo: datos.titulo ?? "",
    tipo: datos.tipo ?? "individual",
    fecha: datos.fecha ?? "",
    seccion: datos.seccion ?? "5A y 5C",
    premio: datos.premio ?? "",
    preguntas,
    siguiente: siguienteLibre(preguntas),
  };
}

export type AccionBorrador =
  | { tipo: "titulo" | "fecha" | "premio"; valor: string }
  | { tipo: "tipo"; valor: TipoTareaProfe }
  | { tipo: "seccion"; valor: SeccionTarea }
  | { tipo: "agregar" }
  | { tipo: "eliminar"; id: string }
  | { tipo: "restaurar"; pregunta: PreguntaBorrador; indice: number }
  | {
      tipo: "editar";
      id: string;
      cambios: Partial<Omit<PreguntaBorrador, "id">>;
    };

export function borradorReducer(
  estado: TareaBorrador,
  accion: AccionBorrador,
): TareaBorrador {
  switch (accion.tipo) {
    case "titulo":
      return { ...estado, titulo: accion.valor };
    case "fecha":
      return { ...estado, fecha: mascaraFecha(accion.valor) };
    case "premio":
      return { ...estado, premio: accion.valor };
    case "tipo":
      return { ...estado, tipo: accion.valor };
    case "seccion":
      return { ...estado, seccion: accion.valor };
    case "agregar": {
      if (estado.preguntas.length >= MAX_PREGUNTAS) return estado;
      // Un id restaurado con «Deshacer» puede coincidir con el contador: se salta
      const n = Math.max(estado.siguiente, siguienteLibre(estado.preguntas));
      return {
        ...estado,
        preguntas: [...estado.preguntas, preguntaVacia(`q${n}`)],
        siguiente: n + 1,
      };
    }
    case "eliminar": {
      if (estado.preguntas.length <= MIN_PREGUNTAS) return estado;
      const preguntas = estado.preguntas.filter((p) => p.id !== accion.id);
      return preguntas.length === estado.preguntas.length
        ? estado
        : { ...estado, preguntas };
    }
    case "restaurar": {
      const { pregunta } = accion;
      if (
        estado.preguntas.length >= MAX_PREGUNTAS ||
        estado.preguntas.some((p) => p.id === pregunta.id)
      ) {
        return estado;
      }
      const i = Math.max(0, Math.min(accion.indice, estado.preguntas.length));
      return {
        ...estado,
        preguntas: [
          ...estado.preguntas.slice(0, i),
          pregunta,
          ...estado.preguntas.slice(i),
        ],
      };
    }
    case "editar":
      return {
        ...estado,
        preguntas: estado.preguntas.map((p) =>
          p.id === accion.id ? { ...p, ...accion.cambios } : p,
        ),
      };
  }
}

/** Suma de los valores, redondeada a medios; las preguntas sin valor cuentan 0. */
export function sumaValores(
  preguntas: ReadonlyArray<Pick<PreguntaBorrador, "valor">>,
): number {
  const total = preguntas.reduce((s, p) => s + (p.valor ?? 0), 0);
  return Math.round(total * 2) / 2;
}

/** Máscara del campo de fecha: solo dígitos, "/" tras el día y el mes, 8 dígitos como mucho. */
export function mascaraFecha(texto: string): string {
  const d = texto.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/** "14/11/2026" → "2026-11-14"; `null` si no está completa o el día no existe. */
export function fechaIso(texto: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto.trim());
  if (!m) return null;
  const [, d, mes, a] = m;
  const iso = `${a}-${mes}-${d}`;
  try {
    formatFecha(iso); // valida que el día exista
    return iso;
  } catch {
    return null;
  }
}

/** "2026-11-14" → "14/11/2026" para el campo; `null` → vacío. */
export function fechaCampo(iso: string | null): string {
  return iso ? formatFecha(iso) : "";
}

/* Mensajes de error. PROVISIONAL (fila 90): el handoff no los define. */
export const ERRORES = {
  titulo: "Escribe el título de la tarea.",
  fecha: "Escribe la fecha como dd/mm/aaaa.",
  fechaPasada: "La fecha de entrega ya pasó.",
  fechaLejana: "La fecha de entrega puede ser como mucho dentro de un año.",
  enunciado: "Escribe el enunciado de la pregunta.",
  valor: "Ponle un valor a la pregunta.",
} as const;

export type ErroresPregunta = { enunciado?: string; valor?: string };
export type ErroresTarea = {
  titulo?: string;
  fecha?: string;
  /** Por id de pregunta; solo las que tienen algún error. */
  preguntas: Record<string, ErroresPregunta>;
  /** Motivo de la suma (≠ 20); el botón Publicar va deshabilitado por él. */
  suma?: string;
};

/** "La suma tiene que ser 20: faltan 6" · "…: te pasaste por 2"; `null` si suma exactamente 20. */
export function motivoSuma(suma: number): string | null {
  const info = sumMeterInfo(suma);
  if (info.state === "exact") return null;
  const msg = info.message.charAt(0).toLowerCase() + info.message.slice(1);
  return `La suma tiene que ser ${NOTA_MAX}: ${msg}`;
}

/**
 * Errores por campo para publicar: título, fecha válida y no pasada, ≥ 1 pregunta, enunciados
 * no vacíos, valores puestos y suma exactamente 20 (D004). `fechaGuardada`: la de una tarea ya
 * publicada, que se puede conservar aunque haya pasado (D200).
 */
export function validarTarea(
  t: TareaBorrador,
  hoy: string,
  fechaGuardada: string | null = null,
): ErroresTarea {
  const errores: ErroresTarea = { preguntas: {} };
  if (!t.titulo.trim()) errores.titulo = ERRORES.titulo;
  const iso = fechaIso(t.fecha);
  if (!iso) errores.fecha = ERRORES.fecha;
  else if (comparaFecha(iso, hoy) < 0 && iso !== fechaGuardada)
    errores.fecha = ERRORES.fechaPasada;
  else if (
    diasEntre(hoy, iso) > FECHA_ENTREGA_MAX_DIAS &&
    iso !== fechaGuardada
  )
    errores.fecha = ERRORES.fechaLejana;
  for (const p of t.preguntas) {
    const e: ErroresPregunta = {};
    if (!p.enunciado.trim()) e.enunciado = ERRORES.enunciado;
    if (p.valor === null) e.valor = ERRORES.valor;
    if (e.enunciado || e.valor) errores.preguntas[p.id] = e;
  }
  const suma = motivoSuma(sumaValores(t.preguntas));
  if (suma) errores.suma = suma;
  return errores;
}

export function tieneErrores(e: ErroresTarea): boolean {
  return Boolean(
    e.titulo || e.fecha || e.suma || Object.keys(e.preguntas).length > 0,
  );
}

/** Para guardar un borrador basta el título (D199). */
export function validarBorrador(t: TareaBorrador): ErroresTarea {
  return t.titulo.trim()
    ? { preguntas: {} }
    : { preguntas: {}, titulo: ERRORES.titulo };
}

export function puedePublicar(t: TareaBorrador, hoy: string): boolean {
  return (
    t.preguntas.length >= MIN_PREGUNTAS && !tieneErrores(validarTarea(t, hoy))
  );
}

/** Lo que se guarda (`guardarTarea`, D199): fecha ISO o `null`, y el premio solo si es grupal. */
export function tareaAGuardar(t: TareaBorrador) {
  const premio = t.premio.trim();
  return {
    titulo: t.titulo.trim(),
    tipo: t.tipo,
    fecha: fechaIso(t.fecha),
    seccion: t.seccion,
    premio: t.tipo === "grupal" && premio ? premio : null,
    preguntas: t.preguntas.map(({ id, enunciado, formato, valor }) => ({
      id,
      enunciado: enunciado.trim(),
      formato,
      valor,
    })),
  };
}

/** "Preguntas · 4". */
export function preguntasTitulo(n: number): string {
  return `Preguntas · ${n}`;
}

/** Ayuda de "Agregar pregunta" al llegar al tope. PROVISIONAL (fila 90). */
export const MAX_PREGUNTAS_TEXTO = `Llegaste al máximo de ${MAX_PREGUNTAS} preguntas.`;

/* Toasts. "Pregunta eliminada" + "Deshacer" son del handoff (§3); los otros, PROVISIONAL (fila 90). */
export const TOAST_ELIMINADA = "Pregunta eliminada";
export const TOAST_PUBLICADA = "Tarea publicada";
export const TOAST_BORRADOR = "Borrador guardado";

/* ---------- Guardar en Firestore (fase 07 W6, D199–D202) ---------- */

/**
 * Qué deja tocar el constructor: todo en un borrador; en una publicada sin entregas, todo menos
 * volver a borrador; con entregas, solo título, fecha y premio; cerrada, nada (D200).
 */
export type ModoConstructor =
  | "borrador"
  | "publicada"
  | "con-entregas"
  | "cerrada";

export type AccionTarea = "borrador" | "publicar" | "guardar";

export type ErrorTarea =
  | "no-existe"
  | "cerrada"
  | "invalida"
  | "fecha-pasada"
  | "fecha-lejana"
  | "sin-empate"
  | "red";

/** Copy de los errores. PLACEHOLDER de copy (CONTENT_CHECKLIST fila 131). */
export function mensajeErrorTarea(error: ErrorTarea): string {
  switch (error) {
    case "no-existe":
      return "Esta tarea ya no existe.";
    case "cerrada":
      return "Esta tarea ya está cerrada: no se puede cambiar.";
    case "invalida":
      return "Revisa los datos de la tarea: hay algo que no se pudo guardar.";
    case "fecha-pasada":
      return ERRORES.fechaPasada;
    case "fecha-lejana":
      return ERRORES.fechaLejana;
    case "sin-empate":
      return "Ya no hay empate en esta sección: recarga la página.";
    case "red":
      return "No se pudo conectar. Revisa tu conexión e inténtalo otra vez.";
  }
}

/* Textos de los modos publicados. PROVISIONAL (fila 131): el handoff no los define. */
export const TOAST_GUARDADA = "Cambios guardados";
export const TOAST_CERRADA = "Tarea cerrada";
export const AVISO_CON_ENTREGAS =
  "Ya hay entregas: solo puedes cambiar el título, la fecha y el premio.";
export const AVISO_CERRADA =
  "Esta tarea está cerrada: ya no recibe entregas y no se puede editar.";
export const NOTA_PUBLICADA =
  "Los cambios se ven al instante en «Por entregar».";
/* ---------- Eliminar una tarea (D242–D244) ---------- */

/**
 * Lo que se pierde al eliminar una tarea: las notas (una por integrante de cada entrega evaluada;
 * en una grupal, una por alumno del equipo), las entregas enviadas sin evaluar y las secciones
 * que pierden notas. Los borradores de los alumnos también se borran, pero no se cuentan.
 */
export type PerdidaEliminar = {
  notas: number;
  sinEvaluar: number;
  secciones: ReadonlyArray<Exclude<SeccionTarea, "5A y 5C">>;
};

export const SIN_PERDIDA: PerdidaEliminar = {
  notas: 0,
  sinEvaluar: 0,
  secciones: [],
};

const plural = (n: number, uno: string, varios: string) =>
  `${n} ${n === 1 ? uno : varios}`;

/* Copy PROVISIONAL: el handoff no define el borrado (lo describe el informe de W4). */
export const eliminarTareaLabel = (titulo: string) => `Eliminar ${titulo}`;
export const eliminarTareaTitulo = (titulo: string) => `¿Eliminar «${titulo}»?`;
export const TOAST_TAREA_ELIMINADA = "Tarea eliminada";
export const ELIMINAR_TAREA_BOTON = "Eliminar tarea";

/**
 * «Se borrarán 23 notas de 5A y 5C. Los puntos del ranking se recalculan.» Sin `perdida` (la
 * vista previa no la conoce) dice lo mismo sin cifras.
 */
export function eliminarTareaDescripcion(perdida?: PerdidaEliminar): string {
  const fin = "Esto no se puede deshacer.";
  if (!perdida) {
    return `Se borrarán sus entregas y sus notas, y los puntos del ranking se recalculan. ${fin}`;
  }
  const { notas, sinEvaluar, secciones } = perdida;
  const pendientes = plural(
    sinEvaluar,
    "entrega sin evaluar",
    "entregas sin evaluar",
  );
  const verbo = (uno: boolean) => (uno ? "Se borrará" : "Se borrarán");
  if (notas > 0) {
    const de = secciones.length > 0 ? ` de ${secciones.join(" y ")}` : "";
    const y = sinEvaluar > 0 ? ` y ${pendientes}` : "";
    return `${verbo(notas === 1 && sinEvaluar === 0)} ${plural(notas, "nota", "notas")}${de}${y}. Los puntos del ranking se recalculan. ${fin}`;
  }
  if (sinEvaluar > 0) {
    return `${verbo(sinEvaluar === 1)} ${pendientes}. Nadie pierde notas ni puntos. ${fin}`;
  }
  return `Todavía no tiene entregas: nadie pierde notas ni puntos. ${fin}`;
}

export const CERRAR_TITULO = "¿Cerrar la tarea?";
export const CERRAR_DESCRIPCION =
  "Ya no recibirá entregas. Las que llegaron se siguen evaluando y, si tiene premio, se decide quién lo gana.";
