import "server-only";
// Crear y borrar cuentas desde el servidor (D233): la pantalla Profesores y, en la ola 2, Alumnos
// (W12). Genérico por rol; quien llama ya exigió la sesión y el permiso (`exigirAdmin`,
// `exigirSesion("profesor")`). Las piezas con el Admin SDK viven en `lib/firebase/cuentas.ts`.
//
// Ojo, estudiante: `crearCuenta` no toca `ranking/{seccion}` ni equipos; quien da de alta a un
// alumno recalcula el ranking de su sección después.
import {
  type EntradaCuenta,
  ErrorCuenta,
  zEntradaCuenta,
} from "@/lib/cuentas-datos";
import { firebaseAdmin } from "@/lib/firebase/admin";
import { crearCuentaCon, eliminarCuentaCon } from "@/lib/firebase/cuentas";
import { zCedula } from "@/lib/modelo";

export { ErrorCuenta };
export type { EntradaCuenta };

/**
 * Crea Auth (uid = cédula, email interno), claims, `usuarios/{cedula}` y `privados/{cedula}` con
 * una contraseña temporal que devuelve UNA vez (D232). Lanza `ErrorCuenta("existe")` si la cédula
 * ya tiene cuenta, `ErrorCuenta("red")` sin Firebase; la entrada inválida lanza el error de zod.
 */
export async function crearCuenta(
  entrada: EntradaCuenta,
): Promise<{ passwordTemporal: string }> {
  const admin = firebaseAdmin();
  if (!admin) throw new ErrorCuenta("red");
  const cuenta = zEntradaCuenta.parse(entrada);
  return crearCuentaCon(admin.auth, admin.db, cuenta, Date.now());
}

/** Borra Auth + `usuarios` + `privados` (lo que la persona hizo se queda). Idempotente. */
export async function eliminarCuenta(cedula: string): Promise<void> {
  const admin = firebaseAdmin();
  if (!admin) throw new ErrorCuenta("red");
  await eliminarCuentaCon(admin.auth, admin.db, zCedula.parse(cedula));
}
