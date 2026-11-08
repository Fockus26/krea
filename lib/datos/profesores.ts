import "server-only";
// Lecturas de la pantalla Profesores (D233, D327): Postgres detrás de `exigirAdmin()` (D231), una
// vez por request. Solo los perfiles con `rol: "profesor"` y sus emails de recuperación.
import { eq } from "drizzle-orm";
import { cache } from "react";
import { type FilaProfesor, filasProfesores } from "@/lib/cuentas-datos";
import { exigirAdmin } from "@/lib/dal";
import { db } from "@/lib/datos/comun";
import { usuarios } from "@/lib/db/schema";
import { validas } from "@/lib/data/filas";
import { usuarioDeFila } from "@/lib/data/usuarios";

export const profesoresTodos = cache(async (): Promise<FilaProfesor[]> => {
  const sesion = await exigirAdmin();
  const filas = await db()
    .select()
    .from(usuarios)
    .where(eq(usuarios.rol, "profesor"));
  const emails: Record<string, string | null> = {};
  for (const f of filas) emails[f.cedula] = f.emailRecuperacion;
  return filasProfesores(validas(filas.map(usuarioDeFila)), emails, sesion.uid);
});
