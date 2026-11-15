// Lista de entregas de una tarea para el profe (/profe/tareas/[id]/entregas, D398–D401). Puro
// (sin Postgres ni React): una fila por titular — el alumno en una individual, el equipo en una
// grupal con sus integrantes y la nota propia de cada uno —, con estado, puntaje sobre 20, base,
// nota y a dónde lleva «Ver» y «Evaluar»/«Corregir». La nota no se guarda: sale de
// `puntaje × base / 20` con la base de esa entrega (D013, D403; si no la guardó, la vigente);
// «No participó» queda en NOTA_MIN (D365).

import { puedeDevolver } from "@/lib/devolver-entrega";
import {
  nombreGrupal,
  rutaEntrega,
  TITULAR_DESCONOCIDO,
} from "@/lib/evaluar-datos";
import { formatNota, NOTA_MIN } from "@/lib/grades";
import { esElegible, rutaIdealProfe } from "@/lib/ideal";
import type {
  Entrega,
  Equipo,
  EstadoTareaId,
  SeccionId,
  Usuario,
} from "@/lib/modelo";
import {
  baseDeIntegrante,
  noParticipo,
  notaDeIntegrante,
} from "@/lib/ranking-datos";
import { ordenarSecciones } from "@/lib/secciones";

type ConId<T> = { id: string } & T;

export type EstadoFilaEntrega = "sin-entregar" | "por-evaluar" | "evaluada";

/** Un integrante de una entrega grupal con su nota propia (D177: base por integrante). */
export type FilaIntegrante = {
  cedula: string;
  nombre: string;
  /** Base de esta entrega (D403; si no la guardó, la vigente); `null` si no hay ninguna. */
  base: number | null;
  /** Nota con su base; `null` = Pendiente (D003). «No participó» = NOTA_MIN (D365). */
  nota: number | null;
  noParticipo: boolean;
};

export type FilaEntregaTarea = {
  /** Cédula (individual) o id del equipo (grupal). */
  titularId: string;
  tipo: "individual" | "grupal";
  seccion: SeccionId;
  nombre: string;
  estado: EstadoFilaEntrega;
  /** Id de la entrega; `null` = sin entregar. */
  entregaId: string | null;
  /** Sobre 20; `null` mientras no esté evaluada. */
  puntaje: number | null;
  /**
   * Individual: la base de esta entrega si se evaluó con una (D403); si no, la vigente del
   * alumno. Grupal: `null` (cada integrante tiene la suya).
   */
  base: number | null;
  /** Individual evaluada: su nota. Grupal: `null` (la nota es de cada integrante). */
  nota: number | null;
  integrantes: readonly FilaIntegrante[];
  /** Enlace a la entrega solo para verla (`?ver`); `null` si no hay entrega. */
  verHref: string | null;
  /** «Evaluar» (por evaluar) o «Corregir» (evaluada): abre la entrega SIN `?ver`. */
  accion: "evaluar" | "corregir" | null;
  accionHref: string | null;
  /** «Devolver al alumno»: evaluada y con la tarea abierta (D411). */
  puedeDevolver: boolean;
  /** Lo que el profe ve, para que devolver o eliminar no pisen un cambio (D413). */
  enviadaEn: number | null;
  evaluadaEn: number | null;
  /** «Marcar como entrega ideal»: solo evaluada con 20 / 20 (D431); `null` si no es elegible. */
  idealHref: string | null;
};

const comparaNombre = new Intl.Collator("es", { sensitivity: "base" });

const nombreCompleto = (u: Pick<Usuario, "nombres" | "apellidos">) =>
  `${u.nombres} ${u.apellidos}`.replace(/\s+/g, " ").trim();

function integranteDe(
  e: Entrega,
  cedula: string,
  usuarios: ReadonlyMap<string, Usuario>,
): FilaIntegrante {
  const u = usuarios.get(cedula);
  const noPart = noParticipo(e, cedula);
  // La de la entrega; si no la guardó, la vigente (un alumno que ya no existe no tiene)
  const base = u
    ? baseDeIntegrante(e, cedula, u.base)
    : (e.evaluacion?.bases?.[cedula] ?? null);
  return {
    cedula,
    nombre: u ? nombreCompleto(u) : TITULAR_DESCONOCIDO,
    base,
    nota:
      base !== null
        ? notaDeIntegrante(e, base, cedula)
        : noPart
          ? NOTA_MIN
          : null,
    noParticipo: noPart,
  };
}

function filaDeEntrega(
  e: ConId<Entrega>,
  usuarios: ReadonlyMap<string, Usuario>,
  equipos: ReadonlyMap<string, Pick<Equipo, "nombre">>,
  tarea: { id: string; estado?: EstadoTareaId },
): FilaEntregaTarea {
  const evaluada = e.estado === "evaluada";
  const grupal = e.tipo === "grupal";
  const titular = grupal ? undefined : usuarios.get(e.titularId);
  const integrantes = grupal
    ? e.integrantes.map((c) => integranteDe(e, c, usuarios))
    : [];
  return {
    titularId: e.titularId,
    tipo: e.tipo,
    seccion: e.seccion,
    nombre: grupal
      ? nombreGrupal(e, equipos)
      : titular
        ? nombreCompleto(titular)
        : TITULAR_DESCONOCIDO,
    estado: evaluada ? "evaluada" : "por-evaluar",
    entregaId: e.id,
    puntaje: evaluada ? (e.evaluacion?.puntaje ?? null) : null,
    base: grupal
      ? null
      : titular
        ? baseDeIntegrante(e, titular.cedula, titular.base)
        : (e.evaluacion?.bases?.[e.titularId] ?? null),
    nota:
      grupal || !titular
        ? null
        : notaDeIntegrante(e, titular.base, titular.cedula),
    integrantes,
    verHref: `${rutaEntrega(e.id)}?ver`,
    accion: evaluada ? "corregir" : "evaluar",
    accionHref: rutaEntrega(e.id),
    // Sin el estado de la tarea no se ofrece: devolver en una cerrada no tiene arreglo (D411)
    puedeDevolver: puedeDevolver(e, tarea),
    enviadaEn: e.enviadaEn,
    evaluadaEn: e.evaluacion?.evaluadaEn ?? null,
    idealHref: esElegible(e, tarea.id)
      ? rutaIdealProfe(tarea.id, { entrega: e.id })
      : null,
  };
}

/**
 * Las filas de la tarea: cada entrega enviada (por evaluar o evaluada, con el equipo con el que
 * se entregó aunque el alumno ya se haya movido, D221) y quienes todavía no entregan — los
 * alumnos de las secciones de la tarea (individual) o los equipos vivos de esas secciones
 * (grupal). Un borrador no cuenta como entrega. Por sección y por nombre.
 */
export function filasEntregasTarea(datos: {
  tarea: {
    id: string;
    tipo: "individual" | "grupal";
    secciones: readonly SeccionId[];
    /** Sin él, ninguna fila ofrece «Devolver» (D411). */
    estado?: EstadoTareaId;
  };
  entregas: ReadonlyArray<ConId<Entrega>>;
  usuarios: readonly Usuario[];
  equipos: ReadonlyArray<ConId<Equipo>>;
}): FilaEntregaTarea[] {
  const { tarea } = datos;
  const usuarios = new Map(datos.usuarios.map((u) => [u.cedula, u]));
  const equipos = new Map(datos.equipos.map((e) => [e.id, e]));
  const enviadas = datos.entregas.filter(
    (e) => e.tareaId === tarea.id && e.estado !== "borrador",
  );
  const filas = enviadas.map((e) => filaDeEntrega(e, usuarios, equipos, tarea));
  const entregaron = new Set(enviadas.map((e) => e.titularId));

  const sinEntregar = (
    titularId: string,
    seccion: SeccionId,
    nombre: string,
    base: number | null,
  ): FilaEntregaTarea => ({
    titularId,
    tipo: tarea.tipo,
    seccion,
    nombre,
    estado: "sin-entregar",
    entregaId: null,
    puntaje: null,
    base,
    nota: null,
    integrantes: [],
    verHref: null,
    accion: null,
    accionHref: null,
    puedeDevolver: false,
    enviadaEn: null,
    evaluadaEn: null,
    idealHref: null,
  });

  if (tarea.tipo === "grupal") {
    for (const eq of datos.equipos) {
      if (entregaron.has(eq.id) || !tarea.secciones.includes(eq.seccion))
        continue;
      filas.push(sinEntregar(eq.id, eq.seccion, eq.nombre, null));
    }
  } else {
    for (const u of datos.usuarios) {
      if (u.rol !== "estudiante" || u.seccion === null) continue;
      if (entregaron.has(u.cedula) || !tarea.secciones.includes(u.seccion))
        continue;
      filas.push(sinEntregar(u.cedula, u.seccion, nombreCompleto(u), u.base));
    }
  }

  return filas.sort(
    (a, b) =>
      a.seccion.localeCompare(b.seccion) ||
      comparaNombre.compare(a.nombre, b.nombre),
  );
}

/** Secciones que aparecen en las filas (para el selector), ordenadas por año y letra. */
export function seccionesDeFilas(
  filas: ReadonlyArray<Pick<FilaEntregaTarea, "seccion">>,
): SeccionId[] {
  return ordenarSecciones([...new Set(filas.map((f) => f.seccion))]);
}

/** Lee `?seccion=` y se queda con una de las que hay; si no, la primera (o `null` sin filas). */
export function seccionElegida(
  pedida: string | undefined,
  secciones: readonly SeccionId[],
): SeccionId | null {
  return secciones.find((s) => s === pedida) ?? secciones[0] ?? null;
}

export function filasDeSeccion<T extends Pick<FilaEntregaTarea, "seccion">>(
  filas: readonly T[],
  seccion: SeccionId | null,
): T[] {
  return seccion === null ? [] : filas.filter((f) => f.seccion === seccion);
}

export type ConteoEntregas = {
  porEvaluar: number;
  evaluadas: number;
  sinEntregar: number;
};

export function conteoEntregas(
  filas: ReadonlyArray<Pick<FilaEntregaTarea, "estado">>,
): ConteoEntregas {
  const c: ConteoEntregas = { porEvaluar: 0, evaluadas: 0, sinEntregar: 0 };
  for (const f of filas) {
    if (f.estado === "por-evaluar") c.porEvaluar++;
    else if (f.estado === "evaluada") c.evaluadas++;
    else c.sinEntregar++;
  }
  return c;
}

/** «3 por evaluar · 12 evaluadas · 2 sin entregar» (frase estable para `role="status"`). */
export function conteoEntregasTexto(c: ConteoEntregas): string {
  const plural = (n: number, uno: string, varios: string) =>
    `${n} ${n === 1 ? uno : varios}`;
  return [
    plural(c.porEvaluar, "por evaluar", "por evaluar"),
    plural(c.evaluadas, "evaluada", "evaluadas"),
    plural(c.sinEntregar, "sin entregar", "sin entregar"),
  ].join(" · ");
}

export const ESTADO_FILA_TEXTO: Record<EstadoFilaEntrega, string> = {
  "sin-entregar": "Sin entregar",
  "por-evaluar": "Por evaluar",
  evaluada: "Evaluada",
};

/** Texto de la acción de una fila. */
export const ACCION_TEXTO = {
  evaluar: "Evaluar",
  corregir: "Corregir",
} as const;

/** Nombre accesible de «Ver», «Evaluar» o «Corregir»: incluye a quién. */
export function accionLabel(
  accion: "ver" | "evaluar" | "corregir",
  nombre: string,
): string {
  const verbo =
    accion === "ver" ? "Ver" : accion === "evaluar" ? "Evaluar" : "Corregir";
  return `${verbo} la entrega de ${nombre}`;
}

/** «17,5 / 20» o «—» sin puntaje. */
export function puntajeTexto(puntaje: number | null): string {
  return puntaje === null ? "—" : `${formatNota(puntaje)} / 20`;
}
