// Adaptadores del Admin SDK para crear, editar y eliminar equipos (W12, D270–D271). Sin
// `server-only` para que las pruebas de tests/rules los corran contra los emuladores; la app los
// usa solo desde lib/acciones/equipos.ts, después de `exigirSesion("profesor")`.
//
// El nombre y el logo del equipo viven también en `ranking/{seccion}`: cada cambio lo reescribe en
// la misma transacción (D175). Eliminar solo un equipo vacío, sin entregas grupales ni ajustes
// (`bloqueoEliminar`): así nunca se lleva una nota ni un punto.
import type { Firestore } from "firebase-admin/firestore";
import { estadoDeDatos } from "@/lib/equipos-datos";
import {
  bloqueoEliminar,
  type EquipoACrear,
  type EquipoAEditar,
  equipoNuevo,
  nombreRepetido,
  type ResultadoGestionEquipo,
} from "@/lib/equipos-gestion";
import { escribirRankingEnTx, leerSeccionEnTx } from "@/lib/firebase/ranking";
import { COL, zEquipo } from "@/lib/modelo";

/** Crea un equipo en la sección y lo suma al ranking con 0 puntos. */
export async function crearEquipoEnTransaccion(
  db: Firestore,
  d: EquipoACrear,
  ahora: number,
): Promise<ResultadoGestionEquipo> {
  const ref = db.collection(COL.equipos).doc();
  return db.runTransaction(async (tx): Promise<ResultadoGestionEquipo> => {
    const datos = await leerSeccionEnTx(tx, db, d.seccion);
    if (nombreRepetido(d.nombre, datos.equipos, d.seccion))
      return { ok: false, error: "repetido" };
    const equipo = equipoNuevo(d);
    tx.create(ref, equipo);
    escribirRankingEnTx(
      tx,
      db,
      d.seccion,
      { ...datos, equipos: [...datos.equipos, { id: ref.id, ...equipo }] },
      ahora,
    );
    return { ok: true, id: ref.id };
  });
}

/** Cambia nombre y tema (el nombre entra en el ranking). */
export async function editarEquipoEnTransaccion(
  db: Firestore,
  d: EquipoAEditar,
  ahora: number,
): Promise<ResultadoGestionEquipo> {
  const ref = db.collection(COL.equipos).doc(d.equipoId);
  return db.runTransaction(async (tx): Promise<ResultadoGestionEquipo> => {
    const snap = await tx.get(ref);
    if (!snap.exists) return { ok: false, error: "no-existe" };
    const e = zEquipo.safeParse(snap.data());
    if (!e.success) return { ok: false, error: "invalida" };
    const datos = await leerSeccionEnTx(tx, db, e.data.seccion);
    if (nombreRepetido(d.nombre, datos.equipos, e.data.seccion, d.equipoId))
      return { ok: false, error: "repetido" };
    tx.update(ref, { nombre: d.nombre, tema: d.tema });
    escribirRankingEnTx(
      tx,
      db,
      e.data.seccion,
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

type Eliminado = { resultado: ResultadoGestionEquipo; logo: string | null };

/**
 * Elimina un equipo vacío, sin entregas grupales ni ajustes, y lo quita del ranking. Devuelve la
 * ruta del logo para borrarla de B2 después del commit. Uno que ya no existe: `no-existe`.
 */
export async function eliminarEquipoEnTransaccion(
  db: Firestore,
  equipoId: string,
  ahora: number,
): Promise<Eliminado> {
  const ref = db.collection(COL.equipos).doc(equipoId);
  return db.runTransaction(async (tx): Promise<Eliminado> => {
    const snap = await tx.get(ref);
    if (!snap.exists)
      return { resultado: { ok: false, error: "no-existe" }, logo: null };
    const e = zEquipo.safeParse(snap.data());
    if (!e.success)
      return { resultado: { ok: false, error: "invalida" }, logo: null };
    const seccion = e.data.seccion;
    const [datos, entregas, ajustes] = await Promise.all([
      leerSeccionEnTx(tx, db, seccion),
      // También las que no validan: un documento roto no debe dejar borrar sus datos
      tx.get(db.collection(COL.entregas).where("titularId", "==", equipoId)),
      tx.get(db.collection(COL.ajustes).where("destinoId", "==", equipoId)),
    ]);
    const estado = estadoDeDatos(seccion, datos.usuarios, datos.equipos);
    const bloqueo = bloqueoEliminar({
      integrantes: estado.equipos[equipoId]?.miembros.length ?? 0,
      entregas: entregas.docs.filter((d) => d.get("tipo") !== "individual")
        .length,
      ajustes: ajustes.docs.filter((d) => d.get("destino") !== "alumno").length,
    });
    if (bloqueo)
      return {
        resultado: { ok: false, error: bloqueo.motivo },
        logo: null,
      };
    tx.delete(ref);
    escribirRankingEnTx(
      tx,
      db,
      seccion,
      { ...datos, equipos: datos.equipos.filter((x) => x.id !== equipoId) },
      ahora,
    );
    return { resultado: { ok: true, id: equipoId }, logo: e.data.logoPath };
  });
}
