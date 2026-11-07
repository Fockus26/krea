import "server-only";
// URLs firmadas de las imágenes de respuesta (D195). Solo se firman las que la página va a
// pintar (la capa gratuita de B2 corta a 2.500 descargas al día). Quien llama responde por el
// permiso: pasa solo rutas de entregas que el usuario de la sesión puede ver (el alumno
// integrante, que las recibe por `datosAlumno`; el profesor, en W7).
// Fotos de premio (`premios/`, D265): las ve el profe en Premios y el alumno en su tarea.
import { almacenB2 } from "@/lib/almacen/b2";

const PREFIJOS = ["entregas/", "equipos/", "premios/"] as const;

/** ¿Hay almacén de B2 configurado? Sin él no se ofrece subir fotos (D265). */
export function hayAlmacen(): boolean {
  return almacenB2() !== null;
}

/** Ruta → URL GET de vida corta; las que no se pudieron firmar no aparecen. */
export async function urlsFirmadas(
  rutas: ReadonlyArray<string>,
): Promise<Map<string, string>> {
  const almacen = almacenB2();
  const out = new Map<string, string>();
  if (!almacen) return out;
  for (const ruta of new Set(rutas)) {
    if (!PREFIJOS.some((p) => ruta.startsWith(p))) continue;
    try {
      out.set(ruta, await almacen.urlFirmada(ruta));
    } catch {
      console.error("[urlsFirmadas] ruta inválida");
    }
  }
  return out;
}
