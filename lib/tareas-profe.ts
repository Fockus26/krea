// Lógica y textos de Tareas del profesor y del constructor (fase 04, D114–D117). Funciones puras,
// sin React ni reloj: "hoy" llega por argumento (con `cacheComponents` el servidor no lee
// `Date.now()`). El constructor es un reducer: añadir / eliminar / restaurar preguntas y editar
// campos; la validación y la suma salen de aquí para poder probarlas sin DOM.
import {
  claveVencimiento,
  comparaFecha,
  diasEntre,
  esHoraValida,
  FECHA_ENTREGA_MAX_DIAS,
  formatFecha,
  formatFechaHora,
  horaPasada,
  vencida,
  verboVence,
} from "@/lib/fecha";
import { NOTA_MAX } from "@/lib/grades";
import { percent, sumMeterInfo } from "@/lib/meters";
import {
  type FormatoPreguntaId,
  MAX_IMAGENES_MIN,
  type SeccionId,
} from "@/lib/modelo";
import {
  listaSecciones,
  ordenarSecciones,
  SECCION_NO_EXISTE,
} from "@/lib/secciones";

/* ---------- Rutas de la fase 05 (brief de la ola 4) ---------- */

export const RUTA_TAREAS = "/profe/tareas";
export const RUTA_NUEVA_TAREA = "/profe/tareas/nueva";
export const RUTA_EVALUAR = "/profe/evaluar";
export const rutaTarea = (id: string) => `${RUTA_TAREAS}/${id}`;
/** Cola de Evaluar filtrada a una tarea (forma compartida con Evaluar: `?tarea=<id>`, D398). */
export const rutaEvaluarTarea = (id: string) =>
  `${RUTA_EVALUAR}?tarea=${encodeURIComponent(id)}`;
/** Lista de entregas de una tarea (D398). */
export const rutaEntregasTarea = (id: string) =>
  `${RUTA_TAREAS}/${id}/entregas`;

/* ---------- Lista ---------- */

/**
 * Estado EFECTIVO de la tarjeta (D451): el servidor lo calcula con `ahora` (`estadoEfectivo`); una
 * abierta vencida o cerrada a mano llega `cerrada`.
 */
export type EstadoTareaProfe = "borrador" | "abierta" | "cerrada";
export type TipoTareaProfe = "individual" | "grupal";
/**
 * Filtros de la lista (D454): los tres estados más «Evaluadas», que no es un estado sino que todas
 * sus entregas tienen nota (`evaluadaToda`): una tarea puede salir en dos filtros.
 */
export type FiltroEstado = "todas" | EstadoTareaProfe | "evaluada";

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
  /** Hora de entrega "HH:MM" (D352); ausente o `null` = al final del día. */
  hora?: string | null;
  /** «5A» o «4B y 5A» (`listaSecciones`; columna de la vista Lista, D313); ausente en la vista previa. */
  secciones?: string;
  /** Grupal o individual (D263); `null` = sin premio (en una grupal, por definir). */
  premio: string | null;
  preguntas: number;
  /** Suma de los valores de las preguntas (tiene que dar 20 para publicar, D004). */
  suma: number;
  avance: AvanceTarea | null;
  /** Entregas en la cola "Por evaluar" de esta tarea. */
  porEvaluar: number;
  /**
   * Al menos una entrega enviada y todas con nota (D454), abierta o cerrada: el filtro
   * «Evaluadas» y el chip «Evaluada». Ausente = no.
   */
  evaluadaToda?: boolean;
  /** Cerrada con prórrogas sin vencer (D452): «Prórrogas abiertas: N». Ausente = 0. */
  prorrogas?: number;
  /** Lo que se pierde al eliminarla; ausente en la vista previa (no lo sabe). */
  perdida?: PerdidaEliminar;
};

/** Opciones del segmentado de estado, en el orden del lienzo. */
export const FILTROS_ESTADO: ReadonlyArray<readonly [FiltroEstado, string]> = [
  ["todas", "Todas"],
  ["borrador", "Borradores"],
  ["abierta", "Abiertas"],
  // PROVISIONAL (fila 255): «Cerradas» es nuevo (D454)
  ["cerrada", "Cerradas"],
  ["evaluada", "Evaluadas"],
];

export function esFiltroEstado(valor: string): valor is FiltroEstado {
  return FILTROS_ESTADO.some(([k]) => k === valor);
}

/** Cerradas = vencidas o cerradas a mano; Evaluadas = todas sus entregas con nota (D454). */
export function filtrarTareas(
  tareas: readonly TareaProfe[],
  filtro: FiltroEstado,
): TareaProfe[] {
  if (filtro === "todas") return [...tareas];
  if (filtro === "evaluada")
    return tareas.filter((t) => t.evaluadaToda === true);
  return tareas.filter((t) => t.estado === filtro);
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
    // PROVISIONAL (fila 255)
    case "cerrada":
      return "Mostrando las tareas cerradas";
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
    // PROVISIONAL (fila 255)
    case "cerrada":
      return "No hay tareas cerradas";
    case "evaluada":
      return "No hay tareas evaluadas";
  }
}

const ORDEN_ESTADO: Record<EstadoTareaProfe, number> = {
  abierta: 0,
  cerrada: 1,
  borrador: 2,
};

/**
 * Orden del lienzo: abiertas (la que vence antes primero), cerradas (la más reciente primero) y
 * borradores al final.
 */
export function ordenarTareas(tareas: readonly TareaProfe[]): TareaProfe[] {
  return [...tareas].sort((a, b) => {
    const e = ORDEN_ESTADO[a.estado] - ORDEN_ESTADO[b.estado];
    if (e !== 0) return e;
    const va = claveVencimiento(a.fecha, a.hora);
    const vb = claveVencimiento(b.fecha, b.hora);
    if (!va || !vb) return va ? -1 : vb ? 1 : 0;
    // Mismo día: la de hora más temprana vence antes (D352)
    const [x, y] = a.estado === "cerrada" ? [vb, va] : [va, vb];
    return x < y ? -1 : x > y ? 1 : 0;
  });
}

/** Eyebrow de la lista: "5 tareas · 4B y 5A". */
export function eyebrowTareas(n: number, secciones: string): string {
  const tareas = `${n} ${n === 1 ? "tarea" : "tareas"}`;
  return secciones ? `${tareas} · ${secciones}` : tareas;
}

/** Con más de esto, el eyebrow dice cuántas secciones son en vez de nombrarlas. */
const SECCIONES_EN_EYEBROW = 3;

/** Secciones del eyebrow: «4B y 5A» o, si son muchas, «6 secciones» (no desborda a 320 px). */
export function seccionesResumen(secciones: readonly SeccionId[]): string {
  if (secciones.length <= SECCIONES_EN_EYEBROW)
    return listaSecciones(secciones);
  return `${secciones.length} secciones`;
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
 * Meta de la tarjeta: "8 preguntas · vence 30/10/2026 · 12 de 69 evaluadas". Las cerradas no
 * llevan fecha (lienzo, las evaluadas de antes) y, con prórrogas vigentes, dicen cuántas (D452);
 * un borrador sin fecha dice "sin fecha" y, si es grupal sin premio, "premio por definir". Una
 * cuya fecha y hora ya pasaron en `ahora` dice "venció" (D357; PROVISIONAL, fila 89).
 */
export function metaTarea(t: TareaProfe, ahora: number): string {
  const partes = [preguntasTexto(t.preguntas)];
  if (t.estado === "cerrada" && t.prorrogas) {
    partes.push(prorrogasTexto(t.prorrogas));
  }
  if (t.estado !== "cerrada") {
    if (t.fecha === null) partes.push("sin fecha");
    else
      partes.push(
        `${verboVence(t.fecha, t.hora, ahora)} ${formatFechaHora(t.fecha, t.hora)}`,
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

/** «prórrogas abiertas: 2» en la meta de una cerrada (D452). PROVISIONAL (fila 256). */
export function prorrogasTexto(n: number): string {
  return `prórrogas abiertas: ${n}`;
}

/* Vista Lista (D313). PROVISIONAL (CONTENT_CHECKLIST fila 164) */
export const TABLA_TAREAS_LABEL = "Lista de tareas";

/**
 * Columna «Fecha» de la vista Lista: «Vence 30/10/2026 · 3:30 p. m.» (con hora, D355), «Venció …»,
 * «30/10/2026» o «Sin fecha».
 */
export function fechaTareaTexto(t: TareaProfe, ahora: number): string {
  if (t.fecha === null) return "Sin fecha";
  const texto = formatFechaHora(t.fecha, t.hora);
  if (t.estado !== "abierta") return texto;
  return `${vencida(t.fecha, t.hora, ahora) ? "Venció" : "Vence"} ${texto}`;
}

/**
 * Barra de evaluadas (máx. 320): en abiertas con avance de evaluación (lienzo) y en cerradas que
 * aún tienen entregas por evaluar (al vencer se sigue evaluando, D451).
 */
export function barraEvaluadas(t: TareaProfe): number | null {
  const enCurso =
    t.estado === "abierta" || (t.estado === "cerrada" && t.porEvaluar > 0);
  if (!enCurso || t.avance?.tipo !== "evaluadas") return null;
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

/**
 * Marca o desmarca una sección en las casillas del constructor (D324). El resultado sale
 * ordenado por año y letra y sin repetir.
 */
export function alternarSeccion(
  secciones: readonly SeccionId[],
  codigo: SeccionId,
  marcada: boolean,
): SeccionId[] {
  const resto = secciones.filter((s) => s !== codigo);
  return ordenarSecciones(marcada ? [...resto, codigo] : resto);
}

/** Resumen de las secciones elegidas: «4B y 5A»; ninguna → «Ninguna sección». PROVISIONAL (fila 168). */
export function seccionesTareaTexto(secciones: readonly SeccionId[]): string {
  return secciones.length === 0 ? "Ninguna sección" : listaSecciones(secciones);
}

/** Contador de un año en el selector (D356): «Ninguna elegida», «1 elegida», «2 elegidas». PROVISIONAL (fila 179). */
export function elegidasTexto(n: number): string {
  if (n === 0) return "Ninguna elegida";
  return `${n} ${n === 1 ? "elegida" : "elegidas"}`;
}

/* Campo de hora (D352, D353). PROVISIONAL (CONTENT_CHECKLIST fila 178) */
export const FECHA_HORA_LEYENDA = "Fecha y hora de entrega";
export const HORA_AYUDA = "Opcional. Sin hora, vence al final del día.";
export const QUITAR_HORA = "Quitar hora";

/** Texto, imagen(es) o «Enlace» (`url`, D468). */
export type FormatoPregunta = FormatoPreguntaId;
export { ENLACE_FORMATO } from "@/lib/url-respuesta";

/** Límites de §3: de 1 a 20 preguntas; valor 0,5–20 en pasos de 0,5 (D004). */
export const MIN_PREGUNTAS = 1;
export const MAX_PREGUNTAS = 20;
export const VALOR_MIN = 0.5;
export const VALOR_MAX = NOTA_MAX;
export const VALOR_PASO = 0.5;

/** Límite al elegir «Varias imágenes» (D373): el mínimo de la regla. */
export const MAX_IMAGENES_INICIAL = MAX_IMAGENES_MIN;

/* Cantidad de imágenes (D373). PROVISIONAL (CONTENT_CHECKLIST fila 190) */
export const CANTIDAD_IMAGENES = "Imágenes";
export const UNA_IMAGEN = "Una";
export const VARIAS_IMAGENES = "Varias";
export const LIMITE_IMAGENES = "Máximo";

export type PreguntaBorrador = {
  id: string;
  enunciado: string;
  formato: FormatoPregunta;
  /**
   * Solo en imagen: `null` o ausente = una imagen; un número = «Varias», hasta ese límite (D373).
   * Se conserva al pasar a Texto (como el premio, D116) pero no se guarda.
   */
  maxImagenes?: number | null;
  /** `null` = sin valor todavía (D103): cuenta 0 en la suma. */
  valor: number | null;
};

export type TareaBorrador = {
  titulo: string;
  tipo: TipoTareaProfe;
  /** Lo escrito en el campo, "dd/mm/aaaa" (puede estar a medias). */
  fecha: string;
  /** Hora de entrega "HH:MM" del campo de hora (D352); vacía = al final del día. */
  hora: string;
  /** Secciones del catálogo que reciben la tarea, ordenadas (D324); al menos una para guardar. */
  secciones: readonly SeccionId[];
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
    hora: datos.hora ?? "",
    // Una tarea nueva recibe las secciones que pase quien la crea (las del profe, D324)
    secciones: ordenarSecciones(datos.secciones ?? []),
    premio: datos.premio ?? "",
    preguntas,
    siguiente: siguienteLibre(preguntas),
  };
}

export type AccionBorrador =
  | { tipo: "titulo" | "fecha" | "hora" | "premio"; valor: string }
  | { tipo: "tipo"; valor: TipoTareaProfe }
  | { tipo: "seccion"; codigo: SeccionId; marcada: boolean }
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
    case "hora":
      return { ...estado, hora: accion.valor };
    case "premio":
      return { ...estado, premio: accion.valor };
    case "tipo":
      return { ...estado, tipo: accion.valor };
    case "seccion":
      return {
        ...estado,
        secciones: alternarSeccion(
          estado.secciones,
          accion.codigo,
          accion.marcada,
        ),
      };
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

/** "15:30" para el campo de hora; `null` (sin hora) → vacío. */
export function horaCampo(hora: string | null): string {
  return hora ?? "";
}

/** Lo del campo de hora → "HH:MM" o `null` (vacía o a medias = al final del día, D352). */
export function horaValor(texto: string): string | null {
  const h = texto.trim();
  return esHoraValida(h) ? h : null;
}

/* Mensajes de error. PROVISIONAL (fila 90): el handoff no los define. */
export const ERRORES = {
  titulo: "Escribe el título de la tarea.",
  fecha: "Escribe la fecha como dd/mm/aaaa.",
  fechaPasada: "La fecha de entrega ya pasó.",
  /** PROVISIONAL (CONTENT_CHECKLIST fila 178). */
  hora: "Escribe la hora completa o déjala vacía.",
  /** PROVISIONAL (CONTENT_CHECKLIST fila 178): hoy con una hora que ya pasó (D354). */
  horaPasada: "La hora de entrega de hoy ya pasó.",
  fechaLejana: "La fecha de entrega puede ser como mucho dentro de un año.",
  enunciado: "Escribe el enunciado de la pregunta.",
  valor: "Ponle un valor a la pregunta.",
  /** PROVISIONAL (CONTENT_CHECKLIST fila 168). */
  secciones: "Elige al menos una sección.",
} as const;

export type ErroresPregunta = { enunciado?: string; valor?: string };
export type ErroresTarea = {
  titulo?: string;
  fecha?: string;
  /** Hora a medias, o la de hoy ya pasada (D354). */
  hora?: string;
  /** Ninguna casilla de sección marcada (D324). */
  secciones?: string;
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
 * publicada, que se puede conservar aunque haya pasado (D200). Hora (D354): la de hoy no puede
 * haber pasado ya (`horaActual`, "HH:MM" de Caracas; sin ella no se mira), salvo que sean la
 * misma fecha y hora guardadas (`horaGuardada`).
 */
export function validarTarea(
  t: TareaBorrador,
  hoy: string,
  fechaGuardada: string | null = null,
  horaActual: string | null = null,
  horaGuardada: string | null = null,
): ErroresTarea {
  const errores: ErroresTarea = { preguntas: {} };
  if (!t.titulo.trim()) errores.titulo = ERRORES.titulo;
  if (t.secciones.length === 0) errores.secciones = ERRORES.secciones;
  const iso = fechaIso(t.fecha);
  if (!iso) errores.fecha = ERRORES.fecha;
  else if (comparaFecha(iso, hoy) < 0 && iso !== fechaGuardada)
    errores.fecha = ERRORES.fechaPasada;
  else if (
    diasEntre(hoy, iso) > FECHA_ENTREGA_MAX_DIAS &&
    iso !== fechaGuardada
  )
    errores.fecha = ERRORES.fechaLejana;
  const hora = horaValor(t.hora);
  if (t.hora.trim() && hora === null) errores.hora = ERRORES.hora;
  else if (
    hora !== null &&
    iso === hoy &&
    horaActual !== null &&
    horaPasada(hora, horaActual) &&
    !(iso === fechaGuardada && hora === horaGuardada)
  )
    errores.hora = ERRORES.horaPasada;
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
    e.titulo ||
      e.fecha ||
      e.hora ||
      e.secciones ||
      e.suma ||
      Object.keys(e.preguntas).length > 0,
  );
}

/** Para guardar un borrador basta el título (D199) y al menos una sección (D324). */
export function validarBorrador(t: TareaBorrador): ErroresTarea {
  const errores: ErroresTarea = { preguntas: {} };
  if (!t.titulo.trim()) errores.titulo = ERRORES.titulo;
  if (t.secciones.length === 0) errores.secciones = ERRORES.secciones;
  return errores;
}

export function puedePublicar(t: TareaBorrador, hoy: string): boolean {
  return (
    t.preguntas.length >= MIN_PREGUNTAS && !tieneErrores(validarTarea(t, hoy))
  );
}

/**
 * Lo que se guarda (`guardarTarea`, D199): fecha ISO o `null`, hora "HH:MM" o `null` (D352) y el
 * premio (grupal o individual, D263).
 */
export function tareaAGuardar(t: TareaBorrador) {
  const premio = t.premio.trim();
  return {
    titulo: t.titulo.trim(),
    tipo: t.tipo,
    fecha: fechaIso(t.fecha),
    hora: horaValor(t.hora),
    secciones: [...t.secciones],
    premio: premio || null,
    preguntas: t.preguntas.map(
      ({ id, enunciado, formato, valor, maxImagenes }) => ({
        id,
        enunciado: enunciado.trim(),
        formato,
        ...(formato === "imagen" && maxImagenes != null ? { maxImagenes } : {}),
        valor,
      }),
    ),
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
  /** Hoy con una hora que ya pasó (D354). */
  | "hora-pasada"
  | "sin-empate"
  /** Una sección elegida ya no está en el catálogo (D323). */
  | "seccion"
  /** Otro profe la cambió mientras se reabría (D455): la vista está vieja. */
  | "cambio"
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
    case "hora-pasada":
      return ERRORES.horaPasada;
    case "sin-empate":
      return "Ya no hay empate en esta sección: recarga la página.";
    case "seccion":
      return SECCION_NO_EXISTE;
    // PROVISIONAL (fila 258)
    case "cambio":
      return "La tarea cambió mientras la reabrías: revisa cómo quedó e inténtalo otra vez.";
    case "red":
      return "No se pudo conectar. Revisa tu conexión e inténtalo otra vez.";
  }
}

/* Textos de los modos publicados. PROVISIONAL (fila 131): el handoff no los define. */
export const TOAST_GUARDADA = "Cambios guardados";
export const TOAST_CERRADA = "Tarea cerrada";
export const AVISO_CON_ENTREGAS =
  "Ya hay entregas: solo puedes cambiar el título, la fecha, la hora y el premio.";
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
  /** Ordenadas por año y letra. */
  secciones: readonly SeccionId[];
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
 * Lo que pierden varias tareas juntas (lote, D314): suma de notas y entregas sin evaluar, y la
 * unión de secciones. Si alguna no trae su pérdida (vista previa), `undefined`: el texto va sin
 * cifras en vez de contar de menos.
 */
export function sumarPerdidas(
  perdidas: ReadonlyArray<PerdidaEliminar | undefined>,
): PerdidaEliminar | undefined {
  let notas = 0;
  let sinEvaluar = 0;
  const secciones = new Set<string>();
  for (const p of perdidas) {
    if (!p) return undefined;
    notas += p.notas;
    sinEvaluar += p.sinEvaluar;
    for (const s of p.secciones) secciones.add(s);
  }
  return {
    notas,
    sinEvaluar,
    secciones: ordenarSecciones(secciones),
  };
}

/**
 * «Se borrarán 23 notas de 4B y 5A. Los puntos del ranking se recalculan.» Sin `perdida` (la
 * vista previa no la conoce) dice lo mismo sin cifras. `varias`: la del lote (D314; solo cambia
 * «Todavía no tiene entregas» por «tienen»). PROVISIONAL (lote: CONTENT_CHECKLIST fila 165).
 */
export function eliminarTareaDescripcion(
  perdida?: PerdidaEliminar,
  varias = false,
): string {
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
    const de = secciones.length > 0 ? ` de ${listaSecciones(secciones)}` : "";
    const y = sinEvaluar > 0 ? ` y ${pendientes}` : "";
    return `${verbo(notas === 1 && sinEvaluar === 0)} ${plural(notas, "nota", "notas")}${de}${y}. Los puntos del ranking se recalculan. ${fin}`;
  }
  if (sinEvaluar > 0) {
    return `${verbo(sinEvaluar === 1)} ${pendientes}. Nadie pierde notas ni puntos. ${fin}`;
  }
  return `Todavía no ${varias ? "tienen" : "tiene"} entregas: nadie pierde notas ni puntos. ${fin}`;
}

export const CERRAR_TITULO = "¿Cerrar la tarea?";
export const CERRAR_DESCRIPCION =
  "Ya no recibirá entregas. Las que llegaron se siguen evaluando y, si tiene premio, se decide quién lo gana.";
