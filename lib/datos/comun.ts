import "server-only";
// Piezas comunes de las lecturas del servidor (D189, D327): la base de Postgres. La conversión y
// validación de cada fila está en `lib/data/filas.ts` (fila que no valida: se omite y se registra).
import { bd, type Db } from "@/lib/db";

export function db(): Db {
  // Sin base no hay sesión (D181): aquí solo se llega con la base configurada.
  return bd();
}
