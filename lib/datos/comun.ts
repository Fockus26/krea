import "server-only";
// Piezas comunes de las lecturas del servidor (D189, D327): la base de Postgres. La conversión y
// validación de cada fila está en `lib/data/filas.ts` (fila que no valida: se omite y se registra).
import { unstable_rethrow } from "next/navigation";
import { bd, type Db } from "@/lib/db";

export function db(): Db {
  // Sin base no hay sesión (D181): aquí solo se llega con la base configurada.
  return bd();
}

/**
 * Una lectura que es complemento de la página (D436): si su consulta falla (permisos, red, tiempo
 * de espera), se registra y la página sigue con `sinDatos`, sin ese bloque. La sesión se exige
 * FUERA de aquí; las interrupciones de Next (redirect, notFound, prerender) se relanzan igual.
 */
export async function opcional<T>(
  que: string,
  leer: () => Promise<T>,
  sinDatos: T,
): Promise<T> {
  try {
    return await leer();
  } catch (e) {
    unstable_rethrow(e);
    console.error(`[datos] ${que}:`, e instanceof Error ? e.message : e);
    return sinDatos;
  }
}
