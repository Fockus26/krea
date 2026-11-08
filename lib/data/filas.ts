// Filas de Postgres ↔ documentos de `lib/modelo` (D327). Cada lectura valida con el mismo esquema
// zod que validaba el documento de Firestore: una fila que no valida se omite y se registra (sin
// datos personales, D189). Los campos que en Firestore estaban ausentes se devuelven ausentes.
import type { ajustes, entregas, equipos, tareas } from "@/lib/db/schema";
import {
  type Ajuste,
  type Entrega,
  type Equipo,
  type TareaDoc,
  zAjuste,
  zEntrega,
  zEquipo,
  zTareaDoc,
} from "@/lib/modelo";

export type ConId<T> = { id: string } & T;

type Esquema<T> = {
  safeParse: (v: unknown) => { success: true; data: T } | { success: false };
};

export function validar<T>(
  esquema: Esquema<T>,
  tabla: string,
  id: string,
  datos: unknown,
): T | null {
  const r = esquema.safeParse(datos);
  if (r.success) return r.data;
  console.error(`[datos] ${tabla}/${id} no valida con el modelo`);
  return null;
}

const sinNull = <T extends Record<string, unknown>>(o: T, claves: string[]) => {
  const r: Record<string, unknown> = { ...o };
  for (const k of claves) if (r[k] === null || r[k] === undefined) delete r[k];
  return r;
};

/* ---------- equipos ---------- */

export type FilaEquipo = typeof equipos.$inferSelect;

export function equipoDeFila(f: FilaEquipo): ConId<Equipo> | null {
  const { id, ...resto } = f;
  const e = validar(zEquipo, "equipos", id, resto);
  return e ? { id, ...e } : null;
}

export function filaDeEquipo(id: string, e: Equipo): FilaEquipo {
  return {
    id,
    nombre: e.nombre,
    seccion: e.seccion,
    tema: e.tema,
    capitanId: e.capitanId,
    logoPath: e.logoPath,
  };
}

/* ---------- tareas ---------- */

export type FilaTarea = typeof tareas.$inferSelect;

export function tareaDeFila(f: FilaTarea): ConId<TareaDoc> | null {
  const { id, ...resto } = f;
  const t = validar(
    zTareaDoc,
    "tareas",
    id,
    sinNull(resto, ["premioFoto", "decisionesPremio"]),
  );
  return t ? { id, ...t } : null;
}

export function filaDeTarea(id: string, t: TareaDoc): FilaTarea {
  return {
    id,
    titulo: t.titulo,
    tipo: t.tipo,
    secciones: [...t.secciones],
    estado: t.estado,
    fechaEntrega: t.fechaEntrega,
    premio: t.premio,
    premioFoto: t.premioFoto ?? null,
    preguntas: [...t.preguntas],
    importada: t.importada,
    autorId: t.autorId,
    actualizadoEn: t.actualizadoEn,
    decisionesPremio:
      "decisionesPremio" in t && t.decisionesPremio ? t.decisionesPremio : null,
  };
}

/* ---------- entregas ---------- */

export type FilaEntrega = typeof entregas.$inferSelect;

export function entregaDeFila(f: FilaEntrega): ConId<Entrega> | null {
  const { id, evaluacionAnterior, ...resto } = f;
  const e = validar(zEntrega, "entregas", id, {
    ...sinNull(resto, ["titularNombre"]),
    ...(evaluacionAnterior ? { evaluacionAnterior: evaluacionAnterior.previa } : {}),
  });
  return e ? { id, ...e } : null;
}

export function filaDeEntrega(id: string, e: Entrega): FilaEntrega {
  return {
    id,
    tareaId: e.tareaId,
    tipo: e.tipo,
    titularId: e.titularId,
    titularNombre: e.titularNombre ?? null,
    seccion: e.seccion,
    integrantes: [...e.integrantes],
    estado: e.estado,
    respuestas: e.respuestas,
    enviadaPor: e.enviadaPor,
    enviadaEn: e.enviadaEn,
    evaluacion: e.evaluacion,
    evaluacionAnterior:
      e.evaluacionAnterior === undefined ? null : { previa: e.evaluacionAnterior },
  };
}

/* ---------- ajustes ---------- */

export type FilaAjuste = typeof ajustes.$inferSelect;

export function ajusteDeFila(f: FilaAjuste): ConId<Ajuste> | null {
  const { id, ...resto } = f;
  const a = validar(zAjuste, "ajustes", id, resto);
  return a ? { id, ...a } : null;
}

export function filaDeAjuste(id: string, a: Ajuste): FilaAjuste {
  return { id, ...a };
}

/** Quita los `null` de una lista de conversiones. */
export const validas = <T>(xs: ReadonlyArray<T | null>): T[] =>
  xs.filter((x): x is T => x !== null);
