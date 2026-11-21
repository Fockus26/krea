// Borrado en lote de las imágenes que quedan sin dueño al eliminar un alumno, una entrega, un
// equipo o una tarea (D229). Sin `server-only` ni lectura del entorno: recibe el almacén, así la
// prueba usa uno falso; las acciones le pasan `almacenB2()`.
import type { Almacen } from "@/lib/almacen/s3";

/**
 * Borra las `claves` del almacén; un fallo solo se registra (`accion` nombra de dónde viene) y
 * quedan huérfanas. Sin almacén configurado también se registra, y nunca lanza.
 */
export async function borrarImagenes(
  almacen: Pick<Almacen, "borrar"> | null,
  claves: readonly string[],
  accion: string,
): Promise<void> {
  if (claves.length === 0) return;
  if (!almacen) {
    console.error(
      `[${accion}] almacén sin configurar: ${claves.length} imágenes sin borrar`,
    );
    return;
  }
  const r = await Promise.allSettled(claves.map((c) => almacen.borrar(c)));
  const fallidas = r.filter((x) => x.status === "rejected" || !x.value.ok);
  if (fallidas.length > 0) {
    console.error(
      `[${accion}] almacén: ${fallidas.length} de ${claves.length} imágenes sin borrar`,
    );
  }
}
