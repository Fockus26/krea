import "server-only";
// Lecturas del profesor en el servidor (fase 07 W6, D199, D327): Postgres detrás de
// `exigirSesion("profesor")`, una vez por request (`cache`). El profe ve todas las secciones del
// catálogo (`seccion: null`, D323); el mapeo a las pantallas es puro (`lib/tareas-profe-datos.ts`).
import { and, eq, isNotNull } from "drizzle-orm";
import { cache } from "react";
import { exigirSesion } from "@/lib/dal";
import {
  ajusteDeFila,
  entregaDeFila,
  equipoDeFila,
  tareaDeFila,
  validas,
} from "@/lib/data/filas";
import { leerRanking } from "@/lib/data/ranking";
import { leerUsuario, usuarioDeFila } from "@/lib/data/usuarios";
import { db } from "@/lib/datos/comun";
import { catalogoSecciones } from "@/lib/datos/secciones";
import { ajustes, entregas, equipos, tareas, usuarios } from "@/lib/db/schema";
import {
  colaPorEvaluar,
  type MapasEvaluar,
  mapasEvaluar,
} from "@/lib/evaluar-datos";
import type {
  Ajuste,
  Entrega,
  Equipo,
  RankingSeccion,
  SeccionId,
  TareaDoc,
  Usuario,
} from "@/lib/modelo";
import { seccionesDe } from "@/lib/secciones";
import type { Sesion } from "@/lib/sesion";
import { type Conteos, conteosDe } from "@/lib/tareas-profe-datos";

type ConId<T> = { id: string } & T;

/** Sesión de profesor + su perfil (`null` si falta o no valida: el shell sigue). */
export const profesorActual = cache(
  async (): Promise<{ sesion: Sesion; usuario: Usuario | null }> => {
    const sesion = await exigirSesion("profesor");
    const usuario = await leerUsuario(db(), sesion.uid);
    return { sesion, usuario };
  },
);

/** Todas las tareas, borradores incluidos. */
export const tareasProfe = cache(async (): Promise<Array<ConId<TareaDoc>>> => {
  await exigirSesion("profesor");
  return validas((await db().select().from(tareas)).map(tareaDeFila));
});

export const tareaProfe = cache(
  async (id: string): Promise<ConId<TareaDoc> | null> => {
    await exigirSesion("profesor");
    const [f] = await db().select().from(tareas).where(eq(tareas.id, id));
    return f ? tareaDeFila(f) : null;
  },
);

/** ¿La tarea tiene ya alguna entrega? (congela su estructura, D200). */
export const tieneEntregas = cache(async (id: string): Promise<boolean> => {
  await exigirSesion("profesor");
  const [una] = await db()
    .select({ id: entregas.id })
    .from(entregas)
    .where(eq(entregas.tareaId, id))
    .limit(1);
  return una !== undefined;
});

/** Entregas de una tarea: lo que se pierde al eliminarla (D243). */
export const entregasDeTarea = cache(async (id: string): Promise<Entrega[]> => {
  await exigirSesion("profesor");
  const filas = await db()
    .select()
    .from(entregas)
    .where(eq(entregas.tareaId, id));
  return validas(filas.map(entregaDeFila));
});

export const entregasTodas = cache(async (): Promise<Array<ConId<Entrega>>> => {
  await exigirSesion("profesor");
  return validas((await db().select().from(entregas)).map(entregaDeFila));
});

export const equiposTodos = cache(async (): Promise<Array<ConId<Equipo>>> => {
  await exigirSesion("profesor");
  return validas((await db().select().from(equipos)).map(equipoDeFila));
});

/**
 * Alumnos por sección (solo cuenta: no trae perfiles) y los ids de los equipos vivos por sección
 * (D316: el total de una grupal descuenta los equipos que ya entregaron, vivos o eliminados).
 */
export const conteos = cache(async (): Promise<Conteos> => {
  await exigirSesion("profesor");
  const secciones = seccionesDe(await catalogoSecciones());
  const [filas, todos] = await Promise.all([
    db()
      .select({ seccion: usuarios.seccion })
      .from(usuarios)
      .where(and(eq(usuarios.rol, "estudiante"), isNotNull(usuarios.seccion))),
    equiposTodos(),
  ]);
  const alumnos: Record<SeccionId, number> = Object.fromEntries(
    secciones.map((s) => [s, 0]),
  );
  for (const f of filas) {
    if (f.seccion !== null && f.seccion in alumnos)
      alumnos[f.seccion] = (alumnos[f.seccion] ?? 0) + 1;
  }
  return conteosDe(secciones, alumnos, todos);
});

/* ---------- Evaluar, Ajustes de puntos y Panel (W7) ---------- */

/** Todos los perfiles (alumnos y profes): nombres de titulares, autores y destinatarios. */
export const usuariosTodos = cache(async (): Promise<Usuario[]> => {
  await exigirSesion("profesor");
  return validas((await db().select().from(usuarios)).map(usuarioDeFila));
});

/** Entregadas sin evaluar, de la más antigua a la más reciente (D204). */
export const colaEvaluar = cache(async (): Promise<Array<ConId<Entrega>>> => {
  await exigirSesion("profesor");
  const filas = await db()
    .select()
    .from(entregas)
    .where(eq(entregas.estado, "entregada"));
  return colaPorEvaluar(validas(filas.map(entregaDeFila)));
});

export const entregaProfe = cache(
  async (id: string): Promise<ConId<Entrega> | null> => {
    await exigirSesion("profesor");
    const [f] = await db().select().from(entregas).where(eq(entregas.id, id));
    return f ? entregaDeFila(f) : null;
  },
);

/** Usuarios, equipos y tareas por id (cola, Panel y Evaluar entrega). */
export const mapasProfe = cache(async (): Promise<MapasEvaluar> => {
  const [us, eqs, ts] = await Promise.all([
    usuariosTodos(),
    equiposTodos(),
    tareasProfe(),
  ]);
  return mapasEvaluar({ usuarios: us, equipos: eqs, tareas: ts });
});

/** Todos los ajustes de puntos, anulaciones incluidas (D121). */
export const ajustesTodos = cache(async (): Promise<Array<ConId<Ajuste>>> => {
  await exigirSesion("profesor");
  return validas((await db().select().from(ajustes)).map(ajusteDeFila));
});

/**
 * El ranking de cada sección del catálogo (`null` si aún no existe, D323). Una sección que no está
 * en el catálogo no sale: quien indexa lee `rankings[s]` con `?.`.
 */
export const rankingsTodos = cache(
  async (): Promise<Partial<Record<SeccionId, RankingSeccion | null>>> => {
    await exigirSesion("profesor");
    const secciones = seccionesDe(await catalogoSecciones());
    const leidos = await Promise.all(
      secciones.map((s) => leerRanking(db(), s)),
    );
    const r: Partial<Record<SeccionId, RankingSeccion | null>> = {};
    secciones.forEach((s, i) => {
      r[s] = leidos[i] ?? null;
    });
    return r;
  },
);

/* ---------- Alumnos y Equipos (W8) ---------- */

/** cédula → email de recuperación (D209): solo el profe y solo en Alumnos. */
export const emailsTodos = cache(
  async (): Promise<Map<string, string | null>> => {
    await exigirSesion("profesor");
    const filas = await db()
      .select({ cedula: usuarios.cedula, email: usuarios.emailRecuperacion })
      .from(usuarios);
    return new Map(filas.map((f) => [f.cedula, f.email]));
  },
);

/** Secciones que ve el profe: la suya o todas las del catálogo (`seccion: null`, D323). */
export function seccionesDelProfe(
  u: Usuario | null,
  secciones: readonly SeccionId[],
): readonly SeccionId[] {
  return u?.seccion ? [u.seccion] : secciones;
}
