import "server-only";
// Lecturas del profesor en el servidor (fase 07 W6, D199): Admin SDK detrás de
// `exigirSesion("profesor")`, una vez por request (`cache`). El profe ve las dos secciones
// (`seccion: null`); el mapeo a las pantallas es puro (`lib/tareas-profe-datos.ts`).
import { cache } from "react";
import { exigirSesion } from "@/lib/dal";
import { db, lista, parsear } from "@/lib/datos/comun";
import {
  colaPorEvaluar,
  type MapasEvaluar,
  mapasEvaluar,
} from "@/lib/evaluar-datos";
import {
  type Ajuste,
  COL,
  type Entrega,
  type Equipo,
  type RankingSeccion,
  SECCIONES,
  type SeccionId,
  type TareaDoc,
  type Usuario,
  zAjuste,
  zEntrega,
  zEquipo,
  zPrivado,
  zRankingSeccion,
  zTareaDoc,
  zUsuario,
} from "@/lib/modelo";
import type { Sesion } from "@/lib/sesion";
import type { Conteos } from "@/lib/tareas-profe-datos";

type ConId<T> = { id: string } & T;

/** Sesión de profesor + su perfil (`null` si el documento falta o no valida: el shell sigue). */
export const profesorActual = cache(
  async (): Promise<{ sesion: Sesion; usuario: Usuario | null }> => {
    const sesion = await exigirSesion("profesor");
    const snap = await db().collection(COL.usuarios).doc(sesion.uid).get();
    const usuario = snap.exists
      ? parsear(zUsuario, COL.usuarios, sesion.uid, snap.data())
      : null;
    return { sesion, usuario };
  },
);

/** Todas las tareas, borradores incluidos. */
export const tareasProfe = cache(async (): Promise<Array<ConId<TareaDoc>>> => {
  await exigirSesion("profesor");
  return lista<TareaDoc>(db().collection(COL.tareas), zTareaDoc, COL.tareas);
});

export const tareaProfe = cache(
  async (id: string): Promise<ConId<TareaDoc> | null> => {
    await exigirSesion("profesor");
    const snap = await db().collection(COL.tareas).doc(id).get();
    if (!snap.exists) return null;
    const t = parsear(zTareaDoc, COL.tareas, id, snap.data());
    return t ? { id, ...t } : null;
  },
);

/** ¿La tarea tiene ya alguna entrega? (congela su estructura, D200). */
export const tieneEntregas = cache(async (id: string): Promise<boolean> => {
  await exigirSesion("profesor");
  const q = await db()
    .collection(COL.entregas)
    .where("tareaId", "==", id)
    .limit(1)
    .get();
  return !q.empty;
});

/** Entregas de una tarea: lo que se pierde al eliminarla (D243). */
export const entregasDeTarea = cache(async (id: string): Promise<Entrega[]> => {
  await exigirSesion("profesor");
  return lista(
    db().collection(COL.entregas).where("tareaId", "==", id),
    zEntrega,
    COL.entregas,
  );
});

export const entregasTodas = cache(async (): Promise<Entrega[]> => {
  await exigirSesion("profesor");
  return lista(db().collection(COL.entregas), zEntrega, COL.entregas);
});

export const equiposTodos = cache(async (): Promise<Array<ConId<Equipo>>> => {
  await exigirSesion("profesor");
  return lista(db().collection(COL.equipos), zEquipo, COL.equipos);
});

/** Alumnos y equipos por sección (solo cuenta: no trae perfiles). */
export const conteos = cache(async (): Promise<Conteos> => {
  await exigirSesion("profesor");
  const base = db();
  const contar = async (
    coleccion: string,
    seccion: SeccionId,
    alumnos: boolean,
  ) => {
    let q = base.collection(coleccion).where("seccion", "==", seccion);
    if (alumnos) q = q.where("rol", "==", "estudiante");
    return (await q.count().get()).data().count;
  };
  const [a5A, a5C, e5A, e5C] = await Promise.all([
    contar(COL.usuarios, "5A", true),
    contar(COL.usuarios, "5C", true),
    contar(COL.equipos, "5A", false),
    contar(COL.equipos, "5C", false),
  ]);
  return {
    alumnos: { "5A": a5A, "5C": a5C },
    equipos: { "5A": e5A, "5C": e5C },
  };
});

/* ---------- Evaluar, Ajustes de puntos y Panel (W7) ---------- */

/** Todos los perfiles (alumnos y profes): nombres de titulares, autores y destinatarios. */
export const usuariosTodos = cache(async (): Promise<Usuario[]> => {
  await exigirSesion("profesor");
  return (
    await lista(db().collection(COL.usuarios), zUsuario, COL.usuarios)
  ).map(({ id: _, ...u }) => u);
});

/** Entregadas sin evaluar, de la más antigua a la más reciente (D204). */
export const colaEvaluar = cache(async (): Promise<Array<ConId<Entrega>>> => {
  await exigirSesion("profesor");
  const q = db().collection(COL.entregas).where("estado", "==", "entregada");
  return colaPorEvaluar(await lista(q, zEntrega, COL.entregas));
});

export const entregaProfe = cache(
  async (id: string): Promise<ConId<Entrega> | null> => {
    await exigirSesion("profesor");
    const snap = await db().collection(COL.entregas).doc(id).get();
    if (!snap.exists) return null;
    const e = parsear(zEntrega, COL.entregas, id, snap.data());
    return e ? { id, ...e } : null;
  },
);

/** Usuarios, equipos y tareas por id (cola, Panel y Evaluar entrega). */
export const mapasProfe = cache(async (): Promise<MapasEvaluar> => {
  const [usuarios, equipos, tareas] = await Promise.all([
    usuariosTodos(),
    equiposTodos(),
    tareasProfe(),
  ]);
  return mapasEvaluar({ usuarios, equipos, tareas });
});

/** Todos los ajustes de puntos, anulaciones incluidas (D121). */
export const ajustesTodos = cache(async (): Promise<Array<ConId<Ajuste>>> => {
  await exigirSesion("profesor");
  return lista(db().collection(COL.ajustes), zAjuste, COL.ajustes);
});

/** `ranking/{seccion}` de las dos secciones (`null` si aún no existe). */
export const rankingsTodos = cache(
  async (): Promise<Record<SeccionId, RankingSeccion | null>> => {
    await exigirSesion("profesor");
    const snaps = await Promise.all(
      SECCIONES.map((s) => db().collection(COL.ranking).doc(s).get()),
    );
    const r = {} as Record<SeccionId, RankingSeccion | null>;
    SECCIONES.forEach((s, i) => {
      const snap = snaps[i];
      r[s] = snap?.exists
        ? parsear(zRankingSeccion, COL.ranking, s, snap.data())
        : null;
    });
    return r;
  },
);

/* ---------- Alumnos y Equipos (W8) ---------- */

/** cédula → email de recuperación (`privados`, D209): solo el profe y solo en Alumnos. */
export const emailsTodos = cache(
  async (): Promise<Map<string, string | null>> => {
    await exigirSesion("profesor");
    const docs = await lista(
      db().collection(COL.privados),
      zPrivado,
      COL.privados,
    );
    return new Map(docs.map((d) => [d.id, d.email]));
  },
);

/** Secciones que ve el profe: la suya o las dos (`seccion: null`). */
export function seccionesDelProfe(u: Usuario | null): readonly SeccionId[] {
  return u?.seccion ? [u.seccion] : SECCIONES;
}
