"use server";
// Server Action del puntaje final de la tarea 1 (`lib/puntaje-final`). El profe sale de la sesión
// (`exigirSesion("profesor")`), nunca del body.
import { refresh } from "next/cache";
import { exigirSesion } from "@/lib/dal";
import { ponerPuntajeFinalEnTransaccion } from "@/lib/data/puntaje-final";
import { baseDeDatos } from "@/lib/db";
import {
  type ResultadoPuntajeFinal,
  zPonerPuntajeFinal,
} from "@/lib/puntaje-final";

export async function ponerPuntajeFinal(
  entrada: unknown,
): Promise<ResultadoPuntajeFinal> {
  const sesion = await exigirSesion("profesor");
  const db = baseDeDatos();
  if (!db) return { ok: false, error: "red" };
  const envio = zPonerPuntajeFinal.safeParse(entrada);
  if (!envio.success) return { ok: false, error: "invalida" };
  try {
    const r = await ponerPuntajeFinalEnTransaccion(
      db,
      sesion.uid,
      envio.data,
      Date.now(),
    );
    if (r.ok) refresh();
    return r;
  } catch (e) {
    console.error(
      "[ponerPuntajeFinal]",
      (e as { code?: string }).code ?? "error",
    );
    return { ok: false, error: "red" };
  }
}
