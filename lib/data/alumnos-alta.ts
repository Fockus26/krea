// Dar de alta y eliminar alumnos sobre Postgres (W12, D267–D269, D327). Sin `server-only` para que
// las pruebas los corran sobre PGlite; la app los usa solo desde lib/acciones/alumnos.ts, después
// de `exigirSesion("profesor")`.
//
// Alta: la cuenta la crea `crearCuenta` (D233); después `incorporarAlumnoEnTransaccion` lo pone en
// su equipo (con las reglas del tablero, D111) y reescribe el ranking en UNA transacción.
// Baja: `eliminarAlumnoEnTransaccion` borra en UNA transacción su perfil, sus entregas
// individuales, sus ajustes y su historial de base, lo saca del equipo (si era capitán el cargo
// pasa al siguiente) y reescribe el ranking. Las entregas grupales no se tocan: el equipo conserva
// su nota (D268). La cuenta (`user`, con sus sesiones) se borra en la misma transacción.
import { eq, inArray } from "drizzle-orm";
import {
  escriturasBorrado,
  type PlanBorradoAlumno,
  planBorradoAlumno,
  type ResumenBorrado,
} from "@/lib/alumnos-alta";
import type { ResultadoMover } from "@/lib/data/equipos";
import { entregaDeFila, equipoDeFila } from "@/lib/data/filas";
import {
  type DatosSeccion,
  escribirRanking,
  leerSeccion,
} from "@/lib/data/ranking";
import { leerUsuario } from "@/lib/data/usuarios";
import { type Db, enSerie, type Tx } from "@/lib/db";
import {
  equipos,
  historialBase,
  presencia,
  recuperaciones,
  ajustes as tAjustes,
  entregas as tEntregas,
  user,
  usuarios,
} from "@/lib/db/schema";
import { cambiosEntre, conCambios, estadoDeDatos } from "@/lib/equipos-datos";
import { equipoDeCedula, moverAlumno } from "@/lib/equipos-profe";
import {
  rutasImagen,
  type SeccionId,
  type Usuario,
  zAjuste,
} from "@/lib/modelo";

/**
 * ¿Puede un alumno nuevo de `seccion` entrar en `equipoId`? Se mira ANTES de crear la cuenta para
 * no dejar una cuenta creada con un equipo imposible.
 */
export async function equipoValidoPara(
  db: Db,
  equipoId: string,
  seccion: SeccionId,
): Promise<boolean> {
  const [f] = await db.select().from(equipos).where(eq(equipos.id, equipoId));
  const e = f ? equipoDeFila(f) : null;
  return e !== null && e.seccion === seccion;
}

/**
 * Tras `crearCuenta`: pone al alumno en `equipoId` (o lo deja sin equipo) con `moverAlumno` (el
 * primero que llega a un equipo vacío es su capitán, D111) y reescribe el ranking SIEMPRE (el
 * alumno nuevo entra con 0 puntos).
 */
export async function incorporarAlumnoEnTransaccion(
  db: Db,
  cedula: string,
  equipoId: string | null,
  ahora: number,
): Promise<ResultadoMover> {
  return db.transaction(async (tx): Promise<ResultadoMover> => {
    const u = await leerUsuario(tx, cedula);
    if (!u) return { ok: false, error: "no-existe" };
    if (u.rol !== "estudiante" || u.seccion === null)
      return { ok: false, error: "invalida" };
    const seccion = u.seccion;
    if (equipoId) {
      const [f] = await tx
        .select()
        .from(equipos)
        .where(eq(equipos.id, equipoId));
      const e = f ? equipoDeFila(f) : null;
      if (!e) return { ok: false, error: "no-existe" };
      if (e.seccion !== seccion) return { ok: false, error: "otra-seccion" };
    }
    const datos = await leerSeccion(tx, seccion);
    const antes = estadoDeDatos(seccion, datos.usuarios, datos.equipos);
    const despues = equipoId ? moverAlumno(antes, cedula, equipoId) : antes;
    const cambios = cambiosEntre(
      despues,
      datos.usuarios,
      datos.equipos,
      seccion,
    );
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
    await escribirRanking(
      tx,
      seccion,
      conCambios(datos, cambios, ahora),
      ahora,
    );
    return { ok: true, afectados: cambios.usuarios.map((c) => c.cedula) };
  });
}

/* ---------- Eliminar ---------- */

type Lecturas = {
  usuario: Usuario & { seccion: SeccionId };
  entregas: Array<typeof tEntregas.$inferSelect>;
  ajustes: Array<typeof tAjustes.$inferSelect>;
  historial: number;
  datos: DatosSeccion;
};

/**
 * Lo que hace falta para borrar a un alumno (la sección queda bloqueada hasta el commit). Las
 * consultas por cédula traen también las filas que no validan: se borran igual.
 */
async function leerAlumno(
  tx: Tx,
  cedula: string,
): Promise<
  { ok: true; l: Lecturas } | { ok: false; error: "no-existe" | "no-alumno" }
> {
  const [f] = await tx
    .select()
    .from(usuarios)
    .where(eq(usuarios.cedula, cedula));
  if (!f) return { ok: false, error: "no-existe" };
  const u = await leerUsuario(tx, cedula);
  // Un profe (o un perfil que no valida) no se borra por aquí (D234)
  if (!u || u.rol !== "estudiante" || u.seccion === null)
    return { ok: false, error: "no-alumno" };
  const seccion = u.seccion;
  const datos = await leerSeccion(tx, seccion);
  const [entregas, ajustes, historial] = await enSerie([
    tx.select().from(tEntregas).where(eq(tEntregas.titularId, cedula)),
    tx.select().from(tAjustes).where(eq(tAjustes.destinoId, cedula)),
    tx
      .select({ id: historialBase.id })
      .from(historialBase)
      .where(eq(historialBase.alumnoId, cedula)),
  ]);
  return {
    ok: true,
    l: {
      usuario: { ...u, seccion },
      entregas,
      ajustes,
      historial: historial.length,
      datos,
    },
  };
}

/** Qué se borra y cómo queda el equipo, a partir de lo leído. */
function planear(l: Lecturas) {
  const { usuario, datos } = l;
  const cedula = usuario.cedula;
  const plan: PlanBorradoAlumno = planBorradoAlumno(
    cedula,
    l.entregas.map((d) => ({
      id: d.id,
      tipo: d.tipo === "grupal" ? ("grupal" as const) : ("individual" as const),
      titularId: d.titularId,
      estado: d.estado,
    })),
    l.ajustes.map((d) => ({
      id: d.id,
      destino:
        d.destino === "equipo" ? ("equipo" as const) : ("alumno" as const),
      destinoId: d.destinoId,
      anulaA: zAjuste.safeParse(d).data?.anulaA ?? null,
    })),
  );

  // Imágenes de sus respuestas individuales: B2 las borra después del commit (D229)
  const borradas = new Set(plan.entregas);
  const imagenes = new Set<string>();
  for (const d of l.entregas) {
    if (!borradas.has(d.id)) continue;
    const e = entregaDeFila(d);
    for (const r of Object.values(e?.respuestas ?? {}))
      for (const ruta of rutasImagen(r)) imagenes.add(ruta);
  }

  // Sacarlo del equipo con la regla del tablero: si era capitán, el cargo pasa al siguiente
  const antes = estadoDeDatos(usuario.seccion, datos.usuarios, datos.equipos);
  const equipo = equipoDeCedula(antes, cedula);
  const despues = moverAlumno(antes, cedula, null);
  const cambios = cambiosEntre(
    despues,
    datos.usuarios,
    datos.equipos,
    usuario.seccion,
  );
  // Su propio perfil se borra: no se actualiza
  cambios.usuarios = cambios.usuarios.filter((c) => c.cedula !== cedula);

  let capitania: ResumenBorrado["capitania"] = null;
  if (equipo && antes.equipos[equipo]?.capitan === cedula) {
    const sucesor = despues.equipos[equipo]?.capitan ?? null;
    const nombre = (c: string) => {
      const x = datos.usuarios.find((y) => y.cedula === c);
      return x ? `${x.nombres} ${x.apellidos}` : c;
    };
    capitania = {
      equipo: datos.equipos.find((e) => e.id === equipo)?.nombre ?? equipo,
      sucesor: sucesor ? nombre(sucesor) : null,
    };
  }
  const escrituras = escriturasBorrado(
    plan,
    l.historial,
    cambios.equipos.length,
  );
  return { plan, imagenes: [...imagenes], cambios, capitania, escrituras };
}

/** Resumen para el diálogo de confirmación (solo lee; la transacción se descarta). */
export async function resumenBorradoCon(
  db: Db,
  cedula: string,
): Promise<
  | { ok: true; resumen: ResumenBorrado }
  | { ok: false; error: "no-existe" | "no-alumno" | "demasiados" }
> {
  return db.transaction(async (tx) => {
    const r = await leerAlumno(tx, cedula);
    if (!r.ok) return r;
    const p = planear(r.l);
    return {
      ok: true as const,
      resumen: {
        notas: p.plan.notas,
        sinNota: p.plan.sinNota,
        ajustes: p.plan.ajustesVisibles,
        capitania: p.capitania,
      },
    };
  });
}

/**
 * Borra los datos del alumno y reescribe el ranking de su sección en UNA transacción. Devuelve las
 * claves de B2 de sus imágenes. Un alumno que ya no existe responde `no-existe`.
 */
export async function eliminarAlumnoEnTransaccion(
  db: Db,
  cedula: string,
  ahora: number,
): Promise<
  | { ok: true; imagenes: string[] }
  | { ok: false; error: "no-existe" | "no-alumno" | "demasiados" }
> {
  return db.transaction(async (tx) => {
    const r = await leerAlumno(tx, cedula);
    if (!r.ok) return r;
    const { l } = r;
    const p = planear(l);
    const entregas = new Set(p.plan.entregas);
    const ajustes = new Set(p.plan.ajustes);
    if (entregas.size)
      await tx.delete(tEntregas).where(inArray(tEntregas.id, [...entregas]));
    if (ajustes.size)
      await tx.delete(tAjustes).where(inArray(tAjustes.id, [...ajustes]));
    await tx.delete(historialBase).where(eq(historialBase.alumnoId, cedula));
    // La cuenta y, en cascada, su perfil y sus sesiones: nadie vuelve a entrar con su cédula
    await tx.delete(user).where(eq(user.id, cedula));
    await tx.delete(recuperaciones).where(eq(recuperaciones.cedula, cedula));
    await tx.delete(presencia).where(eq(presencia.alumnoId, cedula));
    for (const c of p.cambios.equipos) {
      await tx
        .update(equipos)
        .set({ capitanId: c.capitanId })
        .where(eq(equipos.id, c.id));
    }
    const sinEl = conCambios(l.datos, p.cambios, ahora);
    await escribirRanking(
      tx,
      l.usuario.seccion,
      {
        ...sinEl,
        usuarios: sinEl.usuarios.filter((u) => u.cedula !== cedula),
        entregas: sinEl.entregas.filter((e) => !entregas.has(e.id)),
        ajustes: sinEl.ajustes.filter((a) => !ajustes.has(a.id)),
      },
      ahora,
    );
    return { ok: true, imagenes: p.imagenes } as const;
  });
}
