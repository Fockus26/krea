"use server";
// Server Action de «Poner nota» a quien no entregó (`lib/nota-sin-entrega`, D581). El profe sale de
// la sesión (`exigirSesion("profesor")`), nunca del body.
import { refresh } from "next/cache";
import { exigirSesion } from "@/lib/dal";
import { ponerNotaSinEntregaEnTransaccion } from "@/lib/data/nota-sin-entrega";
import { baseDeDatos } from "@/lib/db";
import {
  type ResultadoNotaSinEntrega,
  zPonerNotaSinEntrega,
} from "@/lib/nota-sin-entrega";

export async function ponerNotaSinEntrega(
  entrada: unknown,
): Promise<ResultadoNotaSinEntrega> {
  const sesion = await exigirSesion("profesor");
  const db = baseDeDatos();
  if (!db) return { ok: false, error: "red" };
  const envio = zPonerNotaSinEntrega.safeParse(entrada);
  if (!envio.success) return { ok: false, error: "invalida" };
  try {
    const r = await ponerNotaSinEntregaEnTransaccion(
      db,
      sesion.uid,
      envio.data,
      Date.now(),
    );
    if (r.ok) refresh();
    return r;
  } catch (e) {
    console.error(
      "[ponerNotaSinEntrega]",
      (e as { code?: string }).code ?? "error",
    );
    return { ok: false, error: "red" };
  }
}
