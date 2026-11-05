// Recalcular `ranking/{seccion}` dentro de una transacción del Admin SDK (D175, D204). Sin
// `server-only` para que las pruebas de tests/rules lo corran contra los emuladores.
//
// Firestore pide todas las lecturas antes de la primera escritura, y una transacción no ve sus
// propias escrituras: quien llama lee la sección con `leerSeccionEnTx`, aplica sus cambios a esos
// datos en memoria (la entrega evaluada, el ajuste nuevo) y escribe con `escribirRankingEnTx`.
// Leer todos los documentos de la sección (y el propio ranking) los mete en la transacción: si
// otro profe cambia cualquiera antes del commit, la transacción se reintenta con lo nuevo y
// ninguna escritura se pierde.
import type { Firestore, Transaction } from "firebase-admin/firestore";
import {
  type Ajuste,
  COL,
  type Entrega,
  type Equipo,
  type SeccionId,
  type Usuario,
  zAjuste,
  zEntrega,
  zEquipo,
  zUsuario,
} from "@/lib/modelo";
import { calcularRanking } from "@/lib/ranking-datos";

type ConId<T> = { id: string } & T;

export type DatosSeccion = {
  usuarios: Usuario[];
  equipos: Array<ConId<Equipo>>;
  entregas: Array<ConId<Entrega>>;
  ajustes: Array<ConId<Ajuste>>;
};

type Esquema<T> = {
  safeParse: (v: unknown) => { success: true; data: T } | { success: false };
};

function validos<T>(
  docs: ReadonlyArray<{ id: string; data: () => unknown }>,
  esquema: Esquema<T>,
): Array<ConId<T>> {
  // Un documento que no valida no suma (como las lecturas, D189)
  return docs.flatMap((d) => {
    const r = esquema.safeParse(d.data());
    return r.success ? [{ id: d.id, ...r.data }] : [];
  });
}

/** Lee en la transacción todo lo que entra en el ranking de una sección. */
export async function leerSeccionEnTx(
  tx: Transaction,
  db: Firestore,
  seccion: SeccionId,
): Promise<DatosSeccion> {
  const enSeccion = (col: string) =>
    tx.get(db.collection(col).where("seccion", "==", seccion));
  const [us, eqs, ents, ajs] = await Promise.all([
    enSeccion(COL.usuarios),
    enSeccion(COL.equipos),
    enSeccion(COL.entregas),
    enSeccion(COL.ajustes),
    // El documento derivado también entra en la transacción
    tx.get(db.collection(COL.ranking).doc(seccion)),
  ]);
  return {
    usuarios: validos(us.docs, zUsuario).map(({ id: _, ...u }) => u),
    equipos: validos(eqs.docs, zEquipo),
    entregas: validos(ents.docs, zEntrega),
    ajustes: validos(ajs.docs, zAjuste),
  };
}

/** Reemplaza (o añade) la entrega `id` en los datos leídos. */
export function conEntrega(
  datos: DatosSeccion,
  entrega: ConId<Entrega>,
): DatosSeccion {
  const otras = datos.entregas.filter((e) => e.id !== entrega.id);
  return { ...datos, entregas: [...otras, entrega] };
}

/** Añade un ajuste a los datos leídos. */
export function conAjuste(
  datos: DatosSeccion,
  ajuste: ConId<Ajuste>,
): DatosSeccion {
  return { ...datos, ajustes: [...datos.ajustes, ajuste] };
}

/** Escribe `ranking/{seccion}` con `calcularRanking` sobre los datos ya cambiados. */
export function escribirRankingEnTx(
  tx: Transaction,
  db: Firestore,
  seccion: SeccionId,
  datos: DatosSeccion,
  ahora: number,
): void {
  tx.set(
    db.collection(COL.ranking).doc(seccion),
    calcularRanking(seccion, datos, ahora),
  );
}
