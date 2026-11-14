// Contacto opcional del profesor en Postgres (D378, D380, D389): lo guarda el propio profe y lo
// leen sus alumnos. La lectura del alumno trae solo nombres, apellidos, teléfono, correo de contacto
// y el avatar si su semilla ya no lleva la cédula: nunca la cédula ni el email de recuperación.
import { and, eq, isNotNull, isNull, or } from "drizzle-orm";
import {
  avatarVisibleProfe,
  type Contacto,
  type FilaContactoProfe,
} from "@/lib/contacto";
import type { Tx } from "@/lib/db";
import { usuarios } from "@/lib/db/schema";
import type { SeccionId } from "@/lib/modelo";

/** El contacto guardado de un usuario (`null` si no existe). */
export async function leerContacto(
  db: Tx,
  cedula: string,
): Promise<Contacto | null> {
  const [f] = await db
    .select({
      telefono: usuarios.telefono,
      emailContacto: usuarios.emailContacto,
    })
    .from(usuarios)
    .where(eq(usuarios.cedula, cedula))
    .limit(1);
  return f ?? null;
}

/** Guarda SU contacto (ya validado y normalizado con `zContacto`). Solo un profesor. */
export async function guardarContactoCon(
  db: Tx,
  cedula: string,
  contacto: Contacto,
  ahora: number,
): Promise<{ ok: true } | { ok: false; error: "no-existe" | "no-profesor" }> {
  const [f] = await db
    .select({ rol: usuarios.rol })
    .from(usuarios)
    .where(eq(usuarios.cedula, cedula))
    .limit(1);
  if (!f) return { ok: false, error: "no-existe" };
  if (f.rol !== "profesor") return { ok: false, error: "no-profesor" };
  await db
    .update(usuarios)
    .set({
      telefono: contacto.telefono,
      emailContacto: contacto.emailContacto,
      actualizadoEn: ahora,
    })
    .where(and(eq(usuarios.cedula, cedula), eq(usuarios.rol, "profesor")));
  return { ok: true };
}

/**
 * Los profes de un alumno con algún dato de contacto: los que ven todas las secciones
 * (`seccion: null`, D323) y los de la suya (D380). La cédula se lee solo para decidir si el avatar
 * se puede mostrar (D388) y no sale de aquí.
 */
export async function contactosDeProfes(
  db: Tx,
  seccion: SeccionId,
): Promise<FilaContactoProfe[]> {
  const filas = await db
    .select({
      cedula: usuarios.cedula,
      nombres: usuarios.nombres,
      apellidos: usuarios.apellidos,
      telefono: usuarios.telefono,
      emailContacto: usuarios.emailContacto,
      avatar: usuarios.avatar,
    })
    .from(usuarios)
    .where(
      and(
        eq(usuarios.rol, "profesor"),
        or(isNull(usuarios.seccion), eq(usuarios.seccion, seccion)),
        or(isNotNull(usuarios.telefono), isNotNull(usuarios.emailContacto)),
      ),
    );
  return filas.map(({ cedula, avatar, ...f }) => ({
    ...f,
    avatar: avatarVisibleProfe(avatar, cedula),
  }));
}
