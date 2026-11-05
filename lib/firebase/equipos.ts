// Adaptadores del Admin SDK para Equipos del profesor (fase 07 W8, D210, D212). Sin `server-only`
// para que las pruebas de tests/rules los corran contra los emuladores; la app los usa solo desde
// lib/acciones/equipos.ts, después de `exigirSesion("profesor")`.
//
// Mover y cambiar capitán reutilizan las funciones puras del tablero (`moverAlumno`,
// `cambiarCapitan`) sobre el estado que sale de los documentos, y escriben los perfiles y equipos
// que cambian junto con `ranking/{seccion}` en UNA transacción (D175). Los custom claims viven en
// Auth, fuera de la transacción: `sincronizarClaims` los pone después del commit desde el perfil
// guardado (idempotente: reintentar arregla un fallo a medias).
import type { Auth } from "firebase-admin/auth";
import type { Firestore, Transaction } from "firebase-admin/firestore";
import {
  type CambiarCapitan,
  cambiosEntre,
  conCambios,
  estadoDeDatos,
  type MoverAlumno,
  type ResultadoEquipos,
} from "@/lib/equipos-datos";
import { cambiarCapitan, moverAlumno } from "@/lib/equipos-profe";
import { escribirRankingEnTx, leerSeccionEnTx } from "@/lib/firebase/ranking";
import { COL, claimsDe, zEquipo, zUsuario } from "@/lib/modelo";

/** Resultado de una transacción de equipos: los alumnos cuyo equipo cambió (para sus claims). */
export type ResultadoMover =
  | { ok: true; afectados: string[] }
  | Extract<ResultadoEquipos, { ok: false }>;

/** Pasa a un alumno a otro equipo de su sección (o lo deja sin equipo) y recalcula el ranking. */
export async function moverAlumnoEnTransaccion(
  db: Firestore,
  entrada: MoverAlumno,
  ahora: number,
): Promise<ResultadoMover> {
  const ref = db.collection(COL.usuarios).doc(entrada.cedula);
  const destinoRef =
    entrada.destino === null
      ? null
      : db.collection(COL.equipos).doc(entrada.destino);
  return db.runTransaction(async (tx): Promise<ResultadoMover> => {
    const [snap, dest] = await Promise.all([
      tx.get(ref),
      destinoRef ? tx.get(destinoRef) : null,
    ]);
    if (!snap.exists) return { ok: false, error: "no-existe" };
    const u = zUsuario.safeParse(snap.data());
    if (!u.success || u.data.rol !== "estudiante" || u.data.seccion === null)
      return { ok: false, error: "invalida" };
    const seccion = u.data.seccion;
    if (dest) {
      if (!dest.exists) return { ok: false, error: "no-existe" };
      const e = zEquipo.safeParse(dest.data());
      if (!e.success) return { ok: false, error: "invalida" };
      if (e.data.seccion !== seccion)
        return { ok: false, error: "otra-seccion" };
    }
    const datos = await leerSeccionEnTx(tx, db, seccion);
    const antes = estadoDeDatos(seccion, datos.usuarios, datos.equipos);
    const despues = moverAlumno(antes, entrada.cedula, entrada.destino);
    const cambios = cambiosEntre(
      despues,
      datos.usuarios,
      datos.equipos,
      seccion,
    );
    escribirCambios(tx, db, cambios, ahora);
    if (cambios.usuarios.length || cambios.equipos.length) {
      escribirRankingEnTx(
        tx,
        db,
        seccion,
        conCambios(datos, cambios, ahora),
        ahora,
      );
    }
    return { ok: true, afectados: cambios.usuarios.map((c) => c.cedula) };
  });
}

/** Cambia el capitán de un equipo (D012: solo él envía la grupal) y recalcula el ranking. */
export async function cambiarCapitanEnTransaccion(
  db: Firestore,
  entrada: CambiarCapitan,
  ahora: number,
): Promise<ResultadoMover> {
  const ref = db.collection(COL.equipos).doc(entrada.equipoId);
  return db.runTransaction(async (tx): Promise<ResultadoMover> => {
    const snap = await tx.get(ref);
    if (!snap.exists) return { ok: false, error: "no-existe" };
    const e = zEquipo.safeParse(snap.data());
    if (!e.success) return { ok: false, error: "invalida" };
    const seccion = e.data.seccion;
    const datos = await leerSeccionEnTx(tx, db, seccion);
    const antes = estadoDeDatos(seccion, datos.usuarios, datos.equipos);
    if (!antes.equipos[entrada.equipoId]?.miembros.includes(entrada.cedula))
      return { ok: false, error: "invalida" };
    const despues = cambiarCapitan(antes, entrada.equipoId, entrada.cedula);
    const cambios = cambiosEntre(
      despues,
      datos.usuarios,
      datos.equipos,
      seccion,
    );
    escribirCambios(tx, db, cambios, ahora);
    if (cambios.usuarios.length || cambios.equipos.length) {
      escribirRankingEnTx(
        tx,
        db,
        seccion,
        conCambios(datos, cambios, ahora),
        ahora,
      );
    }
    return { ok: true, afectados: cambios.usuarios.map((c) => c.cedula) };
  });
}

function escribirCambios(
  tx: Transaction,
  db: Firestore,
  cambios: ReturnType<typeof cambiosEntre>,
  ahora: number,
) {
  for (const c of cambios.usuarios) {
    tx.update(db.collection(COL.usuarios).doc(c.cedula), {
      equipoId: c.equipoId,
      actualizadoEn: ahora,
    });
  }
  for (const c of cambios.equipos) {
    tx.update(db.collection(COL.equipos).doc(c.id), { capitanId: c.capitanId });
  }
}

/**
 * Pone en Auth los claims que salen del perfil guardado (`claimsDe`, conservando los demás que
 * tenga la cuenta) y revoca sus tokens: la cookie de sesión deja de valer (D180) y el próximo
 * ingreso trae el equipo nuevo, así las reglas no siguen mostrando el viejo. Una cuenta que aún
 * no existe en Auth no tiene sesión que cerrar: se salta. Devuelve las cédulas que fallaron.
 */
export async function sincronizarClaims(
  auth: Auth,
  db: Firestore,
  cedulas: readonly string[],
): Promise<string[]> {
  const fallidas: string[] = [];
  for (const cedula of new Set(cedulas)) {
    try {
      const snap = await db.collection(COL.usuarios).doc(cedula).get();
      const u = zUsuario.safeParse(snap.data());
      if (!u.success) {
        fallidas.push(cedula);
        continue;
      }
      const cuenta = await auth.getUser(cedula);
      await auth.setCustomUserClaims(cedula, {
        ...(cuenta.customClaims ?? {}),
        ...claimsDe(u.data),
      });
      await auth.revokeRefreshTokens(cedula);
    } catch (e) {
      if ((e as { code?: string }).code === "auth/user-not-found") continue;
      fallidas.push(cedula);
    }
  }
  return fallidas;
}

/**
 * Guarda la ruta del logo nuevo en el equipo y en `ranking/{seccion}` (D212). Devuelve la ruta
 * anterior para que quien llama borre el objeto viejo de B2 tras el commit.
 */
export async function cambiarLogoEnTransaccion(
  db: Firestore,
  equipoId: string,
  logoPath: string,
  ahora: number,
): Promise<
  | { ok: true; anterior: string | null }
  | Extract<ResultadoEquipos, { ok: false }>
> {
  const ref = db.collection(COL.equipos).doc(equipoId);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return { ok: false, error: "no-existe" } as const;
    const e = zEquipo.safeParse(snap.data());
    if (!e.success) return { ok: false, error: "invalida" } as const;
    const datos = await leerSeccionEnTx(tx, db, e.data.seccion);
    tx.update(ref, { logoPath });
    escribirRankingEnTx(
      tx,
      db,
      e.data.seccion,
      {
        ...datos,
        equipos: datos.equipos.map((x) =>
          x.id === equipoId ? { ...x, logoPath } : x,
        ),
      },
      ahora,
    );
    return { ok: true, anterior: e.data.logoPath } as const;
  });
}
