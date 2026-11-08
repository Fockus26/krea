import "server-only";
// Lecturas del estudiante en el servidor (fase 07, D189, D327): Postgres detrás de `exigirSesion`,
// una vez por request (`cache`). Solo lee lo de su sección y lo suyo (lo que dejaban las reglas de
// Firestore); el mapeo a las pantallas es puro (`lib/vistas-estudiante.ts`). Fila que no valida
// con zod: se omite y se registra.
import { and, arrayContains, eq } from "drizzle-orm";
import { cache } from "react";
import { exigirSesion } from "@/lib/dal";
import { entregasDeIntegrante } from "@/lib/data/entregas";
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
import { urlsFirmadas } from "@/lib/datos/imagenes";
import { ajustes, entregas, equipos, tareas, usuarios } from "@/lib/db/schema";
import type {
  Entrega,
  Equipo,
  RankingSeccion,
  SeccionId,
  Tarea,
  Usuario,
} from "@/lib/modelo";
import { type InfoEquipos, infoDeEquipos } from "@/lib/ranking-en-vivo";
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
    const usuario = await leerUsuario(db(), sesion.uid);
    if (!usuario || usuario.seccion === null) {
      throw new Error("El perfil del estudiante no existe o no es válido");
    }
    return { sesion, usuario, seccion: usuario.seccion };
  },
);

export const equipoPorId = cache(
  async (id: string): Promise<ConId<Equipo> | null> => {
    const [f] = await db().select().from(equipos).where(eq(equipos.id, id));
    return f ? equipoDeFila(f) : null;
  },
);

/** Tareas publicadas de la sección (sin borradores, como las reglas). */
export const tareasDeSeccion = cache(
  async (seccion: SeccionId): Promise<Array<ConId<Tarea>>> => {
    const filas = await db()
      .select()
      .from(tareas)
      .where(arrayContains(tareas.secciones, [seccion]));
    return validas(filas.map(tareaDeFila)).filter(
      (t): t is ConId<Tarea> => t.estado !== "borrador",
    );
  },
);

export const rankingDeSeccion = cache(
  async (seccion: SeccionId): Promise<RankingSeccion | null> =>
    leerRanking(db(), seccion),
);

/** Integrantes actuales de un equipo (perfiles: solo el servidor los lee). */
export const integrantesDe = cache(
  async (equipoId: string): Promise<Usuario[]> => {
    const filas = await db()
      .select()
      .from(usuarios)
      .where(
        and(eq(usuarios.equipoId, equipoId), eq(usuarios.rol, "estudiante")),
      );
    return validas(filas.map(usuarioDeFila));
  },
);

/** Todo lo del alumno que pintan Inicio, Notas y Detalle. */
export const datosAlumno = cache(async (): Promise<DatosAlumno> => {
  const { usuario, seccion } = await alumnoActual();
  const [equipo, tareasSeccion, susEntregas, susAjustes, ranking] =
    await Promise.all([
      usuario.equipoId ? equipoPorId(usuario.equipoId) : null,
      tareasDeSeccion(seccion),
      entregasDeIntegrante(db(), usuario.cedula),
      db()
        .select()
        .from(ajustes)
        .where(
          and(
            eq(ajustes.destino, "alumno"),
            eq(ajustes.destinoId, usuario.cedula),
          ),
        )
        .then((filas) => validas(filas.map(ajusteDeFila))),
      rankingDeSeccion(seccion),
    ]);
  return {
    usuario,
    equipo,
    tareas: tareasSeccion,
    entregas: susEntregas,
    ajustes: susAjustes,
    ranking,
  };
});

/** Entregas grupales de la sección (Mi equipo: notas del equipo y ganadores de premios). */
export async function entregasGrupales(seccion: SeccionId): Promise<Entrega[]> {
  const filas = await db()
    .select()
    .from(entregas)
    .where(and(eq(entregas.seccion, seccion), eq(entregas.tipo, "grupal")));
  return validas(filas.map(entregaDeFila));
}

/**
 * Tema, capitán y logo de los equipos de la sección (lo que el ranking no trae). Los logos son de
 * su propia sección, que el alumno ya ve en el ranking, y solo se firman si la vista los pinta
 * (`conLogos`: la de equipos; la capa gratuita de B2 cuenta cada descarga, D212).
 */
export async function infoEquipos(
  seccion: SeccionId,
  { conLogos }: { conLogos: boolean },
): Promise<InfoEquipos> {
  const filas = await db()
    .select()
    .from(equipos)
    .where(eq(equipos.seccion, seccion));
  const lista = validas(filas.map(equipoDeFila));
  const logos = conLogos
    ? await urlsFirmadas(lista.flatMap((e) => (e.logoPath ? [e.logoPath] : [])))
    : new Map<string, string>();
  return infoDeEquipos(lista, logos);
}

/** URL firmada del logo de su equipo (Inicio y Mi equipo), o `null` sin logo. */
export async function logoDeEquipo(
  equipo: Pick<Equipo, "logoPath"> | null,
): Promise<string | null> {
  if (!equipo?.logoPath) return null;
  return (await urlsFirmadas([equipo.logoPath])).get(equipo.logoPath) ?? null;
}
