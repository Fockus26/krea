import "server-only";
// Lecturas del estudiante en el servidor (fase 07, D189, D327): Postgres detrás de `exigirSesion`,
// una vez por request (`cache`). Solo lee lo de su sección y lo suyo (lo que dejaban las reglas de
// Firestore); el mapeo a las pantallas es puro (`lib/vistas-estudiante.ts`). Fila que no valida
// con zod: se omite y se registra.
import { and, arrayContains, eq } from "drizzle-orm";
import { cache } from "react";
import { type TarjetaProfe, tarjetasProfes } from "@/lib/contacto";
import { exigirSesion } from "@/lib/dal";
import type { BorradorGuardado } from "@/lib/borrador-grupal";
import { leerBorradorGrupal } from "@/lib/data/borrador-grupal";
import { contactosDeProfes } from "@/lib/data/contacto";
import {
  entregasDeIntegrante,
  entregasGrupalesDeEquipo,
  leerEntrega,
} from "@/lib/data/entregas";
import {
  ajusteDeFila,
  entregaDeFila,
  equipoDeFila,
  tareaDeFila,
  validas,
} from "@/lib/data/filas";
import { leerPartes } from "@/lib/data/partes";
import { leerRanking } from "@/lib/data/ranking";
import {
  leerUsuario,
  nombresDeProfes,
  usuarioDeFila,
} from "@/lib/data/usuarios";
import { db, opcional } from "@/lib/datos/comun";
import { idPublico } from "@/lib/datos/id-publico";
import { urlsFirmadas } from "@/lib/datos/imagenes";
import { ajustes, entregas, equipos, tareas, usuarios } from "@/lib/db/schema";
import { conSemillaPublica } from "@/lib/id-publico";
import {
  type Entrega,
  type Equipo,
  idEntrega,
  type Parte,
  type RankingSeccion,
  type SeccionId,
  type Tarea,
  type Usuario,
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

/** «Tus profesores» (D380): todos los de su sección o de todas, con o sin contacto (D459). */
export const profesDelAlumno = cache(async (): Promise<TarjetaProfe[]> => {
  const { seccion } = await alumnoActual();
  return tarjetasProfes(await contactosDeProfes(db(), seccion));
});

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

/**
 * Integrantes actuales de un equipo (perfiles: solo el servidor los lee). La semilla que aún
 * tuviera la cédula se cambia por el id público: las vistas la mandan al cliente (D496).
 */
export const integrantesDe = cache(
  async (equipoId: string): Promise<Usuario[]> => {
    const filas = await db()
      .select()
      .from(usuarios)
      .where(
        and(eq(usuarios.equipoId, equipoId), eq(usuarios.rol, "estudiante")),
      );
    return validas(filas.map(usuarioDeFila)).map((u) =>
      conSemillaPublica(u, idPublico),
    );
  },
);

/**
 * El reparto de una grupal de SU equipo (D416). Las respuestas de cada parte las filtra la vista
 * (`partesDeIntegrante`): al integrante solo le llega la suya (D423). Si la lectura falla, sin
 * reparto: el formulario normal sigue (D436).
 */
export const partesDelEquipo = cache(
  async (tareaId: string, equipoId: string): Promise<Parte[]> =>
    opcional(
      "partes del equipo",
      () => leerPartes(db(), idEntrega(tareaId, equipoId)),
      [],
    ),
);

/**
 * El borrador compartido del capitán de SU equipo en esa grupal (D544). Lo pinta la página (el
 * integrante en solo lectura, el capitán como punto de partida); `actualizadoPor` no sale al
 * cliente. Si la lectura falla, sin borrador (como antes de D544).
 */
export const borradorDelEquipo = cache(
  async (tareaId: string, equipoId: string): Promise<BorradorGuardado | null> =>
    opcional(
      "borrador del equipo",
      () => leerBorradorGrupal(db(), idEntrega(tareaId, equipoId)),
      null,
    ),
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
  // Las grupales que su equipo envió antes de que él entrara (D526): para «Por entregar» (D550)
  const delEquipo = equipo
    ? (
        await opcional(
          "grupales del equipo",
          () => entregasGrupalesDeEquipo(db(), equipo.id),
          [],
        )
      ).filter((e) => !susEntregas.some((s) => s.id === e.id))
    : [];
  return {
    usuario,
    equipo,
    tareas: tareasSeccion,
    entregas: susEntregas,
    delEquipo,
    ajustes: susAjustes,
    ranking,
  };
});

/**
 * Nombre de quien evaluó sus entregas de esa tarea (cédula → nombres y apellidos, D447), para el
 * detalle de la nota. Solo el servidor ve la clave: `detalleNota` devuelve el nombre corto.
 */
export const evaluadoresDeTarea = cache(async (tareaId: string) => {
  const { entregas: suyas } = await datosAlumno();
  return nombresDeProfes(
    db(),
    suyas.flatMap((e) =>
      e.tareaId === tareaId && e.evaluacion?.evaluadaPor
        ? [e.evaluacion.evaluadaPor]
        : [],
    ),
  );
});

/**
 * La grupal de esa tarea de SU equipo actual, aunque él no figure como integrante (entró después
 * del envío, D526): la vista la muestra en solo lectura y sin nota suya. Si falla, como antes.
 */
export const entregaDelEquipo = cache(
  async (tareaId: string, equipoId: string): Promise<ConId<Entrega> | null> =>
    opcional(
      "entrega del equipo",
      () => leerEntrega(db(), idEntrega(tareaId, equipoId)),
      null,
    ),
);

/**
 * Nombre de quien envió una entrega y ya no está en el equipo (D525): solo un alumno de su
 * sección, y solo nombres y apellidos (la vista arma el nombre corto; la cédula no sale).
 */
export const autorDeEnvio = cache(
  async (
    cedula: string,
  ): Promise<Map<string, Pick<Usuario, "nombres" | "apellidos">>> => {
    const { seccion } = await alumnoActual();
    const u = await opcional(
      "autor del envío",
      () => leerUsuario(db(), cedula),
      null,
    );
    return u && u.rol === "estudiante" && u.seccion === seccion
      ? new Map([[cedula, { nombres: u.nombres, apellidos: u.apellidos }]])
      : new Map();
  },
);

/**
 * Quiénes compiten por el premio de una individual en su sección (D527): los alumnos (solo lo que
 * pide `notasPremioIndividual`) y sus entregas de esa tarea. Solo el servidor los lee: al alumno
 * le llega si ganó, nunca las notas de los demás.
 */
export const competidoresPremio = cache(
  async (
    tareaId: string,
    seccion: SeccionId,
  ): Promise<{
    alumnos: Array<Pick<Usuario, "cedula" | "rol" | "seccion" | "base">>;
    entregas: Entrega[];
  }> => {
    const [filasAlumnos, filasEntregas] = await Promise.all([
      db()
        .select()
        .from(usuarios)
        .where(
          and(eq(usuarios.seccion, seccion), eq(usuarios.rol, "estudiante")),
        ),
      db()
        .select()
        .from(entregas)
        .where(
          and(
            eq(entregas.tareaId, tareaId),
            eq(entregas.seccion, seccion),
            eq(entregas.tipo, "individual"),
          ),
        ),
    ]);
    return {
      alumnos: validas(filasAlumnos.map(usuarioDeFila)).map((u) => ({
        cedula: u.cedula,
        rol: u.rol,
        seccion: u.seccion,
        base: u.base,
      })),
      entregas: validas(filasEntregas.map(entregaDeFila)),
    };
  },
);

/** Entregas grupales de la sección (Mi equipo: notas del equipo y ganadores de premios). */
export async function entregasGrupales(seccion: SeccionId): Promise<Entrega[]> {
  const filas = await db()
    .select()
    .from(entregas)
    .where(and(eq(entregas.seccion, seccion), eq(entregas.tipo, "grupal")));
  return validas(filas.map(entregaDeFila));
}

/**
 * Tema, capitán (su id público, D494) y logo de los equipos de la sección (lo que el ranking no
 * trae). Los logos son de su propia sección, que el alumno ya ve en el ranking, y solo se firman
 * si la vista los pinta (`conLogos`: la de equipos; la capa gratuita de B2 cuenta cada descarga,
 * D212).
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
  return infoDeEquipos(lista, logos, idPublico);
}

/** URL firmada del logo de su equipo (Inicio y Mi equipo), o `null` sin logo. */
export async function logoDeEquipo(
  equipo: Pick<Equipo, "logoPath"> | null,
): Promise<string | null> {
  if (!equipo?.logoPath) return null;
  return (await urlsFirmadas([equipo.logoPath])).get(equipo.logoPath) ?? null;
}
