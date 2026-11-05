import "server-only";
// Piezas comunes de las lecturas del servidor (D189): la base del Admin SDK y el parseo con zod.
// Documento que no valida: se omite y se registra (sin datos personales).
import type { Firestore, Query } from "firebase-admin/firestore";
import { firebaseAdmin } from "@/lib/firebase/admin";

type ConId<T> = { id: string } & T;

type Esquema<T> = {
  safeParse: (v: unknown) => { success: true; data: T } | { success: false };
};

export function parsear<T>(
  esquema: Esquema<T>,
  coleccion: string,
  id: string,
  data: unknown,
): T | null {
  const r = esquema.safeParse(data);
  if (r.success) return r.data;
  console.error(`[datos] ${coleccion}/${id} no valida con el modelo`);
  return null;
}

export function db(): Firestore {
  const admin = firebaseAdmin();
  // Sin Firebase no hay sesión (D181): aquí solo se llega con Firebase configurado.
  if (!admin) throw new Error("Firebase no está configurado");
  return admin.db;
}

export async function lista<T>(
  q: Query,
  esquema: Esquema<T>,
  coleccion: string,
): Promise<Array<ConId<T>>> {
  const snap = await q.get();
  return snap.docs.flatMap((d) => {
    const v = parsear(esquema, coleccion, d.id, d.data());
    return v ? [{ id: d.id, ...v }] : [];
  });
}
