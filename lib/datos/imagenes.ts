import "server-only";
// URLs firmadas de las imágenes de respuesta (D195). Solo se firman las que la página va a
// pintar (la capa gratuita de B2 corta a 2.500 descargas al día). Quien llama responde por el
// permiso: pasa solo rutas de entregas que el usuario de la sesión puede ver (el alumno
// integrante, que las recibe por `datosAlumno`; el profesor, en W7).
import { almacenB2 } from "@/lib/almacen/b2";

/** Ruta → URL GET de vida corta; las que no se pudieron firmar no aparecen. */
export async function urlsFirmadas(
  rutas: ReadonlyArray<string>,
): Promise<Map<string, string>> {
  const almacen = almacenB2();
  const out = new Map<string, string>();
  if (!almacen) return out;
  for (const ruta of new Set(rutas)) {
    if (!ruta.startsWith("entregas/") && !ruta.startsWith("equipos/")) continue;
    try {
      out.set(ruta, await almacen.urlFirmada(ruta));
    } catch {
      console.error("[urlsFirmadas] ruta inválida");
    }
  }
  return out;
}
