import "server-only";
// El id público de los alumnos con el secreto del servidor (D493): la clave sale de
// `BETTER_AUTH_SECRET` con su propia etiqueta (`lib/id-publico.ts`). Sin secreto no hay sesión
// (Better Auth no arranca), y aquí tampoco hay plan B: nunca se cae a la cédula.
import { crearIdPublico, type IdAlumno } from "@/lib/id-publico";

let calculo: IdAlumno | null = null;

/** Cédula → id público (estable, opaco). Se crea en la primera llamada, no al importar. */
export const idPublico: IdAlumno = (cedula) => {
  calculo ??= crearIdPublico(process.env.BETTER_AUTH_SECRET ?? "");
  return calculo(cedula);
};
