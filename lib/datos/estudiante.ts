import "server-only";
// Lecturas del estudiante en el servidor (fase 07, D189): Admin SDK detrás de `exigirSesion`,
// una vez por request (`cache`). Solo lee lo de su sección y lo suyo; el mapeo a las pantallas
// es puro (`lib/vistas-estudiante.ts`). Documento que no valida con zod: se omite y se registra.
import { cache } from "react";
import { exigirSesion } from "@/lib/dal";
import { db, lista, parsear } from "@/lib/datos/comun";
import {
  type Ajuste,
  COL,
  type Entrega,
  type Equipo,
  type RankingSeccion,
  type SeccionId,
  type Tarea,
  type TareaDoc,
  type Usuario,
  zAjuste,
  zEntrega,
  zEquipo,
  zRankingSeccion,
  zTareaDoc,
  zUsuario,
} from "@/lib/modelo";
import type { InfoEquipos } from "@/lib/ranking-en-vivo";
import type { Sesion } from "@/lib/sesion";
import type { ConId, DatosAlumno } from "@/lib/vistas-estudiante";

/** Sesión de estudiante + su perfil. Sin perfil → a Ingresar no: es un error del dato. */
export const alumnoActual = cache(
  async (): Promise<{
    sesion: Sesion;
    usuario: Usuario;
    seccion: SeccionId;
  }> => {
    const sesion = await exigirSesion("estudiante");
    const snap = await db().collection(COL.usuarios).doc(sesion.uid).get();
    const usuario = snap.exists
      ? parsear(zUsuario, COL.usuarios, sesion.uid, snap.data())
      : null;
    if (!usuario || usuario.seccion === null) {
      throw new Error("El perfil del estudiante no existe o no es válido");
    }
    return { sesion, usuario, seccion: usuario.seccion };
  },
);

export const equipoPorId = cache(
  async (id: string): Promise<ConId<Equipo> | null> => {
    const snap = await db().collection(COL.equipos).doc(id).get();
    if (!snap.exists) return null;
    const e = parsear(zEquipo, COL.equipos, id, snap.data());
    return e ? { id, ...e } : null;
  },
);

/** Tareas publicadas de la sección (sin borradores, como las reglas). */
export const tareasDeSeccion = cache(
  async (seccion: SeccionId): Promise<Array<ConId<Tarea>>> => {
    const q = db()
      .collection(COL.tareas)
      .where("secciones", "array-contains", seccion);
    // `zTareaDoc`: los borradores a medias del profe (D199) no validan con `zTarea`
    const tareas = await lista<TareaDoc>(q, zTareaDoc, COL.tareas);
    return tareas.filter((t): t is ConId<Tarea> => t.estado !== "borrador");
  },
);

export const rankingDeSeccion = cache(
  async (seccion: SeccionId): Promise<RankingSeccion | null> => {
    const snap = await db().collection(COL.ranking).doc(seccion).get();
    if (!snap.exists) return null;
    return parsear(zRankingSeccion, COL.ranking, seccion, snap.data());
  },
);

/** Integrantes actuales de un equipo (perfiles: solo el servidor los lee). */
export const integrantesDe = cache(
  async (equipoId: string): Promise<Usuario[]> => {
    const q = db().collection(COL.usuarios).where("equipoId", "==", equipoId);
    return (await lista(q, zUsuario, COL.usuarios)).filter(
      (u) => u.rol === "estudiante",
    );
  },
);

/** Todo lo del alumno que pintan Inicio, Notas y Detalle. */
export const datosAlumno = cache(async (): Promise<DatosAlumno> => {
  const { usuario, seccion } = await alumnoActual();
  const base = db();
  const [equipo, tareas, entregas, ajustes, ranking] = await Promise.all([
    usuario.equipoId ? equipoPorId(usuario.equipoId) : null,
    tareasDeSeccion(seccion),
    lista<Entrega>(
      base
        .collection(COL.entregas)
        .where("integrantes", "array-contains", usuario.cedula),
      zEntrega,
      COL.entregas,
    ),
    lista<Ajuste>(
      base
        .collection(COL.ajustes)
        .where("destino", "==", "alumno")
        .where("destinoId", "==", usuario.cedula),
      zAjuste,
      COL.ajustes,
    ),
    rankingDeSeccion(seccion),
  ]);
  return { usuario, equipo, tareas, entregas, ajustes, ranking };
});

/** Entregas grupales de la sección (Mi equipo: notas del equipo y ganadores de premios). */
export async function entregasGrupales(seccion: SeccionId): Promise<Entrega[]> {
  const q = db()
    .collection(COL.entregas)
    .where("seccion", "==", seccion)
    .where("tipo", "==", "grupal");
  return lista(q, zEntrega, COL.entregas);
}

/** Tema y capitán de los equipos de la sección (lo que el ranking no trae). */
export async function infoEquipos(seccion: SeccionId): Promise<InfoEquipos> {
  const q = db().collection(COL.equipos).where("seccion", "==", seccion);
  const equipos = await lista(q, zEquipo, COL.equipos);
  return Object.fromEntries(
    equipos.map((e) => [e.id, { tema: e.tema, capitan: e.capitanId }]),
  );
}
