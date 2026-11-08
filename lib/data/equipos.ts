// Equipos del profesor sobre Postgres (fase 07 W8, D210, D212, W12, D270, D307–D309, D327). Sin
// `server-only` para que las pruebas los corran sobre PGlite; la app los usa solo desde
// lib/acciones/equipos.ts, después de `exigirSesion("profesor")`.
//
// Mover y cambiar capitán reutilizan las funciones puras del tablero (`moverAlumno`,
// `cambiarCapitan`) sobre el estado que sale de las filas, y escriben los perfiles y equipos que
// cambian junto con el ranking de la sección en UNA transacción (D175). Ya no hay claims que
// sincronizar: la sesión lee el equipo de `usuarios` en cada request.
import { and, eq, inArray, ne } from "drizzle-orm";
import type { Db, Tx } from "@/lib/db";
import { ajustes, entregas, equipos, usuarios } from "@/lib/db/schema";
import { idNuevo } from "@/lib/data/ajustes";
import { equipoDeFila, filaDeEquipo } from "@/lib/data/filas";
import { escribirRanking, leerSeccion } from "@/lib/data/ranking";
import { leerUsuarioParaActualizar } from "@/lib/data/usuarios";
import {
  type CambiarCapitan,
  cambiosEntre,
  conCambios,
  estadoDeDatos,
  type MoverAlumno,
  type ResultadoEquipos,
} from "@/lib/equipos-datos";
import {
  type EquipoACrear,
  type EquipoAEditar,
  type ErrorGestionEquipo,
  equipoNuevo,
  nombreRepetido,
  type ResultadoGestionEquipo,
} from "@/lib/equipos-gestion";
import { cambiarCapitan, moverAlumno } from "@/lib/equipos-profe";

/** Resultado de una transacción de equipos: los alumnos cuyo equipo cambió. */
export type ResultadoMover =
  | { ok: true; afectados: string[] }
  | Extract<ResultadoEquipos, { ok: false }>;

async function equipoParaActualizar(tx: Tx, id: string) {
  const [f] = await tx.select().from(equipos).where(eq(equipos.id, id)).for("update");
  if (!f) return undefined;
  return equipoDeFila(f);
}

async function escribirCambios(
  tx: Tx,
  cambios: ReturnType<typeof cambiosEntre>,
  ahora: number,
) {
  for (const c of cambios.usuarios) {
    await tx
      .update(usuarios)
      .set({ equipoId: c.equipoId, actualizadoEn: ahora })
      .where(eq(usuarios.cedula, c.cedula));
  }
  for (const c of cambios.equipos) {
    await tx
      .update(equipos)
      .set({ capitanId: c.capitanId })
      .where(eq(equipos.id, c.id));
  }
}

/** Pasa a un alumno a otro equipo de su sección (o lo deja sin equipo) y recalcula el ranking. */
export async function moverAlumnoEnTransaccion(
  db: Db,
  entrada: MoverAlumno,
  ahora: number,
): Promise<ResultadoMover> {
  return db.transaction(async (tx): Promise<ResultadoMover> => {
    const u = await leerUsuarioParaActualizar(tx, entrada.cedula);
    if (!u) return { ok: false, error: "no-existe" };
    if (u.rol !== "estudiante" || u.seccion === null)
      return { ok: false, error: "invalida" };
    const seccion = u.seccion;
    if (entrada.destino !== null) {
      const [f] = await tx
        .select()
        .from(equipos)
        .where(eq(equipos.id, entrada.destino));
      if (!f) return { ok: false, error: "no-existe" };
      const e = equipoDeFila(f);
      if (!e) return { ok: false, error: "invalida" };
      if (e.seccion !== seccion) return { ok: false, error: "otra-seccion" };
    }
    const datos = await leerSeccion(tx, seccion);
    const antes = estadoDeDatos(seccion, datos.usuarios, datos.equipos);
    const despues = moverAlumno(antes, entrada.cedula, entrada.destino);
    const cambios = cambiosEntre(despues, datos.usuarios, datos.equipos, seccion);
    await escribirCambios(tx, cambios, ahora);
    if (cambios.usuarios.length || cambios.equipos.length) {
      await escribirRanking(tx, seccion, conCambios(datos, cambios, ahora), ahora);
    }
    return { ok: true, afectados: cambios.usuarios.map((c) => c.cedula) };
  });
}

/** Cambia el capitán de un equipo (D012: solo él envía la grupal) y recalcula el ranking. */
export async function cambiarCapitanEnTransaccion(
  db: Db,
  entrada: CambiarCapitan,
  ahora: number,
): Promise<ResultadoMover> {
  return db.transaction(async (tx): Promise<ResultadoMover> => {
    const e = await equipoParaActualizar(tx, entrada.equipoId);
    if (e === undefined) return { ok: false, error: "no-existe" };
    if (e === null) return { ok: false, error: "invalida" };
    const seccion = e.seccion;
    const datos = await leerSeccion(tx, seccion);
    const antes = estadoDeDatos(seccion, datos.usuarios, datos.equipos);
    if (!antes.equipos[entrada.equipoId]?.miembros.includes(entrada.cedula))
      return { ok: false, error: "invalida" };
    const despues = cambiarCapitan(antes, entrada.equipoId, entrada.cedula);
    const cambios = cambiosEntre(despues, datos.usuarios, datos.equipos, seccion);
    await escribirCambios(tx, cambios, ahora);
    if (cambios.usuarios.length || cambios.equipos.length) {
      await escribirRanking(tx, seccion, conCambios(datos, cambios, ahora), ahora);
    }
    return { ok: true, afectados: cambios.usuarios.map((c) => c.cedula) };
  });
}

/**
 * Guarda la ruta del logo nuevo en el equipo y en el ranking (D212). Devuelve la ruta anterior
 * para que quien llama borre el objeto viejo de B2 tras el commit.
 */
export async function cambiarLogoEnTransaccion(
  db: Db,
  equipoId: string,
  logoPath: string,
  ahora: number,
): Promise<
  | { ok: true; anterior: string | null }
  | Extract<ResultadoEquipos, { ok: false }>
> {
  return db.transaction(async (tx) => {
    const e = await equipoParaActualizar(tx, equipoId);
    if (e === undefined) return { ok: false, error: "no-existe" } as const;
    if (e === null) return { ok: false, error: "invalida" } as const;
    const datos = await leerSeccion(tx, e.seccion);
    await tx.update(equipos).set({ logoPath }).where(eq(equipos.id, equipoId));
    await escribirRanking(
      tx,
      e.seccion,
      {
        ...datos,
        equipos: datos.equipos.map((x) =>
          x.id === equipoId ? { ...x, logoPath } : x,
        ),
      },
      ahora,
    );
    return { ok: true, anterior: e.logoPath } as const;
  });
}

/** Crea un equipo en la sección y lo suma al ranking con 0 puntos. */
export async function crearEquipoEnTransaccion(
  db: Db,
  d: EquipoACrear,
  ahora: number,
): Promise<ResultadoGestionEquipo> {
  const id = idNuevo();
  return db.transaction(async (tx): Promise<ResultadoGestionEquipo> => {
    const datos = await leerSeccion(tx, d.seccion);
    if (nombreRepetido(d.nombre, datos.equipos, d.seccion))
      return { ok: false, error: "repetido" };
    const equipo = equipoNuevo(d);
    await tx.insert(equipos).values(filaDeEquipo(id, equipo));
    await escribirRanking(
      tx,
      d.seccion,
      { ...datos, equipos: [...datos.equipos, { id, ...equipo }] },
      ahora,
    );
    return { ok: true, id };
  });
}

/** Cambia nombre y tema (el nombre entra en el ranking). */
export async function editarEquipoEnTransaccion(
  db: Db,
  d: EquipoAEditar,
  ahora: number,
): Promise<ResultadoGestionEquipo> {
  return db.transaction(async (tx): Promise<ResultadoGestionEquipo> => {
    const e = await equipoParaActualizar(tx, d.equipoId);
    if (e === undefined) return { ok: false, error: "no-existe" };
    if (e === null) return { ok: false, error: "invalida" };
    const datos = await leerSeccion(tx, e.seccion);
    if (nombreRepetido(d.nombre, datos.equipos, e.seccion, d.equipoId))
      return { ok: false, error: "repetido" };
    await tx
      .update(equipos)
      .set({ nombre: d.nombre, tema: d.tema })
      .where(eq(equipos.id, d.equipoId));
    await escribirRanking(
      tx,
      e.seccion,
      {
        ...datos,
        equipos: datos.equipos.map((x) =>
          x.id === d.equipoId ? { ...x, nombre: d.nombre, tema: d.tema } : x,
        ),
      },
      ahora,
    );
    return { ok: true, id: d.equipoId };
  });
}

type Eliminado = {
  resultado: ResultadoGestionEquipo;
  logo: string | null;
  /** Integrantes que quedaron «Sin equipo». */
  afectados: string[];
};

/**
 * Elimina un equipo con todo lo suyo en UNA transacción (D307–D309): sus integrantes pasan a «Sin
 * equipo» (`moverAlumno` a `null`, como al quitarlos del tablero), cada entrega grupal suya se
 * queda con su nota e `integrantes` y recibe `titularNombre`, sus ajustes de puntos se borran, y
 * el ranking se reescribe sin él. Devuelve la ruta del logo (B2 la borra tras el commit) y los
 * integrantes movidos. Postgres no tiene el límite de 500 escrituras: `demasiados` ya no sale.
 */
export async function eliminarEquipoEnTransaccion(
  db: Db,
  equipoId: string,
  ahora: number,
): Promise<Eliminado> {
  const fallo = (error: ErrorGestionEquipo): Eliminado => ({
    resultado: { ok: false, error },
    logo: null,
    afectados: [],
  });
  return db.transaction(async (tx): Promise<Eliminado> => {
    const e = await equipoParaActualizar(tx, equipoId);
    if (e === undefined) return fallo("no-existe");
    if (e === null) return fallo("invalida");
    const seccion = e.seccion;
    const datos = await leerSeccion(tx, seccion);
    const borrar = await tx
      .select({ id: ajustes.id })
      .from(ajustes)
      .where(and(eq(ajustes.destinoId, equipoId), ne(ajustes.destino, "alumno")));

    // Cada integrante sale con la regla del tablero; el equipo se borra: su capitán no se escribe
    let estado = estadoDeDatos(seccion, datos.usuarios, datos.equipos);
    for (const c of estado.equipos[equipoId]?.miembros ?? [])
      estado = moverAlumno(estado, c, null);
    const cambios = cambiosEntre(estado, datos.usuarios, datos.equipos, seccion);
    cambios.equipos = cambios.equipos.filter((c) => c.id !== equipoId);

    await escribirCambios(tx, cambios, ahora);
    await tx
      .update(entregas)
      .set({ titularNombre: e.nombre })
      .where(and(eq(entregas.titularId, equipoId), ne(entregas.tipo, "individual")));
    const borrados = new Set(borrar.map((a) => a.id));
    if (borrados.size)
      await tx.delete(ajustes).where(inArray(ajustes.id, [...borrados]));
    await tx.delete(equipos).where(eq(equipos.id, equipoId));

    const sinEl = conCambios(datos, cambios, ahora);
    await escribirRanking(
      tx,
      seccion,
      {
        ...sinEl,
        equipos: sinEl.equipos.filter((x) => x.id !== equipoId),
        ajustes: sinEl.ajustes.filter((a) => !borrados.has(a.id)),
      },
      ahora,
    );
    return {
      resultado: { ok: true, id: equipoId },
      logo: e.logoPath,
      afectados: cambios.usuarios.map((u) => u.cedula),
    };
  });
}
