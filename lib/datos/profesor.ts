import "server-only";
// Lecturas del profesor en el servidor (fase 07 W6, D199): Admin SDK detrás de
// `exigirSesion("profesor")`, una vez por request (`cache`). El profe ve todas las secciones del
// catálogo (`seccion: null`, D323); el mapeo a las pantallas es puro (`lib/tareas-profe-datos.ts`).
import { cache } from "react";
import { exigirSesion } from "@/lib/dal";
import { db, lista, parsear } from "@/lib/datos/comun";
import { catalogoSecciones } from "@/lib/datos/secciones";
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
import { seccionesDe } from "@/lib/secciones";
import type { Sesion } from "@/lib/sesion";
import { type Conteos, conteosDe } from "@/lib/tareas-profe-datos";

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

/**
 * Alumnos por sección (solo cuenta: no trae perfiles) y los ids de los equipos vivos por sección
 * (D316: el total de una grupal descuenta los equipos que ya entregaron, vivos o eliminados).
 */
export const conteos = cache(async (): Promise<Conteos> => {
  await exigirSesion("profesor");
  const base = db();
  const contar = async (seccion: SeccionId) =>
    (
      await base
        .collection(COL.usuarios)
        .where("seccion", "==", seccion)
        .where("rol", "==", "estudiante")
        .count()
        .get()
    ).data().count;
  // Una cuenta por sección del catálogo (D323): una sección nueva sale con 0 y sin equipos
  const secciones = seccionesDe(await catalogoSecciones());
  const [cuentas, equipos] = await Promise.all([
    Promise.all(secciones.map(contar)),
    equiposTodos(),
  ]);
  const alumnos = Object.fromEntries(
    secciones.map((s, i) => [s, cuentas[i] ?? 0]),
  );
  return conteosDe(secciones, alumnos, equipos);
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

/**
 * `ranking/{seccion}` de cada sección del catálogo (`null` si aún no existe, D323). Una sección
 * que no está en el catálogo no sale: quien indexa lee `rankings[s]` con `?.`.
 */
export const rankingsTodos = cache(
  async (): Promise<Partial<Record<SeccionId, RankingSeccion | null>>> => {
    await exigirSesion("profesor");
    const secciones = seccionesDe(await catalogoSecciones());
    const snaps = await Promise.all(
      secciones.map((s) => db().collection(COL.ranking).doc(s).get()),
    );
    const r: Partial<Record<SeccionId, RankingSeccion | null>> = {};
    secciones.forEach((s, i) => {
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

/** Secciones que ve el profe: la suya o todas las del catálogo (`seccion: null`, D323). */
export function seccionesDelProfe(
  u: Usuario | null,
  secciones: readonly SeccionId[],
): readonly SeccionId[] {
  return u?.seccion ? [u.seccion] : secciones;
}
