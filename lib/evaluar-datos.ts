// Evaluar con datos de Firestore (fase 07 W7, D204–D206). Puro (sin Firebase ni reloj): qué
// manda el formulario, qué evaluación se escribe (`armarEvaluacion`), qué devuelve «Deshacer»
// (`deshacerEvaluacion`), la cola «Por evaluar» y las props de la pantalla. Lo usan los
// adaptadores de Postgres (`lib/data/evaluar.ts`), las páginas del profe y las pruebas.
//
// La nota NO se guarda: se deriva de `puntaje × base / 20` (D013), con la base que la evaluación
// guardó para cada integrante (D403). Aquí solo se valida y se suma el puntaje por pregunta en
// medios enteros (D004); la nota de la vista sale de `lib/grades`.
import { z } from "zod";
import type { ReviewIdentity } from "@/components/sections/evaluar/review-header";
import {
  baseEfectiva,
  entregaLinea,
  eyebrowEvaluar,
  type SiguienteEntrega,
  tipoChipTexto,
} from "@/lib/evaluar";
import { diaDeInstante, hora24DeInstante } from "@/lib/fecha";
import { BASE_MAX, formatNota, NOTA_MAX, NOTA_MIN } from "@/lib/grades";
import {
  type Entrega,
  type Equipo,
  type Evaluacion,
  type Pregunta,
  type PreguntaBorrador,
  rutasImagen,
  sumaValores,
  type TareaDoc,
  type Usuario,
  zBase,
  zCedula,
  zInstante,
  zPuntaje,
} from "@/lib/modelo";
import { COMMENT_MAX_LENGTH, imagenesConAlt } from "@/lib/question";
import { estiloDe, nombreCorto } from "@/lib/vistas-estudiante";

type ConId<T> = { id: string } & T;

/** Ruta de la cola de Evaluar (D148). */
export const RUTA_EVALUAR = "/profe/evaluar";

/** Filtros de la cola de Evaluar, en la URL (D384): los cuatro son opcionales. */
export type FiltrosEvaluar = {
  tipo?: "individual" | "grupal";
  /** Código de sección («5A»). */
  seccion?: string;
  /** Id de la tarea. */
  tarea?: string;
  /** Cédula: casa con el titular de una individual y con cualquier integrante de una grupal. */
  alumno?: string;
};

const zFiltroTipo = z.enum(["individual", "grupal"]);
const zFiltroSeccion = z.string().regex(/^[A-Za-z0-9._-]{1,12}$/);

/**
 * Lee los filtros de `searchParams`: un valor inválido o repetido se ignora (no da error, D384).
 * Acepta el objeto de Next (`string | string[] | undefined`) o un `URLSearchParams` ya vuelto objeto.
 */
export function filtrosDeParams(
  raw: Readonly<Record<string, string | string[] | undefined>>,
): FiltrosEvaluar {
  const uno = (k: string) => {
    const v = raw[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const f: FiltrosEvaluar = {};
  const tipo = zFiltroTipo.safeParse(uno("tipo"));
  if (tipo.success) f.tipo = tipo.data;
  const seccion = zFiltroSeccion.safeParse(uno("seccion"));
  if (seccion.success) f.seccion = seccion.data;
  const tarea = zIdDocumento.safeParse(uno("tarea"));
  if (tarea.success) f.tarea = tarea.data;
  const alumno = zCedula.safeParse(uno("alumno"));
  if (alumno.success) f.alumno = alumno.data;
  return f;
}

export function hayFiltros(f: FiltrosEvaluar): boolean {
  return Boolean(f.tipo || f.seccion || f.tarea || f.alumno);
}

/** `?tipo=grupal&seccion=5A…` (orden fijo); vacío si no hay filtros. */
export function queryFiltros(f: FiltrosEvaluar): string {
  const q = new URLSearchParams();
  if (f.tipo) q.set("tipo", f.tipo);
  if (f.seccion) q.set("seccion", f.seccion);
  if (f.tarea) q.set("tarea", f.tarea);
  if (f.alumno) q.set("alumno", f.alumno);
  const s = q.toString();
  return s ? `?${s}` : "";
}

/** La cola filtrable, con los filtros en la URL. */
export function rutaCola(filtros: FiltrosEvaluar = {}): string {
  return `${RUTA_EVALUAR}${queryFiltros(filtros)}`;
}

/** Una entrega; con `filtros`, conserva la cola filtrada. Sin `?ver`: se evalúa o corrige. */
export function rutaEntrega(id: string, filtros: FiltrosEvaluar = {}): string {
  return `${RUTA_EVALUAR}/${id}${queryFiltros(filtros)}`;
}

/* ---------- Entrada de las Server Actions ---------- */

/** Ids de documento (automáticos, del seed y `tarea__titular` de las entregas). */
export const zIdDocumento = z
  .string()
  .regex(/^[A-Za-z0-9_-]{1,200}$/, "Id inválido");

const zIdPregunta = z.string().regex(/^[A-Za-z0-9_-]{1,40}$/, "Id inválido");

export const zGuardarEvaluacion = z.object({
  entregaId: zIdDocumento,
  /** Puntos por pregunta (id → puntos), pasos de 0,5 (D004); el máximo de cada una lo mira el servidor. */
  puntos: z.record(zIdPregunta, zPuntaje),
  /** Comentario por pregunta (id → texto); vacío = sin comentario. Hasta 300 (D446). */
  comentarios: z.record(zIdPregunta, z.string().trim().max(COMMENT_MAX_LENGTH)),
  /**
   * Comentario general de la entrega (D445); vacío = sin comentario. Opcional para que un
   * formulario viejo siga guardando (sin el campo = sin comentario general).
   */
  comentarioGeneral: z.string().trim().max(COMMENT_MAX_LENGTH).optional(),
  /**
   * `evaluadaEn` de la evaluación con la que se abrió el formulario (`null` = estaba Pendiente).
   * Si ya no es la vigente, otro la cambió mientras tanto y no se pisa (`cambio`; QA versión 1,
   * F-M1; D224).
   */
  version: zInstante.nullable(),
  /**
   * Grupal: cédulas de los integrantes marcados «No participó» (D364). Opcional para que un
   * formulario viejo siga guardando (sin el campo = nadie marcado). El servidor rechaza las que
   * no son de la entrega y cualquiera en una individual.
   */
  noParticiparon: z.array(zCedula).max(50).optional(),
  /**
   * Base de cada integrante en esta tarea (cédula → base 10–20, pasos de 0,5; D403). Opcional
   * para que un formulario viejo siga guardando: quien no viene conserva la que tenía la
   * evaluación o, si no, su base vigente (`armarEvaluacion`). Una cédula ajena = `invalida`.
   */
  bases: z
    .record(zCedula, zBase)
    .refine((b) => Object.keys(b).length <= 50, "Demasiadas bases")
    .optional(),
  /**
   * `enviadaEn` de la entrega que el profe tenía en pantalla (D397): si el alumno la editó mientras
   * tanto, no se guarda (`editada`). Opcional para que un formulario viejo siga guardando.
   */
  enviadaEn: zInstante.nullable().optional(),
});
export type GuardarEvaluacion = z.infer<typeof zGuardarEvaluacion>;

export const zDeshacerEvaluacion = z.object({
  entregaId: zIdDocumento,
  /** `evaluadaEn` de la evaluación que se deshace: si cambió, otro la pisó y no se toca. */
  evaluadaEn: zInstante,
});
export type DeshacerEvaluacion = z.infer<typeof zDeshacerEvaluacion>;

export type ErrorEvaluar =
  | "invalida"
  | "no-existe"
  | "no-entregada"
  | "sin-preguntas"
  | "incompleta"
  | "cambio"
  /** El alumno editó la entrega mientras el profe la puntuaba (D397). */
  | "editada"
  | "red";

export type ResultadoEvaluar =
  | { ok: true; id: string; evaluadaEn: number }
  | { ok: false; error: ErrorEvaluar };

/** Toast de error al guardar o deshacer. PROVISIONAL (CONTENT_CHECKLIST fila 133). */
export function errorEvaluarTexto(e: ErrorEvaluar): string {
  switch (e) {
    case "red":
      return "No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.";
    case "cambio":
      return "Otra persona cambió esta nota. Recarga para ver la última.";
    case "editada":
      return "El alumno editó la entrega. Recarga para ver la versión nueva.";
    case "incompleta":
      return "Falta puntuar alguna pregunta o un puntaje pasa del máximo.";
    case "no-existe":
      return "Esta entrega ya no existe. Recarga la página.";
    default:
      return "No se pudo guardar la nota. Recarga la página e inténtalo de nuevo.";
  }
}

/* ---------- Escritura ---------- */

/** Preguntas evaluables de una tarea: las de una tarea publicada (en un borrador, ninguna). */
function preguntasDe(t: TareaDoc): readonly Pregunta[] {
  if (t.estado === "borrador") return [];
  return t.preguntas as readonly Pregunta[];
}

/**
 * Evaluación que se escribe: cada pregunta de la tarea con su puntaje (0 a su valor, pasos de
 * 0,5, D004), ni una de más ni una de menos; comentarios recortados y solo los que tienen texto.
 * El puntaje total es la suma en medios enteros (sin errores de coma flotante). Lleva la base de
 * cada integrante (D403, `basesDeEvaluacion`); `basesVigentes`: cédula → base vigente de los
 * integrantes que siguen existiendo.
 */
export function armarEvaluacion({
  entrega,
  tarea,
  envio,
  basesVigentes,
  autorId,
  ahora,
}: {
  entrega: Entrega;
  tarea: TareaDoc;
  envio: GuardarEvaluacion;
  basesVigentes: Readonly<Record<string, number>>;
  autorId: string;
  ahora: number;
}): { ok: true; evaluacion: Evaluacion } | { ok: false; error: ErrorEvaluar } {
  // Un borrador del alumno todavía no se entregó (D196)
  if (entrega.estado === "borrador")
    return { ok: false, error: "no-entregada" };
  // Otra pestaña u otro profe guardó desde que se abrió el formulario (D224)
  if ((entrega.evaluacion?.evaluadaEn ?? null) !== envio.version)
    return { ok: false, error: "cambio" };
  const preguntas = preguntasDe(tarea);
  if (preguntas.length === 0) return { ok: false, error: "sin-preguntas" };

  const ids = new Set(preguntas.map((p) => p.id));
  if (Object.keys(envio.puntos).some((id) => !ids.has(id))) {
    return { ok: false, error: "invalida" };
  }
  const puntos: Record<string, number> = {};
  for (const p of preguntas) {
    const v = envio.puntos[p.id];
    if (v === undefined || v < 0 || v > p.valor) {
      return { ok: false, error: "incompleta" };
    }
    puntos[p.id] = v;
  }
  const comentarios: Record<string, string> = {};
  for (const [id, texto] of Object.entries(envio.comentarios)) {
    const t = texto.trim();
    if (ids.has(id) && t) comentarios[id] = t;
  }
  const puntaje = sumaValores(
    Object.values(puntos).map((valor) => ({ valor })),
  );
  const marcados = noParticiparonDe(entrega, envio.noParticiparon ?? []);
  if (!marcados) return { ok: false, error: "invalida" };
  const bases = basesDeEvaluacion(entrega, envio.bases ?? {}, basesVigentes);
  if (!bases) return { ok: false, error: "invalida" };
  const general = envio.comentarioGeneral?.trim() ?? "";
  return {
    ok: true,
    evaluacion: {
      puntos,
      comentarios,
      puntaje,
      evaluadaPor: autorId,
      evaluadaEn: ahora,
      // Solo si hay alguno: así una evaluación sin marcas queda igual que las de antes (D364)
      ...(marcados.length > 0 ? { noParticiparon: marcados } : {}),
      bases,
      // Solo con texto: sin él queda igual que las evaluaciones de antes (D445)
      ...(general ? { comentarioGeneral: general } : {}),
    },
  };
}

/** Cédula → base vigente de los integrantes de la entrega que siguen existiendo. */
export function basesVigentesDe(
  entrega: Pick<Entrega, "integrantes">,
  usuarios: ReadonlyMap<string, Pick<Usuario, "base">>,
): Record<string, number> {
  const bases: Record<string, number> = {};
  for (const c of entrega.integrantes) {
    const u = usuarios.get(c);
    if (u) bases[c] = u.base;
  }
  return bases;
}

/**
 * Base de cada integrante que se guarda en la evaluación (D403), en el orden de `integrantes`:
 * la que mandó el profe → si no, la que ya tenía la evaluación vigente de esta entrega → si no,
 * la vigente del alumno → si el alumno ya no existe, `BASE_MAX`. `null` si llega una cédula que
 * no es integrante o una base fuera de 10–20 / de los pasos de 0,5: no se adivina, se rechaza.
 */
export function basesDeEvaluacion(
  entrega: Pick<Entrega, "integrantes" | "evaluacion">,
  pedidas: Readonly<Record<string, number>>,
  basesVigentes: Readonly<Record<string, number>>,
): Record<string, number> | null {
  for (const [cedula, base] of Object.entries(pedidas)) {
    if (!entrega.integrantes.includes(cedula)) return null;
    if (!zBase.safeParse(base).success) return null;
  }
  const bases: Record<string, number> = {};
  for (const c of entrega.integrantes) {
    const candidatas = [
      pedidas[c],
      entrega.evaluacion?.bases?.[c],
      basesVigentes[c],
    ];
    bases[c] =
      candidatas.find(
        (b): b is number => b !== undefined && zBase.safeParse(b).success,
      ) ?? BASE_MAX;
  }
  return bases;
}

/**
 * «No participó» que se guarda (D364): solo en grupales y solo integrantes de la entrega (la
 * foto de quién entregó, D221), sin repetir y en el orden de `integrantes`. `null` si llega una
 * cédula ajena o alguna marca en una individual: no se adivina, se rechaza.
 */
export function noParticiparonDe(
  entrega: Pick<Entrega, "tipo" | "integrantes">,
  cedulas: readonly string[],
): string[] | null {
  if (cedulas.length === 0) return [];
  if (entrega.tipo !== "grupal") return null;
  const pedidas = new Set(cedulas);
  if ([...pedidas].some((c) => !entrega.integrantes.includes(c))) return null;
  return entrega.integrantes.filter((c) => pedidas.has(c));
}

/** Lo que cambia en la entrega al guardar: evaluada, y la anterior para «Deshacer» (D205). */
export function entregaEvaluada(
  entrega: Entrega,
  evaluacion: Evaluacion,
): Entrega {
  return {
    ...entrega,
    estado: "evaluada",
    evaluacion,
    evaluacionAnterior: entrega.evaluacion,
  };
}

/**
 * «Deshacer» (D105, D205): devuelve la evaluación que la última reemplazó (o la deja Pendiente,
 * D003, si no había). Solo si la evaluación vigente es la que el profe acaba de guardar (mismo
 * instante y mismo autor): si otro profe la cambió después, no se pisa (`cambio`).
 */
export function deshacerEvaluacion(
  entrega: Entrega,
  evaluadaEn: number,
  autorId: string,
): { ok: true; entrega: Entrega } | { ok: false; error: ErrorEvaluar } {
  const ev = entrega.evaluacion;
  if (
    entrega.estado !== "evaluada" ||
    !ev ||
    ev.evaluadaEn !== evaluadaEn ||
    ev.evaluadaPor !== autorId ||
    entrega.evaluacionAnterior === undefined
  ) {
    return { ok: false, error: "cambio" };
  }
  const anterior = entrega.evaluacionAnterior;
  const { evaluacionAnterior: _, ...resto } = entrega;
  return {
    ok: true,
    entrega: {
      ...resto,
      estado: anterior ? "evaluada" : "entregada",
      evaluacion: anterior,
    },
  };
}

/* ---------- Cola «Por evaluar» ---------- */

/** Entregadas sin evaluar, de la más antigua a la más reciente (desempate por id, D204). */
export function colaPorEvaluar<T extends ConId<Entrega>>(
  entregas: readonly T[],
): T[] {
  return entregas
    .filter((e) => e.estado === "entregada")
    .sort(
      (a, b) =>
        (a.enviadaEn ?? 0) - (b.enviadaEn ?? 0) ||
        (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
    );
}

/** ¿La entrega cumple todos los filtros activos? */
function cumpleFiltros(e: Entrega, f: FiltrosEvaluar): boolean {
  return (
    (!f.tipo || e.tipo === f.tipo) &&
    (!f.seccion || e.seccion === f.seccion) &&
    (!f.tarea || e.tareaId === f.tarea) &&
    // un alumno trae sus individuales y las grupales de su equipo (D384)
    (!f.alumno || e.integrantes.includes(f.alumno))
  );
}

/** La cola que cumple los filtros, en el mismo orden (D384). */
export function filtrarCola<T extends ConId<Entrega>>(
  cola: readonly T[],
  filtros: FiltrosEvaluar,
): T[] {
  return cola.filter((e) => cumpleFiltros(e, filtros));
}

/**
 * La cola filtrada para la pantalla de una entrega: si la entrega abierta está por evaluar pero
 * no cumple el filtro (enlace viejo), igual forma parte de la cola para no perder el sitio.
 */
export function colaFiltradaCon<T extends ConId<Entrega>>(
  cola: readonly T[],
  filtros: FiltrosEvaluar,
  actualId: string,
): T[] {
  return cola.filter((e) => e.id === actualId || cumpleFiltros(e, filtros));
}

/** Documentos que necesitan la cola, el Panel y la pantalla para nombrar a cada titular. */
export type MapasEvaluar = {
  usuarios: ReadonlyMap<string, Usuario>;
  equipos: ReadonlyMap<string, ConId<Equipo>>;
  tareas: ReadonlyMap<string, ConId<TareaDoc>>;
};

export function mapasEvaluar(d: {
  usuarios: ReadonlyArray<Usuario>;
  equipos: ReadonlyArray<ConId<Equipo>>;
  tareas: ReadonlyArray<ConId<TareaDoc>>;
}): MapasEvaluar {
  return {
    usuarios: new Map(d.usuarios.map((u) => [u.cedula, u])),
    equipos: new Map(d.equipos.map((e) => [e.id, e])),
    tareas: new Map(d.tareas.map((t) => [t.id, t])),
  };
}

/** PROVISIONAL (fila 133): titular cuyo documento falta (no debería pasar). */
export const TITULAR_DESCONOCIDO = "Sin nombre";
/** PROVISIONAL (fila 133): tarea cuyo documento falta. */
export const TAREA_DESCONOCIDA = "Tarea sin título";

/**
 * Nombre del equipo de una grupal (D308): el del equipo vivo; si se eliminó, el que tenía entonces
 * (`titularNombre`); si no, `TITULAR_DESCONOCIDO`.
 */
export function nombreGrupal(
  e: Pick<Entrega, "titularId" | "titularNombre">,
  equipos: ReadonlyMap<string, Pick<Equipo, "nombre">>,
): string {
  return (
    equipos.get(e.titularId)?.nombre ?? e.titularNombre ?? TITULAR_DESCONOCIDO
  );
}

/** Nombre del titular: el equipo, o «Yeilin Duarte». */
export function nombreTitular(e: Entrega, m: MapasEvaluar): string {
  if (e.tipo === "grupal") return nombreGrupal(e, m.equipos);
  const u = m.usuarios.get(e.titularId);
  return u ? nombreCorto(u) : TITULAR_DESCONOCIDO;
}

export function tituloTarea(e: Entrega, m: MapasEvaluar): string {
  return m.tareas.get(e.tareaId)?.titulo ?? TAREA_DESCONOCIDA;
}

/**
 * Opciones de los filtros Tarea y Alumno: las de la cola entera (para poder cambiar de filtro), más
 * la elegida si ya no tiene entregas. Ordenadas por texto (es-VE).
 */
export function opcionesFiltros(
  cola: ReadonlyArray<Entrega>,
  filtros: FiltrosEvaluar,
  m: MapasEvaluar,
): {
  tareas: Array<{ valor: string; texto: string }>;
  alumnos: Array<{ valor: string; texto: string }>;
} {
  const tareas = new Set(cola.map((e) => e.tareaId));
  if (filtros.tarea) tareas.add(filtros.tarea);
  const alumnos = new Set(cola.flatMap((e) => e.integrantes));
  if (filtros.alumno) alumnos.add(filtros.alumno);
  const orden = (a: { texto: string }, b: { texto: string }) =>
    a.texto.localeCompare(b.texto, "es");
  return {
    tareas: [...tareas]
      .map((id) => ({
        valor: id,
        texto: m.tareas.get(id)?.titulo ?? TAREA_DESCONOCIDA,
      }))
      .sort(orden),
    alumnos: [...alumnos]
      .map((cedula) => {
        const u = m.usuarios.get(cedula);
        return {
          valor: cedula,
          texto: u ? nombreCorto(u) : TITULAR_DESCONOCIDO,
        };
      })
      .sort(orden),
  };
}

/** PROVISIONAL (fila 197): textos del filtro activo. */
export const FILTRO_TIPO_TEXTO = {
  individual: "Individuales",
  grupal: "Grupales",
} as const;

/** «Grupales · 5A · Identidad de marca · Yeilin Duarte»; `null` sin filtros. */
export function resumenFiltros(
  f: FiltrosEvaluar,
  m: MapasEvaluar,
): string | null {
  const partes: string[] = [];
  if (f.tipo) partes.push(FILTRO_TIPO_TEXTO[f.tipo]);
  if (f.seccion) partes.push(f.seccion);
  if (f.tarea) partes.push(m.tareas.get(f.tarea)?.titulo ?? TAREA_DESCONOCIDA);
  if (f.alumno) {
    const u = m.usuarios.get(f.alumno);
    partes.push(u ? nombreCorto(u) : TITULAR_DESCONOCIDO);
  }
  return partes.length > 0 ? partes.join(" · ") : null;
}

/** Siguiente de la cola para «Sigue: …». */
export function siguienteDe(
  e: Entrega | undefined,
  m: MapasEvaluar,
): SiguienteEntrega {
  return e ? { nombre: nombreTitular(e, m), tarea: tituloTarea(e, m) } : null;
}

/* ---------- Pantalla Evaluar entrega ---------- */

/** Eyebrow de una entrega ya evaluada que se abre para corregir. PROVISIONAL (fila 133). */
export const EYEBROW_REEVALUAR = "Ya evaluada · puedes corregir la nota";
/** PROVISIONAL (fila 133): respuesta que no está en la entrega. */
export const SIN_RESPUESTA = "Sin respuesta.";
/** PROVISIONAL (fila 133): imagen que no se pudo firmar (B2 no disponible). */
export const IMAGEN_NO_DISPONIBLE =
  "Respondió con una imagen, pero no se pudo cargar. Recarga la página para verla.";
/** Chip de base de una grupal: la base se aplica por integrante (D177). PROVISIONAL (fila 133). */
export const BASE_GRUPAL_CHIP = "Base de cada integrante";

/** Bloque «No participó» de las grupales (D366). PROVISIONAL (CONTENT_CHECKLIST fila 183). */
export const INTEGRANTES_TITULO = "Integrantes";
export const NO_PARTICIPO_AYUDA = `Quien no participó queda con ${formatNota(NOTA_MIN)} en esta tarea; el equipo conserva su nota.`;
export const NO_PARTICIPO_CASILLA = "No participó";
/** Estado en texto junto al nombre marcado (no solo el ✓). PROVISIONAL (fila 184). */
export const NO_PARTICIPO_ESTADO = `Queda con ${formatNota(NOTA_MIN)}`;
/**
 * Motivo junto al nombre de quien tenía preguntas repartidas y no entregó ninguna (D420): llega
 * premarcado «No participó» y el profe lo puede desmarcar. PROVISIONAL (CONTENT_CHECKLIST fila 229).
 */
export const SIN_PARTE_MOTIVO = "No entregó ninguna parte";

/**
 * «Solo ver» de una grupal evaluada: la base de cada integrante en esta tarea (D403), en el orden
 * de la entrega. «Bases en esta tarea: Ana Pérez 15 · Luis Díaz no participó». PROVISIONAL
 * (CONTENT_CHECKLIST fila 215).
 */
export function basesIntegrantesTexto(
  integrantes: ReadonlyArray<{ cedula: string; nombre: string }>,
  bases: Readonly<Record<string, number>>,
  noParticiparon: readonly string[],
): string {
  const partes = integrantes.map((m) => {
    if (noParticiparon.includes(m.cedula)) return `${m.nombre} no participó`;
    const b = bases[m.cedula];
    return b === undefined ? m.nombre : `${m.nombre} ${formatNota(b)}`;
  });
  return `Bases en esta tarea: ${partes.join(" · ")}`;
}

export type RespuestaEvaluar =
  | { tipo: "texto"; texto: string }
  /** Una o varias (D373), en orden; cada una con su `alt`. */
  | { tipo: "imagen"; imagenes: ReadonlyArray<{ ruta: string; alt: string }> };

export type VistaEvaluar = {
  entregaId: string;
  tipo: Entrega["tipo"];
  titulo: string;
  identidad: ReviewIdentity;
  eyebrow: string;
  linea: string;
  chips: {
    tipo: Entrega["tipo"];
    tipoTexto: string;
    seccion: string;
    base: string;
    premio?: string;
  };
  /**
   * Base de la nota que se ve al abrir: la del alumno en esta tarea (D403); en grupales, 20 (la
   * nota del equipo). En individual, el formulario la cambia en vivo con la que se elija.
   */
  base: number;
  preguntas: Array<{
    id: string;
    enunciado: string;
    valor: number;
    respuesta: RespuestaEvaluar;
  }>;
  /**
   * Grupal: quiénes entregaron (D221), para marcar «No participó» (D364); vacío en individuales.
   * `sinParte`: tenía preguntas repartidas y no entregó ninguna (D420); ausente si no.
   */
  integrantes: Array<{ cedula: string; nombre: string; sinParte?: boolean }>;
  inicial: {
    /** `enviadaEn` de la entrega que se ve: va con Guardar (D397). */
    enviadaEn: number | null;
    puntajes: (number | null)[];
    comentarios: string[];
    /** Comentario general de la evaluación vigente (D445); `""` si no tiene. */
    comentarioGeneral: string;
    /**
     * Cédulas marcadas «No participó» en la evaluación vigente (al reevaluar vienen marcadas).
     * Sin evaluación, las de `entrega.sinParte` (D420): premarcadas, el profe las puede desmarcar.
     */
    noParticiparon: string[];
    /**
     * Base de cada integrante en esta tarea (cédula → base, D403; en individual, solo el
     * titular): la de la evaluación vigente o, si no la trae, la vigente del alumno.
     */
    bases: Record<string, number>;
  };
  /** Filtro activo en texto («Grupales · 5A») o `null`; el enlace «Cambiar» va a `colaHref`. */
  filtroTexto: string | null;
  colaHref: string;
  /** Posición en la cola; `null` si ya está evaluada (se abre para corregir). */
  posicion: { indice: number; total: number } | null;
  siguiente: SiguienteEntrega;
  anteriorHref: string | null;
  saltarHref: string | null;
  /** A dónde va «Guardar»: la siguiente de la cola, o la cola (estado vacío) al acabar. */
  guardarHref: string;
};

function respuestaDe(
  e: Entrega,
  p: Pick<PreguntaBorrador, "id">,
  autor: string,
  numero: number,
): RespuestaEvaluar {
  const r = e.respuestas[p.id];
  if (!r) return { tipo: "texto", texto: SIN_RESPUESTA };
  if ("texto" in r)
    return { tipo: "texto", texto: r.texto.trim() || SIN_RESPUESTA };
  return {
    tipo: "imagen",
    imagenes: imagenesConAlt(rutasImagen(r), autor, numero),
  };
}

/**
 * Props de Evaluar entrega para una entrega real. `cola` es la de `colaPorEvaluar`: si la
 * entrega está en ella, «Anterior»/«Saltar» y «Guardar» siguen la cola; si ya estaba evaluada,
 * «Saltar» y «Guardar» llevan a la primera de la cola (o a la cola vacía).
 */
export function vistaEvaluar({
  entrega,
  tarea,
  cola,
  mapas,
  filtros = {},
}: {
  entrega: ConId<Entrega>;
  tarea: ConId<TareaDoc>;
  /** La cola ya filtrada (`colaFiltradaCon`). */
  cola: ReadonlyArray<ConId<Entrega>>;
  mapas: MapasEvaluar;
  /** Los filtros de la URL: todos los enlaces de salida los conservan (D385). */
  filtros?: FiltrosEvaluar;
}): VistaEvaluar {
  const indice = cola.findIndex((c) => c.id === entrega.id);
  const enCola = indice >= 0;
  const otras = cola.filter((c) => c.id !== entrega.id);
  const sig = enCola ? cola[indice + 1] : otras[0];
  const ant = enCola && indice > 0 ? cola[indice - 1] : undefined;

  const titulo = nombreTitular(entrega, mapas);
  let identidad: ReviewIdentity;
  // Base de cada integrante en esta tarea (D403): la de la evaluación vigente o la vigente
  const bases =
    basesDeEvaluacion(entrega, {}, basesVigentesDe(entrega, mapas.usuarios)) ??
    {};
  let baseAlumno: number = NOTA_MAX;
  if (entrega.tipo === "grupal") {
    const eq = mapas.equipos.get(entrega.titularId);
    identidad = {
      tipo: "equipo",
      teamId: entrega.titularId,
      tema: eq?.tema ?? eq?.nombre ?? titulo,
    };
  } else {
    const u = mapas.usuarios.get(entrega.titularId);
    identidad = {
      tipo: "alumno",
      estilo: estiloDe(u?.avatar.estilo ?? ""),
      seed: u?.avatar.semilla ?? entrega.titularId,
      nombre: titulo,
    };
    baseAlumno = bases[entrega.titularId] ?? NOTA_MAX;
  }

  const autor = entrega.enviadaPor
    ? mapas.usuarios.get(entrega.enviadaPor)
    : undefined;
  const tituloT = tarea.titulo;
  const linea =
    entrega.enviadaEn === null
      ? tituloT
      : entregaLinea({
          tarea: tituloT,
          tipo: entrega.tipo,
          autor: autor ? nombreCorto(autor) : undefined,
          fecha: diaDeInstante(entrega.enviadaEn),
          hora: hora24DeInstante(entrega.enviadaEn),
        });

  // Quién respondió, para el `alt` de las imágenes
  const autorAlt = autor ? nombreCorto(autor) : titulo;
  const ev = entrega.evaluacion;
  const preguntas = (
    tarea.estado === "borrador" ? [] : (tarea.preguntas as Pregunta[])
  ).map((p, i) => ({
    id: p.id,
    enunciado: p.enunciado,
    valor: p.valor,
    respuesta: respuestaDe(entrega, p, autorAlt, i + 1),
  }));

  return {
    entregaId: entrega.id,
    tipo: entrega.tipo,
    titulo,
    identidad,
    eyebrow: enCola ? eyebrowEvaluar(indice, cola.length) : EYEBROW_REEVALUAR,
    linea,
    chips: {
      tipo: entrega.tipo,
      tipoTexto: tipoChipTexto(
        entrega.tipo,
        entrega.tipo === "grupal" ? entrega.integrantes.length : undefined,
      ),
      seccion: `Sección ${entrega.seccion}`,
      base:
        entrega.tipo === "grupal"
          ? BASE_GRUPAL_CHIP
          : `Base ${formatNota(baseAlumno)}`,
      premio: tarea.premio ? tarea.premio : undefined,
    },
    base: baseEfectiva(entrega.tipo, baseAlumno),
    preguntas,
    integrantes:
      entrega.tipo === "grupal"
        ? entrega.integrantes.map((cedula) => {
            const u = mapas.usuarios.get(cedula);
            return {
              cedula,
              nombre: u ? nombreCorto(u) : TITULAR_DESCONOCIDO,
              ...(entrega.sinParte?.includes(cedula) ? { sinParte: true } : {}),
            };
          })
        : [],
    inicial: {
      enviadaEn: entrega.enviadaEn,
      puntajes: preguntas.map((p) => ev?.puntos?.[p.id] ?? null),
      comentarios: preguntas.map((p) => ev?.comentarios[p.id] ?? ""),
      comentarioGeneral: ev?.comentarioGeneral ?? "",
      // Con evaluación manda lo que el profe guardó; sin ella, el premarcado del reparto (D420)
      noParticiparon:
        entrega.tipo !== "grupal"
          ? []
          : ev
            ? [...(ev.noParticiparon ?? [])]
            : (entrega.sinParte ?? []).filter((c) =>
                entrega.integrantes.includes(c),
              ),
      bases,
    },
    posicion: enCola ? { indice, total: cola.length } : null,
    siguiente: siguienteDe(sig, mapas),
    filtroTexto: resumenFiltros(filtros, mapas),
    colaHref: rutaCola(filtros),
    anteriorHref: ant ? rutaEntrega(ant.id, filtros) : null,
    saltarHref: sig ? rutaEntrega(sig.id, filtros) : null,
    guardarHref: sig ? rutaEntrega(sig.id, filtros) : rutaCola(filtros),
  };
}
