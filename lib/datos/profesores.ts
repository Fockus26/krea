import "server-only";
// Lecturas de la pantalla Profesores (D233): Admin SDK detrás de `exigirAdmin()` (D231), una vez
// por request. Solo los perfiles con `rol: "profesor"` y sus emails de recuperación.
import { cache } from "react";
import { type FilaProfesor, filasProfesores } from "@/lib/cuentas-datos";
import { exigirAdmin } from "@/lib/dal";
import { db, lista, parsear } from "@/lib/datos/comun";
import { COL, zPrivado, zUsuario } from "@/lib/modelo";

export const profesoresTodos = cache(async (): Promise<FilaProfesor[]> => {
  const sesion = await exigirAdmin();
  const usuarios = await lista(
    db().collection(COL.usuarios).where("rol", "==", "profesor"),
    zUsuario,
    COL.usuarios,
  );
  const privados = usuarios.length
    ? await db().getAll(
        ...usuarios.map((u) => db().collection(COL.privados).doc(u.id)),
      )
    : [];
  const emails: Record<string, string | null> = {};
  for (const p of privados) {
    if (!p.exists) continue;
    emails[p.id] =
      parsear(zPrivado, COL.privados, p.id, p.data())?.email ?? null;
  }
  return filasProfesores(
    usuarios.map(({ id: _, ...u }) => u),
    emails,
    sesion.uid,
  );
});
