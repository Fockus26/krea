// Tareas del profesor con datos de Firestore (fase 07 W6, D199–D202). Puro (sin Firebase ni
// reloj): qué se escribe al guardar, publicar o editar una tarea (`armarTarea`), cómo se ve en la
// lista y en el constructor, y las tarjetas de Premios. Lo usan los adaptadores del Admin SDK
// (`lib/firebase/tareas.ts`), las páginas del profe y las pruebas.
import { z } from "zod";
import { comparaFecha, diaDeInstante } from "@/lib/fecha";
import { NOTA_MAX } from "@/lib/grades";
import {
  type DecisionesPremio,
  type DecisionPremio,
  type Entrega,
  type Equipo,
  SECCIONES,
  type SeccionId,
  sumaValores as sumaModelo,
  type TareaDoc,
  TIPOS_TAREA,
  zDecisionPremio,
  zDia,
  zPuntaje,
  zSeccion,
  zTarea,
  zTareaBorrador,
} from "@/lib/modelo";
import {
  type EstadoPremio,
  estadoPremio,
  resolverEmpate,
  type TarjetaPremio,
} from "@/lib/premios";
import {
  type AccionTarea,
  type AvanceTarea,
  type DatosBorrador,
  type ErrorTarea,
  fechaCampo,
  MAX_PREGUNTAS,
  type ModoConstructor,
  SECCIONES_TAREA,
  type SeccionTarea,
  type TareaProfe,
} from "@/lib/tareas-profe";

type ConId<T> = { id: string } & T;

/* ---------- Entrada de las Server Actions ---------- */

/** Ids de documento de Firestore (los automáticos y los del seed, con guiones). */
export const zIdTareaProfe = z
  .string()
  .regex(/^[A-Za-z0-9_-]{1,120}$/, "Id inválido");

/** Lo que manda el constructor (`tareaAGuardar`): a medias en un borrador. */
export const zEntradaTarea = z.object({
  titulo: z.string().trim().max(120),
  tipo: z.enum(TIPOS_TAREA),
  fecha: zDia.nullable(),
  seccion: z.enum(SECCIONES_TAREA as [SeccionTarea, ...SeccionTarea[]]),
  premio: z.string().trim().max(200).nullable(),
  preguntas: z
    .array(
      z.object({
        id: z.string().regex(/^[A-Za-z0-9_-]{1,40}$/, "Id inválido"),
        enunciado: z.string().trim().max(500),
        formato: z.enum(["texto", "imagen"]),
        valor: zPuntaje.refine((n) => n > 0).nullable(),
      }),
    )
    .min(1)
    .max(MAX_PREGUNTAS),
});
export type EntradaTarea = z.infer<typeof zEntradaTarea>;

export const zGuardarTarea = z.object({
  /** `null`: tarea nueva (id automático). */
  id: zIdTareaProfe.nullable(),
  accion: z.enum(["borrador", "publicar", "guardar"]),
  tarea: zEntradaTarea,
});
export type GuardarTarea = z.infer<typeof zGuardarTarea>;

export const zDecidirPremio = z.object({
  tareaId: zIdTareaProfe,
  seccion: zSeccion,
  decision: zDecisionPremio,
});
export type DecidirPremio = z.infer<typeof zDecidirPremio>;

export type ResultadoTarea =
  | { ok: true; id: string }
  | { ok: false; error: ErrorTarea };

/* ---------- Secciones ---------- */

export function seccionesDe(s: SeccionTarea): SeccionId[] {
  return s === "5A y 5C" ? [...SECCIONES] : [s];
}

export function seccionTareaDe(secciones: readonly SeccionId[]): SeccionTarea {
  const unica = secciones.length === 1 ? secciones[0] : undefined;
  return unica ?? "5A y 5C";
}

/* ---------- Armar el documento ---------- */

type Armar = {
  entrada: EntradaTarea;
  accion: AccionTarea;
  /** Documento actual; `null` si la tarea es nueva. */
  previa: TareaDoc | null;
  /** ¿La tarea tiene ya alguna entrega? Congela tipo, secciones y preguntas (D200). */
  conEntregas: boolean;
  autorId: string;
  /** Día civil de Caracas: la fecha de entrega no puede ser anterior (salvo la ya guardada). */
  hoy: string;
  ahora: number;
};

type Armada = { ok: true; tarea: TareaDoc } | { ok: false; error: ErrorTarea };

function idsUnicos(preguntas: ReadonlyArray<{ id: string }>): boolean {
  return new Set(preguntas.map((p) => p.id)).size === preguntas.length;
}

/** Fecha válida para publicar: hoy o después, o la que ya tenía la tarea. */
function fechaOk(
  fecha: string | null,
  hoy: string,
  guardada: string | null,
): ErrorTarea | null {
  if (fecha === null) return "invalida";
  if (fecha !== guardada && comparaFecha(fecha, hoy) < 0) return "fecha-pasada";
  return null;
}

/** Tarea publicada completa (D004): todo escrito y la suma en 20 exactos. */
function publicada(
  a: Armar,
  base: { estado: "abierta"; autorId: string | null },
): Armada {
  const { entrada } = a;
  const guardada = a.previa?.fechaEntrega ?? null;
  const err = fechaOk(entrada.fecha, a.hoy, a.previa ? guardada : null);
  if (err) return { ok: false, error: err };
  if (
    !entrada.titulo ||
    entrada.preguntas.some((p) => !p.enunciado || p.valor === null) ||
    sumaModelo(entrada.preguntas.map((p) => ({ valor: p.valor ?? 0 }))) !==
      NOTA_MAX
  ) {
    return { ok: false, error: "invalida" };
  }
  const r = zTarea.safeParse({
    titulo: entrada.titulo,
    tipo: entrada.tipo,
    secciones: seccionesDe(entrada.seccion),
    estado: base.estado,
    fechaEntrega: entrada.fecha,
    premio: premioDe(entrada),
    preguntas: entrada.preguntas,
    importada: false,
    autorId: base.autorId,
    actualizadoEn: a.ahora,
  });
  return r.success
    ? { ok: true, tarea: r.data }
    : { ok: false, error: "invalida" };
}

function premioDe(e: Pick<EntradaTarea, "tipo" | "premio">): string | null {
  return e.tipo === "grupal" && e.premio ? e.premio : null;
}

/**
 * Documento que se escribe (D199, D200). Borrador o nueva: «borrador» guarda lo que haya (con
 * título) y «publicar» exige la tarea completa. Abierta: solo «guardar»; con entregas, solo
 * título, fecha y premio (las preguntas, el tipo y las secciones quedan como estaban). Cerrada
 * (`evaluada`) o importada del Excel: no se cambia.
 */
export function armarTarea(a: Armar): Armada {
  const { entrada, previa, accion } = a;
  if (!idsUnicos(entrada.preguntas)) return { ok: false, error: "invalida" };
  if (previa && (previa.importada || previa.estado === "evaluada")) {
    return { ok: false, error: "cerrada" };
  }
  const autorId = previa ? previa.autorId : a.autorId;

  if (previa?.estado === "abierta") {
    if (accion !== "guardar") return { ok: false, error: "invalida" };
    if (!a.conEntregas) return publicada(a, { estado: "abierta", autorId });
    const err = fechaOk(entrada.fecha, a.hoy, previa.fechaEntrega);
    if (err) return { ok: false, error: err };
    const r = zTarea.safeParse({
      ...previa,
      titulo: entrada.titulo,
      fechaEntrega: entrada.fecha,
      premio: premioDe({ tipo: previa.tipo, premio: entrada.premio }),
      actualizadoEn: a.ahora,
    });
    return r.success
      ? { ok: true, tarea: r.data }
      : { ok: false, error: "invalida" };
  }

  if (accion === "guardar") return { ok: false, error: "invalida" };
  if (accion === "publicar")
    return publicada(a, { estado: "abierta", autorId });

  const r = zTareaBorrador.safeParse({
    titulo: entrada.titulo,
    tipo: entrada.tipo,
    secciones: seccionesDe(entrada.seccion),
    estado: "borrador",
    fechaEntrega: entrada.fecha,
    premio: premioDe(entrada),
    preguntas: entrada.preguntas,
    importada: false,
    autorId,
    actualizadoEn: a.ahora,
  });
  return r.success
    ? { ok: true, tarea: r.data }
    : { ok: false, error: "invalida" };
}

/** Cerrar = dejar de recibir entregas (`abierta` → `evaluada`, D196, D202). */
export function puedeCerrar(t: TareaDoc): boolean {
  return t.estado === "abierta" && !t.importada;
}

/* ---------- Lista y constructor ---------- */

export type ResumenEntregas = { entregadas: number; evaluadas: number };

/** Entregas por tarea: enviadas sin evaluar («Por evaluar») y evaluadas. */
export function resumenEntregas(
  entregas: ReadonlyArray<Pick<Entrega, "tareaId" | "estado">>,
): Map<string, ResumenEntregas> {
  const m = new Map<string, ResumenEntregas>();
  for (const e of entregas) {
    if (e.estado === "borrador") continue;
    const r = m.get(e.tareaId) ?? { entregadas: 0, evaluadas: 0 };
    if (e.estado === "evaluada") r.evaluadas += 1;
    else r.entregadas += 1;
    m.set(e.tareaId, r);
  }
  return m;
}

/** Alumnos y equipos por sección: el total del avance («12 de 69 evaluadas»). */
export type Conteos = {
  alumnos: Readonly<Record<SeccionId, number>>;
  equipos: Readonly<Record<SeccionId, number>>;
};

export function totalTitulares(
  t: Pick<TareaDoc, "tipo" | "secciones">,
  c: Conteos,
): number {
  const de = t.tipo === "grupal" ? c.equipos : c.alumnos;
  return t.secciones.reduce((s, sec) => s + (de[sec] ?? 0), 0);
}

/**
 * Tarjeta de la lista. Avance: con alguna evaluada (o cerrada), «n de N evaluadas»; si no,
 * «n de N entregaron». Un borrador no lleva avance.
 */
export function tareaProfeDe(
  t: ConId<TareaDoc>,
  resumen: ResumenEntregas | undefined,
  conteos: Conteos,
): TareaProfe {
  const r = resumen ?? { entregadas: 0, evaluadas: 0 };
  const total = totalTitulares(t, conteos);
  let avance: AvanceTarea | null = null;
  if (t.estado !== "borrador") {
    avance =
      r.evaluadas > 0 || t.estado === "evaluada"
        ? { tipo: "evaluadas", hechas: r.evaluadas, total }
        : { tipo: "entregas", hechas: r.entregadas + r.evaluadas, total };
  }
  return {
    id: t.id,
    titulo: t.titulo,
    tipo: t.tipo,
    estado: t.estado,
    fecha: t.fechaEntrega,
    premio: t.tipo === "grupal" ? t.premio : null,
    preguntas: t.preguntas.length,
    suma: sumaModelo(t.preguntas.map((p) => ({ valor: p.valor ?? 0 }))),
    avance,
    porEvaluar: r.entregadas,
  };
}

/** Lo que carga el constructor: los campos como se escriben y las preguntas con su id. */
export function datosBorradorDe(t: TareaDoc): DatosBorrador {
  return {
    titulo: t.titulo,
    tipo: t.tipo,
    fecha: fechaCampo(t.fechaEntrega),
    seccion: seccionTareaDe(t.secciones),
    premio: t.premio ?? "",
    preguntas: t.preguntas.map(({ id, enunciado, formato, valor }) => ({
      id,
      enunciado,
      formato,
      valor,
    })),
  };
}

export function modoConstructor(
  t: TareaDoc,
  conEntregas: boolean,
): ModoConstructor {
  if (t.estado === "borrador") return "borrador";
  if (t.estado === "evaluada" || t.importada) return "cerrada";
  return conEntregas ? "con-entregas" : "publicada";
}

/* ---------- Premios ---------- */

type EntregaPremio = Pick<
  Entrega,
  "tareaId" | "tipo" | "titularId" | "seccion" | "estado" | "evaluacion"
>;

/**
 * Estado del premio de una tarea en una sección: compiten sus equipos con la nota grupal sin
 * base (D014). Cerrada: la fecha es la de la última evaluación (o la de entrega). Con empate y
 * decisión del profe, la decisión manda (D123, D124).
 */
export function estadoPremioSeccion(
  t: Pick<TareaDoc, "estado" | "premio" | "fechaEntrega"> & {
    id: string;
    decisionesPremio?: DecisionesPremio | undefined;
  },
  seccion: SeccionId,
  equipos: ReadonlyArray<ConId<Pick<Equipo, "seccion">>>,
  entregas: ReadonlyArray<EntregaPremio>,
): EstadoPremio {
  const deSeccion = entregas.filter(
    (e) =>
      e.tareaId === t.id &&
      e.tipo === "grupal" &&
      e.seccion === seccion &&
      e.estado !== "borrador",
  );
  const rivales = equipos.filter((e) => e.seccion === seccion);
  const notas = rivales.map((eq) => {
    const e = deSeccion.find((x) => x.titularId === eq.id);
    return {
      id: eq.id,
      nota:
        e?.estado === "evaluada" && e.evaluacion ? e.evaluacion.puntaje : null,
    };
  });
  const ultima = Math.max(
    0,
    ...deSeccion.map((e) => e.evaluacion?.evaluadaEn ?? 0),
  );
  const fecha =
    t.estado === "evaluada" && ultima > 0
      ? diaDeInstante(ultima)
      : t.fechaEntrega;
  const estado = estadoPremio(
    {
      estado: t.estado,
      premio: t.premio ?? undefined,
      fecha,
      avance: { entregaron: deSeccion.length, total: rivales.length },
    },
    notas,
  );
  const decision: DecisionPremio | undefined = t.decisionesPremio?.[seccion];
  return decision ? resolverEmpate(estado, decision) : estado;
}

const ORDEN_PREMIO: Record<TareaDoc["estado"], number> = {
  evaluada: 0,
  abierta: 1,
  borrador: 2,
};

/**
 * Tarjetas de Premios (D201): cada tarea grupal con premio, una por sección (el premio se
 * disputa en cada una). Un borrador grupal, o una abierta sin premio, da una tarjeta «por
 * definir». Las cerradas sin premio y las importadas del Excel no salen.
 */
export function tarjetasPremios(
  tareas: ReadonlyArray<ConId<TareaDoc>>,
  equipos: ReadonlyArray<ConId<Pick<Equipo, "seccion">>>,
  entregas: ReadonlyArray<EntregaPremio>,
): TarjetaPremio[] {
  const grupales = tareas
    .filter((t) => t.tipo === "grupal" && !t.importada)
    .sort(
      (a, b) =>
        ORDEN_PREMIO[a.estado] - ORDEN_PREMIO[b.estado] ||
        comparaFecha(
          b.fechaEntrega ?? "0001-01-01",
          a.fechaEntrega ?? "0001-01-01",
        ),
    );
  return grupales.flatMap((t): TarjetaPremio[] => {
    const comun = { tarea: t.titulo, tareaId: t.id, premio: t.premio };
    if (t.estado === "borrador" || !t.premio) {
      if (t.estado === "evaluada") return [];
      return [
        {
          ...comun,
          id: t.id,
          seccion: seccionTareaDe(t.secciones),
          borrador: t.estado === "borrador",
          estado: { tipo: "por-definir" },
        },
      ];
    }
    return t.secciones.map((s) => ({
      ...comun,
      id: `${t.id}__${s}`,
      seccion: s,
      seccionId: s,
      borrador: false,
      estado: estadoPremioSeccion(t, s, equipos, entregas),
    }));
  });
}
