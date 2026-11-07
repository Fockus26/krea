"use client";
// Presencia al editar un alumno (W14, D275, D277) con el SDK del navegador. La lista de Alumnos
// escucha la consulta de grupo `editores` (una sola suscripción para todas las filas) y el diálogo
// abierto escribe SU entrada con un latido. Sin sesión de Firebase en el navegador (y sin poder
// recuperarla con `tokenEnVivo`, D190), la presencia se apaga en silencio: guardar sigue igual.
import { onAuthStateChanged, signInWithCustomToken } from "firebase/auth";
import {
  collectionGroup,
  deleteDoc,
  doc,
  type Firestore,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Timestamp,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { tokenEnVivo } from "@/lib/acciones/en-vivo";
import { firebaseCliente } from "@/lib/firebase/cliente";
import { COL, SUBCOL_EDITORES } from "@/lib/modelo";
import {
  type EntradaPresencia,
  editoresVigentes,
  LATIDO_MS,
  porAlumno,
  RELOJ_PRESENCIA_MS,
  zEntradaPresencia,
} from "@/lib/presencia";

/** El profe que mira la lista: su cédula (uid) y cómo lo ven los demás. */
export type YoPresencia = { uid: string; nombre: string };

export type Presencia = YoPresencia & {
  /** `null` mientras no haya sesión de Firebase en el navegador (o si no se pudo). */
  db: Firestore | null;
  /** Los OTROS profes que editan a ese alumno ahora (vigentes, en orden de llegada). */
  editoresDe: (cedula: string) => EntradaPresencia[];
};

const NADIE: EntradaPresencia[] = [];
const ms = (t: unknown) =>
  t && typeof (t as Timestamp).toMillis === "function"
    ? (t as Timestamp).toMillis()
    : Number.NaN;

/**
 * Sesión de Firebase de `uid` en el navegador + suscripción a toda la presencia. `null` sin `yo`
 * (vista previa). Un intento de token por montaje, como el ranking (D190).
 */
export function usePresenciaAlumnos(yo?: YoPresencia): Presencia | null {
  const uid = yo?.uid;
  const nombre = yo?.nombre ?? "";
  const [db, setDb] = useState<Firestore | null>(null);
  const [entradas, setEntradas] = useState<Map<string, EntradaPresencia[]>>(
    () => new Map(),
  );
  const [ahora, setAhora] = useState(0);

  useEffect(() => {
    if (!uid) return;
    const fb = firebaseCliente();
    if (!fb) return;
    let fin = false;
    let pedido = false;
    const dejarAuth = onAuthStateChanged(fb.auth, async (user) => {
      if (fin) return;
      if (user?.uid === uid) {
        setDb(fb.db);
        return;
      }
      setDb(null);
      if (pedido) return;
      pedido = true;
      try {
        const r = await tokenEnVivo();
        if (!fin && r.ok) await signInWithCustomToken(fb.auth, r.token);
      } catch {
        // Presencia apagada en silencio (D275)
      }
    });
    return () => {
      fin = true;
      dejarAuth();
      setDb(null);
    };
  }, [uid]);

  useEffect(() => {
    if (!db) return;
    setAhora(Date.now());
    const reloj = setInterval(() => setAhora(Date.now()), RELOJ_PRESENCIA_MS);
    const dejar = onSnapshot(
      collectionGroup(db, SUBCOL_EDITORES),
      (snap) => {
        const docs: Array<{ alumnoId: string; entrada: EntradaPresencia }> = [];
        for (const d of snap.docs) {
          const alumno = d.ref.parent.parent;
          if (!alumno || alumno.parent.id !== COL.presencia) continue;
          // La propia, recién escrita, trae los timestamps del servidor estimados
          const v = d.data({ serverTimestamps: "estimate" });
          const e = zEntradaPresencia.safeParse({
            profeId: d.id,
            nombre: v.nombre,
            desde: ms(v.desde),
            latido: ms(v.latido),
          });
          if (e.success) docs.push({ alumnoId: alumno.id, entrada: e.data });
        }
        setEntradas(porAlumno(docs));
        setAhora(Date.now());
      },
      // Sin permiso o sin red: nadie a la vista, en silencio
      () => setEntradas(new Map()),
    );
    return () => {
      clearInterval(reloj);
      dejar();
      setEntradas(new Map());
    };
  }, [db]);

  return useMemo(() => {
    if (!uid) return null;
    return {
      uid,
      nombre,
      db,
      editoresDe: (cedula: string) => {
        const lista = entradas.get(cedula);
        return lista ? editoresVigentes(lista, ahora, uid) : NADIE;
      },
    };
  }, [uid, nombre, db, entradas, ahora]);
}

/**
 * Mientras el diálogo de `cedula` está abierto: escribe la entrada propia, la renueva cada
 * LATIDO_MS y la borra al cerrar, al desmontar y en `pagehide`. Si el latido no la encuentra
 * (otra pestaña mía la borró, la página volvió del bfcache), la vuelve a crear.
 */
export function useMarcarPresencia(
  presencia: Presencia | null | undefined,
  cedula: string,
): void {
  const db = presencia?.db ?? null;
  const uid = presencia?.uid;
  const nombre = presencia?.nombre;
  useEffect(() => {
    if (!db || !uid || !nombre) return;
    const ref = doc(db, COL.presencia, cedula, SUBCOL_EDITORES, uid);
    let fin = false;
    const crear = () =>
      setDoc(ref, {
        nombre,
        desde: serverTimestamp(),
        latido: serverTimestamp(),
      }).catch(() => {});
    const latir = () =>
      updateDoc(ref, { latido: serverTimestamp() }).catch(() => {
        if (!fin) void crear();
      });
    const borrar = () => {
      deleteDoc(ref).catch(() => {});
    };
    void crear();
    const latido = setInterval(latir, LATIDO_MS);
    window.addEventListener("pagehide", borrar);
    return () => {
      fin = true;
      clearInterval(latido);
      window.removeEventListener("pagehide", borrar);
      borrar();
    };
  }, [db, uid, nombre, cedula]);
}
