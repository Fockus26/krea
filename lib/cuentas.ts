import "server-only";
// Crear y borrar cuentas desde el servidor (D233): la pantalla Profesores y, en la ola 2, Alumnos
// (W12). Genérico por rol; quien llama ya exigió la sesión y el permiso (`exigirAdmin`,
// `exigirSesion("profesor")`). Las piezas sobre Postgres viven en `lib/data/cuentas.ts` (D327).
//
// Ojo, estudiante: `crearCuenta` no toca `ranking/{seccion}` ni equipos; quien da de alta a un
// alumno recalcula el ranking de su sección después.
import {
  type EntradaCuenta,
  ErrorCuenta,
  zEntradaCuenta,
} from "@/lib/cuentas-datos";
import { baseDeDatos } from "@/lib/db";
import { crearCuentaCon, eliminarCuentaCon } from "@/lib/data/cuentas";
import { zCedula } from "@/lib/modelo";

export { ErrorCuenta };
export type { EntradaCuenta };

/**
 * Crea la cuenta (id = cédula, email interno) y su perfil con una contraseña temporal que devuelve
 * UNA vez (D232). Lanza `ErrorCuenta("existe")` si la cédula ya tiene cuenta, `ErrorCuenta("red")`
 * sin base de datos; la entrada inválida lanza el error de zod.
 */
export async function crearCuenta(
  entrada: EntradaCuenta,
): Promise<{ passwordTemporal: string }> {
  const db = baseDeDatos();
  if (!db) throw new ErrorCuenta("red");
  const cuenta = zEntradaCuenta.parse(entrada);
  return crearCuentaCon(db, cuenta, Date.now());
}

/** Borra la cuenta, sus sesiones y su perfil (lo que la persona hizo se queda). Idempotente. */
export async function eliminarCuenta(cedula: string): Promise<void> {
  const db = baseDeDatos();
  if (!db) throw new ErrorCuenta("red");
  await eliminarCuentaCon(db, zCedula.parse(cedula));
}
