// Equipos del profesor con datos de Firestore (fase 07 W8, D210–D212). Puro (sin Firebase ni
// reloj): qué mandan las acciones, el `EstadoEquipos` que sale de los documentos, qué documentos
// cambian tras `moverAlumno`/`cambiarCapitan` (las funciones puras de `lib/equipos-profe.ts`) y
// las props del tablero.
import { z } from "zod";
import {
  type DatosEquiposProfe,
  type EquipoEstado,
  type EstadoEquipos,
  equipoDeCedula,
} from "@/lib/equipos-profe";
import { zIdDocumento } from "@/lib/evaluar-datos";
import {
  type Equipo,
  type RankingSeccion,
  type SeccionId,
  type Usuario,
  zCedula,
} from "@/lib/modelo";
import { rankCompetition } from "@/lib/ranking";

type ConId<T> = { id: string } & T;

/* ---------- Entrada de las Server Actions ---------- */

/** Mover a un alumno a otro equipo de su sección, o dejarlo sin equipo (`destino: null`). */
export const zMoverAlumno = z.object({
  cedula: zCedula,
  destino: zIdDocumento.nullable(),
});
export type MoverAlumno = z.infer<typeof zMoverAlumno>;

export const zCambiarCapitan = z.object({
  equipoId: zIdDocumento,
  cedula: zCedula,
});
export type CambiarCapitan = z.infer<typeof zCambiarCapitan>;

export type ErrorEquipos =
  | "invalida"
  | "no-existe"
  | "otra-seccion"
  | "sesiones"
  | "logo-peso"
  | "logo-tipo"
  | "red";

export type ResultadoEquipos =
  | { ok: true }
  | { ok: false; error: ErrorEquipos };

/** Subir logo: la URL firmada del nuevo (`null` si no se pudo firmar: se pinta el local). */
export type ResultadoLogo =
  | { ok: true; url: string | null }
  | { ok: false; error: ErrorEquipos };

/** Texto del toast de error de cada acción del tablero (copy provisional, fila 135). */
export function errorEquiposTexto(e: ErrorEquipos): string {
  switch (e) {
    case "no-existe":
      return "Ese alumno o equipo ya no existe. Recarga la página.";
    case "otra-seccion":
      return "Solo puedes mover alumnos entre equipos de su sección.";
    case "sesiones":
      return "El cambio se guardó, pero no pudimos cerrar su sesión. Vuelve a intentarlo.";
    case "logo-peso":
      return "El logo pesa demasiado. Prueba con otra imagen.";
    case "logo-tipo":
      return "No pudimos leer el logo. Prueba con una imagen JPG, PNG o WebP.";
    case "invalida":
      return "No se pudo guardar el cambio. Recarga la página e inténtalo otra vez.";
    case "red":
      return "No se guardó: revisa tu conexión e inténtalo otra vez.";
  }
}

/* ---------- Del documento al estado del tablero ---------- */

const comparaNombre = new Intl.Collator("es", { sensitivity: "base" });
const nombreDe = (u: Pick<Usuario, "nombres" | "apellidos">) =>
  `${u.nombres} ${u.apellidos}`.replace(/\s+/g, " ").trim();

/** Alumnos de la sección por nombre (el orden de las listas del tablero). */
function alumnosDe(
  usuarios: readonly Usuario[],
  seccion: SeccionId,
): Usuario[] {
  return usuarios
    .filter((u) => u.rol === "estudiante" && u.seccion === seccion)
    .sort((a, b) => comparaNombre.compare(nombreDe(a), nombreDe(b)));
}

/**
 * `EstadoEquipos` de una sección: integrantes por `usuarios.equipoId` (la fuente de verdad) y
 * capitán por `equipos.capitanId`. Un `equipoId` que apunta a un equipo que no existe o de otra
 * sección cuenta como «Sin equipo». Un capitán que ya no es integrante se descarta (con 1
 * integrante, ese es el capitán; con más, el primero), como hace `moverAlumno`.
 */
export function estadoDeDatos(
  seccion: SeccionId,
  usuarios: readonly Usuario[],
  equipos: ReadonlyArray<ConId<Equipo>>,
): EstadoEquipos {
  const propios = equipos.filter((e) => e.seccion === seccion);
  const ids = new Set(propios.map((e) => e.id));
  const alumnos = alumnosDe(usuarios, seccion);
  const estado: Record<string, EquipoEstado> = {};
  for (const e of propios) {
    const miembros = alumnos
      .filter((u) => u.equipoId === e.id)
      .map((u) => u.cedula);
    const capitan =
      e.capitanId !== null && miembros.includes(e.capitanId)
        ? e.capitanId
        : (miembros[0] ?? null);
    estado[e.id] = { miembros, capitan };
  }
  return {
    equipos: estado,
    sinEquipo: alumnos
      .filter((u) => u.equipoId === null || !ids.has(u.equipoId))
      .map((u) => u.cedula),
  };
}

export type CambiosEquipos = {
  /** Alumnos cuyo `equipoId` cambia (y a cuál). */
  usuarios: Array<{ cedula: string; equipoId: string | null }>;
  /** Equipos cuyo `capitanId` cambia (y a quién). */
  equipos: Array<{ id: string; capitanId: string | null }>;
};

/**
 * Qué documentos hay que escribir para pasar de `antes` a `despues`. Compara con los documentos
 * guardados (`usuarios`, `equipos`), no solo entre estados: así también se corrige un dato que
 * estaba desalineado (un capitán que ya no era integrante).
 */
export function cambiosEntre(
  despues: EstadoEquipos,
  usuarios: readonly Usuario[],
  equipos: ReadonlyArray<ConId<Equipo>>,
  seccion: SeccionId,
): CambiosEquipos {
  const out: CambiosEquipos = { usuarios: [], equipos: [] };
  for (const u of alumnosDe(usuarios, seccion)) {
    const nuevo = equipoDeCedula(despues, u.cedula);
    // Un `equipoId` huérfano se queda tal cual mientras el alumno siga «Sin equipo» en pantalla
    const actual =
      u.equipoId !== null && despues.equipos[u.equipoId] ? u.equipoId : null;
    if (nuevo !== actual)
      out.usuarios.push({ cedula: u.cedula, equipoId: nuevo });
  }
  for (const e of equipos) {
    const est = despues.equipos[e.id];
    if (e.seccion !== seccion || !est) continue;
    if (est.capitan !== e.capitanId)
      out.equipos.push({ id: e.id, capitanId: est.capitan });
  }
  return out;
}

/** Aplica los cambios a los datos leídos (para recalcular el ranking en la misma transacción). */
export function conCambios<
  D extends {
    usuarios: Usuario[];
    equipos: Array<ConId<Equipo>>;
  },
>(datos: D, cambios: CambiosEquipos, ahora: number): D {
  const equipoDe = new Map(cambios.usuarios.map((c) => [c.cedula, c.equipoId]));
  const capitanDe = new Map(cambios.equipos.map((c) => [c.id, c.capitanId]));
  return {
    ...datos,
    usuarios: datos.usuarios.map((u) => {
      const equipoId = equipoDe.get(u.cedula);
      return equipoId === undefined
        ? u
        : { ...u, equipoId, actualizadoEn: ahora };
    }),
    equipos: datos.equipos.map((e) => {
      const capitanId = capitanDe.get(e.id);
      return capitanId === undefined ? e : { ...e, capitanId };
    }),
  };
}

/* ---------- Props del tablero ---------- */

/**
 * Tablero de una sección con los documentos reales: equipos en el orden del ranking (puntos de
 * `ranking/{seccion}`; sin documento, 0 y empate), integrantes con su avatar y el estado inicial.
 * `logos`: equipo → URL firmada (solo la de los que tienen logo).
 */
export function equiposProfeDatos(
  seccion: SeccionId,
  datos: {
    usuarios: readonly Usuario[];
    equipos: ReadonlyArray<ConId<Equipo>>;
    ranking: RankingSeccion | null;
    logos?: ReadonlyMap<string, string>;
  },
): DatosEquiposProfe {
  const propios = datos.equipos.filter((e) => e.seccion === seccion);
  const alumnos = alumnosDe(datos.usuarios, seccion);
  const filas = rankCompetition(
    propios.map((e) => ({
      ...e,
      puntos: datos.ranking?.equipos[e.id]?.puntos ?? 0,
      primerApellido: e.nombre,
    })),
  );
  return {
    seccion,
    equipos: filas.map((e) => ({
      id: e.id,
      nombre: e.nombre,
      tema: e.tema,
      puesto: e.puesto,
      puntos: e.puntos,
      empate: e.empate,
      logo: (e.logoPath && datos.logos?.get(e.logoPath)) || null,
    })),
    alumnos: Object.fromEntries(
      alumnos.map((u) => [
        u.cedula,
        {
          cedula: u.cedula,
          nombre: nombreDe(u),
          seed: u.avatar.semilla,
          estilo: u.avatar.estilo,
        },
      ]),
    ),
    inicial: estadoDeDatos(seccion, datos.usuarios, datos.equipos),
    total: alumnos.length,
  };
}
