"use server";
// Server Actions del aviso de tarea nueva (D335, D339): el alumno suscribe o quita ESTE navegador.
// La cédula sale SIEMPRE de la sesión, nunca del body; la suscripción se valida con zod. Nunca se
// registran el endpoint ni la cédula: solo códigos.
import { refresh } from "next/cache";
import { exigirSesion } from "@/lib/dal";
import { borrarSuscripcion, guardarSuscripcion } from "@/lib/data/push";
import { baseDeDatos } from "@/lib/db";
import { configPush, zEndpointPush, zSuscripcionPush } from "@/lib/push";

export type ResultadoPush = { ok: true } | { ok: false };

function registrar(accion: string, e: unknown) {
  console.error(`[${accion}]`, (e as { code?: string }).code ?? "error");
}

/** Guarda la suscripción de este navegador (`PushSubscription.toJSON()`) para la cuenta. */
export async function suscribirPush(entrada: unknown): Promise<ResultadoPush> {
  const sesion = await exigirSesion("estudiante");
  const db = baseDeDatos();
  if (!db || !configPush(process.env)) return { ok: false };
  const sub = zSuscripcionPush.safeParse(entrada);
  if (!sub.success) return { ok: false };
  try {
    await guardarSuscripcion(db, sesion.uid, sub.data, Date.now());
  } catch (e) {
    registrar("suscribirPush", e);
    return { ok: false };
  }
  refresh();
  return { ok: true };
}

/** Quita la suscripción de este navegador (solo si es de la cuenta de la sesión). */
export async function desuscribirPush(
  endpoint: unknown,
): Promise<ResultadoPush> {
  const sesion = await exigirSesion("estudiante");
  const db = baseDeDatos();
  if (!db) return { ok: false };
  const e = zEndpointPush.safeParse(endpoint);
  if (!e.success) return { ok: false };
  try {
    await borrarSuscripcion(db, sesion.uid, e.data);
  } catch (err) {
    registrar("desuscribirPush", err);
    return { ok: false };
  }
  refresh();
  return { ok: true };
}
