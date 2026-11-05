// Adaptador del Admin SDK para Editar alumno (fase 07 W8, D209). Sin `server-only` para que las
// pruebas de tests/rules lo corran contra los emuladores; la app lo usa solo desde
// lib/acciones/alumnos.ts, después de `exigirSesion("profesor")`.
//
// Perfil, historial de base (D176) y email de recuperación se escriben en UNA transacción con
// `ranking/{seccion}` (D175): el nombre y la base del alumno entran en el ranking.
import type { Firestore } from "firebase-admin/firestore";
import {
  armarEdicion,
  type EditarAlumno,
  type ResultadoAlumno,
} from "@/lib/alumnos-datos";
import { escribirRankingEnTx, leerSeccionEnTx } from "@/lib/firebase/ranking";
import { COL, zPrivado, zUsuario } from "@/lib/modelo";

export async function editarAlumnoEnTransaccion(
  db: Firestore,
  autorId: string,
  entrada: EditarAlumno,
  ahora: number,
): Promise<ResultadoAlumno> {
  const ref = db.collection(COL.usuarios).doc(entrada.cedula);
  const privadoRef = db.collection(COL.privados).doc(entrada.cedula);
  const historialRef = db.collection(COL.historialBase).doc();
  return db.runTransaction(async (tx): Promise<ResultadoAlumno> => {
    const [snap, privado] = await Promise.all([
      tx.get(ref),
      tx.get(privadoRef),
    ]);
    if (!snap.exists) return { ok: false, error: "no-existe" };
    const u = zUsuario.safeParse(snap.data());
    if (!u.success || u.data.seccion === null)
      return { ok: false, error: "invalida" };
    const p = zPrivado.safeParse(privado.data() ?? { email: null });
    const seccion = u.data.seccion;
    // Todas las lecturas antes de la primera escritura (Firestore)
    const datos = await leerSeccionEnTx(tx, db, seccion);

    const r = armarEdicion({
      actual: u.data,
      emailActual: p.success ? p.data.email : null,
      entrada,
      autorId,
      ahora,
    });
    if (!r.ok) return r;
    const { usuario, cambioBase, email } = r.edicion;

    if (email !== undefined) tx.set(privadoRef, { email });
    if (cambioBase) tx.create(historialRef, cambioBase);
    if (usuario) {
      tx.set(ref, usuario);
      escribirRankingEnTx(
        tx,
        db,
        seccion,
        {
          ...datos,
          usuarios: datos.usuarios.map((x) =>
            x.cedula === usuario.cedula ? usuario : x,
          ),
        },
        ahora,
      );
    }
    return { ok: true };
  });
}
