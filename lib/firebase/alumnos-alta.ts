// Adaptadores del Admin SDK para dar de alta y eliminar alumnos (W12, D267–D269). Sin `server-only`
// para que las pruebas de tests/rules los corran contra los emuladores; la app los usa solo desde
// lib/acciones/alumnos.ts, después de `exigirSesion("profesor")`.
//
// Alta: la cuenta la crea `crearCuenta` (D233); después `incorporarAlumnoEnTransaccion` lo pone en
// su equipo (con las reglas del tablero, D111) y reescribe `ranking/{seccion}` en UNA transacción.
// Baja: `eliminarAlumnoEnTransaccion` borra en UNA transacción su perfil, `privados`, sus entregas
// individuales, sus ajustes y su historial de base, lo saca del equipo (si era capitán el cargo
// pasa al siguiente, como al quitarlo del equipo) y reescribe el ranking. Las entregas grupales no
// se tocan: el equipo conserva su nota (D268).
import type { Auth } from "firebase-admin/auth";
import type {
  Firestore,
  QuerySnapshot,
  Transaction,
} from "firebase-admin/firestore";
import {
  cabeEnTransaccion,
  escriturasBorrado,
  type PlanBorradoAlumno,
  planBorradoAlumno,
  type ResumenBorrado,
} from "@/lib/alumnos-alta";
import { cambiosEntre, conCambios, estadoDeDatos } from "@/lib/equipos-datos";
import { equipoDeCedula, moverAlumno } from "@/lib/equipos-profe";
import type { ResultadoMover } from "@/lib/firebase/equipos";
import {
  type DatosSeccion,
  escribirRankingEnTx,
  leerSeccionEnTx,
} from "@/lib/firebase/ranking";
import {
  COL,
  type SeccionId,
  type Usuario,
  zAjuste,
  zEntrega,
  zEquipo,
  zUsuario,
} from "@/lib/modelo";

const codigo = (e: unknown) => (e as { code?: unknown }).code;

/**
 * ¿Puede un alumno nuevo de `seccion` entrar en `equipoId`? Se mira ANTES de crear la cuenta para
 * no dejar una cuenta creada con un equipo imposible.
 */
export async function equipoValidoPara(
  db: Firestore,
  equipoId: string,
  seccion: SeccionId,
): Promise<boolean> {
  const snap = await db.collection(COL.equipos).doc(equipoId).get();
  const e = zEquipo.safeParse(snap.data());
  return e.success && e.data.seccion === seccion;
}

/**
 * Tras `crearCuenta`: pone al alumno en `equipoId` (o lo deja sin equipo) con `moverAlumno` (el
 * primero que llega a un equipo vacío es su capitán, D111) y reescribe `ranking/{seccion}` SIEMPRE
 * (el alumno nuevo entra en el ranking con 0 puntos). Devuelve a quién cambiarle las claims.
 */
export async function incorporarAlumnoEnTransaccion(
  db: Firestore,
  cedula: string,
  equipoId: string | null,
  ahora: number,
): Promise<ResultadoMover> {
  const ref = db.collection(COL.usuarios).doc(cedula);
  const equipoRef = equipoId ? db.collection(COL.equipos).doc(equipoId) : null;
  return db.runTransaction(async (tx): Promise<ResultadoMover> => {
    const [snap, eq] = await Promise.all([
      tx.get(ref),
      equipoRef ? tx.get(equipoRef) : null,
    ]);
    const u = zUsuario.safeParse(snap.data());
    if (!u.success) return { ok: false, error: "no-existe" };
    if (u.data.rol !== "estudiante" || u.data.seccion === null)
      return { ok: false, error: "invalida" };
    const seccion = u.data.seccion;
    if (eq) {
      const e = zEquipo.safeParse(eq.data());
      if (!e.success) return { ok: false, error: "no-existe" };
      if (e.data.seccion !== seccion)
        return { ok: false, error: "otra-seccion" };
    }
    const datos = await leerSeccionEnTx(tx, db, seccion);
    const antes = estadoDeDatos(seccion, datos.usuarios, datos.equipos);
    const despues = equipoId ? moverAlumno(antes, cedula, equipoId) : antes;
    const cambios = cambiosEntre(
      despues,
      datos.usuarios,
      datos.equipos,
      seccion,
    );
    for (const c of cambios.usuarios) {
      tx.update(db.collection(COL.usuarios).doc(c.cedula), {
        equipoId: c.equipoId,
        actualizadoEn: ahora,
      });
    }
    for (const c of cambios.equipos) {
      tx.update(db.collection(COL.equipos).doc(c.id), {
        capitanId: c.capitanId,
      });
    }
    escribirRankingEnTx(
      tx,
      db,
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
  entregas: QuerySnapshot;
  ajustes: QuerySnapshot;
  historial: QuerySnapshot;
  datos: DatosSeccion;
};

/**
 * Lo que hace falta para borrar a un alumno, leído en `tx` (la del borrado, o una de solo lectura
 * para el resumen previo). Las consultas por cédula traen también los documentos que no validan:
 * se borran igual.
 */
async function leerAlumno(
  tx: Transaction,
  db: Firestore,
  cedula: string,
): Promise<
  { ok: true; l: Lecturas } | { ok: false; error: "no-existe" | "no-alumno" }
> {
  const snap = await tx.get(db.collection(COL.usuarios).doc(cedula));
  if (!snap.exists) return { ok: false, error: "no-existe" };
  const u = zUsuario.safeParse(snap.data());
  // Un profe (o un perfil que no valida) no se borra por aquí (D234)
  if (!u.success || u.data.rol !== "estudiante" || u.data.seccion === null)
    return { ok: false, error: "no-alumno" };
  const seccion = u.data.seccion;
  const [entregas, ajustes, historial, datos] = await Promise.all([
    tx.get(db.collection(COL.entregas).where("titularId", "==", cedula)),
    tx.get(db.collection(COL.ajustes).where("destinoId", "==", cedula)),
    tx.get(db.collection(COL.historialBase).where("alumnoId", "==", cedula)),
    leerSeccionEnTx(tx, db, seccion),
  ]);
  return {
    ok: true,
    l: { usuario: { ...u.data, seccion }, entregas, ajustes, historial, datos },
  };
}

/** Qué se borra y cómo queda el equipo, a partir de lo leído. */
function planear(l: Lecturas) {
  const { usuario, datos } = l;
  const cedula = usuario.cedula;
  const crudo = (s: QuerySnapshot) =>
    s.docs.map((d) => ({
      id: d.id,
      data: d.data() as Record<string, unknown>,
    }));
  const entregas = crudo(l.entregas).map((d) => ({
    id: d.id,
    // Un documento que no valida se borra si su forma básica es la de una individual suya
    tipo:
      d.data.tipo === "grupal" ? ("grupal" as const) : ("individual" as const),
    titularId: String(d.data.titularId),
    estado: zEntrega.safeParse(d.data).data?.estado ?? ("borrador" as const),
  }));
  const ajustes = crudo(l.ajustes).map((d) => ({
    id: d.id,
    destino:
      d.data.destino === "equipo" ? ("equipo" as const) : ("alumno" as const),
    destinoId: String(d.data.destinoId),
    anulaA: zAjuste.safeParse(d.data).data?.anulaA ?? null,
  }));
  const plan: PlanBorradoAlumno = planBorradoAlumno(cedula, entregas, ajustes);

  // Imágenes de sus respuestas individuales: B2 las borra después del commit (D229)
  const borradas = new Set(plan.entregas);
  const imagenes = new Set<string>();
  for (const d of l.entregas.docs) {
    if (!borradas.has(d.id)) continue;
    const e = zEntrega.safeParse(d.data());
    if (!e.success) continue;
    for (const r of Object.values(e.data.respuestas))
      if ("imagenPath" in r) imagenes.add(r.imagenPath);
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
    l.historial.size,
    cambios.equipos.length,
  );
  return { plan, imagenes: [...imagenes], cambios, capitania, escrituras };
}

/** Resumen para el diálogo de confirmación (solo lee). */
export async function resumenBorradoCon(
  db: Firestore,
  cedula: string,
): Promise<
  | { ok: true; resumen: ResumenBorrado }
  | { ok: false; error: "no-existe" | "no-alumno" | "demasiados" }
> {
  const r = await db.runTransaction((tx) => leerAlumno(tx, db, cedula), {
    readOnly: true,
  });
  if (!r.ok) return r;
  const p = planear(r.l);
  if (!cabeEnTransaccion(p.escrituras))
    return { ok: false, error: "demasiados" };
  return {
    ok: true,
    resumen: {
      notas: p.plan.notas,
      sinNota: p.plan.sinNota,
      ajustes: p.plan.ajustesVisibles,
      capitania: p.capitania,
    },
  };
}

/**
 * Borra los datos del alumno y reescribe el ranking de su sección en UNA transacción (todas las
 * lecturas antes de la primera escritura). Devuelve las claves de B2 de sus imágenes. Un alumno
 * que ya no existe responde `no-existe` (repetir no rompe nada).
 */
export async function eliminarAlumnoEnTransaccion(
  db: Firestore,
  cedula: string,
  ahora: number,
): Promise<
  | { ok: true; imagenes: string[] }
  | { ok: false; error: "no-existe" | "no-alumno" | "demasiados" }
> {
  return db.runTransaction(async (tx) => {
    const r = await leerAlumno(tx, db, cedula);
    if (!r.ok) return r;
    const { l } = r;
    const p = planear(l);
    if (!cabeEnTransaccion(p.escrituras))
      return { ok: false, error: "demasiados" } as const;

    const entregas = new Set(p.plan.entregas);
    const ajustes = new Set(p.plan.ajustes);
    for (const d of l.entregas.docs) if (entregas.has(d.id)) tx.delete(d.ref);
    for (const d of l.ajustes.docs) if (ajustes.has(d.id)) tx.delete(d.ref);
    for (const d of l.historial.docs) tx.delete(d.ref);
    tx.delete(db.collection(COL.usuarios).doc(cedula));
    tx.delete(db.collection(COL.privados).doc(cedula));
    tx.delete(db.collection(COL.recuperaciones).doc(cedula));
    for (const c of p.cambios.equipos) {
      tx.update(db.collection(COL.equipos).doc(c.id), {
        capitanId: c.capitanId,
      });
    }
    const sinEl = conCambios(l.datos, p.cambios, ahora);
    escribirRankingEnTx(
      tx,
      db,
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

/**
 * Borra el usuario de Auth de un alumno: su cookie deja de valer en el DAL (D180, D210) y nadie
 * puede entrar con su cédula. Idempotente (sin cuenta, no hace nada). Nunca borra a un profesor:
 * si las claims dicen `profesor`, no lo toca.
 */
export async function borrarAuthAlumno(
  auth: Auth,
  cedula: string,
): Promise<void> {
  try {
    const cuenta = await auth.getUser(cedula);
    if (
      (cuenta.customClaims as { rol?: unknown } | undefined)?.rol === "profesor"
    )
      return;
    await auth.deleteUser(cedula);
  } catch (e) {
    if (codigo(e) !== "auth/user-not-found") throw e;
  }
}
