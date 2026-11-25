// Entrega ideal de una tarea (tanda 11-14 Z2, D430–D435). Puro (sin Postgres ni React): el tipo
// de la fila, la entrada de las Server Actions, qué entrega es elegible, la validación, la vigencia
// al leer, quién la puede ver, las vistas del profe y del alumno y sus textos. La persistencia está
// en lib/data/ideales.ts.
//
// Dos formas, nunca las dos (D430): la entrega de un alumno o equipo con puntaje 20 / 20 (D431) o
// la respuesta que escribe el profe, un texto por pregunta (también en las de imagen: sin subir
// archivos, D432). El porqué general es obligatorio; el de cada pregunta, opcional. Los alumnos de
// las secciones de la tarea la ven solo con la tarea ya cerrada (D433). Una ideal cuya entrega se
// devolvió o bajó de 20 deja de existir para el alumno y el profe ve el aviso (D434); eliminar la
// entrega o la tarea la borra (D531).
import { z } from "zod";
import { cerradaParaTodos, type TareaConVencimiento } from "@/lib/estado-tarea";
import { zIdDocumento } from "@/lib/evaluar-datos";
import { NOTA_MAX } from "@/lib/grades";
import {
  type Entrega,
  type Equipo,
  type Pregunta,
  type Respuesta,
  rutasImagen,
  type SeccionId,
  type TareaDoc,
  type Usuario,
  zInstante,
} from "@/lib/modelo";
import { semillaConCedula } from "@/lib/perfil";

/* ---------- Límites ---------- */

/** Máximo del porqué general y de cada nota por pregunta. */
export const NOTA_IDEAL_MAX = 1000;
/** Máximo de cada respuesta escrita por el profe (como la del alumno, `zRespuesta`). */
export const RESPUESTA_IDEAL_MAX = 5000;

const zIdPregunta = z.string().regex(/^[A-Za-z0-9_-]{1,40}$/, "Id inválido");

/* ---------- La fila ---------- */

export const zIdeal = z
  .object({
    tareaId: zIdDocumento,
    entregaId: zIdDocumento.nullable(),
    respuestas: z
      .record(zIdPregunta, z.string().trim().min(1).max(RESPUESTA_IDEAL_MAX))
      .nullable(),
    nota: z.string().trim().min(1).max(NOTA_IDEAL_MAX),
    notas: z.record(zIdPregunta, z.string().trim().min(1).max(NOTA_IDEAL_MAX)),
    autorId: z.string().min(1),
    actualizadoEn: zInstante,
  })
  .superRefine((i, ctx) => {
    if ((i.entregaId === null) === (i.respuestas === null)) {
      ctx.addIssue({
        code: "custom",
        message: "La ideal es de una entrega o del profe, no las dos",
      });
    }
  });
export type Ideal = z.infer<typeof zIdeal>;

/* ---------- Entrada de las Server Actions ---------- */

export const zGuardarIdeal = z.object({
  tareaId: zIdDocumento,
  forma: z.discriminatedUnion("tipo", [
    z.object({ tipo: z.literal("entrega"), entregaId: zIdDocumento }),
    z.object({
      tipo: z.literal("profe"),
      respuestas: z.record(zIdPregunta, z.string().max(RESPUESTA_IDEAL_MAX)),
    }),
  ]),
  nota: z.string().max(NOTA_IDEAL_MAX),
  /** Vacías = sin nota en esa pregunta. */
  notas: z.record(zIdPregunta, z.string().max(NOTA_IDEAL_MAX)),
  /**
   * La versión que vio el formulario (D532): el `actualizadoEn` de la ideal guardada, o
   * `VERSION_IDEAL_SIN_FILA` si no había. Si otro profe guardó o la quitó después, `cambio`. Sin
   * ella (llamadas viejas) no se comprueba.
   */
  version: zInstante.optional(),
});
export type GuardarIdeal = z.infer<typeof zGuardarIdeal>;

export const zQuitarIdeal = z.object({
  tareaId: zIdDocumento,
  /** Versión de la ideal cuando se abrió la lista (D532, D551): si cambió, `cambio`. Sin ella, quita igual. */
  version: zInstante.optional(),
});
export type QuitarIdeal = z.infer<typeof zQuitarIdeal>;

/** La tarea aún no tiene ideal guardada: su versión vale 0 (D532). */
export const VERSION_IDEAL_SIN_FILA = 0;

/** Versión que deja un guardado: el instante, o una más si el reloj no avanzó (como D509). */
export function versionIdealNueva(anterior: number, ahora: number): number {
  return ahora > anterior ? ahora : anterior + 1;
}

export type ErrorIdeal =
  | "invalida"
  | "no-existe"
  /** La tarea es un borrador: no tiene entregas ni alumnos que la vean. */
  | "borrador"
  /** Falta el porqué general. */
  | "sin-nota"
  /** El profe dejó una pregunta sin respuesta. */
  | "incompleta"
  /** La entrega ya no tiene 20 / 20, se devolvió o se eliminó. */
  | "no-elegible"
  /** Otro profe guardó (o quitó) la ideal desde que se abrió el formulario (D532). */
  | "cambio"
  | "red";

/** `cambio` trae la versión de ahora: con ella, el siguiente «Guardar» reemplaza (D532). */
export type ResultadoIdeal =
  | { ok: true }
  | { ok: false; error: "cambio"; version: number }
  | { ok: false; error: Exclude<ErrorIdeal, "cambio"> };

/* ---------- Reglas ---------- */

/** ¿Puede ser la ideal? Entrega de ESA tarea, evaluada y con puntaje 20 / 20 (D431). */
export function esElegible(
  e: Pick<Entrega, "tareaId" | "estado" | "evaluacion"> &
    Partial<Pick<Entrega, "enviadaEn">>,
  tareaId: string,
): boolean {
  return (
    e.tareaId === tareaId &&
    e.estado === "evaluada" &&
    e.evaluacion?.puntaje === NOTA_MAX &&
    // Una nota puesta sin entrega (D581) no tiene respuestas que mostrar como ideal
    e.enviadaEn !== null
  );
}

/** Quita los vacíos y las preguntas que la tarea no tiene. */
function limpiar(
  textos: Readonly<Record<string, string>>,
  ids: ReadonlySet<string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [id, t] of Object.entries(textos)) {
    const v = t.trim();
    if (v && ids.has(id)) out[id] = v;
  }
  return out;
}

/**
 * Valida lo que manda el profe contra la tarea y (si parte de una) la entrega, y arma la fila.
 * El orden importa para el mensaje: tarea → porqué → forma.
 */
export function validarIdeal(
  entrada: GuardarIdeal,
  tarea: Pick<TareaDoc, "estado" | "preguntas"> | null,
  entrega:
    | (Pick<Entrega, "tareaId" | "estado" | "evaluacion"> & { id: string })
    | null,
  autorId: string,
  ahora: number,
):
  | { ok: true; ideal: Ideal }
  | { ok: false; error: Exclude<ErrorIdeal, "cambio"> } {
  if (!tarea) return { ok: false, error: "no-existe" };
  if (tarea.estado === "borrador") return { ok: false, error: "borrador" };
  const nota = entrada.nota.trim();
  if (!nota) return { ok: false, error: "sin-nota" };
  const ids = new Set(tarea.preguntas.map((p) => p.id));
  const notas = limpiar(entrada.notas, ids);
  const base = {
    tareaId: entrada.tareaId,
    nota,
    notas,
    autorId,
    actualizadoEn: ahora,
  };
  if (entrada.forma.tipo === "entrega") {
    if (
      !entrega ||
      entrega.id !== entrada.forma.entregaId ||
      !esElegible(entrega, entrada.tareaId)
    )
      return { ok: false, error: "no-elegible" };
    return {
      ok: true,
      ideal: { ...base, entregaId: entrega.id, respuestas: null },
    };
  }
  const respuestas = limpiar(entrada.forma.respuestas, ids);
  if (ids.size === 0 || [...ids].some((id) => !respuestas[id]))
    return { ok: false, error: "incompleta" };
  return { ok: true, ideal: { ...base, entregaId: null, respuestas } };
}

export type Vigencia = "vigente" | "sin-entrega" | "no-elegible";

/**
 * Al leer (D434): la del profe siempre vale; la de un alumno, solo si su entrega sigue existiendo
 * y sigue siendo elegible (no se eliminó, no se devolvió, no se corrigió a menos de 20).
 */
export function vigencia(
  ideal: Pick<Ideal, "tareaId" | "entregaId">,
  entrega: Pick<Entrega, "tareaId" | "estado" | "evaluacion"> | null,
): Vigencia {
  if (ideal.entregaId === null) return "vigente";
  if (!entrega) return "sin-entrega";
  return esElegible(entrega, ideal.tareaId) ? "vigente" : "no-elegible";
}

/**
 * ¿La ve este alumno? (D433) Tarea publicada, de su sección y cerrada para todos en `ahora`
 * (D453): vencida sin prórrogas vigentes o cerrada a mano. La vigencia se comprueba aparte: sin
 * ideal vigente tampoco hay nada que ver.
 */
export function alumnoPuedeVer(
  tarea: (TareaConVencimiento & Pick<TareaDoc, "secciones">) | null,
  seccion: SeccionId | null,
  ahora: number,
): boolean {
  if (!tarea || seccion === null) return false;
  return cerradaParaTodos(tarea, ahora) && tarea.secciones.includes(seccion);
}

/* ---------- Autor ---------- */

export type AutorIdeal =
  | {
      tipo: "alumno";
      nombre: string;
      avatar: { estilo: string; semilla: string } | null;
    }
  | {
      tipo: "equipo";
      nombre: string;
      equipoId: string;
      tema: string;
      logoPath: string | null;
    }
  | { tipo: "profe" };

/** Nombre que se usa cuando el alumno o el equipo ya no existen. */
export const AUTOR_DESCONOCIDO = "Sin nombre";

/** Quién hizo la ideal: el alumno o el equipo de la entrega, o los profes. */
export function autorDe(
  ideal: Pick<Ideal, "entregaId">,
  entrega: Pick<
    Entrega,
    "tipo" | "titularId" | "titularNombre" | "integrantes"
  > | null,
  usuarios: ReadonlyMap<
    string,
    Pick<Usuario, "nombres" | "apellidos" | "avatar">
  >,
  equipos: ReadonlyMap<string, Pick<Equipo, "nombre" | "tema" | "logoPath">>,
): AutorIdeal {
  if (ideal.entregaId === null || !entrega) return { tipo: "profe" };
  if (entrega.tipo === "grupal") {
    const eq = equipos.get(entrega.titularId);
    const nombre = eq?.nombre ?? entrega.titularNombre ?? AUTOR_DESCONOCIDO;
    return {
      tipo: "equipo",
      nombre,
      equipoId: entrega.titularId,
      tema: eq?.tema ?? nombre,
      logoPath: eq?.logoPath ?? null,
    };
  }
  const u = usuarios.get(entrega.titularId);
  return u
    ? {
        tipo: "alumno",
        nombre: `${u.nombres} ${u.apellidos}`.replace(/\s+/g, " ").trim(),
        // Una semilla que aún contiene su cédula no sale a otros alumnos (D388, D496)
        avatar: semillaConCedula(u.avatar.semilla, entrega.titularId)
          ? null
          : u.avatar,
      }
    : { tipo: "alumno", nombre: AUTOR_DESCONOCIDO, avatar: null };
}

/* ---------- Vista del profe (lista de entregas) ---------- */

export type EstadoIdealProfe =
  | { tipo: "ninguna" }
  | {
      tipo: "vigente";
      /** «de Adela Pérez», «del equipo Los Pixel» o «de los profesores». */
      deQuien: string;
      entregaId: string | null;
    }
  /** La entrega elegida ya no vale (D434): los alumnos no la ven; hay que elegir otra o quitarla. */
  | { tipo: "caducada"; deQuien: string | null };

export function deQuienTexto(a: AutorIdeal): string {
  switch (a.tipo) {
    case "alumno":
      return `de ${a.nombre}`;
    case "equipo":
      return `del equipo ${a.nombre}`;
    case "profe":
      return "escrita por los profesores";
  }
}

/** Estado de la ideal para el profe: ninguna, vigente (de quién) o caducada (D434). */
export function estadoIdealProfe(
  ideal: Pick<Ideal, "tareaId" | "entregaId"> | null,
  entrega:
    | (Pick<
        Entrega,
        | "tipo"
        | "titularId"
        | "titularNombre"
        | "integrantes"
        | "tareaId"
        | "estado"
        | "evaluacion"
      > & { id: string })
    | null,
  usuarios: Parameters<typeof autorDe>[2],
  equipos: Parameters<typeof autorDe>[3],
): EstadoIdealProfe {
  if (!ideal) return { tipo: "ninguna" };
  const v = vigencia(ideal, entrega);
  if (v !== "vigente") {
    const deQuien = entrega
      ? deQuienTexto(autorDe(ideal, entrega, usuarios, equipos))
      : null;
    return { tipo: "caducada", deQuien };
  }
  return {
    tipo: "vigente",
    deQuien: deQuienTexto(autorDe(ideal, entrega, usuarios, equipos)),
    entregaId: ideal.entregaId,
  };
}

/* ---------- Vista del alumno ---------- */

/** Respuesta de una pregunta de la ideal: texto, enlace (D468) o rutas de imagen que la página firma. */
export type RespuestaIdeal =
  | { tipo: "texto"; texto: string }
  | { tipo: "url"; url: string }
  | { tipo: "imagen"; rutas: string[] };

export type PreguntaIdeal = {
  id: string;
  numero: number;
  enunciado: string;
  valor: number;
  /** `null` = el autor no respondió esa pregunta (no debería pasar con 20 / 20). */
  respuesta: RespuestaIdeal | null;
  /** Por qué es ideal esta respuesta; `null` sin nota. */
  nota: string | null;
};

export type VistaIdeal = {
  titulo: string;
  autor: AutorIdeal;
  /** Por qué es ideal (general). */
  nota: string;
  preguntas: PreguntaIdeal[];
};

function respuestaDe(r: Respuesta | undefined): RespuestaIdeal | null {
  if (!r) return null;
  if ("texto" in r)
    return r.texto.trim() ? { tipo: "texto", texto: r.texto } : null;
  if ("url" in r) return { tipo: "url", url: r.url };
  return { tipo: "imagen", rutas: rutasImagen(r) };
}

/**
 * Lo que pinta la página del alumno: el porqué general, el autor y, por pregunta, enunciado,
 * respuesta y su nota. Nunca la nota, la base, el puntaje ni los comentarios de la evaluación del
 * autor (D433): de la entrega solo se leen las respuestas.
 */
export function vistaIdeal(datos: {
  tarea: { titulo: string; preguntas: readonly Pregunta[] };
  ideal: Ideal;
  entrega: Pick<Entrega, "respuestas"> | null;
  autor: AutorIdeal;
}): VistaIdeal {
  const { tarea, ideal, entrega, autor } = datos;
  return {
    titulo: tarea.titulo,
    autor,
    nota: ideal.nota,
    preguntas: tarea.preguntas.map((p, i) => {
      const escrita = ideal.respuestas?.[p.id];
      return {
        id: p.id,
        numero: i + 1,
        enunciado: p.enunciado,
        valor: p.valor,
        respuesta:
          ideal.respuestas !== null
            ? escrita
              ? { tipo: "texto", texto: escrita }
              : null
            : respuestaDe(entrega?.respuestas[p.id]),
        nota: ideal.notas[p.id] ?? null,
      };
    }),
  };
}

/** Las respuestas de una entrega en el orden de las preguntas (el formulario del profe). */
export function respuestasDeEntrega(
  preguntas: ReadonlyArray<Pick<Pregunta, "id">>,
  e: Pick<Entrega, "respuestas">,
): Array<RespuestaIdeal | null> {
  return preguntas.map((p) => respuestaDe(e.respuestas[p.id]));
}

/** Rutas de imagen que pinta la vista (las únicas que se firman, D195). */
export function rutasVista(v: VistaIdeal): string[] {
  return v.preguntas.flatMap((p) =>
    p.respuesta?.tipo === "imagen" ? p.respuesta.rutas : [],
  );
}

/* ---------- Rutas ---------- */

export const rutaIdealProfe = (
  tareaId: string,
  q: { entrega?: string; forma?: "profe" } = {},
) => {
  const s = new URLSearchParams();
  if (q.entrega) s.set("entrega", q.entrega);
  if (q.forma) s.set("forma", q.forma);
  const qs = s.toString();
  return `/profe/tareas/${tareaId}/ideal${qs ? `?${qs}` : ""}`;
};

export const rutaIdealAlumno = (tareaId: string) => `/tareas/${tareaId}/ideal`;

/* ---------- Textos (PROVISIONAL, CONTENT_CHECKLIST filas 235–240) ---------- */

/** Ítem del menú de la fila y su nombre accesible (fila 235). */
export const MARCAR_IDEAL_TEXTO = "Marcar como entrega ideal";
export const ES_IDEAL_TEXTO = "Entrega ideal";

/** Aviso antes de guardar la de un alumno o equipo (fila 235, D435). */
export function avisoAutorTitulo(a: AutorIdeal): string {
  return a.tipo === "equipo"
    ? `¿Mostrar la entrega del equipo ${a.nombre}?`
    : a.tipo === "alumno"
      ? `¿Mostrar la entrega de ${a.nombre}?`
      : "¿Guardar la entrega ideal?";
}

export function avisoAutorTexto(a: AutorIdeal): string {
  return a.tipo === "equipo"
    ? `Cuando la tarea cierre, toda la sección verá estas respuestas con el nombre y el logo del equipo ${a.nombre}. No verán su nota ni tus comentarios.`
    : a.tipo === "alumno"
      ? `Cuando la tarea cierre, toda la sección verá estas respuestas con el nombre y el avatar de ${a.nombre}. No verán su nota ni tus comentarios.`
      : "Cuando la tarea cierre, toda la sección verá estas respuestas como «Respuesta de tus profesores».";
}

/** Estado en la lista de entregas (fila 236). */
export function estadoIdealTitulo(e: EstadoIdealProfe): string {
  switch (e.tipo) {
    case "ninguna":
      return "Todavía no hay entrega ideal";
    case "vigente":
      return `Entrega ideal ${e.deQuien}`;
    case "caducada":
      return "La entrega ideal ya no se muestra";
  }
}

export function estadoIdealTexto(
  e: EstadoIdealProfe,
  tareaAbierta: boolean,
): string {
  switch (e.tipo) {
    case "ninguna":
      return "Elige una entrega con 20 / 20 en el menú de su fila o escribe tú la respuesta ideal.";
    case "vigente":
      return tareaAbierta
        ? "Los alumnos la verán cuando la tarea cierre."
        : "Los alumnos de la tarea ya la pueden ver.";
    case "caducada":
      return e.deQuien
        ? `Era la entrega ${e.deQuien}, pero ya no tiene 20 / 20 (se corrigió o se devolvió): los alumnos no la ven. Elige otra o quítala.`
        : "La entrega elegida se eliminó: los alumnos no la ven. Elige otra o quítala.";
  }
}

export const ESCRIBIR_IDEAL_TEXTO = "Escribir la respuesta ideal";
export const EDITAR_IDEAL_TEXTO = "Editar";
export const QUITAR_IDEAL_TEXTO = "Quitar";
export const QUITAR_IDEAL_TITULO = "¿Quitar la entrega ideal?";
export const QUITAR_IDEAL_DESCRIPCION =
  "Los alumnos dejan de verla. Las entregas y las notas no cambian.";

/** Formulario (fila 237). */
export const NOTA_GENERAL_LABEL = "Por qué es la entrega ideal";
export const NOTA_GENERAL_AYUDA =
  "Los alumnos lo leen arriba de todo. Obligatorio.";
export const NOTA_PREGUNTA_LABEL = "Por qué es ideal esta respuesta (opcional)";
export const RESPUESTA_PROFE_LABEL = "Respuesta ideal";
export const RESPUESTA_IMAGEN_AYUDA =
  "Esta pregunta se responde con imagen: describe en texto cómo sería la ideal (aquí no se suben imágenes).";
export const GUARDAR_IDEAL_TEXTO = "Guardar entrega ideal";
export const IDEAL_GUARDADA_TEXTO = "Entrega ideal guardada.";
export const IDEAL_QUITADA_TEXTO = "Se quitó la entrega ideal.";

/** «Quitar» con una lista vieja (D551): otro profe cambió o quitó la ideal. */
// PROVISIONAL (fila 302)
export const QUITAR_IDEAL_CAMBIO_TEXTO =
  "Otro profe cambió la entrega ideal de esta tarea mientras tanto. No quitamos nada: la lista ya muestra lo de ahora. Si todavía quieres quitarla, vuelve a pulsar «Quitar».";

/** Errores (fila 238). */
export function errorIdealTexto(e: ErrorIdeal): string {
  switch (e) {
    case "no-existe":
      return "Esta tarea ya no existe. Recarga la página.";
    case "borrador":
      return "La tarea todavía es un borrador: publícala antes de elegir la entrega ideal.";
    case "sin-nota":
      return "Escribe por qué es la entrega ideal.";
    case "incompleta":
      return "Escribe la respuesta ideal de cada pregunta.";
    case "no-elegible":
      return "Esa entrega ya no tiene 20 / 20 (se corrigió, se devolvió o se eliminó). Elige otra o escribe tú la respuesta ideal.";
    case "cambio":
      // PROVISIONAL (fila 291, D532)
      return "Otro profe cambió la entrega ideal de esta tarea mientras escribías. No guardamos nada: lo tuyo sigue aquí. Si vuelves a guardar, reemplazas la suya.";
    case "red":
      return "No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.";
    default:
      return "No se pudo guardar. Recarga la página e inténtalo de nuevo.";
  }
}

/** Alumno (fila 239). */
export const VER_IDEAL_TEXTO = "Ver la entrega ideal";
export const VER_IDEAL_AYUDA =
  "Mira una entrega de 20 / 20 y por qué tus profes la eligieron.";
export const IDEAL_TITULO = "Entrega ideal";
export const AUTOR_PROFE_TEXTO = "Respuesta de tus profesores";
export const NOTA_GENERAL_ALUMNO = "Por qué es la entrega ideal";
export const NOTA_PREGUNTA_ALUMNO = "Por qué es ideal";
export const RESPUESTA_IDEAL_ALUMNO = "Respuesta";
/** La imagen no se pudo firmar (fila 239). */
export const IMAGEN_NO_DISPONIBLE = "La imagen no está disponible ahora.";
export const SIN_RESPUESTA_TEXTO = "Sin respuesta en esta pregunta.";

export function autorIdealTexto(a: AutorIdeal): string {
  switch (a.tipo) {
    case "alumno":
      return `Entrega de ${a.nombre}`;
    case "equipo":
      return `Entrega del equipo ${a.nombre}`;
    case "profe":
      return AUTOR_PROFE_TEXTO;
  }
}
