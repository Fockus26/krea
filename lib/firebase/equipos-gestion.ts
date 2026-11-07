// Adaptadores del Admin SDK para crear, editar y eliminar equipos (W12, D270, D307–D309). Sin
// `server-only` para que las pruebas de tests/rules los corran contra los emuladores; la app los
// usa solo desde lib/acciones/equipos.ts, después de `exigirSesion("profesor")`.
//
// El nombre y el logo del equipo viven también en `ranking/{seccion}`: cada cambio lo reescribe en
// la misma transacción (D175). Eliminar deshace el equipo sin llevarse ninguna nota: los
// integrantes quedan «Sin equipo» y las entregas grupales se quedan con ellos (D307).
import type { Firestore } from "firebase-admin/firestore";
import { cambiosEntre, conCambios, estadoDeDatos } from "@/lib/equipos-datos";
import {
  consecuenciasEliminar,
  type EquipoACrear,
  type EquipoAEditar,
  type ErrorGestionEquipo,
  equipoNuevo,
  escriturasEliminarEquipo,
  nombreRepetido,
  type ResultadoGestionEquipo,
} from "@/lib/equipos-gestion";
import { moverAlumno } from "@/lib/equipos-profe";
import { escribirRankingEnTx, leerSeccionEnTx } from "@/lib/firebase/ranking";
import { COL, zEquipo } from "@/lib/modelo";
import { MAX_ESCRITURAS_TX } from "@/lib/tareas-profe-datos";

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

type Eliminado = {
  resultado: ResultadoGestionEquipo;
  logo: string | null;
  /** Integrantes que quedaron «Sin equipo»: sus claims se ponen después del commit. */
  afectados: string[];
};

/**
 * Elimina un equipo con todo lo suyo en UNA transacción (D307–D309): sus integrantes pasan a «Sin
 * equipo» (`moverAlumno` a `null`, como al quitarlos del tablero), cada entrega grupal suya se
 * queda con su nota e `integrantes` y recibe `titularNombre`, sus ajustes de puntos se borran, y
 * el ranking se reescribe sin él. Devuelve la ruta del logo (B2 la borra tras el commit) y los
 * integrantes movidos. Uno que ya no existe: `no-existe`; si pasa de 500 escrituras: `demasiados`
 * sin escribir nada.
 */
export async function eliminarEquipoEnTransaccion(
  db: Firestore,
  equipoId: string,
  ahora: number,
): Promise<Eliminado> {
  const ref = db.collection(COL.equipos).doc(equipoId);
  const fallo = (error: ErrorGestionEquipo): Eliminado => ({
    resultado: { ok: false, error },
    logo: null,
    afectados: [],
  });
  return db.runTransaction(async (tx): Promise<Eliminado> => {
    const snap = await tx.get(ref);
    if (!snap.exists) return fallo("no-existe");
    const e = zEquipo.safeParse(snap.data());
    if (!e.success) return fallo("invalida");
    const seccion = e.data.seccion;
    const [datos, entregasSnap, ajustesSnap] = await Promise.all([
      leerSeccionEnTx(tx, db, seccion),
      // También los que no validan: la consulta por id los trae igual
      tx.get(db.collection(COL.entregas).where("titularId", "==", equipoId)),
      tx.get(db.collection(COL.ajustes).where("destinoId", "==", equipoId)),
    ]);
    const grupales = entregasSnap.docs.filter(
      (d) => d.get("tipo") !== "individual",
    );
    const ajustes = ajustesSnap.docs.filter(
      (d) => d.get("destino") !== "alumno",
    );

    // Cada integrante sale con la regla del tablero; el equipo se borra: su capitán no se escribe
    let estado = estadoDeDatos(seccion, datos.usuarios, datos.equipos);
    for (const c of estado.equipos[equipoId]?.miembros ?? [])
      estado = moverAlumno(estado, c, null);
    const cambios = cambiosEntre(
      estado,
      datos.usuarios,
      datos.equipos,
      seccion,
    );
    cambios.equipos = cambios.equipos.filter((c) => c.id !== equipoId);

    const c = consecuenciasEliminar({
      integrantes: cambios.usuarios.length,
      entregas: grupales.length,
      ajustes: ajustes.length,
    });
    if (
      escriturasEliminarEquipo(c) + cambios.equipos.length >
      MAX_ESCRITURAS_TX
    )
      return fallo("demasiados");

    for (const u of cambios.usuarios) {
      tx.update(db.collection(COL.usuarios).doc(u.cedula), {
        equipoId: u.equipoId,
        actualizadoEn: ahora,
      });
    }
    for (const x of cambios.equipos) {
      tx.update(db.collection(COL.equipos).doc(x.id), {
        capitanId: x.capitanId,
      });
    }
    for (const d of grupales)
      tx.update(d.ref, { titularNombre: e.data.nombre });
    for (const d of ajustes) tx.delete(d.ref);
    tx.delete(ref);

    const borrados = new Set(ajustes.map((d) => d.id));
    const sinEl = conCambios(datos, cambios, ahora);
    escribirRankingEnTx(
      tx,
      db,
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
      logo: e.data.logoPath,
      afectados: cambios.usuarios.map((u) => u.cedula),
    };
  });
}
