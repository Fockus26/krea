// Evaluar con datos de Firestore (fase 07 W7, D204–D206). Puro (sin Firebase ni reloj): qué
// manda el formulario, qué evaluación se escribe (`armarEvaluacion`), qué devuelve «Deshacer»
// (`deshacerEvaluacion`), la cola «Por evaluar» y las props de la pantalla. Lo usan los
// adaptadores del Admin SDK (`lib/firebase/evaluar.ts`), las páginas del profe y las pruebas.
//
// La nota NO se guarda: se deriva de `puntaje × base / 20` (D013, D176). Aquí solo se valida y se
// suma el puntaje por pregunta en medios enteros (D004); la nota de la vista sale de `lib/grades`.
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
import { formatNota, NOTA_MAX } from "@/lib/grades";
import {
  type Entrega,
  type Equipo,
  type Evaluacion,
  type Pregunta,
  type PreguntaBorrador,
  sumaValores,
  type TareaDoc,
  type Usuario,
  zInstante,
  zPuntaje,
} from "@/lib/modelo";
import { answerImageAlt } from "@/lib/question";
import { estiloDe, nombreCorto } from "@/lib/vistas-estudiante";

type ConId<T> = { id: string } & T;

/** Ruta de la cola de Evaluar (D148). */
export const RUTA_EVALUAR = "/profe/evaluar";

export function rutaEntrega(id: string): string {
  return `${RUTA_EVALUAR}/${id}`;
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
  /** Comentario por pregunta (id → texto); vacío = sin comentario. */
  comentarios: z.record(zIdPregunta, z.string().trim().max(1000)),
  /**
   * `evaluadaEn` de la evaluación con la que se abrió el formulario (`null` = estaba Pendiente).
   * Si ya no es la vigente, otro la cambió mientras tanto y no se pisa (`cambio`; QA versión 1,
   * F-M1; D224).
   */
  version: zInstante.nullable(),
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
 * El puntaje total es la suma en medios enteros (sin errores de coma flotante).
 */
export function armarEvaluacion({
  entrega,
  tarea,
  envio,
  autorId,
  ahora,
}: {
  entrega: Entrega;
  tarea: TareaDoc;
  envio: GuardarEvaluacion;
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
  return {
    ok: true,
    evaluacion: {
      puntos,
      comentarios,
      puntaje,
      evaluadaPor: autorId,
      evaluadaEn: ahora,
    },
  };
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

/** Nombre del titular: el equipo, o «Yeilin Duarte». */
export function nombreTitular(e: Entrega, m: MapasEvaluar): string {
  if (e.tipo === "grupal") {
    return m.equipos.get(e.titularId)?.nombre ?? TITULAR_DESCONOCIDO;
  }
  const u = m.usuarios.get(e.titularId);
  return u ? nombreCorto(u) : TITULAR_DESCONOCIDO;
}

export function tituloTarea(e: Entrega, m: MapasEvaluar): string {
  return m.tareas.get(e.tareaId)?.titulo ?? TAREA_DESCONOCIDA;
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

export type RespuestaEvaluar =
  | { tipo: "texto"; texto: string }
  | { tipo: "imagen"; ruta: string; alt: string };

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
  /** Base de la nota que se ve al evaluar: la del alumno; en grupales, 20 (nota del equipo). */
  base: number;
  preguntas: Array<{
    id: string;
    enunciado: string;
    valor: number;
    respuesta: RespuestaEvaluar;
  }>;
  inicial: { puntajes: (number | null)[]; comentarios: string[] };
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
  if ("imagenPath" in r) {
    return {
      tipo: "imagen",
      ruta: r.imagenPath,
      alt: answerImageAlt(autor, numero),
    };
  }
  return { tipo: "texto", texto: r.texto.trim() || SIN_RESPUESTA };
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
}: {
  entrega: ConId<Entrega>;
  tarea: ConId<TareaDoc>;
  cola: ReadonlyArray<ConId<Entrega>>;
  mapas: MapasEvaluar;
}): VistaEvaluar {
  const indice = cola.findIndex((c) => c.id === entrega.id);
  const enCola = indice >= 0;
  const otras = cola.filter((c) => c.id !== entrega.id);
  const sig = enCola ? cola[indice + 1] : otras[0];
  const ant = enCola && indice > 0 ? cola[indice - 1] : undefined;

  const titulo = nombreTitular(entrega, mapas);
  let identidad: ReviewIdentity;
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
    baseAlumno = u?.base ?? NOTA_MAX;
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
      premio:
        entrega.tipo === "grupal" && tarea.premio ? tarea.premio : undefined,
    },
    base: baseEfectiva(entrega.tipo, baseAlumno),
    preguntas,
    inicial: {
      puntajes: preguntas.map((p) => ev?.puntos?.[p.id] ?? null),
      comentarios: preguntas.map((p) => ev?.comentarios[p.id] ?? ""),
    },
    posicion: enCola ? { indice, total: cola.length } : null,
    siguiente: siguienteDe(sig, mapas),
    anteriorHref: ant ? rutaEntrega(ant.id) : null,
    saltarHref: sig ? rutaEntrega(sig.id) : null,
    guardarHref: sig ? rutaEntrega(sig.id) : RUTA_EVALUAR,
  };
}
