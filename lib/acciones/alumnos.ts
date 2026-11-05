"use server";
// Server Action de Editar alumno (fase 07 W8, D175, D209). El autor sale SIEMPRE de la sesión
// (`exigirSesion("profesor")`), nunca del body. Valida con zod y escribe perfil, historial de base
// (D176), email de recuperación y `ranking/{seccion}` en UNA transacción (`lib/firebase/alumnos.ts`).
import { refresh } from "next/cache";
import { type ResultadoAlumno, zEditarAlumno } from "@/lib/alumnos-datos";
import { exigirSesion } from "@/lib/dal";
import { firebaseAdmin } from "@/lib/firebase/admin";
import { editarAlumnoEnTransaccion } from "@/lib/firebase/alumnos";

export type { ResultadoAlumno };

export async function editarAlumno(entrada: unknown): Promise<ResultadoAlumno> {
  const sesion = await exigirSesion("profesor");
  const admin = firebaseAdmin();
  if (!admin) return { ok: false, error: "red" };
  const d = zEditarAlumno.safeParse(entrada);
  if (!d.success) return { ok: false, error: "invalida" };
  try {
    const r = await editarAlumnoEnTransaccion(
      admin.db,
      sesion.uid,
      d.data,
      Date.now(),
    );
    if (r.ok) refresh();
    return r;
  } catch (e) {
    console.error("[editarAlumno]", (e as { code?: string }).code ?? "error");
    return { ok: false, error: "red" };
  }
}
