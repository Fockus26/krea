// Editar alumno sobre Postgres (fase 07 W8, D209, D327). Sin `server-only` para que las pruebas lo
// corran sobre PGlite; la app lo usa solo desde lib/acciones/alumnos.ts, después de
// `exigirSesion("profesor")`.
//
// Perfil, historial de base (D176) y email de recuperación se escriben en UNA transacción con el
// ranking de la sección (D175): el nombre y la base del alumno entran en el ranking. Con `version`
// (W14, D276), si otro profe guardó los campos editables desde que se abrió el diálogo, no se
// escribe nada y se responde `conflicto` con los valores vigentes.
import { eq } from "drizzle-orm";
import {
  armarEdicion,
  type EditarAlumno,
  hayConflicto,
  type ResultadoAlumno,
  versionDe,
} from "@/lib/alumnos-datos";
import type { Db } from "@/lib/db";
import { historialBase, usuarios } from "@/lib/db/schema";
import { escribirRanking, leerSeccion } from "@/lib/data/ranking";
import { filaDeUsuario, leerUsuario, usuarioDeFila } from "@/lib/data/usuarios";

export async function editarAlumnoEnTransaccion(
  db: Db,
  autorId: string,
  entrada: EditarAlumno,
  ahora: number,
): Promise<ResultadoAlumno> {
  return db.transaction(async (tx): Promise<ResultadoAlumno> => {
    const previo = await leerUsuario(tx, entrada.cedula);
    if (!previo) return { ok: false, error: "no-existe" };
    // Solo alumnos: un profesor no edita los datos de otro profesor por aquí (D234)
    if (previo.rol !== "estudiante" || previo.seccion === null)
      return { ok: false, error: "invalida" };
    const seccion = previo.seccion;
    // Turno de la sección, luego la fila con bloqueo: dos profes guardando a la vez no se pisan
    const datos = await leerSeccion(tx, seccion);
    const [f] = await tx
      .select()
      .from(usuarios)
      .where(eq(usuarios.cedula, entrada.cedula))
      .for("update");
    const u = f ? usuarioDeFila(f) : null;
    if (!f || !u) return { ok: false, error: "no-existe" };
    const emailActual = f.emailRecuperacion;
    // Otro profe guardó desde que se abrió el diálogo: no se pisa (D276); se devuelve lo vigente
    const actual = versionDe(u, emailActual);
    if (hayConflicto(entrada.version, actual))
      return { ok: false, error: "conflicto", actual };

    const r = armarEdicion({ actual: u, emailActual, entrada, autorId, ahora });
    if (!r.ok) return r;
    const { usuario, cambioBase, email } = r.edicion;

    if (email !== undefined)
      await tx
        .update(usuarios)
        .set({ emailRecuperacion: email })
        .where(eq(usuarios.cedula, entrada.cedula));
    if (cambioBase) await tx.insert(historialBase).values(cambioBase);
    if (usuario) {
      await tx
        .update(usuarios)
        .set(filaDeUsuario(usuario))
        .where(eq(usuarios.cedula, usuario.cedula));
      await escribirRanking(
        tx,
        seccion,
        {
          ...datos,
          usuarios: datos.usuarios.map((x) =>
            x.cedula === usuario.cedula ? usuario : x,
          ),
        },
        ahora,
      );
    }
    return { ok: true };
  });
}
