import { verificarSesion } from "@/lib/dal";
import { ColaOffline } from "./cola-offline";

/**
 * La cola sin conexión con la cédula de la sesión (D292). Va en su `<Suspense>` del layout
 * (`cacheComponents`, como el shell, D189): sin sesión no drena nada.
 */
export async function ColaSesion() {
  const s = await verificarSesion();
  return <ColaOffline usuario={s?.uid ?? null} />;
}
