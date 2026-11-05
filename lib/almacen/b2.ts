import "server-only";
// Almacén B2 del servidor (D194): configuración del entorno + `fetch` real. Las variables
// `B2_*` son solo servidor; sin ellas no hay subidas ni URLs (la app responde «no se pudo»).
import { type Almacen, configB2, crearAlmacen } from "@/lib/almacen/s3";

let almacen: Almacen | null | undefined;

export function almacenB2(): Almacen | null {
  if (almacen !== undefined) return almacen;
  const config = configB2(process.env);
  almacen = config ? crearAlmacen(config, { fetch }) : null;
  return almacen;
}
